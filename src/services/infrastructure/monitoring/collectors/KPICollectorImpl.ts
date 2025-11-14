/**
 * KPI Collector 實作
 *
 * 實作 MetricsCollector 和 KPICollector 介面
 * 包裝現有的 KPIMonitoringService 功能
 */

import { logger } from '@/lib/logger'
import { metrics } from '@/lib/metrics'
import {
  getAllKPIBaselines,
  getKPIBaselineByName,
  checkKPIThreshold,
  KPIBaseline,
  AlertSeverity,
} from '@/config/kpi-baselines'
import { rateLimitCollector } from './RateLimitCollectorImpl'
import { MetricType, CollectorOptions, MetricData } from '../types/monitoring-types'
import {
  KPICollector,
  KPIMeasurement,
  KPIReport,
  KPIHistoryPoint,
  KPIMetricData,
} from '../types/kpi-collector'

/**
 * KPI Collector 實作類別
 */
export class KPICollectorImpl implements KPICollector {
  private measurements: Map<string, KPIMeasurement[]> = new Map()
  private readonly maxMeasurements = 1000

  constructor() {
    // 定期清理過期數據
    setInterval(() => this.cleanup(), 30 * 60 * 1000)
  }

  /**
   * 實作 MetricsCollector.collect
   */
  async collect(options?: CollectorOptions): Promise<MetricData[]> {
    const metrics: MetricData<any>[] = []
    const timestamp = Date.now()

    try {
      // 測量所有 KPI
      const measurements = await this.measureAllKPIs()

      // 將每個測量結果轉換為 MetricData
      for (const measurement of measurements) {
        metrics.push({
          type: MetricType.KPI,
          name: measurement.name,
          value: measurement.value,
          unit: this.getUnitForKPI(measurement.name),
          timestamp,
          metadata: {
            baseline: measurement.baseline,
            alertSeverity: measurement.alertSeverity,
            threshold:
              measurement.alertSeverity === AlertSeverity.CRITICAL
                ? measurement.baseline.criticalThreshold
                : measurement.baseline.warningThreshold,
            percentageOfBaseline: (measurement.value / measurement.baseline.warningThreshold) * 100,
          },
        })
      }

      // 如果需要詳細資料，生成完整報告
      if (options?.includeDetails) {
        const report = await this.generateKPIReport()
        metrics.push({
          type: MetricType.KPI,
          name: 'kpi_summary_report',
          value: report,
          timestamp,
        })
      }
    } catch (error) {
      logger.error('KPI 指標收集失敗', error as Error, {
        module: 'KPICollector',
        action: 'collect',
      })
    }

    return metrics
  }

  /**
   * 實作 MetricsCollector.getMetricType
   */
  getMetricType(): MetricType {
    return MetricType.KPI
  }

  /**
   * 實作 MetricsCollector.getSupportedMetrics
   */
  getSupportedMetrics(): string[] {
    return getAllKPIBaselines().map(baseline => baseline.name)
  }

  /**
   * 實作 MetricsCollector.supportsMetric
   */
  supportsMetric(metricName: string): boolean {
    return getKPIBaselineByName(metricName) !== null
  }

  /**
   * 實作 KPICollector.measureAllKPIs
   */
  async measureAllKPIs(): Promise<KPIMeasurement[]> {
    const baselines = getAllKPIBaselines()
    const measurements: KPIMeasurement[] = []

    for (const baseline of baselines) {
      try {
        const measurement = await this.measureKPI(baseline.name)
        if (measurement) {
          measurements.push(measurement)
          this.storeMeasurement(measurement)
        }
      } catch (error) {
        logger.error(`KPI 測量失敗: ${baseline.name}`, error as Error, {
          module: 'KPICollector',
          action: 'measureAllKPIs',
          metadata: { kpiName: baseline.name },
        })
      }
    }

    return measurements
  }

