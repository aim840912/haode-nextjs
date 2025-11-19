/**
 * Vercel KV Store Implementation
 *
 * 使用 Vercel KV (基於 Redis) 作為 Rate Limiter 的持久化存儲
 */

import { kv } from '@vercel/kv'
import { logger } from '@/lib/logger'
import type { RateLimitStore } from '../types'

/**
 * Vercel KV 存儲實作
 *
 * 特點:
 * - 分散式存儲,適合多實例部署
 * - 自動容錯處理
 * - 適用於生產環境
 */
export class VercelKVStore implements RateLimitStore {
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
