/**
 * Rate Limit 監控工具函數
 *
 * 從 RateLimitCollectorImpl 類別簡化為工具函數集合
 * 保留所有核心功能（統計、IP 管理、自動封鎖）
 */

import { kv } from '@vercel/kv'
import { dbLogger } from '@/lib/logger'
import { auditLogService } from '@/services/infrastructure/auditLogService'

// === 類型定義 ===

export interface RateLimitStats {
  totalRequests: number
  limitedRequests: number
  limitRate: number
  last24Hours: { requests: number; limited: number; rate: number }
  lastHour: { requests: number; limited: number; rate: number }
  blockedIPs: number
  topOffendingIPs: Array<{
    ip: string
    violations: number
    lastViolation: string
  }>
}

export enum BlockReason {
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  MANUAL_BLOCK = 'manual_block',
  ANTI_DDOS = 'anti_ddos',
}

export interface IPBlockInfo {
  ip: string
  reason: BlockReason
  blockedAt: string
  expiresAt: string
  violationCount: number
  lastViolation: string
  userAgent?: string
  country?: string
}

// === 常數定義 ===

const STATS_KEY_PREFIX = 'rate_limit_stats:'
const BLOCK_KEY_PREFIX = 'ip_block:'
const VIOLATION_KEY_PREFIX = 'violations:'

// === 核心函數 ===

/**
 * 取得 Rate Limit 統計 (主要導出函數)
 */
export async function getRateLimitStats(): Promise<RateLimitStats> {
  const now = Date.now()
  const currentHour = Math.floor(now / (60 * 60 * 1000))
  const currentDay = Math.floor(now / (24 * 60 * 60 * 1000))

  try {
    const [hourStats, dayStats, blockedIPs, topOffenders] = await Promise.all([
      kv.hgetall(`${STATS_KEY_PREFIX}hour:${currentHour}`),
      kv.hgetall(`${STATS_KEY_PREFIX}day:${currentDay}`),
      getBlockedIPsCount(),
      getTopOffendingIPs(),
    ])

    const hourRequests = parseInt(hourStats?.total_requests as string) || 0
    const hourLimited = parseInt(hourStats?.limited_requests as string) || 0
    const dayRequests = parseInt(dayStats?.total_requests as string) || 0
    const dayLimited = parseInt(dayStats?.limited_requests as string) || 0

    return {
      totalRequests: dayRequests,
      limitedRequests: dayLimited,
      limitRate: dayRequests > 0 ? (dayLimited / dayRequests) * 100 : 0,
      last24Hours: {
        requests: dayRequests,
        limited: dayLimited,
        rate: dayRequests > 0 ? (dayLimited / dayRequests) * 100 : 0,
      },
      lastHour: {
        requests: hourRequests,
        limited: hourLimited,
        rate: hourRequests > 0 ? (hourLimited / hourRequests) * 100 : 0,
      },
      blockedIPs,
      topOffendingIPs: topOffenders,
    }
  } catch (error) {
    dbLogger.error(
      '統計資料獲取失敗',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        module: 'RateLimitMonitoring',
        action: 'getRateLimitStats',
      }
    )
    return getEmptyStats()
  }
}

/**
 * 取得被封鎖的 IP 列表
 */
export async function getBlockedIPs(): Promise<IPBlockInfo[]> {
  try {
    const keys = await kv.keys(`${BLOCK_KEY_PREFIX}*`)
    const blockedIPs: IPBlockInfo[] = []

    for (const key of keys) {
      const blockData = await kv.hgetall(key)
      if (blockData && blockData.ip) {
        const blockInfo = blockData as unknown as IPBlockInfo
        // 檢查是否已過期
        if (new Date() <= new Date(blockInfo.expiresAt)) {
          blockedIPs.push(blockInfo)
        } else {
          // 清理過期的封鎖
          await kv.del(key)
        }
      }
    }

    return blockedIPs
  } catch (error) {
    dbLogger.error(
      '被封鎖 IP 列表獲取失敗',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        module: 'RateLimitMonitoring',
        action: 'getBlockedIPs',
      }
    )
    return []
  }
}

/**
 * 檢查 IP 是否被封鎖
 */
export async function isIPBlocked(ip: string): Promise<boolean> {
  const blockKey = `${BLOCK_KEY_PREFIX}${ip}`

  try {
    const blockData = await kv.hgetall(blockKey)

    if (!blockData || !blockData.ip) {
      return false
    }

    const blockInfo = blockData as unknown as IPBlockInfo

    // 檢查是否已過期
    if (new Date() > new Date(blockInfo.expiresAt)) {
      await kv.del(blockKey)
      return false
    }

    return true
  } catch (error) {
    dbLogger.error(
      'IP 封鎖狀態檢查失敗',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        module: 'RateLimitMonitoring',
        action: 'isIPBlocked',
        metadata: { ip },
      }
    )
    return false
  }
}

