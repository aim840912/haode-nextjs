import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { SupabaseConnectionPool } from './db-pool'
import { dbLogger } from '@/lib/logger'

/**
 * 池化連線包裝器
 * 提供自動管理和安全使用的 Supabase 連線
 */
export class PooledConnectionWrapper {
  private released = false
  private queryCount = 0
  private startTime = Date.now()

  constructor(
    private connection: any, // PooledConnection from db-pool.ts
    private pool: SupabaseConnectionPool,
    private autoRelease = true
  ) {}

  /**
   * 取得 Supabase 客戶端
   */
  get client(): SupabaseClient<Database> {
    if (this.released) {
      throw new Error('連線已釋放，無法使用')
    }
    return this.connection.client
  }

  /**
   * 取得連線 ID
   */
  get id(): string {
    return this.connection.id
  }

  /**
   * 取得連線統計資訊
   */
  get stats() {
    return {
      id: this.connection.id,
      queryCount: this.queryCount,
      useCount: this.connection.useCount,
      sessionDuration: Date.now() - this.startTime,
      createdAt: this.connection.createdAt,
      lastUsed: this.connection.lastUsed,
    }
  }

  /**
   * 執行查詢並自動記錄
   */
  async query<T>(
    queryBuilder: (client: SupabaseClient<Database>) => Promise<T>,
    context?: { action?: string; metadata?: Record<string, unknown> }
  ): Promise<T> {
    if (this.released) {
      throw new Error('連線已釋放，無法執行查詢')
    }

    this.queryCount++
    const queryStartTime = Date.now()

    try {
      const result = await queryBuilder(this.connection.client)

      const queryDuration = Date.now() - queryStartTime

      dbLogger.debug('資料庫查詢執行成功', {
        module: 'PooledConnectionWrapper',
        action: context?.action || 'query',
        metadata: {
          ...context?.metadata,
          connectionId: this.connection.id,
          queryCount: this.queryCount,
          queryDuration,
          sessionDuration: Date.now() - this.startTime,
        },
      })

      return result
    } catch (error) {
      const queryDuration = Date.now() - queryStartTime

      dbLogger.error('資料庫查詢執行失敗', error as Error, {
        module: 'PooledConnectionWrapper',
        action: context?.action || 'query',
        metadata: {
          ...context?.metadata,
          connectionId: this.connection.id,
          queryCount: this.queryCount,
          queryDuration,
          sessionDuration: Date.now() - this.startTime,
        },
      })

      throw error
    } finally {
      // 如果啟用自動釋放，在查詢完成後釋放連線
      if (this.autoRelease) {
        this.release()
      }
    }
  }

  /**
   * 手動釋放連線
   */
  release(): void {
    if (this.released) {
      dbLogger.warn('嘗試重複釋放連線', {
        module: 'PooledConnectionWrapper',
        action: 'release',
        metadata: {
          connectionId: this.connection.id,
          queryCount: this.queryCount,
        },
      })
      return
    }

    const sessionDuration = Date.now() - this.startTime

    dbLogger.debug('釋放池化連線', {
      module: 'PooledConnectionWrapper',
      action: 'release',
      metadata: {
        connectionId: this.connection.id,
        queryCount: this.queryCount,
        sessionDuration,
        useCount: this.connection.useCount,
      },
    })

    this.pool.releaseConnection(this.connection)
    this.released = true
  }

  /**
   * 檢查連線是否已釋放
   */
  isReleased(): boolean {
    return this.released
  }

  /**
   * 實作 Symbol.asyncDispose 以支援 using 語法（未來功能）
   */
  async [Symbol.asyncDispose](): Promise<void> {
    this.release()
  }
}

/**
 * 連線管理工具類別
 * 提供便利方法來管理池化連線
 */
export class ConnectionManager {
  constructor(private pool: SupabaseConnectionPool) {}

  /**
   * 執行單一查詢（自動管理連線）
   */
  async withConnection<T>(
    queryBuilder: (client: SupabaseClient<Database>) => Promise<T>,
    context?: { action?: string; metadata?: Record<string, unknown> }
  ): Promise<T> {
    const connection = await this.pool.acquireConnection()
    const wrapper = new PooledConnectionWrapper(connection, this.pool, true)

    return wrapper.query(queryBuilder, context)
  }

  /**
   * 取得長期使用的連線（需要手動釋放）
   */
  async getConnection(): Promise<PooledConnectionWrapper> {
    const connection = await this.pool.acquireConnection()
    return new PooledConnectionWrapper(connection, this.pool, false)
  }

  /**
   * 執行事務（確保使用同一個連線）
   */
  async withTransaction<T>(
    transactionBuilder: (client: SupabaseClient<Database>) => Promise<T>,
    context?: { action?: string; metadata?: Record<string, unknown> }
  ): Promise<T> {
    const connection = await this.pool.acquireConnection()
    const wrapper = new PooledConnectionWrapper(connection, this.pool, false)

    try {
      // Supabase 會自動處理事務，但我們確保使用同一個連線
      const result = await wrapper.query(transactionBuilder, {
        ...context,
        action: `transaction_${context?.action || 'execute'}`,
      })

      return result
    } finally {
      wrapper.release()
    }
  }

  /**
   * 批次執行查詢（使用同一個連線以提升效能）
   */
  async withBatch<T>(
    queries: Array<{
      queryBuilder: (client: SupabaseClient<Database>) => Promise<any>
      context?: { action?: string; metadata?: Record<string, unknown> }
    }>
  ): Promise<T[]> {
    if (queries.length === 0) {
      return []
    }

    const connection = await this.pool.acquireConnection()
    const wrapper = new PooledConnectionWrapper(connection, this.pool, false)

    try {
      const results = []

      for (const { queryBuilder, context } of queries) {
        const result = await wrapper.query(queryBuilder, {
          ...context,
          action: `batch_${context?.action || 'query'}`,
        })
        results.push(result)
      }

      return results
    } finally {
      wrapper.release()
    }
  }

  /**
   * 取得連線池統計資訊
   */
  getPoolStats() {
    return this.pool.getStats()
  }
}
