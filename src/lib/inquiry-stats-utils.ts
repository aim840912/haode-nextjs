/**
 * 詢價統計工具函數
 * 純函數邏輯，用於 Hook 架構重構
 */

import { logger } from '@/lib/logger'

/**
 * 詢價統計資料介面
 */
export interface InquiryStatsData {
  total_inquiries: number
  unread_count: number
  unreplied_count: number
  read_rate: number
  reply_rate: number
  completion_rate: number
  cancellation_rate: number
  avg_response_time_hours: number
}

/**
 * 輪詢配置選項
 */
export interface PollingConfig {
  baseRefreshInterval: number
  isVisible: boolean
  lastActivity: number
  stats: InquiryStatsData | null
  consecutiveErrors: number
  isDevelopment?: boolean
}

/**
 * 重試配置
 */
export interface RetryConfig {
  retryAttempt: number
  isRateLimited: boolean
}

/**
 * 快取配置
 */
export interface CacheConfig {
  key: string
  maxAge: number // 毫秒
}

/**
 * 計算重試延遲時間
 */
export function calculateRetryDelay(config: RetryConfig): number {
  const { retryAttempt, isRateLimited } = config

  if (isRateLimited) {
    // 速率限制錯誤：使用更長的延遲
    const baseDelay = 30000 // 30 秒
    const maxDelay = 300000 // 最多 5 分鐘
    const delay = Math.min(baseDelay * Math.pow(1.5, retryAttempt), maxDelay)
    return delay
  } else {
    // 一般錯誤：正常指數退避
    const baseDelay = 1000 // 1 秒
    const maxDelay = 60000 // 最多 60 秒
    const delay = Math.min(baseDelay * Math.pow(2, retryAttempt), maxDelay)
    return delay
  }
}

/**
 * 計算動態輪詢間隔
 */
export function calculateDynamicPollingInterval(config: PollingConfig): number | null {
  const {
    baseRefreshInterval,
    isVisible,
    lastActivity,
    stats,
    consecutiveErrors,
    isDevelopment = false,
  } = config

  // 頁面隱藏時不輪詢
  if (!isVisible) return null

  // 如果連續錯誤過多，停止輪詢
  if (consecutiveErrors >= 5) {
    if (isDevelopment) {
      logger.debug('[inquiry-stats-utils] Too many consecutive errors, stopping polling')
    }
    return null
  }

  const timeSinceLastActivity = Date.now() - lastActivity
  const hasUnread = stats && stats.unread_count > 0

  let interval = baseRefreshInterval

  // 有未讀詢價：使用基本間隔（2分鐘）
  if (hasUnread) {
    interval = Math.max(baseRefreshInterval, 120000) // 至少2分鐘
  }
  // 閒置超過 10 分鐘：10 分鐘輪詢
  else if (timeSinceLastActivity > 600000) {
    interval = 600000 // 10 分鐘
  }
  // 閒置超過 5 分鐘：5 分鐘輪詢
  else if (timeSinceLastActivity > 300000) {
    interval = 300000 // 5 分鐘
  }
  // 否則使用基本間隔，但至少2分鐘
  else {
    interval = Math.max(baseRefreshInterval, 120000)
  }

  // 如果有連續錯誤，增加間隔
  if (consecutiveErrors > 0) {
    interval = Math.max(interval, interval * (1 + consecutiveErrors * 0.5))
  }

  return interval
}

/**
 * 驗證快取資料是否有效
 */
export function isCacheValid(cacheData: any, maxAge: number): boolean {
  if (!cacheData || typeof cacheData !== 'object') return false

  const { data, timestamp } = cacheData
  if (!data || !timestamp) return false

  return Date.now() - timestamp < maxAge
}

/**
 * 建立快取鍵值
 */
export function createCacheKey(prefix: string, userToken?: string): string {
  const suffix = userToken ? userToken.slice(-10) : 'anonymous'
  return `${prefix}-${suffix}`
}

/**
 * 格式化錯誤訊息給使用者
 */
export function formatUserFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    // 將技術錯誤轉換為使用者友好的訊息
    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      return '網路連線問題，請稍後再試'
    }
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return '請求過於頻繁，請稍後再試'
    }
    if (error.message.includes('認證失敗') || error.message.includes('401')) {
      return '登入已過期，請重新登入'
    }
    if (error.message.includes('403')) {
      return '權限不足'
    }
    if (error.message.includes('500')) {
      return '伺服器錯誤，請稍後再試'
    }
    return error.message
  }
  return '未知錯誤，請稍後再試'
}

/**
 * 檢查是否應該顯示錯誤給使用者
 * 某些錯誤類型（如速率限制、網路錯誤）應該靜默處理
 */
export function shouldShowErrorToUser(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // 速率限制錯誤 - 靜默處理
    if (message.includes('rate limit') || message.includes('429')) {
      return false
    }

    // 一般網路錯誤 - 靜默處理（但嚴重錯誤除外）
    if (message.includes('networkerror') && !message.includes('server')) {
      return false
    }

    // AbortError - 不顯示
    if (message.includes('aborterror') || error.name === 'AbortError') {
      return false
    }
  }

  return true
}

/**
 * 常數定義
 */
export const INQUIRY_STATS_CONSTANTS = {
  // 快取設定
  CACHE_DURATION: 300000, // 5 分鐘
  CACHE_KEY_PREFIX: 'inquiry-stats-cache',

  // 輪詢設定
  DEFAULT_POLLING_INTERVAL: 120000, // 2 分鐘
  MIN_POLLING_INTERVAL: 120000, // 最小 2 分鐘
  MAX_POLLING_INTERVAL: 600000, // 最大 10 分鐘

  // 重試設定
  MAX_RETRY_ATTEMPTS: 5,
  MAX_CONSECUTIVE_ERRORS: 5,

  // 活動追蹤
  ACTIVITY_TIMEOUT: 300000, // 5 分鐘無活動算閒置
  LONG_IDLE_TIMEOUT: 600000, // 10 分鐘長時間閒置

  // 請求去重
  REQUEST_DEDUP_DURATION: 5000, // 5 秒內重複請求去重
} as const