/**
 * 記錄 Rate Limit 事件
 */
export async function recordEvent(
  ip: string,
  path: string,
  strategy: string,
  limited: boolean,
  details: Record<string, unknown> = {}
): Promise<void> {
  const now = Date.now()
  const hourKey = `${STATS_KEY_PREFIX}hour:${Math.floor(now / (60 * 60 * 1000))}`
  const dayKey = `${STATS_KEY_PREFIX}day:${Math.floor(now / (24 * 60 * 60 * 1000))}`

  try {
    // 更新統計計數器
    await Promise.all([
      kv.hincrby(hourKey, 'total_requests', 1),
      kv.hincrby(dayKey, 'total_requests', 1),
      kv.expire(hourKey, 2 * 60 * 60), // 2 小時 TTL
      kv.expire(dayKey, 48 * 60 * 60), // 48 小時 TTL
    ])

    if (limited) {
      // 更新限制統計
      await Promise.all([
        kv.hincrby(hourKey, 'limited_requests', 1),
        kv.hincrby(dayKey, 'limited_requests', 1),
        recordViolation(ip, path, strategy, details),
      ])

      // 檢查是否需要自動封鎖
      await checkAutoBlock(ip, details)
    }
  } catch (error) {
    dbLogger.error(
      'Rate Limit 事件記錄失敗',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        module: 'RateLimitMonitoring',
        action: 'recordEvent',
        metadata: { ip, path, strategy },
      }
    )
  }
}

/**
 * 封鎖 IP
 */
export async function blockIP(
  ip: string,
  reason: BlockReason,
  duration: number,
  details: Record<string, unknown> = {}
): Promise<void> {
  const blockKey = `${BLOCK_KEY_PREFIX}${ip}`
  const now = new Date()
  const expiresAt = new Date(now.getTime() + duration)

  const blockInfo: IPBlockInfo = {
    ip,
    reason,
    blockedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    violationCount: typeof details.violationCount === 'number' ? details.violationCount : 0,
    lastViolation:
      typeof details.lastViolation === 'string' ? details.lastViolation : now.toISOString(),
    userAgent: typeof details.userAgent === 'string' ? details.userAgent : undefined,
    country: typeof details.country === 'string' ? details.country : undefined,
  }

  try {
    // 存儲封鎖資訊
    await kv.hset(blockKey, blockInfo as unknown as Record<string, unknown>)
    await kv.expire(blockKey, Math.ceil(duration / 1000))

    // 記錄到審計日誌
    await auditLogService.log({
      action: 'status_change',
      resource_type: 'security',
      resource_id: ip,
      user_id: null,
      user_email: 'system',
      resource_details: {
        ...blockInfo,
        operationType: 'ip_blocked',
        ...details,
      },
      metadata: {
        severity: 'high',
        alert: true,
      },
    })

    dbLogger.warn('IP 已被封鎖', {
      module: 'RateLimitMonitoring',
      action: 'blockIP',
      metadata: {
        ip,
        reason,
        expiresAt: expiresAt.toISOString(),
        violationCount: details.violationCount,
      },
    })
  } catch (error) {
    dbLogger.error('IP 封鎖失敗', error instanceof Error ? error : new Error('Unknown error'), {
      module: 'RateLimitMonitoring',
      action: 'blockIP',
      metadata: { ip, reason },
    })
  }
}

/**
 * 解除封鎖 IP
 */
export async function unblockIP(ip: string): Promise<void> {
  const blockKey = `${BLOCK_KEY_PREFIX}${ip}`

  try {
    const blockInfo = await kv.hgetall(blockKey)

    if (blockInfo && blockInfo.ip) {
      await kv.del(blockKey)

      // 記錄解封事件
      await auditLogService.log({
        action: 'status_change',
        resource_type: 'security',
        resource_id: ip,
        user_id: null,
        user_email: 'system',
        resource_details: {
          ip,
          reason: 'manual_unblock',
          originalBlockReason: blockInfo.reason,
          unblockedAt: new Date().toISOString(),
          operationType: 'ip_unblocked',
        },
        metadata: {
          severity: 'medium',
        },
      })

      dbLogger.info('IP 已解除封鎖', {
        module: 'RateLimitMonitoring',
        action: 'unblockIP',
        metadata: {
          ip,
          originalBlockReason: blockInfo.reason,
        },
      })
    }
  } catch (error) {
    dbLogger.error('IP 解封失敗', error instanceof Error ? error : new Error('Unknown error'), {
      module: 'RateLimitMonitoring',
      action: 'unblockIP',
      metadata: { ip },
    })
  }
}

