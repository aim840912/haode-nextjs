import { SupabaseConnectionPool } from '../db-pool'
import { ConnectionManager } from '../pooled-connection'
import { PoolConfigManager } from './pool-config'
import { createServiceSupabaseClient } from '../supabase-server'
import { dbLogger } from '../logger'

/**
 * 連線工廠單例
 * 管理全域的連線池實例
 */
class SupabaseConnectionFactory {
  private static instance: SupabaseConnectionFactory
  private connectionPool?: SupabaseConnectionPool
  private connectionManager?: ConnectionManager
  private initialized = false

  private constructor() {}

  /**
   * 取得工廠單例
   */
  static getInstance(): SupabaseConnectionFactory {
    if (!SupabaseConnectionFactory.instance) {
      SupabaseConnectionFactory.instance = new SupabaseConnectionFactory()
    }
    return SupabaseConnectionFactory.instance
  }

  /**
   * 初始化連線池
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      const config = PoolConfigManager.getConfig()

      // 驗證配置
      PoolConfigManager.validateConfig(config)

      dbLogger.info('初始化 Supabase 連線工廠', {
        module: 'SupabaseConnectionFactory',
        action: 'initialize',
        metadata: {
          config: PoolConfigManager.getConfigSummary(config),
        },
      })

      if (!config.enabled) {
        dbLogger.info('連線池已停用，使用傳統單例模式', {
          module: 'SupabaseConnectionFactory',
          action: 'initialize',
        })
        this.initialized = true
        return
      }

      // 取得 Supabase 連線參數
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('缺少必要的 Supabase 環境變數')
      }

      // 建立連線池
      this.connectionPool = new SupabaseConnectionPool(config, supabaseUrl, supabaseKey)

      // 建立連線管理器
      this.connectionManager = new ConnectionManager(this.connectionPool)

      this.initialized = true

      dbLogger.info('Supabase 連線工廠初始化完成', {
        module: 'SupabaseConnectionFactory',
        action: 'initialize',
        metadata: {
          poolEnabled: true,
        },
      })
    } catch (error) {
      dbLogger.error('Supabase 連線工廠初始化失敗', error as Error, {
        module: 'SupabaseConnectionFactory',
        action: 'initialize',
      })

      // 初始化失敗時，標記為已初始化但不使用連線池
      this.initialized = true
      this.connectionPool = undefined
      this.connectionManager = undefined

      throw error
    }
  }

  /**
   * 取得連線管理器
   */
  async getConnectionManager(): Promise<ConnectionManager | null> {
    if (!this.initialized) {
      await this.initialize()
    }

    return this.connectionManager || null
  }

  /**
   * 取得連線池（如果啟用）
   */
  async getConnectionPool(): Promise<SupabaseConnectionPool | null> {
    if (!this.initialized) {
      await this.initialize()
    }

    return this.connectionPool || null
  }

  /**
   * 檢查連線池是否啟用
   */
  async isPoolEnabled(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize()
    }

    return this.connectionPool !== undefined
  }

  /**
   * 取得傳統的單例連線（後備方案）
   */
  getFallbackConnection() {
    return createServiceSupabaseClient()
  }

  /**
   * 關閉連線工廠
   */
  async shutdown(): Promise<void> {
    if (this.connectionPool) {
      await this.connectionPool.shutdown()
    }

    this.connectionPool = undefined
    this.connectionManager = undefined
    this.initialized = false

    dbLogger.info('Supabase 連線工廠已關閉', {
      module: 'SupabaseConnectionFactory',
      action: 'shutdown',
    })
  }
}

/**
 * 全域連線工廠實例
 */
export const connectionFactory = SupabaseConnectionFactory.getInstance()

/**
 * 便利函數：取得連線管理器
 */
export async function getConnectionManager(): Promise<ConnectionManager> {
  const manager = await connectionFactory.getConnectionManager()

  if (!manager) {
    throw new Error('連線池未啟用，請使用傳統的 Supabase 客戶端')
  }

  return manager
}

/**
 * 便利函數：執行單一查詢（自動管理連線）
 */
export async function withPooledConnection<T>(
  queryBuilder: (client: any) => Promise<T>,
  context?: { action?: string; metadata?: Record<string, unknown> }
): Promise<T> {
  try {
    const manager = await getConnectionManager()
    return await manager.withConnection(queryBuilder, context)
  } catch (error) {
    // 如果連線池不可用，使用傳統連線
    dbLogger.warn('連線池不可用，使用傳統連線', {
      module: 'SupabaseConnectionFactory',
      action: 'withPooledConnection',
      metadata: {
        fallbackUsed: true,
        error: (error as Error).message,
      },
    })

    const fallbackClient = connectionFactory.getFallbackConnection()
    return await queryBuilder(fallbackClient)
  }
}

/**
 * 便利函數：檢查是否應該使用連線池
 */
export async function shouldUseConnectionPool(): Promise<boolean> {
  try {
    return await connectionFactory.isPoolEnabled()
  } catch {
    return false
  }
}

/**
 * 便利函數：取得連線池統計資訊
 */
export async function getPoolStats() {
  const manager = await connectionFactory.getConnectionManager()
  return manager?.getPoolStats() || null
}

/**
 * 應用程式關閉時清理資源
 */
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await connectionFactory.shutdown()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await connectionFactory.shutdown()
    process.exit(0)
  })
}
