/**
 * Memory Store Implementation
 *
 * 使用記憶體作為 Rate Limiter 的回退存儲
 */

import type { RateLimitStore } from '../types'

/**
 * 記憶體回退存儲實作
 *
 * 特點:
 * - 純記憶體存儲,不需要外部依賴
 * - 自動過期清理機制
 * - 適合開發環境和故障回退
 *
 * @warning 記憶體存儲不適合多實例部署,每個實例維護獨立的限流計數
 */
export class MemoryStore implements RateLimitStore {
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

  /**
   * 清理過期項目
   *
   * 應定期調用以釋放記憶體
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiry < now) {
        this.store.delete(key)
      }
    }
  }

  /**
   * 獲取當前存儲的項目數量（用於監控）
   */
  size(): number {
    return this.store.size
  }
}
