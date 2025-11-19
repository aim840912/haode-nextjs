/**
 * Default Rate Limit Configurations
 *
 * 預定義的常用 Rate Limit 配置
 */

import { IdentifierStrategy, RateLimitConfig } from '../types'

/**
 * 預設 Rate Limit 配置集合
 */
export const DEFAULT_RATE_LIMITS = {
  /**
   * 全域限流 - 寬鬆
   * 適用於公開 API
   */
  GLOBAL: {
    maxRequests: 1000,
    windowMs: 15 * 60 * 1000, // 15 分鐘
    strategy: IdentifierStrategy.IP,
    enableAuditLog: true,
    includeHeaders: true,
  },

  /**
   * API 嚴格限流
   * 適用於敏感操作 (登入、註冊、支付)
   */
  API_STRICT: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 分鐘
    strategy: IdentifierStrategy.COMBINED,
    enableAuditLog: true,
    includeHeaders: true,
    message: '請求過於頻繁,請等待一分鐘後重試',
  },

  /**
   * API 中等限流
   * 適用於一般 API 端點
   */
  API_MODERATE: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 分鐘
    strategy: IdentifierStrategy.IP,
    enableAuditLog: true,
    includeHeaders: true,
  },

  /**
   * API 寬鬆限流
   * 適用於讀取操作
   */
  API_LENIENT: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 分鐘
    strategy: IdentifierStrategy.IP,
    enableAuditLog: false,
    includeHeaders: true,
  },
} as const satisfies Record<string, RateLimitConfig>