  /**
   * 實作 KPICollector.measureKPI
   */
  async measureKPI(kpiName: string): Promise<KPIMeasurement | null> {
    const baseline = getKPIBaselineByName(kpiName)
    if (!baseline) return null

    const timestamp = Date.now()
    let value: number | null = null
    let metadata: Record<string, unknown> = {}

    try {
      switch (baseline.name) {
        // API 效能指標
        case 'api_response_time_avg':
          value = await this.measureApiResponseTimeAvg()
          break
        case 'api_response_time_p95':
          value = await this.measureApiResponseTimeP95()
          break
        case 'api_error_rate':
          value = await this.measureApiErrorRate()
          break
        case 'api_throughput':
          value = await this.measureApiThroughput()
          break

        // 業務指標
        case 'daily_active_users':
          value = await this.measureDailyActiveUsers()
          break
        case 'product_view_rate':
          value = await this.measureProductViewRate()
          break
        case 'inquiry_submission_rate':
          value = await this.measureInquirySubmissionRate()
          break
        case 'search_success_rate':
          value = await this.measureSearchSuccessRate()
          break

        // 安全指標
        case 'rate_limit_violation_rate':
          const rateLimitData = await this.measureRateLimitViolationRate()
          value = rateLimitData.rate
          metadata = { blockedIPs: rateLimitData.blockedIPs }
          break
        case 'blocked_ips_count':
          value = await this.measureBlockedIPsCount()
          break

        // 系統健康指標
        case 'cache_hit_rate':
          value = await this.measureCacheHitRate()
          break

        default:
          logger.warn(`未知的 KPI 指標: ${baseline.name}`, {
            module: 'KPICollector',
            action: 'measureKPI',
            metadata: { kpiName: baseline.name },
          })
          return null
      }

      if (value === null) return null

      const alertSeverity = checkKPIThreshold(baseline, value)

      return {
        name: baseline.name,
        value,
        baseline,
        alertSeverity,
        timestamp,
        metadata,
      }
    } catch (error) {
      logger.error(`KPI 測量實現錯誤: ${baseline.name}`, error as Error, {
        module: 'KPICollector',
        action: 'measureKPI',
        metadata: { kpiName: baseline.name },
      })
      return null
    }
  }

  /**
   * 實作 KPICollector.generateKPIReport
   */
  async generateKPIReport(): Promise<KPIReport> {
    const measurements = await this.measureAllKPIs()
    const alerts = measurements
      .filter(m => m.alertSeverity !== null)
      .map(m => ({
        kpi: m.name,
        severity: m.alertSeverity!,
        message: this.generateAlertMessage(m),
        currentValue: m.value,
        threshold:
          m.alertSeverity === AlertSeverity.CRITICAL
            ? m.baseline.criticalThreshold
            : m.baseline.warningThreshold,
      }))

    const healthScore = this.calculateHealthScore(measurements)
    const recommendations = this.generateRecommendations(measurements)

    return {
      timestamp: new Date().toISOString(),
      overallHealthScore: healthScore,
      measurements,
      alerts,
      recommendations,
    }
  }

  /**
   * 實作 KPICollector.getKPIHistory
   */
  async getKPIHistory(kpiName: string, limit: number = 100): Promise<KPIHistoryPoint[]> {
    const measurements = this.measurements.get(kpiName) || []
    return measurements.slice(-limit).map(m => ({
      name: m.name,
      value: m.value,
      timestamp: m.timestamp,
    }))
  }

  /**
   * 實作 KPICollector.calculateHealthScore
   */
  calculateHealthScore(measurements: KPIMeasurement[]): number {
    if (measurements.length === 0) return 100

    let totalScore = 0
    let count = 0

    for (const measurement of measurements) {
      const baseline = measurement.baseline
      const ratio = measurement.value / baseline.warningThreshold

      let score = 100
      if (measurement.alertSeverity === AlertSeverity.CRITICAL) {
        score = 0
      } else if (measurement.alertSeverity === AlertSeverity.WARNING) {
        score = 50
      } else {
        // 根據與基線的距離計算分數
        score = Math.max(0, Math.min(100, 100 - (ratio - 1) * 50))
      }

      totalScore += score
      count++
    }

    return Math.round(totalScore / count)
  }

  /**
   * 實作 KPICollector.getKPIBaselines
   */
  getKPIBaselines(): KPIBaseline[] {
    return getAllKPIBaselines()
  }

  /**
   * 實作 KPICollector.getKPIBaseline
   */
  getKPIBaseline(kpiName: string): KPIBaseline | null {
    return getKPIBaselineByName(kpiName) || null
  }

  // === 私有輔助方法 ===

