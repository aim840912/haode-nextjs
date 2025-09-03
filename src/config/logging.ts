/**
 * 日誌配置設定
 * 
 * 集中管理整個應用程式的日誌行為
 */

import { LogLevel } from '@/lib/logger'

export interface LoggingConfig {
  // 基本設定
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  
  // 效能相關
  enablePerformanceLogging: boolean
  slowQueryThreshold: number  // 慢查詢閾值（毫秒）
  slowApiThreshold: number    // 慢 API 閾值（毫秒）
  
  // 安全相關
  enableSecurityLogging: boolean
  maskSensitiveData: boolean
  
  // 整合服務
  enableSentry: boolean
  enableAnalytics: boolean
}

// 環境特定配置
const configs: Record<string, LoggingConfig> = {
  development: {
    level: LogLevel.DEBUG,
    enableConsole: true,
    enableFile: false,
    enablePerformanceLogging: true,
    slowQueryThreshold: 100,
    slowApiThreshold: 500,
    enableSecurityLogging: true,
    maskSensitiveData: false,  // 開發環境可以看完整資料
    enableSentry: false,
    enableAnalytics: false,
  },
  
  test: {
    level: LogLevel.WARN,      // 測試時減少雜訊
    enableConsole: false,      // 測試時不輸出 console
    enableFile: true,
    enablePerformanceLogging: false,
    slowQueryThreshold: 200,
    slowApiThreshold: 1000,
    enableSecurityLogging: false,
    maskSensitiveData: true,
    enableSentry: false,
    enableAnalytics: false,
  },
  
  production: {
    level: LogLevel.WARN,      // 生產環境只記錄警告以上
    enableConsole: true,       // 使用結構化 JSON 輸出
    enableFile: false,         // 使用雲端日誌服務
    enablePerformanceLogging: true,
    slowQueryThreshold: 500,   // 生產環境較嚴格的效能標準
    slowApiThreshold: 2000,
    enableSecurityLogging: true,
    maskSensitiveData: true,   // 生產環境必須遮蔽敏感資料
    enableSentry: true,        // 啟用錯誤追蹤
    enableAnalytics: true,
  }
}

export const loggingConfig = configs[process.env.NODE_ENV || 'development']

// 敏感資料欄位清單（需要遮蔽的欄位）
export const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'secret',
  'credential',
  'authorization',
  'cookie',
  'session',
  // 個人資訊
  'email',
  'phone',
  'address',
  'creditCard',
  'ssn',
  'idNumber'
]

// 效能監控的關鍵指標
export const PERFORMANCE_METRICS = {
  // API 回應時間分級
  API_RESPONSE_TIME: {
    FAST: 200,      // < 200ms 為快速
    NORMAL: 1000,   // 200ms - 1s 為正常
    SLOW: 3000,     // 1s - 3s 為慢
    // > 3s 為非常慢
  },
  
  // 資料庫查詢時間分級
  DB_QUERY_TIME: {
    FAST: 50,       // < 50ms 為快速
    NORMAL: 200,    // 50ms - 200ms 為正常
    SLOW: 1000,     // 200ms - 1s 為慢
    // > 1s 為非常慢
  },
  
  // 快取命中率標準
  CACHE_HIT_RATE: {
    EXCELLENT: 0.95,  // > 95% 為優秀
    GOOD: 0.8,        // > 80% 為良好
    POOR: 0.5,        // < 50% 為差
  }
}

// 日誌格式模板
export const LOG_TEMPLATES = {
  API_REQUEST: 'API 請求: {method} {path}',
  API_RESPONSE: 'API 回應: {method} {path} - {status} ({duration}ms)',
  DB_QUERY: '資料庫查詢: {operation} on {table} ({duration}ms)',
  CACHE_HIT: '快取命中: {key}',
  CACHE_MISS: '快取未命中: {key}',
  USER_ACTION: '使用者操作: {userId} {action}',
  ERROR_CAUGHT: '捕獲錯誤: {error} in {module}',
  SECURITY_EVENT: '安全事件: {event} from {ip}',
}

// 敏感資料遮蔽函數
export function maskSensitiveData(data: unknown): unknown {
  if (!loggingConfig.maskSensitiveData) return data
  
  if (typeof data !== 'object' || data === null) return data
  
  const masked = { ...data } as Record<string, unknown>
  
  for (const field of SENSITIVE_FIELDS) {
    if (field in masked) {
      const value = masked[field]
      if (typeof value === 'string' && value.length > 0) {
        // 保留前2個和後2個字元，中間用 * 遮蔽
        if (value.length <= 4) {
          masked[field] = '****'
        } else {
          const start = value.substring(0, 2)
          const end = value.substring(value.length - 2)
          const middle = '*'.repeat(Math.max(4, value.length - 4))
          masked[field] = `${start}${middle}${end}`
        }
      } else {
        masked[field] = '[MASKED]'
      }
    }
  }
  
  return masked
}

// 錯誤分類
export enum ErrorCategory {
  VALIDATION = 'validation',      // 資料驗證錯誤
  AUTHENTICATION = 'auth',        // 認證錯誤
  AUTHORIZATION = 'authz',        // 授權錯誤
  DATABASE = 'database',          // 資料庫錯誤
  EXTERNAL_API = 'external_api',  // 外部 API 錯誤
  NETWORK = 'network',           // 網路錯誤
  SYSTEM = 'system',             // 系統錯誤
  BUSINESS = 'business',         // 商業邏輯錯誤
  UNKNOWN = 'unknown'            // 未知錯誤
}

// 根據錯誤訊息自動分類
export function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase()
  
  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorCategory.VALIDATION
  }
  if (message.includes('unauthorized') || message.includes('login')) {
    return ErrorCategory.AUTHENTICATION
  }
  if (message.includes('forbidden') || message.includes('permission')) {
    return ErrorCategory.AUTHORIZATION
  }
  if (message.includes('database') || message.includes('sql')) {
    return ErrorCategory.DATABASE
  }
  if (message.includes('fetch') || message.includes('network')) {
    return ErrorCategory.NETWORK
  }
  
  return ErrorCategory.UNKNOWN
}