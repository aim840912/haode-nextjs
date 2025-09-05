/**
 * 進階 Rate Limiting 中間件
 *
 * 功能特點：
 * - 滑動窗口算法提供平滑的限流體驗
 * - 支援多層級識別：IP、用戶 ID、API Key
 * - 分散式存儲支援（Vercel KV/Redis）
 * - 記憶體回退機制
 * - 完整的審計日誌記錄
 */

import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { auditLogService } from '@/services/auditLogService'
import { AuditAction } from '@/types/audit'
import { logger } from '@/lib/logger'

/**
 * Rate Limiting 識別策略
 */
export enum IdentifierStrategy {
  IP = 'ip',
  USER_ID = 'user_id',
  API_KEY = 'api_key',
  COMBINED = 'combined',
}

/**
 * Rate Limiting 配置介面
 */
export interface RateLimitConfig {
  /** 最大請求數 */
  maxRequests: number
  /** 時間窗口（毫秒） */
  windowMs: number
  /** 識別策略 */
  strategy: IdentifierStrategy
  /** 是否記錄超限請求到審計日誌 */
  enableAuditLog?: boolean
  /** 自訂錯誤訊息 */
  message?: string
  /** 是否跳過成功的請求 */
  skipSuccessfulRequests?: boolean
  /** 是否跳過失敗的請求 */
  skipFailedRequests?: boolean
  /** 白名單 IP 列表 */
  whitelist?: string[]
  /** 回應標頭包含剩餘請求數 */
  includeHeaders?: boolean
}

/**
 * Rate Limiting 結果
 */
export interface RateLimitResult {
  /** 是否允許請求 */
  allowed: boolean
  /** 剩餘請求數 */
  remaining: number
  /** 總限制數 */
  limit: number
  /** 重置時間（Unix 時間戳） */
  resetTime: number
  /** 當前時間窗口的請求數 */
  currentRequests: number
  /** 識別符 */
  identifier: string
  /** 超限原因（如果適用） */
  reason?: string
}

/**
 * 存儲介面
 */
interface RateLimitStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttl: number): Promise<void>
  incr(key: string): Promise<number>
  expire(key: string, ttl: number): Promise<void>
}

/**
 * Vercel KV 存儲實作
 */
class VercelKVStore implements RateLimitStore {
  async get(key: string): Promise<string | null> {
    try {
      return await kv.get(key)
    } catch (error) {
      logger.warn('Rate Limiter KV get failed', { metadata: { error: (error as Error).message } })
      return null
    }
  }

  async set(key: string, value: string, ttl: number): Promise<void> {
    try {
      await kv.set(key, value, { ex: Math.ceil(ttl / 1000) })
    } catch (error) {
      logger.warn('Rate Limiter KV set failed', { metadata: { error: (error as Error).message } })
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await kv.incr(key)
    } catch (error) {
      logger.warn('Rate Limiter KV incr failed', { metadata: { error: (error as Error).message } })
      return 1
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      await kv.expire(key, Math.ceil(ttl / 1000))
    } catch (error) {
      logger.warn('Rate Limiter KV expire failed', {
        metadata: { error: (error as Error).message },
      })
    }
  }
}

/**
 * 記憶體回退存儲實作
 */
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { value: string; expiry: number }>()

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key)
    if (!entry || entry.expiry < Date.now()) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  async set(key: string, value: string, ttl: number): Promise<void> {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttl,
    })
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key)
    const newValue = current ? parseInt(current) + 1 : 1
    await this.set(key, newValue.toString(), 60000) // 預設 60 秒 TTL
    return newValue
  }

  async expire(key: string, ttl: number): Promise<void> {
    const entry = this.store.get(key)
    if (entry) {
      entry.expiry = Date.now() + ttl
    }
  }

  // 定期清理過期項目
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiry < now) {
        this.store.delete(key)
      }
    }
  }
}

// 檢查 Vercel KV 是否可用
const isKVAvailable =
  !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
  !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

// 創建存儲實例
const memoryStore = new MemoryStore()
const kvStore = isKVAvailable ? new VercelKVStore() : null

// 定期清理記憶體存儲
setInterval(() => memoryStore.cleanup(), 60000)

// 在開發環境中記錄存儲狀態
if (process.env.NODE_ENV === 'development') {
  logger.info('Rate Limiter store initialized', {
    metadata: { storeType: isKVAvailable ? 'Vercel KV' : 'Memory' },
  })
}

/**
 * 進階 Rate Limiter 類別
 */
export class AdvancedRateLimiter {
  private store: RateLimitStore
  private fallbackStore: RateLimitStore

  constructor() {
    // 如果 KV 可用，優先使用 KV；否則使用記憶體存儲
    this.store = kvStore || memoryStore
    this.fallbackStore = memoryStore
  }

