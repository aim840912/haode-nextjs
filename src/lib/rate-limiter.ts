/**
 * Rate Limiter - Legacy Entry Point
 *
 * ⚠️ 此檔案僅用於向後兼容
 * 新程式碼請使用 @/lib/rate-limiter/* 模組化匯入
 *
 * 功能特點:
 * - 滑動窗口算法提供平滑的限流體驗
 * - 支援多層級識別:IP、用戶 ID、API Key
 * - 分散式存儲支援 (Vercel KV/Redis)
 * - 記憶體回退機制
 * - 完整的審計日誌記錄
 *
 * @deprecated 建議遷移到新模組:
 * ```typescript
 * // Old (仍可用)
 * import { rateLimiter } from '@/lib/rate-limiter'
 *
 * // New (推薦)
 * import { rateLimiter } from '@/lib/rate-limiter/middleware'
 * import { DEFAULT_RATE_LIMITS } from '@/lib/rate-limiter/config/defaults'
 * import type { RateLimitConfig } from '@/lib/rate-limiter/types'
 * ```
 */

// 重新匯出所有公開 API
export type { RateLimitConfig, RateLimitResult, RateLimitStore } from './rate-limiter/types'

export { IdentifierStrategy } from './rate-limiter/types'

export { RateLimiter } from './rate-limiter/core'

export { createRateLimitMiddleware, withRateLimit, rateLimiter } from './rate-limiter/middleware'

export { DEFAULT_RATE_LIMITS } from './rate-limiter/config/defaults'

// 已移除的類別 (向後兼容說明)
/**
 * @deprecated AdvancedRateLimiter 已重新命名為 RateLimiter
 * 請更新匯入:
 * ```typescript
 * // Old
 * import { AdvancedRateLimiter } from '@/lib/rate-limiter'
 *
 * // New
 * import { RateLimiter } from '@/lib/rate-limiter'
 * ```
 */
export { RateLimiter as AdvancedRateLimiter } from './rate-limiter/core'