  /**
   * 儲存測量結果
   */
  private storeMeasurement(measurement: KPIMeasurement): void {
    const measurements = this.measurements.get(measurement.name) || []
    measurements.push(measurement)

    // 限制保留數量
    if (measurements.length > this.maxMeasurements) {
      measurements.shift()
    }

    this.measurements.set(measurement.name, measurements)
  }

  /**
   * 清理過期數據
   */
  private cleanup(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000 // 保留 24 小時
    for (const [kpiName, measurements] of this.measurements) {
      const filtered = measurements.filter(m => m.timestamp >= cutoff)
      this.measurements.set(kpiName, filtered)
    }
  }

  /**
   * 生成警報訊息
   */
  private generateAlertMessage(measurement: KPIMeasurement): string {
    const { name, value, baseline, alertSeverity } = measurement
    const threshold =
      alertSeverity === AlertSeverity.CRITICAL
        ? baseline.criticalThreshold
        : baseline.warningThreshold

    return `${name} 已達到${alertSeverity === AlertSeverity.CRITICAL ? '臨界' : '警告'}閾值。當前值: ${value.toFixed(2)}, 閾值: ${threshold}`
  }

  /**
   * 生成建議
   */
  private generateRecommendations(measurements: KPIMeasurement[]): string[] {
    const recommendations: string[] = []

    for (const measurement of measurements) {
      if (measurement.alertSeverity) {
        recommendations.push(`檢查並優化 ${measurement.name}`)
      }
    }

    return recommendations
  }

  /**
   * 取得 KPI 單位
   */
  private getUnitForKPI(kpiName: string): string | undefined {
    if (kpiName.includes('time')) return 'ms'
    if (kpiName.includes('rate')) return '%'
    if (kpiName.includes('count')) return 'count'
    return undefined
  }

  // === 具體指標測量實作 ===

  private async measureApiResponseTimeAvg(): Promise<number> {
    const metricsData = metrics.getMetricsSummary(60 * 60 * 1000)
    const responseTimes = metricsData.performance.apiResponseTime
    if (responseTimes.length === 0) return 0
    return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
  }

  private async measureApiResponseTimeP95(): Promise<number> {
    const metricsData = metrics.getMetricsSummary(60 * 60 * 1000)
    const responseTimes = metricsData.performance.apiResponseTime.sort((a, b) => a - b)
    if (responseTimes.length === 0) return 0
    const p95Index = Math.floor(responseTimes.length * 0.95)
    return responseTimes[p95Index] || 0
  }

  private async measureApiErrorRate(): Promise<number> {
    const metricsData = metrics.getMetricsSummary(60 * 60 * 1000)
    return metricsData.performance.errorRate
  }

  private async measureApiThroughput(): Promise<number> {
    const metricsData = metrics.getMetricsSummary(60 * 60 * 1000)
    return metricsData.performance.apiResponseTime.length
  }

  private async measureDailyActiveUsers(): Promise<number> {
    const metricsData = metrics.getMetricsSummary(24 * 60 * 60 * 1000)
    return metricsData.performance.activeUsers
  }

  private async measureProductViewRate(): Promise<number> {
    const metricsData = metrics.getMetricsSummary(24 * 60 * 60 * 1000)
    return metricsData.userActions.productViews
  }

  private async measureInquirySubmissionRate(): Promise<number> {
    const metricsData = metrics.getMetricsSummary(24 * 60 * 60 * 1000)
    return metricsData.userActions.inquirySubmissions
  }

  private async measureSearchSuccessRate(): Promise<number> {
    const metricsData = metrics.getMetricsSummary(60 * 60 * 1000)
    const searchQueries = metricsData.userActions.searchQueries
    return searchQueries > 0 ? 100 : 0
  }

  private async measureRateLimitViolationRate(): Promise<{ rate: number; blockedIPs: number }> {
    const rateLimitStats = await rateLimitCollector.getRateLimitStats()
    return {
      rate: rateLimitStats.limitRate,
      blockedIPs: rateLimitStats.blockedIPs,
    }
  }

  private async measureBlockedIPsCount(): Promise<number> {
    const rateLimitStats = await rateLimitCollector.getRateLimitStats()
    return rateLimitStats.blockedIPs
  }

  private async measureCacheHitRate(): Promise<number> {
    // 待實作：從快取系統獲取統計數據
    return 0
  }
}

// 創建單例實例
export const kpiCollector = new KPICollectorImpl()
