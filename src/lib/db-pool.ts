import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { dbLogger } from '@/lib/logger'

/**
 * 連線池配置介面
 */
export interface PoolConfig {
  /** 最小連線數 */
  min: number
  /** 最大連線數 */
  max: number
  /** 空閒超時時間（毫秒） */
  idleTimeout: number
  /** 取得連線的超時時間（毫秒） */
  acquireTimeout: number
  /** 健康檢查間隔（毫秒） */
  healthCheckInterval: number
  /** 啟用連線池（功能開關） */
  enabled: boolean
}

/**
 * 連線狀態
 */
enum ConnectionState {
  IDLE = 'idle', // 空閒中
  ACTIVE = 'active', // 使用中
  UNHEALTHY = 'unhealthy', // 不健康
}

/**
 * 池化連線資訊
 */
interface PooledConnection {
  id: string
  client: SupabaseClient<Database>
  state: ConnectionState
  createdAt: number
  lastUsed: number
  useCount: number
}

/**
 * 連線池統計資訊
 */
export interface PoolStats {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  unhealthyConnections: number
  totalRequests: number
  failedRequests: number
  averageAcquireTime: number
  poolUtilization: number
}

/**
 * Supabase 連線池管理器
 * 提供高效能的資料庫連線管理
 */
export class SupabaseConnectionPool {
  private connections: Map<string, PooledConnection> = new Map()
  private waitingQueue: Array<{
    resolve: (connection: PooledConnection) => void
    reject: (error: Error) => void
    timestamp: number
  }> = []
  private schemaVersion: number = Date.now() // 追蹤 schema 版本

  private stats = {
    totalRequests: 0,
    failedRequests: 0,
    acquireTimes: [] as number[],
  }

  private healthCheckTimer?: NodeJS.Timeout
  private cleanupTimer?: NodeJS.Timeout

  constructor(
    private config: PoolConfig,
    private supabaseUrl: string,
    private supabaseKey: string
  ) {
    if (config.enabled) {
      this.initialize()
    }

    dbLogger.info('Supabase 連線池初始化', {
      module: 'SupabaseConnectionPool',
      action: 'constructor',
      metadata: {
        config: {
          enabled: config.enabled,
          min: config.min,
          max: config.max,
          idleTimeout: config.idleTimeout,
          acquireTimeout: config.acquireTimeout,
        },
      },
    })
  }

  /**
   * 初始化連線池
   */
  private async initialize(): Promise<void> {
    try {
      // 建立最小數量的連線
      for (let i = 0; i < this.config.min; i++) {
        await this.createConnection()
      }

      // 啟動健康檢查
      this.startHealthCheck()

      // 啟動清理程序
      this.startCleanup()

      dbLogger.info('連線池初始化完成', {
        module: 'SupabaseConnectionPool',
        action: 'initialize',
        metadata: {
          initialConnections: this.connections.size,
        },
      })
    } catch (error) {
      dbLogger.error('連線池初始化失敗', error as Error, {
        module: 'SupabaseConnectionPool',
        action: 'initialize',
      })
      throw error
    }
  }

