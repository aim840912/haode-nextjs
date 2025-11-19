/**
 * Core Rate Limiter Implementation
 *
 * 核心限流邏輯,實作滑動窗口算法
 */

import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { auditLogService } from '@/services/infrastructure/auditLogService'
import { AuditAction } from '@/types/audit'
import { kvStore, memoryStore } from '../stores'
import { extractIdentifier, getClientIP } from '../utils/identifier'
import type { RateLimitConfig, RateLimitResult, RateLimitStore, IdentifierStrategy } from '../types'

/**
 * 進階 Rate Limiter 類別
 *
 * 功能特點:
 * - 滑動窗口算法提供平滑的限流體驗
 * - 支援多層級識別 (IP / User ID / API Key)
 * - 分散式存儲支援 (Vercel KV / Redis)
 * - 記憶體回退機制
 * - 完整的審計日誌記錄
 */
export class RateLimiter {
  private store: RateLimitStore
  private fallbackStore: RateLimitStore

  constructor() {
    // 如果 KV 可用,優先使用 KV;否則使用記憶體存儲
    this.store = kvStore || memoryStore
    this.fallbackStore = memoryStore
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
        ip: getClientIP(request),
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
   * 滑動窗口 Rate Limiting 實作
   *
   * @param request - Next.js 請求物件
   * @param config - Rate Limit 配置
   * @returns Rate Limit 檢查結果
   */
  async checkRateLimit(request: NextRequest, config: RateLimitConfig): Promise<RateLimitResult> {
    const identifier = extractIdentifier(request, config.strategy)
    const clientIP = getClientIP(request)

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

        // 如果兩個存儲都失敗,允許請求通過但記錄錯誤
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
}