// === 私有輔助函數 ===

async function recordViolation(
  ip: string,
  path: string,
  strategy: string,
  details: Record<string, unknown>
): Promise<void> {
  const violationKey = `${VIOLATION_KEY_PREFIX}${ip}`
  const now = new Date().toISOString()

  try {
    // 增加違反計數
    const count = await kv.hincrby(violationKey, 'count', 1)

    // 更新最後違反時間
    await kv.hset(violationKey, {
      last_violation: now,
      last_path: path,
      last_strategy: strategy,
      user_agent: details.userAgent || 'unknown',
    })

    // 設置過期時間（24 小時）
    await kv.expire(violationKey, 24 * 60 * 60)

    // 記錄到審計日誌（每 5 次違反記錄一次）
    if (count % 5 === 0) {
      await auditLogService.log({
        action: 'unauthorized_access',
        resource_type: 'rate_limiter',
        resource_id: ip,
        user_id: null,
        user_email: 'system',
        resource_details: {
          ip,
          path,
          strategy,
          violationCount: count,
          violationType: 'rate_limit_violation_milestone',
          ...details,
        },
        metadata: {
          severity: count > 50 ? 'high' : count > 20 ? 'medium' : 'low',
          alert: count > 50,
        },
      })
    }
  } catch (error) {
    dbLogger.error(
      '違規事件記錄失敗',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        module: 'RateLimitMonitoring',
        action: 'recordViolation',
        metadata: { ip, path, strategy },
      }
    )
  }
}

async function checkAutoBlock(ip: string, details: Record<string, unknown>): Promise<void> {
  try {
    const violationKey = `${VIOLATION_KEY_PREFIX}${ip}`
    const violationData = await kv.hgetall(violationKey)

    if (!violationData || !violationData.count) return

    const violationCount = parseInt(violationData.count as string)
    const threshold = getAutoBlockThreshold(details)

    if (violationCount >= threshold) {
      await blockIP(ip, BlockReason.RATE_LIMIT_EXCEEDED, getBlockDuration(violationCount), {
        violationCount,
        autoBlocked: true,
        lastViolation: violationData.last_violation as string,
        userAgent: violationData.user_agent as string,
      })
    }
  } catch (error) {
    dbLogger.error(
      '自動封鎖檢查失敗',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        module: 'RateLimitMonitoring',
        action: 'checkAutoBlock',
        metadata: { ip },
      }
    )
  }
}

function getAutoBlockThreshold(details: Record<string, unknown>): number {
  const path = typeof details.path === 'string' ? details.path : ''
  if (path.includes('/api/auth/')) return 10
  if (path.includes('/api/payment/')) return 5
  if (path.includes('/api/admin/')) return 50
  return 25
}

function getBlockDuration(violationCount: number): number {
  if (violationCount >= 100) return 24 * 60 * 60 * 1000 // 24 小時
  if (violationCount >= 50) return 4 * 60 * 60 * 1000 // 4 小時
  if (violationCount >= 25) return 60 * 60 * 1000 // 1 小時
  return 15 * 60 * 1000 // 15 分鐘
}

async function getBlockedIPsCount(): Promise<number> {
  try {
    const keys = await kv.keys(`${BLOCK_KEY_PREFIX}*`)
    return keys.length
  } catch {
    return 0
  }
}

async function getTopOffendingIPs(): Promise<
  Array<{ ip: string; violations: number; lastViolation: string }>
> {
  try {
    const keys = await kv.keys(`${VIOLATION_KEY_PREFIX}*`)
    const results = []

    for (const key of keys.slice(0, 10)) {
      const data = await kv.hgetall(key)
      if (data && data.count) {
        results.push({
          ip: key.replace(VIOLATION_KEY_PREFIX, ''),
          violations: parseInt(data.count as string),
          lastViolation: (data.last_violation as string) || 'unknown',
        })
      }
    }

    return results.sort((a, b) => b.violations - a.violations)
  } catch {
    return []
  }
}

function getEmptyStats(): RateLimitStats {
  return {
    totalRequests: 0,
    limitedRequests: 0,
    limitRate: 0,
    last24Hours: { requests: 0, limited: 0, rate: 0 },
    lastHour: { requests: 0, limited: 0, rate: 0 },
    blockedIPs: 0,
    topOffendingIPs: [],
  }
}