  /**
   * 建立新連線
   */
  private async createConnection(): Promise<PooledConnection> {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      const client = createClient<Database>(this.supabaseUrl, this.supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        // 設定連線選項優化
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'Connection-Pool-ID': connectionId,
          },
        },
      })

      const connection: PooledConnection = {
        id: connectionId,
        client,
        state: ConnectionState.IDLE,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        useCount: 0,
      }

      // 驗證連線是否可用
      await this.validateConnection(connection)

      this.connections.set(connectionId, connection)

      dbLogger.debug('新連線建立成功', {
        module: 'SupabaseConnectionPool',
        action: 'createConnection',
        metadata: {
          connectionId,
          totalConnections: this.connections.size,
        },
      })

      return connection
    } catch (error) {
      dbLogger.error('建立連線失敗', error as Error, {
        module: 'SupabaseConnectionPool',
        action: 'createConnection',
        metadata: { connectionId },
      })
      throw error
    }
  }

  /**
   * 驗證連線是否健康
   */
  private async validateConnection(connection: PooledConnection): Promise<boolean> {
    try {
      // 執行簡單的健康檢查查詢
      const { error } = await connection.client.from('products').select('id').limit(1).maybeSingle()

      const isHealthy = !error || error.code === 'PGRST116' // 表格可能為空

      if (!isHealthy) {
        connection.state = ConnectionState.UNHEALTHY
        dbLogger.warn('連線健康檢查失敗', {
          module: 'SupabaseConnectionPool',
          action: 'validateConnection',
          metadata: {
            connectionId: connection.id,
            error: error?.message,
          },
        })
      }

      return isHealthy
    } catch (error) {
      connection.state = ConnectionState.UNHEALTHY
      return false
    }
  }

  /**
   * 取得連線（主要 API）
   */
  async acquireConnection(): Promise<PooledConnection> {
    if (!this.config.enabled) {
      throw new Error('連線池已停用，請使用傳統連線方式')
    }

    this.stats.totalRequests++
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.stats.failedRequests++
        reject(new Error(`取得連線逾時（${this.config.acquireTimeout}ms）`))
      }, this.config.acquireTimeout)

      const tryAcquire = () => {
        // 尋找空閒連線
        const idleConnection = Array.from(this.connections.values()).find(
          conn => conn.state === ConnectionState.IDLE
        )

        if (idleConnection) {
          clearTimeout(timeoutId)
          idleConnection.state = ConnectionState.ACTIVE
          idleConnection.lastUsed = Date.now()
          idleConnection.useCount++

          const acquireTime = Date.now() - startTime
          this.stats.acquireTimes.push(acquireTime)

          // 保持最近 100 筆記錄
          if (this.stats.acquireTimes.length > 100) {
            this.stats.acquireTimes.shift()
          }

          dbLogger.debug('連線取得成功', {
            module: 'SupabaseConnectionPool',
            action: 'acquireConnection',
            metadata: {
              connectionId: idleConnection.id,
              acquireTime,
              useCount: idleConnection.useCount,
            },
          })

          resolve(idleConnection)
          return
        }

        // 沒有空閒連線，嘗試建立新連線
        if (this.connections.size < this.config.max) {
          this.createConnection()
            .then(newConnection => {
              clearTimeout(timeoutId)
              newConnection.state = ConnectionState.ACTIVE
              newConnection.useCount++

              const acquireTime = Date.now() - startTime
              this.stats.acquireTimes.push(acquireTime)

              resolve(newConnection)
            })
            .catch(() => {
              // 建立失敗，加入等待佇列
              this.waitingQueue.push({ resolve, reject, timestamp: Date.now() })
            })
          return
        }

        // 達到最大連線數，加入等待佇列
        this.waitingQueue.push({ resolve, reject, timestamp: Date.now() })
      }

      tryAcquire()
    })
  }

  /**
   * 釋放連線
   */
  releaseConnection(connection: PooledConnection): void {
    if (!this.connections.has(connection.id)) {
      dbLogger.warn('嘗試釋放不存在的連線', {
        module: 'SupabaseConnectionPool',
        action: 'releaseConnection',
        metadata: { connectionId: connection.id },
      })
      return
    }

    connection.state = ConnectionState.IDLE
    connection.lastUsed = Date.now()

    // 處理等待佇列
    if (this.waitingQueue.length > 0) {
      const waiting = this.waitingQueue.shift()
      if (waiting) {
        connection.state = ConnectionState.ACTIVE
        connection.useCount++
        waiting.resolve(connection)
      }
    }

    dbLogger.debug('連線釋放成功', {
      module: 'SupabaseConnectionPool',
      action: 'releaseConnection',
      metadata: {
        connectionId: connection.id,
        waitingQueueLength: this.waitingQueue.length,
      },
    })
  }

  /**
   * 啟動健康檢查
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      const unhealthyConnections: string[] = []

      for (const [id, connection] of this.connections) {
        if (connection.state !== ConnectionState.ACTIVE) {
          const isHealthy = await this.validateConnection(connection)
          if (!isHealthy) {
            unhealthyConnections.push(id)
          }
        }
      }

      // 移除不健康的連線
      for (const id of unhealthyConnections) {
        this.connections.delete(id)
        dbLogger.warn('移除不健康的連線', {
          module: 'SupabaseConnectionPool',
          action: 'healthCheck',
          metadata: { connectionId: id },
        })
      }

      // 確保最少連線數
      const currentHealthy = this.connections.size
      if (currentHealthy < this.config.min) {
        const needed = this.config.min - currentHealthy
        for (let i = 0; i < needed; i++) {
          try {
            await this.createConnection()
          } catch (error) {
            dbLogger.error('健康檢查期間建立連線失敗', error as Error, {
              module: 'SupabaseConnectionPool',
              action: 'healthCheck',
            })
          }
        }
      }
    }, this.config.healthCheckInterval)
  }

  /**
   * 啟動清理程序
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(
      () => {
        const now = Date.now()
        const connectionsToRemove: string[] = []

        for (const [id, connection] of this.connections) {
          // 清理超過空閒時間的連線（但保持最小數量）
          if (
            connection.state === ConnectionState.IDLE &&
            now - connection.lastUsed > this.config.idleTimeout &&
            this.connections.size > this.config.min
          ) {
            connectionsToRemove.push(id)
          }
        }

        for (const id of connectionsToRemove) {
          this.connections.delete(id)
          dbLogger.debug('清理空閒連線', {
            module: 'SupabaseConnectionPool',
            action: 'cleanup',
            metadata: { connectionId: id },
          })
        }

        // 清理過期的等待請求
        const validWaiting = this.waitingQueue.filter(item => {
          if (now - item.timestamp > this.config.acquireTimeout) {
            item.reject(new Error('等待連線逾時'))
            return false
          }
          return true
        })
        this.waitingQueue = validWaiting
      },
      Math.min(this.config.idleTimeout / 2, 30000)
    ) // 每30秒或空閒時間的一半清理一次
  }

  /**
   * 取得連線池統計資訊
   */
  getStats(): PoolStats {
    const connections = Array.from(this.connections.values())
    const activeConnections = connections.filter(c => c.state === ConnectionState.ACTIVE).length
    const idleConnections = connections.filter(c => c.state === ConnectionState.IDLE).length
    const unhealthyConnections = connections.filter(
      c => c.state === ConnectionState.UNHEALTHY
    ).length

    const averageAcquireTime =
      this.stats.acquireTimes.length > 0
        ? this.stats.acquireTimes.reduce((a, b) => a + b, 0) / this.stats.acquireTimes.length
        : 0

    return {
      totalConnections: this.connections.size,
      activeConnections,
      idleConnections,
      unhealthyConnections,
      totalRequests: this.stats.totalRequests,
      failedRequests: this.stats.failedRequests,
      averageAcquireTime,
      poolUtilization: this.config.max > 0 ? (activeConnections / this.config.max) * 100 : 0,
    }
  }

  /**
   * 重置所有連線（用於 schema 變更後）
   */
  async resetConnections(): Promise<void> {
    dbLogger.info('開始重置連線池', {
      module: 'SupabaseConnectionPool',
      action: 'resetConnections',
      metadata: {
        currentConnections: this.connections.size,
        oldSchemaVersion: this.schemaVersion,
      },
    })

    // 更新 schema 版本
    this.schemaVersion = Date.now()

    // 標記所有連線為不健康，強制重建
    for (const [id, connection] of this.connections) {
      connection.state = ConnectionState.UNHEALTHY
    }

    // 清理所有現有連線
    const oldConnections = Array.from(this.connections.keys())
    this.connections.clear()

    // 重建最小數量的連線
    try {
      for (let i = 0; i < this.config.min; i++) {
        await this.createConnection()
      }

      dbLogger.info('連線池重置完成', {
        module: 'SupabaseConnectionPool',
        action: 'resetConnections',
        metadata: {
          oldConnectionsCleared: oldConnections.length,
          newConnectionsCreated: this.connections.size,
          newSchemaVersion: this.schemaVersion,
        },
      })
    } catch (error) {
      dbLogger.error('連線池重置失敗', error as Error, {
        module: 'SupabaseConnectionPool',
        action: 'resetConnections',
      })
      throw error
    }
  }

  /**
   * 強制重新整理 schema（清除快取）
   */
  async refreshSchema(): Promise<void> {
    dbLogger.info('開始重新整理 schema', {
      module: 'SupabaseConnectionPool',
      action: 'refreshSchema',
    })

    // 如果連線池未啟用，直接返回
    if (!this.config.enabled) {
      dbLogger.info('連線池未啟用，跳過 schema 重新整理', {
        module: 'SupabaseConnectionPool',
        action: 'refreshSchema',
      })
      return
    }

    // 重置所有連線以獲取新的 schema
    await this.resetConnections()
  }

  /**
   * 取得當前 schema 版本
   */
  getSchemaVersion(): number {
    return this.schemaVersion
  }

  /**
   * 關閉連線池
   */
  async shutdown(): Promise<void> {
    dbLogger.info('開始關閉連線池', {
      module: 'SupabaseConnectionPool',
      action: 'shutdown',
    })

    // 清理定時器
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    // 拒絕等待中的請求
    for (const waiting of this.waitingQueue) {
      waiting.reject(new Error('連線池正在關閉'))
    }
    this.waitingQueue.length = 0

    // 清理所有連線
    this.connections.clear()

    dbLogger.info('連線池關閉完成', {
      module: 'SupabaseConnectionPool',
      action: 'shutdown',
    })
  }
}

/**
 * 預設連線池配置
 */
export const DEFAULT_POOL_CONFIG: PoolConfig = {
  min: 2,
  max: 10,
  idleTimeout: 30000, // 30 秒
  acquireTimeout: 10000, // 10 秒
  healthCheckInterval: 60000, // 60 秒
  enabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_CONNECTION_POOL === 'true',
}
