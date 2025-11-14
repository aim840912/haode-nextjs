/**
 * Audit Collector 實作
 *
 * 實作 MetricsCollector 和 AuditCollector 介面
 * 包裝現有的 SupabaseAuditStatsService 功能
 */

import { dbLogger } from '@/lib/logger'
import { SupabaseAuditStatsService } from '../../auditStatsService'
import {
  FormattedAuditStats,
  FormattedUserActivityStats,
  FormattedResourceAccessStats,
} from '@/types/audit-stats'
import { MetricType, CollectorOptions, MetricData, TimeRange } from '../types/monitoring-types'
import {
  AuditCollector,
  AuditStatsQueryParams,
  UserActivityQueryParams,
  ResourceAccessQueryParams,
  AuditSummary,
  AuditMetricData,
} from '../types/audit-collector'

/**
 * Audit Collector 實作類別
 */
export class AuditCollectorImpl implements AuditCollector {
  private auditStatsService: SupabaseAuditStatsService

  constructor() {
    this.auditStatsService = new SupabaseAuditStatsService()
  }

  /**
   * 實作 MetricsCollector.collect
   */
  async collect(options?: CollectorOptions): Promise<MetricData[]> {
    const metrics: MetricData<any>[] = []
    const timestamp = Date.now()

    try {
      const params: AuditStatsQueryParams = {
        startDate: options?.startDate,
        endDate: options?.endDate,
        days: options?.days || 30,
        limit: options?.limit || 100,
      }

      // 收集審計統計
      const auditStats = await this.getAuditStats(params)
      metrics.push({
        type: MetricType.AUDIT,
        name: 'audit_stats',
        value: auditStats,
        timestamp,
        metadata: {
          queryParams: params,
          resultCount: auditStats.length,
        },
      })

      // 如果需要詳細資料，收集使用者活動和資源存取統計
      if (options?.includeDetails) {
        const [userActivity, resourceAccess, summary] = await Promise.all([
          this.getUserActivityStats(params),
          this.getResourceAccessStats(params),
          this.getAuditSummary({ startDate: params.startDate, endDate: params.endDate }),
        ])

        metrics.push(
          {
            type: MetricType.AUDIT,
            name: 'user_activity_stats',
            value: userActivity,
            timestamp,
            metadata: { resultCount: userActivity.length },
          },
          {
            type: MetricType.AUDIT,
            name: 'resource_access_stats',
            value: resourceAccess,
            timestamp,
            metadata: { resultCount: resourceAccess.length },
          },
          {
            type: MetricType.AUDIT,
            name: 'audit_summary',
            value: summary,
            timestamp,
          }
        )
      }
    } catch (error) {
      dbLogger.error('審計指標收集失敗', error as Error, {
        module: 'AuditCollector',
        action: 'collect',
      })
    }

    return metrics
  }

  /**
   * 實作 MetricsCollector.getMetricType
   */
  getMetricType(): MetricType {
    return MetricType.AUDIT
  }

  /**
   * 實作 MetricsCollector.getSupportedMetrics
   */
  getSupportedMetrics(): string[] {
    return [
      'audit_stats',
      'user_activity_stats',
      'resource_access_stats',
      'audit_summary',
      'user_activity_history',
      'resource_access_history',
    ]
  }

  /**
   * 實作 MetricsCollector.supportsMetric
   */
  supportsMetric(metricName: string): boolean {
    return this.getSupportedMetrics().includes(metricName)
  }

  /**
   * 實作 AuditCollector.getAuditStats
   */
  async getAuditStats(params?: AuditStatsQueryParams): Promise<FormattedAuditStats[]> {
    try {
      return await this.auditStatsService.getAuditStats({
        days: params?.days,
        start_date: params?.startDate,
        end_date: params?.endDate,
      })
    } catch (error) {
      dbLogger.error('取得審計統計失敗', error as Error, {
        module: 'AuditCollector',
        action: 'getAuditStats',
        metadata: { params },
      })
      return []
    }
  }

