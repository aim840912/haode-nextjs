/**
 * Rate Limiter - Main Entry Point
 *
 * 提供統一的 API 入口,保持向後兼容
 */

// === 類型定義 ===
export type { RateLimitConfig, RateLimitResult, RateLimitStore } from './types'

export { IdentifierStrategy } from './types'

// === 核心實作 ===
export { RateLimiter } from './core'

// === 中間件和便利函數 ===
export { createRateLimitMiddleware, withRateLimit, rateLimiter } from './middleware'

// === 預設配置 ===
export { DEFAULT_RATE_LIMITS } from './config/defaults'

// === Store 實作（進階使用） ===
export { MemoryStore, VercelKVStore, kvStore, memoryStore } from './stores'
