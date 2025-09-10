/**
 * 環境變數載入輔助工具
 *
 * 🎯 功能：
 * - 自動載入 .env.local 檔案
 * - 驗證必要環境變數是否存在
 * - 提供環境變數類型安全存取
 * - 支援不同環境的配置載入
 */

import { config } from 'dotenv'
import path from 'path'
import { dbLogger } from '../../src/lib/logger'

interface EnvironmentConfig {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  SUPABASE_ANON_KEY: string
  NODE_ENV: string
  LOG_LEVEL: string
  JWT_SECRET?: string
  ADMIN_API_KEY?: string
}

interface LoadEnvOptions {
  required?: (keyof EnvironmentConfig)[]
  envPath?: string
  silent?: boolean
}

class EnvironmentLoader {
  private static isLoaded = false
  private static config: Partial<EnvironmentConfig> = {}

  /**
   * 載入環境變數配置
   */
  static load(options: LoadEnvOptions = {}): EnvironmentConfig {
    const {
      required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
      envPath = path.join(__dirname, '../../.env.local'),
      silent = false,
    } = options

    // 避免重複載入
    if (!this.isLoaded) {
      if (!silent) {
        dbLogger.info('載入環境變數配置', {
          module: 'EnvironmentLoader',
          metadata: { envPath },
        })
      }

      // 載入 .env.local 檔案
      const result = config({ path: envPath })

      if (result.error && !silent) {
        dbLogger.warn('無法載入 .env.local 檔案', {
          module: 'EnvironmentLoader',
          metadata: { error: result.error.message, envPath },
        })
      }

      // 建立配置對象
      this.config = {
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_ANON_KEY:
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
        NODE_ENV: process.env.NODE_ENV || 'development',
        LOG_LEVEL: process.env.LOG_LEVEL || 'INFO',
        JWT_SECRET: process.env.JWT_SECRET,
        ADMIN_API_KEY: process.env.ADMIN_API_KEY,
      }

      this.isLoaded = true

      if (!silent) {
        dbLogger.info('環境變數載入完成', {
          module: 'EnvironmentLoader',
          metadata: {
            loadedKeys: Object.keys(this.config).filter(
              key => this.config[key as keyof EnvironmentConfig]
            ),
            nodeEnv: this.config.NODE_ENV,
          },
        })
      }
    }

    // 驗證必要的環境變數
    this.validateRequired(required, silent)

    return this.config as EnvironmentConfig
  }

  /**
   * 驗證必要的環境變數
   */
  private static validateRequired(required: (keyof EnvironmentConfig)[], silent: boolean): void {
    const missing = required.filter(key => !this.config[key])

    if (missing.length > 0) {
      const errorMessage = `缺少必要的環境變數: ${missing.join(', ')}`

      if (!silent) {
        dbLogger.error(errorMessage, new Error('Environment validation failed'), {
          module: 'EnvironmentLoader',
          metadata: { missingKeys: missing },
        })
      }

      throw new Error(errorMessage)
    }
  }

  /**
   * 取得特定環境變數
   */
  static get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    if (!this.isLoaded) {
      this.load({ silent: true })
    }
    return this.config[key] as EnvironmentConfig[K]
  }

  /**
   * 檢查環境變數是否存在
   */
  static has(key: keyof EnvironmentConfig): boolean {
    if (!this.isLoaded) {
      this.load({ silent: true })
    }
    return Boolean(this.config[key])
  }

  /**
   * 取得所有已載入的環境變數
   */
  static getAll(): Partial<EnvironmentConfig> {
    if (!this.isLoaded) {
      this.load({ silent: true })
    }
    return { ...this.config }
  }

  /**
   * 重設載入狀態（測試用）
   */
  static reset(): void {
    this.isLoaded = false
    this.config = {}
  }

  /**
   * 檢查是否為開發環境
   */
  static isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development'
  }

  /**
   * 檢查是否為生產環境
   */
  static isProduction(): boolean {
    return this.get('NODE_ENV') === 'production'
  }

  /**
   * 取得 Supabase 配置
   */
  static getSupabaseConfig(): {
    url: string
    serviceRoleKey: string
    anonKey: string
  } {
    return {
      url: this.get('SUPABASE_URL'),
      serviceRoleKey: this.get('SUPABASE_SERVICE_ROLE_KEY'),
      anonKey: this.get('SUPABASE_ANON_KEY'),
    }
  }
}

/**
 * 簡化的環境變數載入函數
 */
export function loadEnv(options?: LoadEnvOptions): EnvironmentConfig {
  return EnvironmentLoader.load(options)
}

/**
 * 載入 Supabase 專用配置
 */
export function loadSupabaseConfig(): {
  url: string
  serviceRoleKey: string
  anonKey: string
} {
  loadEnv({ required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] })
  return EnvironmentLoader.getSupabaseConfig()
}

/**
 * 檢查環境變數是否存在
 */
export function hasEnv(key: keyof EnvironmentConfig): boolean {
  return EnvironmentLoader.has(key)
}

/**
 * 取得特定環境變數
 */
export function getEnv<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
  return EnvironmentLoader.get(key)
}

// 預設匯出
export default EnvironmentLoader

// 常用環境檢查
export const isDev = () => EnvironmentLoader.isDevelopment()
export const isProd = () => EnvironmentLoader.isProduction()