  /**
   * 實作 AuditCollector.getUserActivityStats
   */
  async getUserActivityStats(
    params?: UserActivityQueryParams
  ): Promise<FormattedUserActivityStats[]> {
    try {
      const result = await this.auditStatsService.getUserActivityStats({
        days: params?.days,
        start_date: params?.startDate,
        end_date: params?.endDate,
      })

      // 應用過濾和限制
      let filtered = result

      if (params?.userId) {
        filtered = filtered.filter(
          (stat: FormattedUserActivityStats) => stat.user_id === params.userId
        )
      }

      if (params?.userRole) {
        filtered = filtered.filter(
          (stat: FormattedUserActivityStats) => stat.user_role === params.userRole
        )
      }

      if (params?.minActions !== undefined) {
        filtered = filtered.filter(
          (stat: FormattedUserActivityStats) => stat.total_actions >= params.minActions!
        )
      }

      if (params?.limit) {
        filtered = filtered.slice(0, params.limit)
      }

      return filtered
    } catch (error) {
      dbLogger.error('取得使用者活動統計失敗', error as Error, {
        module: 'AuditCollector',
        action: 'getUserActivityStats',
        metadata: { params },
      })
      return []
    }
  }

  /**
   * 實作 AuditCollector.getResourceAccessStats
   */
  async getResourceAccessStats(
    params?: ResourceAccessQueryParams
  ): Promise<FormattedResourceAccessStats[]> {
    try {
      const result = await this.auditStatsService.getResourceAccessStats({
        days: params?.days,
        start_date: params?.startDate,
        end_date: params?.endDate,
      })

      // 應用過濾和限制
      let filtered = result

      if (params?.resourceType) {
        filtered = filtered.filter(
          (stat: FormattedResourceAccessStats) => stat.resource_type === params.resourceType
        )
      }

      if (params?.resourceId) {
        filtered = filtered.filter(
          (stat: FormattedResourceAccessStats) => stat.resource_id === params.resourceId
        )
      }

      if (params?.minAccess !== undefined) {
        filtered = filtered.filter(
          (stat: FormattedResourceAccessStats) => stat.access_count >= params.minAccess!
        )
      }

      if (params?.limit) {
        filtered = filtered.slice(0, params.limit)
      }

      return filtered
    } catch (error) {
      dbLogger.error('取得資源存取統計失敗', error as Error, {
        module: 'AuditCollector',
        action: 'getResourceAccessStats',
        metadata: { params },
      })
      return []
    }
  }

  /**
   * 實作 AuditCollector.getAuditSummary
   */
  async getAuditSummary(params?: TimeRange): Promise<AuditSummary> {
    try {
      const stats = await this.getAuditStats({
        startDate: params?.startDate,
        endDate: params?.endDate,
        days: params?.days,
      })

      // 計算摘要統計
      const uniqueUsers = new Set(stats.map(s => s.user_role)).size
      const actionCounts = new Map<string, number>()
      const resourceTypeCounts = new Map<string, number>()

      for (const stat of stats) {
        actionCounts.set(stat.action, (actionCounts.get(stat.action) || 0) + stat.count)
        resourceTypeCounts.set(
          stat.resource_type,
          (resourceTypeCounts.get(stat.resource_type) || 0) + stat.count
        )
      }

      // 取得前 5 個最常見動作
      const topActions = Array.from(actionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([action, count]) => ({ action, count }))

      // 取得前 5 個最常見資源類型
      const topResourceTypes = Array.from(resourceTypeCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([resourceType, count]) => ({ resourceType, count }))

      return {
        totalRecords: stats.reduce((sum, stat) => sum + stat.count, 0),
        uniqueUsers,
        topActions,
        topResourceTypes,
        peakHours: [], // 待實作：需要時間戳記資料
        timeRange: {
          startDate: params?.startDate,
          endDate: params?.endDate,
          days: params?.days,
        },
      }
    } catch (error) {
      dbLogger.error('取得審計摘要失敗', error as Error, {
        module: 'AuditCollector',
        action: 'getAuditSummary',
        metadata: { params },
      })
      return {
        totalRecords: 0,
        uniqueUsers: 0,
        topActions: [],
        topResourceTypes: [],
        peakHours: [],
        timeRange: params || {},
      }
    }
  }

  /**
   * 實作 AuditCollector.getUserActivityHistory
   */
  async getUserActivityHistory(
    userId: string,
    params?: TimeRange
  ): Promise<FormattedUserActivityStats[]> {
    return this.getUserActivityStats({
      userId,
      startDate: params?.startDate,
      endDate: params?.endDate,
      days: params?.days,
    })
  }

  /**
   * 實作 AuditCollector.getResourceAccessHistory
   */
  async getResourceAccessHistory(
    resourceType: string,
    resourceId: string,
    params?: TimeRange
  ): Promise<FormattedResourceAccessStats[]> {
    return this.getResourceAccessStats({
      resourceType,
      resourceId,
      startDate: params?.startDate,
      endDate: params?.endDate,
      days: params?.days,
    })
  }
}

// 創建單例實例
export const auditCollector = new AuditCollectorImpl()
