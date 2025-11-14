/**
 * MonitoringService 統一入口實作
 *
 * 協調所有 Collectors，提供統一的監控服務介面
 */

import { logger } from '@/lib/logger'
import {
  MonitoringService,
  MonitoringServiceOptions,
  MetricsCollector,
  MetricType,
  CollectorOptions,
  MetricData,
  MonitoringReport,
  MonitoringAlert,
  AlertSeverity,
} from './types/monitoring-types'

/**
 * MonitoringService 實作類別
 */
export class MonitoringServiceImpl implements MonitoringService {
  private collectors: Map<MetricType, MetricsCollector> = new Map()
  private alerts: MonitoringAlert[] = []
  private collectInterval?: NodeJS.Timeout
  private options: MonitoringServiceOptions

  constructor(options: MonitoringServiceOptions = {}) {
    this.options = {
      autoCollect: options.autoCollect ?? false,
      collectInterval: options.collectInterval ?? 5 * 60 * 1000, // 預設 5 分鐘
      enableAlerts: options.enableAlerts ?? true,
    }

    // 如果啟用自動收集，開始定期收集
    if (this.options.autoCollect) {
      this.startAutoCollect()
    }
  }

  /**
   * 實作 MonitoringService.registerCollector
   */
  registerCollector(collector: MetricsCollector): void {
    const type = collector.getMetricType()

    if (this.collectors.has(type)) {
      logger.warn(`Collector for type ${type} already registered, replacing...`, {
        module: 'MonitoringService',
        action: 'registerCollector',
        metadata: { type },
      })
    }

    this.collectors.set(type, collector)

    logger.info(`Collector registered: ${type}`, {
      module: 'MonitoringService',
      action: 'registerCollector',
      metadata: {
        type,
        supportedMetrics: collector.getSupportedMetrics().length,
      },
    })
  }

  /**
   * 實作 MonitoringService.collectAllMetrics
   */
  async collectAllMetrics(options?: CollectorOptions): Promise<MetricData[]> {
    const allMetrics: MetricData[] = []

    try {
      logger.info('開始收集所有監控指標', {
        module: 'MonitoringService',
        action: 'collectAllMetrics',
        metadata: {
          collectorCount: this.collectors.size,
          options,
        },
      })

      // 並行收集所有 Collector 的指標
      const collectionPromises = Array.from(this.collectors.values()).map(collector =>
        collector.collect(options).catch(error => {
          logger.error(`Collector ${collector.getMetricType()} 收集失敗`, error as Error, {
            module: 'MonitoringService',
            action: 'collectAllMetrics',
            metadata: { type: collector.getMetricType() },
          })
          return [] as MetricData[]
        })
      )

      const results = await Promise.all(collectionPromises)

      // 合併所有結果
      for (const metrics of results) {
        allMetrics.push(...metrics)
      }

      // 處理警報
      if (this.options.enableAlerts) {
        await this.processAlerts(allMetrics)
      }

      logger.info(`成功收集 ${allMetrics.length} 個監控指標`, {
        module: 'MonitoringService',
        action: 'collectAllMetrics',
        metadata: {
          metricCount: allMetrics.length,
          byType: this.getMetricCountByType(allMetrics),
        },
      })
    } catch (error) {
      logger.error('收集監控指標失敗', error as Error, {
        module: 'MonitoringService',
        action: 'collectAllMetrics',
      })
    }

    return allMetrics
  }

  /**
   * 實作 MonitoringService.collectMetricsByType
   */
  async collectMetricsByType(type: MetricType, options?: CollectorOptions): Promise<MetricData[]> {
    const collector = this.collectors.get(type)

    if (!collector) {
      logger.warn(`No collector registered for type: ${type}`, {
        module: 'MonitoringService',
        action: 'collectMetricsByType',
        metadata: { type },
      })
      return []
    }

    try {
      const metrics = await collector.collect(options)

      logger.info(`收集 ${type} 類型指標: ${metrics.length} 個`, {
        module: 'MonitoringService',
        action: 'collectMetricsByType',
        metadata: { type, count: metrics.length },
      })

      return metrics
    } catch (error) {
      logger.error(`收集 ${type} 類型指標失敗`, error as Error, {
        module: 'MonitoringService',
        action: 'collectMetricsByType',
        metadata: { type },
      })
      return []
    }
  }