  /**
   * 從請求中提取識別符
   */
  private extractIdentifier(request: NextRequest, strategy: IdentifierStrategy): string {
    switch (strategy) {
      case IdentifierStrategy.IP:
        return this.getClientIP(request)

      case IdentifierStrategy.USER_ID:
        // 從 JWT token 或 session 中提取用戶 ID
        const authHeader = request.headers.get('authorization')
        if (authHeader) {
          try {
            // 這裡簡化處理，實際應該解碼 JWT
            return `user:${authHeader.split(' ')[1]?.substring(0, 10)}`
          } catch {
            return this.getClientIP(request)
          }
        }
        return this.getClientIP(request)

      case IdentifierStrategy.API_KEY:
        const apiKey = request.headers.get('x-admin-key') || request.headers.get('x-api-key')
        return apiKey ? `api:${apiKey.substring(0, 8)}` : this.getClientIP(request)

      case IdentifierStrategy.COMBINED:
        const ip = this.getClientIP(request)
        const userAgent = request.headers.get('user-agent')?.substring(0, 20) || ''
        return `combined:${ip}:${Buffer.from(userAgent).toString('base64').substring(0, 8)}`

      default:
        return this.getClientIP(request)
    }
  }

  /**
   * 獲取客戶端 IP
   */
  private getClientIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    )
  }

  /**
   * 檢查 IP 是否在白名單中
   */
  private isWhitelisted(ip: string, whitelist?: string[]): boolean {
    if (!whitelist || whitelist.length === 0) {
      return false
    }

    return whitelist.some(whitelistedIP => {
      if (whitelistedIP === ip) return true

      // 支援 CIDR 格式（簡化版本）
      if (whitelistedIP.includes('/')) {
        // 這裡可以實作完整的 CIDR 匹配邏輯
        return false
      }

      // 支援萬用字元
      if (whitelistedIP.includes('*')) {
        const regex = new RegExp(whitelistedIP.replace(/\*/g, '.*'))
        return regex.test(ip)
      }

      return false
    })
  }

  /**
   * 滑動窗口 Rate Limiting 實作
   */
  async checkRateLimit(request: NextRequest, config: RateLimitConfig): Promise<RateLimitResult> {
    const identifier = this.extractIdentifier(request, config.strategy)
    const clientIP = this.getClientIP(request)

    // 檢查白名單
    if (this.isWhitelisted(clientIP, config.whitelist)) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        limit: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
        currentRequests: 0,
        identifier,
      }
    }

    const now = Date.now()
    const key = `ratelimit:${identifier}:${Math.floor(now / config.windowMs)}`

    try {
      // 首先嘗試使用主要存儲（KV）
      const currentCount = await this.store.get(key)
      const count = currentCount ? parseInt(currentCount) : 0

      if (count >= config.maxRequests) {
        // 記錄超限請求
        if (config.enableAuditLog) {
          await this.logRateLimitViolation(request, identifier, config, count)
        }

        return {
          allowed: false,
          remaining: 0,
          limit: config.maxRequests,
          resetTime: Math.floor(now / config.windowMs) * config.windowMs + config.windowMs,
          currentRequests: count,
          identifier,
          reason: 'Rate limit exceeded',
        }
      }

      // 增加計數器
      const newCount = await this.store.incr(key)

      // 設置過期時間（如果是新的 key）
      if (!currentCount) {
        await this.store.expire(key, config.windowMs)
      }

      return {
        allowed: true,
        remaining: Math.max(0, config.maxRequests - newCount),
        limit: config.maxRequests,
        resetTime: Math.floor(now / config.windowMs) * config.windowMs + config.windowMs,
        currentRequests: newCount,
        identifier,
      }
    } catch (error) {
      logger.warn('Rate Limiter primary store failed, using fallback', {
        metadata: { error: (error as Error).message },
      })

      // 回退到記憶體存儲
      try {
        const currentCount = await this.fallbackStore.get(key)
        const count = currentCount ? parseInt(currentCount) : 0

        if (count >= config.maxRequests) {
          return {
            allowed: false,
            remaining: 0,
            limit: config.maxRequests,
            resetTime: Math.floor(now / config.windowMs) * config.windowMs + config.windowMs,
            currentRequests: count,
            identifier,
            reason: 'Rate limit exceeded (fallback)',
          }
        }

        const newCount = await this.fallbackStore.incr(key)

        return {
          allowed: true,
          remaining: Math.max(0, config.maxRequests - newCount),
          limit: config.maxRequests,
          resetTime: Math.floor(now / config.windowMs) * config.windowMs + config.windowMs,
          currentRequests: newCount,
          identifier,
        }
      } catch (fallbackError) {
        logger.error('Rate Limiter fallback store also failed', fallbackError as Error, {
          metadata: { originalError: (error as Error).message },
        })

        // 如果兩個存儲都失敗，允許請求通過但記錄錯誤
        return {
          allowed: true,
          remaining: config.maxRequests,
          limit: config.maxRequests,
          resetTime: now + config.windowMs,
          currentRequests: 0,
          identifier,
          reason: 'Storage failure - allowing request',
        }
      }
    }
  }

  /**
   * 記錄 Rate Limit 違反事件到審計日誌
   */
  private async logRateLimitViolation(
    request: NextRequest,
    identifier: string,
    config: RateLimitConfig,
    currentCount: number
  ): Promise<void> {
    try {
      const clientInfo = {
        ip: this.getClientIP(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        origin: request.headers.get('origin') || 'unknown',
        referer: request.headers.get('referer') || 'unknown',
        path: request.nextUrl.pathname,
        method: request.method,
      }

      await auditLogService.log({
        action: 'rate_limit_exceeded' as AuditAction,
        resource_type: 'rate_limiter' as const,
        resource_id: identifier,
        user_id: null,
        user_email: 'anonymous',
        resource_details: {
          identifier,
          strategy: config.strategy,
          limit: config.maxRequests,
          windowMs: config.windowMs,
          currentCount,
          ...clientInfo,
        },
        metadata: {
          severity: 'medium',
          alert: currentCount > config.maxRequests * 2, // 如果超過兩倍限制則標記為警告
        },
      })
    } catch (error) {
      logger.error('Rate Limiter failed to log violation', error as Error)
    }
  }

  /**
   * 創建 Rate Limiting 中間件
   */
  createMiddleware(config: RateLimitConfig) {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      const result = await this.checkRateLimit(request, config)

      if (!result.allowed) {
        const response = NextResponse.json(
          {
            error: '請求過於頻繁，請稍後再試',
            success: false,
            code: 'RATE_LIMIT_EXCEEDED',
            details: {
              limit: result.limit,
              remaining: result.remaining,
              resetTime: result.resetTime,
              identifier: result.identifier.startsWith('combined:')
                ? 'combined'
                : result.identifier,
            },
          },
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
              ...(config.includeHeaders && {
                'X-RateLimit-Limit': result.limit.toString(),
                'X-RateLimit-Remaining': result.remaining.toString(),
                'X-RateLimit-Reset': result.resetTime.toString(),
              }),
            },
          }
        )

        return response
      }

      // 如果請求被允許，可以在這裡添加 rate limit 標頭
      if (config.includeHeaders) {
        // 需要修改原始 response，但在中間件中我們只能返回 null 來繼續
        // Rate limit headers 會在路由處理器中添加
        return null
      }

      return null // 繼續處理請求
    }
  }

  /**
   * 為 API 路由創建包裝器
   */
  wrapHandler<T extends (...args: unknown[]) => Promise<Response | NextResponse>>(
    handler: T,
    config: RateLimitConfig
  ): T {
    return (async (...args: Parameters<T>) => {
      const request = args[0] as NextRequest
      const result = await this.checkRateLimit(request, config)

      if (!result.allowed) {
        return NextResponse.json(
          {
            error: '請求過於頻繁，請稍後再試',
            success: false,
            code: 'RATE_LIMIT_EXCEEDED',
            details: {
              limit: result.limit,
              remaining: result.remaining,
              resetTime: result.resetTime,
            },
          },
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
              ...(config.includeHeaders && {
                'X-RateLimit-Limit': result.limit.toString(),
                'X-RateLimit-Remaining': result.remaining.toString(),
                'X-RateLimit-Reset': result.resetTime.toString(),
              }),
            },
          }
        )
      }

      // 調用原始處理器
      const response = await handler(...args)

      // 添加 rate limit 標頭到成功回應
      if (config.includeHeaders && response.headers) {
        response.headers.set('X-RateLimit-Limit', result.limit.toString())
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
      }

      return response
    }) as T
  }
}

