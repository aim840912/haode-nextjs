import { PoolConfig } from '../db-pool'

/**
 * 連線池配置管理
 */
export class PoolConfigManager {
  /**
   * 根據環境取得連線池配置
   */
  static getConfig(): PoolConfig {
    const isProduction = process.env.NODE_ENV === 'production'
    const isDevelopment = process.env.NODE_ENV === 'development'
    const forceEnable = process.env.ENABLE_CONNECTION_POOL === 'true'
    const forceDisable = process.env.DISABLE_CONNECTION_POOL === 'true'

    // 決定是否啟用連線池
    let enabled = false
    if (forceDisable) {
      enabled = false
    } else if (forceEnable) {
      enabled = true
    } else {
      // 預設在生產環境啟用
      enabled = isProduction
    }

    // 根據環境調整配置
    const baseConfig: PoolConfig = {
      enabled,
      min: parseInt(process.env.DB_POOL_MIN_CONNECTIONS || '2'),
      max: parseInt(process.env.DB_POOL_MAX_CONNECTIONS || (isProduction ? '10' : '5')),
      idleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'), // 30 秒
      acquireTimeout: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '10000'), // 10 秒
      healthCheckInterval: parseInt(process.env.DB_POOL_HEALTH_CHECK_INTERVAL || '60000'), // 60 秒
    }

    // 開發環境優化
    if (isDevelopment) {
      return {
        ...baseConfig,
        min: Math.max(1, baseConfig.min - 1), // 開發環境最少連線數減 1
        healthCheckInterval: baseConfig.healthCheckInterval * 2, // 開發環境健康檢查間隔加倍
      }
    }

    // 生產環境優化
    if (isProduction) {
      return {
        ...baseConfig,
        min: Math.max(2, baseConfig.min), // 生產環境最少 2 個連線
        max: Math.min(20, baseConfig.max), // 生產環境最多 20 個連線
      }
    }

    return baseConfig
  }

  /**
   * 驗證配置合理性
   */
  static validateConfig(config: PoolConfig): void {
    const errors: string[] = []

    if (config.min < 0) {
      errors.push('最小連線數不能小於 0')
    }

    if (config.max <= 0) {
      errors.push('最大連線數必須大於 0')
    }

    if (config.min > config.max) {
      errors.push('最小連線數不能大於最大連線數')
    }

    if (config.idleTimeout < 1000) {
      errors.push('空閒超時時間不能小於 1 秒')
    }

    if (config.acquireTimeout < 1000) {
      errors.push('取得連線超時時間不能小於 1 秒')
    }

    if (config.healthCheckInterval < 10000) {
      errors.push('健康檢查間隔不能小於 10 秒')
    }

    if (errors.length > 0) {
      throw new Error(`連線池配置錯誤: ${errors.join(', ')}`)
    }
  }

  /**
   * 取得配置摘要（用於日誌）
   */
  static getConfigSummary(config: PoolConfig): Record<string, any> {
    return {
      enabled: config.enabled,
      connections: `${config.min}-${config.max}`,
      timeouts: {
        idle: `${config.idleTimeout / 1000}s`,
        acquire: `${config.acquireTimeout / 1000}s`,
        healthCheck: `${config.healthCheckInterval / 1000}s`,
      },
      environment: process.env.NODE_ENV,
    }
  }
}

/**
 * 環境變數配置說明
 *
 * DB_POOL_MIN_CONNECTIONS: 最小連線數（預設: 2）
 * DB_POOL_MAX_CONNECTIONS: 最大連線數（預設: 生產 10, 開發 5）
 * DB_POOL_IDLE_TIMEOUT: 空閒超時時間，毫秒（預設: 30000）
 * DB_POOL_ACQUIRE_TIMEOUT: 取得連線超時時間，毫秒（預設: 10000）
 * DB_POOL_HEALTH_CHECK_INTERVAL: 健康檢查間隔，毫秒（預設: 60000）
 * ENABLE_CONNECTION_POOL: 強制啟用連線池（預設: false，生產環境除外）
 * DISABLE_CONNECTION_POOL: 強制停用連線池（預設: false）
 *
 * 使用範例:
 *
 * # .env.local - 開發環境
 * ENABLE_CONNECTION_POOL=true
 * DB_POOL_MIN_CONNECTIONS=1
 * DB_POOL_MAX_CONNECTIONS=3
 *
 * # .env.production - 生產環境
 * DB_POOL_MIN_CONNECTIONS=5
 * DB_POOL_MAX_CONNECTIONS=15
 * DB_POOL_IDLE_TIMEOUT=60000
 */
