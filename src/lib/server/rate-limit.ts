/**
 * Server Actions 速率限制工具
 *
 * 提供 Server-side 的速率限制功能:
 * - 基於用戶 ID 或 IP 的速率限制
 * - 支援不同時間窗口和閾值
 * - 記憶體內快取 (適合單一伺服器部署)
 *
 * ⚠️ 注意: 此實作使用記憶體快取,在多伺服器環境需要使用 Redis
 */

import { apiLogger } from '@/lib/logger'
import { RateLimitError } from '@/lib/errors'

/**
 * 速率限制配置介面
 */
export interface RateLimitConfig {
  /** 時間窗口 (毫秒) */
  windowMs: number
  /** 最大請求數 */
  maxRequests: number
  /** 限制識別符 (用戶 ID 或 IP) */
  identifier: string
  /** 動作名稱 (用於日誌) */
  action?: string
}

/**
 * 速率限制記錄
 */
interface RateLimitRecord {
  count: number
  resetTime: number
}

/**
 * 記憶體內速率限制快取
 * 格式: Map<identifier, Map<action, RateLimitRecord>>
 */
const rateLimitCache = new Map<string, Map<string, RateLimitRecord>>()

/**
 * 清理過期的速率限制記錄
 */
function cleanupExpiredRecords() {
  const now = Date.now()

  for (const [identifier, actions] of rateLimitCache.entries()) {
    for (const [action, record] of actions.entries()) {
      if (record.resetTime < now) {
        actions.delete(action)
      }
    }

    // 如果該 identifier 沒有任何記錄了,刪除整個 Map
    if (actions.size === 0) {
      rateLimitCache.delete(identifier)
    }
  }
}

// 每 5 分鐘清理一次過期記錄
setInterval(cleanupExpiredRecords, 5 * 60 * 1000)

/**
 * 檢查速率限制
 *
 * @param config - 速率限制配置
 * @throws RateLimitError - 當超過速率限制時
 *
 * @example
 * ```ts
 * 'use server'
 *
 * export async function createInquiryAction(data: InquiryInput) {
 *   const user = await requireAuth()
 *
 *   // 限制每位用戶每分鐘最多 5 次詢價
 *   await checkRateLimit({
 *     identifier: user.id,
 *     action: 'create-inquiry',
 *     maxRequests: 5,
 *     windowMs: 60 * 1000, // 1 分鐘
 *   })
 *
 *   const inquiry = await inquiryService.create(data, user.id)
 *   return success(inquiry)
 * }
 * ```
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<void> {
  const { identifier, action = 'default', maxRequests, windowMs } = config
  const now = Date.now()

  // 取得或建立該 identifier 的速率限制記錄
  let userActions = rateLimitCache.get(identifier)
  if (!userActions) {
    userActions = new Map<string, RateLimitRecord>()
    rateLimitCache.set(identifier, userActions)
  }

  // 取得特定動作的記錄
  const record = userActions.get(action)

  // 如果沒有記錄或記錄已過期,建立新記錄
  if (!record || record.resetTime < now) {
    userActions.set(action, {
      count: 1,
      resetTime: now + windowMs,
    })
    return
  }

  // 檢查是否超過限制
  if (record.count >= maxRequests) {
    const remainingTime = Math.ceil((record.resetTime - now) / 1000)

    apiLogger.warn('速率限制已達上限', {
      metadata: {
        identifier,
        action,
        count: record.count,
        maxRequests,
        remainingTime,
      },
    })

    throw new RateLimitError(`請求過於頻繁,請在 ${remainingTime} 秒後再試`, {
      module: 'RateLimit',
      action,
      context: {
        identifier,
        count: record.count,
        maxRequests,
        remainingTime,
      },
    })
  }

  // 增加計數
  record.count++
}

/**
 * 取得剩餘請求數
 *
 * @param identifier - 限制識別符
 * @param action - 動作名稱
 * @param maxRequests - 最大請求數
 * @returns 剩餘請求數
 *
 * @example
 * ```ts
 * const remaining = getRemainingRequests(userId, 'create-inquiry', 5)
 * console.log(`剩餘請求數: ${remaining}`)
 * ```
 */
export function getRemainingRequests(
  identifier: string,
  action: string = 'default',
  maxRequests: number
): number {
  const userActions = rateLimitCache.get(identifier)
  if (!userActions) return maxRequests

  const record = userActions.get(action)
  if (!record || record.resetTime < Date.now()) {
    return maxRequests
  }

  return Math.max(0, maxRequests - record.count)
}

/**
 * 重置速率限制記錄
 *
 * @param identifier - 限制識別符
 * @param action - 動作名稱 (可選,如果不提供則重置所有動作)
 *
 * @example
 * ```ts
 * // 重置特定用戶的特定動作
 * resetRateLimit(userId, 'create-inquiry')
 *
 * // 重置特定用戶的所有動作
 * resetRateLimit(userId)
 * ```
 */
export function resetRateLimit(identifier: string, action?: string): void {
  if (action) {
    // 重置特定動作
    const userActions = rateLimitCache.get(identifier)
    if (userActions) {
      userActions.delete(action)
      if (userActions.size === 0) {
        rateLimitCache.delete(identifier)
      }
    }
  } else {
    // 重置所有動作
    rateLimitCache.delete(identifier)
  }

  apiLogger.info('速率限制已重置', {
    metadata: {
      identifier,
      action: action || 'all',
    },
  })
}

/**
 * 預設速率限制配置
 */
export const defaultRateLimits = {
  /** 一般操作: 每分鐘 60 次 */
  standard: {
    maxRequests: 60,
    windowMs: 60 * 1000,
  },

  /** 嚴格限制 (敏感操作): 每分鐘 10 次 */
  strict: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },

  /** 寬鬆限制 (查詢操作): 每分鐘 120 次 */
  lenient: {
    maxRequests: 120,
    windowMs: 60 * 1000,
  },

  /** 表單提交: 每分鐘 5 次 */
  formSubmit: {
    maxRequests: 5,
    windowMs: 60 * 1000,
  },

  /** 訪客操作: 每分鐘 20 次 */
  guest: {
    maxRequests: 20,
    windowMs: 60 * 1000,
  },
} as const

/**
 * 速率限制包裝器 - 為 Server Action 添加速率限制
 *
 * @example
 * ```ts
 * 'use server'
 *
 * export const createInquiryAction = withRateLimit(
 *   async (data: InquiryInput) => {
 *     const user = await requireAuth()
 *     const inquiry = await inquiryService.create(data, user.id)
 *     return success(inquiry)
 *   },
 *   {
 *     getIdentifier: async () => {
 *       const user = await requireAuth()
 *       return user.id
 *     },
 *     action: 'create-inquiry',
 *     ...defaultRateLimits.formSubmit
 *   }
 * )
 * ```
 */
export function withRateLimit<TArgs extends unknown[], TReturn>(
  action: (...args: TArgs) => Promise<TReturn>,
  config: {
    getIdentifier: (...args: TArgs) => Promise<string> | string
    action?: string
    maxRequests: number
    windowMs: number
  }
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    const identifier = await config.getIdentifier(...args)

    await checkRateLimit({
      identifier,
      action: config.action,
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
    })

    return action(...args)
  }
}
