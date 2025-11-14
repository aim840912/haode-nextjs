/**
 * Rate Limit Collector 特定類型定義
 */

import { MetricsCollector, MetricData } from './monitoring-types'

/**
 * Rate Limit 統計資料
 */
export interface RateLimitStats {
  /** 總請求數 */
  totalRequests: number
  /** 被限制的請求數 */
  limitedRequests: number
  /** 限制率 (%) */
  limitRate: number
  /** 最近 24 小時的統計 */
  last24Hours: {
    requests: number
    limited: number
    rate: number
  }
  /** 最近 1 小時的統計 */
  lastHour: {
    requests: number
    limited: number
    rate: number
  }
  /** 活躍的被封鎖 IP 數量 */
  blockedIPs: number
  /** 最常觸發限制的 IP */
  topOffendingIPs: Array<{
    ip: string
    violations: number
    lastViolation: string
  }>
}

/**
 * 封鎖原因
 */
export enum BlockReason {
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  MANUAL_BLOCK = 'manual_block',
  ANTI_DDOS = 'anti_ddos',
}

/**
 * IP 封鎖資訊
 */
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

/**
 * Rate Limit Collector 介面
 * 擴展基礎 MetricsCollector，增加 Rate Limit 特定功能
 */
export interface RateLimitCollector extends MetricsCollector {
  /**
   * 取得 Rate Limit 統計
   */
  getRateLimitStats(): Promise<RateLimitStats>

  /**
   * 取得被封鎖的 IP 列表
   */
  getBlockedIPs(): Promise<IPBlockInfo[]>

  /**
   * 檢查 IP 是否被封鎖
   */
  isIPBlocked(ip: string): Promise<boolean>

  /**
   * 記錄 Rate Limit 事件
   */
  recordEvent(
    ip: string,
    path: string,
    strategy: string,
    limited: boolean,
    details?: Record<string, unknown>
  ): Promise<void>

  /**
   * 封鎖 IP
   */
  blockIP(
    ip: string,
    reason: BlockReason,
    duration: number,
    details?: Record<string, unknown>
  ): Promise<void>

  /**
   * 解除封鎖 IP
   */
  unblockIP(ip: string): Promise<void>
}

/**
 * Rate Limit Metric Data
 * 繼承 MetricData，為 Rate Limit 指標提供類型安全
 */
export interface RateLimitMetricData extends MetricData<RateLimitStats> {
  metadata?: {
    blockedIPs?: IPBlockInfo[]
    recentViolations?: Array<{
      ip: string
      timestamp: string
      path: string
    }>
  }
}
