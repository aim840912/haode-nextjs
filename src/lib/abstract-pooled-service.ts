import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { dbLogger } from '@/lib/logger'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

/**
 * 池化服務基礎類別
 * 提供連線池整合和後備機制
 */
export abstract class AbstractPooledService {
  protected moduleName: string

  constructor(moduleName: string) {
    this.moduleName = moduleName
  }

  /**
   * 執行資料庫操作（智能選擇連線方式）
   */
  protected async executeWithConnection<T>(
    operation: (client: SupabaseClient<Database>) => Promise<T>,
    context?: {
      action?: string
      metadata?: Record<string, unknown>
      usePool?: boolean
    }
  ): Promise<T> {
    const startTime = Date.now()

    // 動態導入避免模組載入時創建全域實例
    const { shouldUseConnectionPool } = await import('@/lib/supabase/connection-factory')
    const usePool = context?.usePool !== false && (await shouldUseConnectionPool())

    try {
      if (usePool) {
        // 使用連線池
        const { withPooledConnection } = await import('@/lib/supabase/connection-factory')
        return await withPooledConnection(operation, {
          action: context?.action || 'database_operation',
          metadata: {
            ...context?.metadata,
            module: this.moduleName,
            connectionType: 'pooled',
          },
        })
      } else {
        // 使用傳統單例連線
        const client = createServiceSupabaseClient()
        const result = await operation(client)

        const duration = Date.now() - startTime

        dbLogger.debug('傳統連線執行成功', {
          module: this.moduleName,
          action: context?.action || 'database_operation',
          metadata: {
            ...context?.metadata,
            connectionType: 'singleton',
            duration,
          },
        })

        return result
      }
    } catch (error) {
      const duration = Date.now() - startTime

      dbLogger.error('資料庫操作失敗', error as Error, {
        module: this.moduleName,
        action: context?.action || 'database_operation',
        metadata: {
          ...context?.metadata,
          connectionType: usePool ? 'pooled' : 'singleton',
          duration,
        },
      })

      throw error
    }
  }

  /**
   * 執行事務操作
   */
  protected async executeTransaction<T>(
    operations: (client: SupabaseClient<Database>) => Promise<T>,
    context?: {
      action?: string
      metadata?: Record<string, unknown>
    }
  ): Promise<T> {
    return this.executeWithConnection(operations, {
      ...context,
      action: `transaction_${context?.action || 'execute'}`,
      usePool: true, // 事務建議使用連線池以確保一致性
    })
  }

  /**
   * 批次執行操作
   */
  protected async executeBatch<T>(
    operations: Array<{
      operation: (client: SupabaseClient<Database>) => Promise<any>
      context?: { action?: string; metadata?: Record<string, unknown> }
    }>
  ): Promise<T[]> {
    if (operations.length === 0) {
      return []
    }

    const { shouldUseConnectionPool } = await import('@/lib/supabase/connection-factory')
    const usePool = await shouldUseConnectionPool()

    if (usePool) {
      // 使用連線池的批次操作（共用連線）
      try {
        const { ConnectionManager } = await import('@/lib/pooled-connection')
        const { getConnectionManager } = await import('@/lib/supabase/connection-factory')

        const manager = await getConnectionManager()
        if (manager) {
          return await manager.withBatch(
            operations.map(op => ({
              queryBuilder: op.operation,
              context: {
                ...op.context,
                metadata: {
                  ...op.context?.metadata,
                  module: this.moduleName,
                },
              },
            }))
          )
        }
      } catch (error) {
        dbLogger.warn('批次操作連線池失敗，改用傳統方式', {
          module: this.moduleName,
          action: 'executeBatch',
          metadata: {
            error: (error as Error).message,
            operationCount: operations.length,
          },
        })
      }
    }

    // 後備：使用傳統方式逐個執行
    const results = []
    const client = createServiceSupabaseClient()

    for (const { operation, context } of operations) {
      try {
        const result = await operation(client)
        results.push(result)

        dbLogger.debug('批次操作項目成功', {
          module: this.moduleName,
          action: context?.action || 'batch_operation',
          metadata: {
            ...context?.metadata,
            connectionType: 'singleton_batch',
          },
        })
      } catch (error) {
        dbLogger.error('批次操作項目失敗', error as Error, {
          module: this.moduleName,
          action: context?.action || 'batch_operation',
          metadata: {
            ...context?.metadata,
            connectionType: 'singleton_batch',
          },
        })
        throw error
      }
    }

    return results
  }

  /**
   * 檢查連線池狀態
   */
  protected async checkPoolStatus(): Promise<{
    enabled: boolean
    stats?: any
  }> {
    try {
      const { shouldUseConnectionPool, getPoolStats } = await import(
        '@/lib/supabase/connection-factory'
      )

      const enabled = await shouldUseConnectionPool()
      const stats = enabled ? await getPoolStats() : null

      return { enabled, stats }
    } catch {
      return { enabled: false }
    }
  }

  /**
   * 健康檢查（包含連線池狀態）
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: string
    details?: Record<string, unknown>
  }> {
    try {
      // 執行基本健康檢查
      const isHealthy = await this.executeWithConnection(
        async client => {
          const { error } = await client
            .from('products') // 使用通用表格進行檢查
            .select('id')
            .limit(1)
            .maybeSingle()

          return !error || error.code === 'PGRST116'
        },
        {
          action: 'health_check',
          metadata: { service: this.moduleName },
        }
      )

      const poolStatus = await this.checkPoolStatus()

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        details: {
          module: this.moduleName,
          connectionPool: poolStatus,
          databaseConnected: isHealthy,
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: {
          module: this.moduleName,
          error: (error as Error).message,
          connectionPool: { enabled: false },
          databaseConnected: false,
        },
      }
    }
  }
}

/**
 * 連線池服務介面
 * 擴展現有服務介面以支援連線池功能
 */
export interface PooledService {
  /**
   * 取得連線池統計資訊
   */
  getPoolStats?(): Promise<any>

  /**
   * 檢查是否使用連線池
   */
  isPoolEnabled?(): Promise<boolean>

  /**
   * 強制重新整理連線池
   */
  refreshPool?(): Promise<void>
}
