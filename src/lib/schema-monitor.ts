import { createServiceSupabaseClient } from './supabase-server'
import { dbLogger } from './logger'
import { refreshConnectionPoolSchema } from './supabase/connection-factory'

/**
 * Schema 監控器 - 偵測資料庫 schema 變更
 * 當偵測到變更時自動重新整理連線池
 */
export class SchemaMonitor {
  private static instance: SchemaMonitor
  private intervalId?: NodeJS.Timeout
  private lastSchemaHash?: string
  private monitoringEnabled = false
  private checkInterval: number = 60000 // 60 秒

  private constructor() {}

  static getInstance(): SchemaMonitor {
    if (!SchemaMonitor.instance) {
      SchemaMonitor.instance = new SchemaMonitor()
    }
    return SchemaMonitor.instance
  }

  /**
   * 開始監控 schema 變更
   */
  async startMonitoring(checkIntervalMs: number = 60000): Promise<void> {
    if (this.monitoringEnabled) {
      dbLogger.warn('Schema 監控已啟用，跳過重複啟動', {
        module: 'SchemaMonitor',
        action: 'startMonitoring',
      })
      return
    }

    this.checkInterval = checkIntervalMs
    this.monitoringEnabled = true

    // 初始化當前 schema 雜湊值
    try {
      this.lastSchemaHash = await this.getSchemaHash()

      dbLogger.info('Schema 監控開始', {
        module: 'SchemaMonitor',
        action: 'startMonitoring',
        metadata: {
          checkIntervalMs,
          initialSchemaHash: this.lastSchemaHash.substring(0, 8) + '...',
        },
      })

      // 設定定期檢查
      this.intervalId = setInterval(async () => {
        await this.checkSchemaChanges()
      }, this.checkInterval)
    } catch (error) {
      dbLogger.error('Schema 監控啟動失敗', error as Error, {
        module: 'SchemaMonitor',
        action: 'startMonitoring',
      })
      this.monitoringEnabled = false
      throw error
    }
  }

  /**
   * 停止監控
   */
  stopMonitoring(): void {
    if (!this.monitoringEnabled) {
      return
    }

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }

    this.monitoringEnabled = false

    dbLogger.info('Schema 監控已停止', {
      module: 'SchemaMonitor',
      action: 'stopMonitoring',
    })
  }

  /**
   * 手動檢查 schema 變更
   */
  async checkSchemaChanges(): Promise<boolean> {
    if (!this.monitoringEnabled || !this.lastSchemaHash) {
      return false
    }

    try {
      const currentSchemaHash = await this.getSchemaHash()

      if (currentSchemaHash !== this.lastSchemaHash) {
        dbLogger.info('偵測到 schema 變更', {
          module: 'SchemaMonitor',
          action: 'checkSchemaChanges',
          metadata: {
            oldSchemaHash: this.lastSchemaHash.substring(0, 8) + '...',
            newSchemaHash: currentSchemaHash.substring(0, 8) + '...',
          },
        })

        // 自動重新整理連線池
        try {
          await refreshConnectionPoolSchema()

          dbLogger.info('Schema 變更後連線池自動重新整理完成', {
            module: 'SchemaMonitor',
            action: 'checkSchemaChanges',
          })
        } catch (refreshError) {
          dbLogger.error('Schema 變更後連線池重新整理失敗', refreshError as Error, {
            module: 'SchemaMonitor',
            action: 'checkSchemaChanges',
          })
        }

        // 更新儲存的雜湊值
        this.lastSchemaHash = currentSchemaHash
        return true
      }

      return false
    } catch (error) {
      dbLogger.error('Schema 變更檢查失敗', error as Error, {
        module: 'SchemaMonitor',
        action: 'checkSchemaChanges',
      })
      return false
    }
  }

  /**
   * 取得當前 schema 雜湊值
   * 透過查詢系統表格來計算 schema 的雜湊值
   */
  private async getSchemaHash(): Promise<string> {
    const supabase = createServiceSupabaseClient()

    try {
      // 查詢 information_schema 來取得表格結構資訊
      // 這個查詢會回傳所有資料表和欄位的詳細資訊
      const result = await (supabase as any).rpc('get_schema_info', {})
      const { data: schemaInfo, error } = result

      if (error) {
        // 如果 RPC 函數不存在，使用簡化的替代方案
        dbLogger.warn('get_schema_info RPC 不存在，使用替代方案', {
          module: 'SchemaMonitor',
          action: 'getSchemaHash',
          metadata: { error: error.message },
        })

        return await this.getSchemaHashFallback()
      }

      // 將 schema 資訊轉換為字串並計算雜湊值
      const schemaString = JSON.stringify(schemaInfo, Object.keys(schemaInfo).sort())
      return this.simpleHash(schemaString)
    } catch (error) {
      dbLogger.warn('取得 schema 資訊失敗，使用替代方案', {
        module: 'SchemaMonitor',
        action: 'getSchemaHash',
        metadata: { error: String(error) },
      })

      return await this.getSchemaHashFallback()
    }
  }

  /**
   * Schema 雜湊值替代方案
   * 查詢主要資料表的欄位資訊來計算簡化的雜湊值
   */
  private async getSchemaHashFallback(): Promise<string> {
    const supabase = createServiceSupabaseClient()

    try {
      // 查詢主要資料表的 schema 資訊
      const mainTables = ['locations', 'products', 'users', 'inquiries']
      const schemaData: any[] = []

      for (const tableName of mainTables) {
        try {
          // 嘗試查詢表格結構（透過查詢第一筆記錄來取得欄位資訊）
          const { data, error } = await supabase
            .from(tableName as any)
            .select('*')
            .limit(1)
            .maybeSingle()

          if (!error && data) {
            // 取得欄位名稱並排序
            const fields = Object.keys(data).sort()
            schemaData.push({ table: tableName, fields })
          } else if (error && !error.message.includes('does not exist')) {
            // 資料表存在但查詢失敗
            schemaData.push({ table: tableName, error: error.message })
          }
        } catch (tableError) {
          // 忽略不存在的資料表
        }
      }

      // 計算雜湊值
      const schemaString = JSON.stringify(schemaData)
      return this.simpleHash(schemaString)
    } catch (error) {
      // 最終替代方案：使用時間戳
      dbLogger.warn('Schema 監控使用時間戳替代方案', {
        module: 'SchemaMonitor',
        action: 'getSchemaHashFallback',
        metadata: { error: String(error) },
      })

      return this.simpleHash(Date.now().toString())
    }
  }

  /**
   * 簡單的字串雜湊函數
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 轉換為 32 位元整數
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * 取得監控狀態
   */
  getStatus() {
    return {
      enabled: this.monitoringEnabled,
      checkInterval: this.checkInterval,
      lastSchemaHash: this.lastSchemaHash ? this.lastSchemaHash.substring(0, 8) + '...' : null,
      hasIntervalId: !!this.intervalId,
    }
  }
}

/**
 * 預設的 schema 監控器實例
 */
export const schemaMonitor = SchemaMonitor.getInstance()

/**
 * 便利函數：啟動 schema 監控
 */
export function startSchemaMonitoring(checkIntervalMs: number = 60000): Promise<void> {
  return schemaMonitor.startMonitoring(checkIntervalMs)
}

/**
 * 便利函數：停止 schema 監控
 */
export function stopSchemaMonitoring(): void {
  schemaMonitor.stopMonitoring()
}

/**
 * 便利函數：手動檢查 schema 變更
 */
export function checkSchemaChanges(): Promise<boolean> {
  return schemaMonitor.checkSchemaChanges()
}