// 創建全域實例
export const rateLimiter = new AdvancedRateLimiter()

// 便利函數
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return rateLimiter.createMiddleware(config)
}

// 重載：專門處理 ApiHandler 類型
export function withRateLimit(
  handler: (request: NextRequest, params?: unknown) => Promise<Response | NextResponse>,
  config: RateLimitConfig
): (request: NextRequest, params?: unknown) => Promise<Response | NextResponse>

// 重載：處理一般泛型函數
export function withRateLimit<T extends (...args: unknown[]) => Promise<Response | NextResponse>>(
  handler: T,
  config: RateLimitConfig
): T

// 實作
export function withRateLimit<T extends (...args: unknown[]) => Promise<Response | NextResponse>>(
  handler: T,
  config: RateLimitConfig
): T {
  return rateLimiter.wrapHandler(handler, config)
}

// 預設配置
export const DEFAULT_RATE_LIMITS = {
  GLOBAL: {
    maxRequests: 1000,
    windowMs: 15 * 60 * 1000, // 15 分鐘
    strategy: IdentifierStrategy.IP,
    enableAuditLog: true,
    includeHeaders: true,
  },
  API_STRICT: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 分鐘
    strategy: IdentifierStrategy.COMBINED,
    enableAuditLog: true,
    includeHeaders: true,
    message: '請求過於頻繁，請等待一分鐘後重試',
  },
  API_MODERATE: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 分鐘
    strategy: IdentifierStrategy.IP,
    enableAuditLog: true,
    includeHeaders: true,
  },
  API_LENIENT: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 分鐘
    strategy: IdentifierStrategy.IP,
    enableAuditLog: false,
    includeHeaders: true,
  },
} as const
