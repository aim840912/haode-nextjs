/**
 * Store Initialization
 *
 * 自動檢測環境並選擇適當的存儲後端
 */

import { logger } from '@/lib/logger'
import { MemoryStore } from './MemoryStore'
import { VercelKVStore } from './VercelKVStore'
import type { RateLimitStore } from '../types'

// 檢查 Vercel KV 是否可用
const isKVAvailable =
  !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
  !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

// 創建存儲實例
export const memoryStore = new MemoryStore()
export const kvStore: RateLimitStore | null = isKVAvailable ? new VercelKVStore() : null

// 定期清理記憶體存儲（每 60 秒）
setInterval(() => memoryStore.cleanup(), 60000)

// 在開發環境中記錄存儲狀態
if (process.env.NODE_ENV === 'development') {
  logger.info('Rate Limiter store initialized', {
    metadata: { storeType: isKVAvailable ? 'Vercel KV' : 'Memory' },
  })
}

// 匯出方便函數
export { MemoryStore, VercelKVStore }