  /**
   * 實作 MonitoringService.collectMetric
   */
  async collectMetric(metricName: string, options?: CollectorOptions): Promise<MetricData | null> {
    // 尋找支援此指標的 Collector
    for (const collector of this.collectors.values()) {
      if (collector.supportsMetric(metricName)) {
        try {
          const metrics = await collector.collect(options)
          const metric = metrics.find(m => m.name === metricName)

          if (metric) {
            logger.info(`收集指標 ${metricName}`, {
              module: 'MonitoringService',
              action: 'collectMetric',
              metadata: { metricName, type: collector.getMetricType() },
            })
            return metric
          }
        } catch (error) {
          logger.error(`收集指標 ${metricName} 失敗`, error as Error, {
            module: 'MonitoringService',
            action: 'collectMetric',
            metadata: { metricName },
          })
        }
      }
    }

    logger.warn(`未找到支援指標 ${metricName} 的 Collector`, {
      module: 'MonitoringService',
      action: 'collectMetric',
      metadata: { metricName },
    })

    return null
  }

  /**
   * 實作 MonitoringService.generateReport
   */
  async generateReport(
    type: MetricType | 'summary',
    options?: CollectorOptions
  ): Promise<MonitoringReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date().toISOString()

    try {
      let metrics: MetricData[] = []

      if (type === 'summary') {
        // 摘要報告：收集所有類型
        metrics = await this.collectAllMetrics(options)
      } else {
        // 特定類型報告
        metrics = await this.collectMetricsByType(type, options)
      }

      // 提取警報
      const alerts = this.extractAlerts(metrics)

      // 計算健康評分
      const healthScore = this.calculateOverallHealthScore(metrics)

      // 生成建議
      const recommendations = this.generateRecommendations(metrics, alerts)

      const report: MonitoringReport = {
        id: reportId,
        title: type === 'summary' ? '監控摘要報告' : `${type} 監控報告`,
        type,
        generatedAt: timestamp,
        timeRange: {
          startDate: options?.startDate,
          endDate: options?.endDate,
          days: options?.days,
        },
        healthScore,
        metrics,
        alerts,
        recommendations,
        summary: {
          totalMetrics: metrics.length,
          totalAlerts: alerts.length,
          criticalAlerts: alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
          highAlerts: alerts.filter(a => a.severity === AlertSeverity.HIGH).length,
        },
      }

      logger.info(`生成監控報告: ${reportId}`, {
        module: 'MonitoringService',
        action: 'generateReport',
        metadata: {
          reportId,
          type,
          metricCount: metrics.length,
          alertCount: alerts.length,
          healthScore,
        },
      })

      return report
    } catch (error) {
      logger.error('生成監控報告失敗', error as Error, {
        module: 'MonitoringService',
        action: 'generateReport',
        metadata: { type },
      })

      // 返回空報告
      return {
        id: reportId,
        title: `${type} 監控報告（失敗）`,
        type,
        generatedAt: timestamp,
        timeRange: options || {},
        healthScore: 0,
        metrics: [],
        alerts: [],
        recommendations: ['監控報告生成失敗，請檢查日誌'],
        summary: {
          totalMetrics: 0,
          totalAlerts: 0,
          criticalAlerts: 0,
          highAlerts: 0,
        },
      }
    }
  }

  /**
   * 實作 MonitoringService.getAlerts
   */
  async getAlerts(severity?: AlertSeverity): Promise<MonitoringAlert[]> {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity && !alert.resolved)
    }
    return this.alerts.filter(alert => !alert.resolved)
  }

  /**
   * 實作 MonitoringService.getCollectors
   */
  getCollectors(): MetricsCollector[] {
    return Array.from(this.collectors.values())
  }

  // === 公開輔助方法 ===

  /**
   * 開始自動收集
   */
  startAutoCollect(): void {
    if (this.collectInterval) {
      logger.warn('自動收集已經在運行', {
        module: 'MonitoringService',
        action: 'startAutoCollect',
      })
      return
    }

    logger.info(`啟動自動收集，間隔: ${this.options.collectInterval}ms`, {
      module: 'MonitoringService',
      action: 'startAutoCollect',
    })

    this.collectInterval = setInterval(() => {
      this.collectAllMetrics().catch(error => {
        logger.error('自動收集失敗', error as Error, {
          module: 'MonitoringService',
          action: 'autoCollect',
        })
      })
    }, this.options.collectInterval)
  }

  /**
   * 停止自動收集
   */
  stopAutoCollect(): void {
    if (this.collectInterval) {
      clearInterval(this.collectInterval)
      this.collectInterval = undefined

      logger.info('停止自動收集', {
        module: 'MonitoringService',
        action: 'stopAutoCollect',
      })
    }
  }

  /**
   * 解決警報
   */
  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId)

    if (!alert) {
      logger.warn(`警報不存在: ${alertId}`, {
        module: 'MonitoringService',
        action: 'resolveAlert',
        metadata: { alertId },
      })
      return false
    }

    alert.resolved = true
    alert.resolvedAt = new Date().toISOString()

    logger.info(`警報已解決: ${alertId}`, {
      module: 'MonitoringService',
      action: 'resolveAlert',
      metadata: { alertId, type: alert.type },
    })

    return true
  }

  // === 私有輔助方法 ===

  /**
   * 處理警報
   */
  private async processAlerts(metrics: MetricData[]): Promise<void> {
    for (const metric of metrics) {
      if (metric.alerts && metric.alerts.length > 0) {
        for (const alert of metric.alerts) {
          // 檢查是否已存在相同的警報
          const existing = this.alerts.find(
            a =>
              a.type === alert.type &&
              !a.resolved &&
              JSON.stringify(a.details) === JSON.stringify(alert.details)
          )

          if (!existing) {
            this.alerts.push(alert)

            logger.warn(`新警報: ${alert.type}`, {
              module: 'MonitoringService',
              action: 'processAlerts',
              metadata: {
                alertId: alert.id,
                severity: alert.severity,
                message: alert.message,
              },
            })
          }
        }
      }
    }

    // 清理過期的已解決警報（保留 7 天）
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    this.alerts = this.alerts.filter(alert => {
      if (alert.resolved && alert.resolvedAt) {
        return new Date(alert.resolvedAt).getTime() > cutoff
      }
      return true
    })
  }

  /**
   * 從指標中提取警報
   */
  private extractAlerts(metrics: MetricData[]): MonitoringAlert[] {
    const alerts: MonitoringAlert[] = []

    for (const metric of metrics) {
      if (metric.alerts) {
        alerts.push(...metric.alerts)
      }
    }

    return alerts
  }

  /**
   * 計算整體健康評分
   */
  private calculateOverallHealthScore(metrics: MetricData[]): number {
    if (metrics.length === 0) return 100

    let totalScore = 0
    let count = 0

    for (const metric of metrics) {
      // 根據警報級別計算分數
      if (metric.alerts && metric.alerts.length > 0) {
        const highestSeverity = metric.alerts.reduce((max, alert) => {
          const severityScore = this.getSeverityScore(alert.severity)
          return Math.max(max, severityScore)
        }, 0)

        totalScore += 100 - highestSeverity
      } else {
        totalScore += 100
      }
      count++
    }

    return Math.round(totalScore / count)
  }

  /**
   * 獲取嚴重程度分數
   */
  private getSeverityScore(severity: AlertSeverity): number {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 100
      case AlertSeverity.HIGH:
        return 75
      case AlertSeverity.MEDIUM:
        return 50
      case AlertSeverity.LOW:
        return 25
      default:
        return 0
    }
  }

  /**
   * 生成建議
   */
  private generateRecommendations(metrics: MetricData[], alerts: MonitoringAlert[]): string[] {
    const recommendations: string[] = []

    // 根據警報生成建議
    const criticalAlerts = alerts.filter(a => a.severity === AlertSeverity.CRITICAL)
    const highAlerts = alerts.filter(a => a.severity === AlertSeverity.HIGH)

    if (criticalAlerts.length > 0) {
      recommendations.push(`🔴 發現 ${criticalAlerts.length} 個嚴重警報，需立即處理`)
    }

    if (highAlerts.length > 0) {
      recommendations.push(`🟠 發現 ${highAlerts.length} 個高優先級警報，建議儘快處理`)
    }

    // 根據指標類型生成建議
    const metricsByType = this.groupMetricsByType(metrics)

    for (const [type, typeMetrics] of metricsByType) {
      const typeAlerts = typeMetrics.filter(m => m.alerts && m.alerts.length > 0)
      if (typeAlerts.length > 0) {
        recommendations.push(`檢查並優化 ${type} 相關指標`)
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ 所有監控指標正常')
    }

    return recommendations
  }

  /**
   * 按類型分組指標
   */
  private groupMetricsByType(metrics: MetricData[]): Map<MetricType, MetricData[]> {
    const grouped = new Map<MetricType, MetricData[]>()

    for (const metric of metrics) {
      const existing = grouped.get(metric.type) || []
      existing.push(metric)
      grouped.set(metric.type, existing)
    }

    return grouped
  }

  /**
   * 獲取按類型統計的指標數量
   */
  private getMetricCountByType(metrics: MetricData[]): Record<string, number> {
    const counts: Record<string, number> = {}

    for (const metric of metrics) {
      counts[metric.type] = (counts[metric.type] || 0) + 1
    }

    return counts
  }
}

// 創建全域監控服務實例（預設不啟用自動收集）
export const monitoringService = new MonitoringServiceImpl({
  autoCollect: false,
  enableAlerts: true,
})
