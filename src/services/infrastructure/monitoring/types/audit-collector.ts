/**
 * Audit Collector 特定類型定義
 */

import { MetricsCollector, MetricData, TimeRange } from './monitoring-types'
import {
  FormattedAuditStats,
  FormattedUserActivityStats,
  FormattedResourceAccessStats,
} from '@/types/audit-stats'

/**
 * 審計統計查詢參數
 */
export interface AuditStatsQueryParams extends TimeRange {
  /** 資源類型過濾 */
  resourceType?: string
  /** 動作類型過濾 */
  action?: string
  /** 使用者角色過濾 */
  userRole?: string
  /** 限制返回數量 */
  limit?: number
}

/**
 * 使用者活動查詢參數
 */
export interface UserActivityQueryParams extends TimeRange {
  /** 使用者 ID 過濾 */
  userId?: string
  /** 使用者角色過濾 */
  userRole?: string
  /** 最小活動次數 */
  minActions?: number
  /** 限制返回數量 */
  limit?: number
}

/**
 * 資源存取查詢參數
 */
export interface ResourceAccessQueryParams extends TimeRange {
  /** 資源類型過濾 */
  resourceType?: string
  /** 資源 ID 過濾 */
  resourceId?: string
  /** 最小存取次數 */
  minAccess?: number
  /** 限制返回數量 */
  limit?: number
}

/**
 * 審計摘要
 */
export interface AuditSummary {
  /** 總審計記錄數 */
  totalRecords: number
  /** 不重複使用者數 */
  uniqueUsers: number
  /** 最常見動作 */
  topActions: Array<{
    action: string
    count: number
  }>
  /** 最常見資源類型 */
  topResourceTypes: Array<{
    resourceType: string
    count: number
  }>
  /** 最活躍的時段（小時） */
  peakHours: number[]
  /** 時間範圍 */
  timeRange: TimeRange
}

/**
 * Audit Collector 介面
 * 擴展基礎 MetricsCollector，增加審計統計特定功能
 */
export interface AuditCollector extends MetricsCollector {
  /**
   * 取得審計統計
   */
  getAuditStats(params?: AuditStatsQueryParams): Promise<FormattedAuditStats[]>

  /**
   * 取得使用者活動統計
   */
  getUserActivityStats(params?: UserActivityQueryParams): Promise<FormattedUserActivityStats[]>

  /**
   * 取得資源存取統計
   */
  getResourceAccessStats(
    params?: ResourceAccessQueryParams
  ): Promise<FormattedResourceAccessStats[]>

  /**
   * 取得審計摘要
   */
  getAuditSummary(params?: TimeRange): Promise<AuditSummary>

  /**
   * 取得特定使用者的活動歷史
   */
  getUserActivityHistory(userId: string, params?: TimeRange): Promise<FormattedUserActivityStats[]>

  /**
   * 取得特定資源的存取歷史
   */
  getResourceAccessHistory(
    resourceType: string,
    resourceId: string,
    params?: TimeRange
  ): Promise<FormattedResourceAccessStats[]>
}

/**
 * Audit Metric Data
 * 繼承 MetricData，為審計指標提供類型安全
 */
export interface AuditMetricData
  extends MetricData<
    | FormattedAuditStats[]
    | FormattedUserActivityStats[]
    | FormattedResourceAccessStats[]
    | AuditSummary
  > {
  metadata?: {
    queryParams?: AuditStatsQueryParams | UserActivityQueryParams | ResourceAccessQueryParams
    resultCount?: number
  }
}
