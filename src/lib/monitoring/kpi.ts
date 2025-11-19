/**
 * KPI 監控工具函數
 *
 * 從 KPICollectorImpl 類別簡化為工具函數集合
 * 移除狀態管理、Collector 介面實作
 */

import {
  getAllKPIBaselines,
  getKPIBaselineByName,
  checkKPIThreshold,
  AlertSeverity,
  type KPIBaseline,
} from '@/config/kpi-baselines'
import { logger } from '@/lib/logger'
import { metrics } from '@/lib/metrics'

// 動態 import 避免循環依賴
// import type { RateLimitStats } from './rate-limit'

// === 類型定義 ===

export interface KPIMeasurement {
  name: string
  value: number
  baseline: KPIBaseline
  alertSeverity: AlertSeverity | null
  timestamp: number
  metadata?: Record<string, unknown>
}

export interface KPIReport {
  timestamp: string
  overallHealthScore: number
  measurements: KPIMeasurement[]
  alerts: Array<{
    kpi: string
    severity: AlertSeverity
    message: string
    currentValue: number
    threshold: number
  }>
  recommendations: string[]
}

// === 核心函數 ===

/**
 * 生成 KPI 報告 (主要導出函數)
 */
export async function generateKPIReport(): Promise<KPIReport> {
  const measurements = await measureAllKPIs()
  const alerts = measurements
    .filter(m => m.alertSeverity !== null)
    .map(m => ({
      kpi: m.name,
      severity: m.alertSeverity!,
      message: generateAlertMessage(m),
      currentValue: m.value,
      threshold:
        m.alertSeverity === AlertSeverity.CRITICAL
          ? m.baseline.criticalThreshold
          : m.baseline.warningThreshold,
    }))

  const healthScore = calculateHealthScore(measurements)
  const recommendations = generateRecommendations(measurements)

  return {
    timestamp: new Date().toISOString(),
    overallHealthScore: healthScore,
    measurements,
    alerts,
    recommendations,
  }
}

/**
 * 測量所有 KPI 指標
 */
async function measureAllKPIs(): Promise<KPIMeasurement[]> {
  const baselines = getAllKPIBaselines()
  const measurements: KPIMeasurement[] = []

  for (const baseline of baselines) {
    try {
      const measurement = await measureKPI(baseline.name)
      if (measurement) {
        measurements.push(measurement)
      }
    } catch (error) {
      logger.error(`KPI 測量失敗: ${baseline.name}`, error as Error, {
        module: 'KPIMonitoring',
        action: 'measureAllKPIs',
        metadata: { kpiName: baseline.name },
      })
    }
  }

  return measurements
}

/**
 * 測量單一 KPI 指標
 */
async function measureKPI(kpiName: string): Promise<KPIMeasurement | null> {
  const baseline = getKPIBaselineByName(kpiName)
  if (!baseline) return null

  const timestamp = Date.now()
  let value: number | null = null
  let metadata: Record<string, unknown> = {}

  try {
    switch (baseline.name) {
      // API 效能指標
      case 'api_response_time_avg':
        value = await measureApiResponseTimeAvg()
        break
      case 'api_response_time_p95':
        value = await measureApiResponseTimeP95()
        break
      case 'api_error_rate':
        value = await measureApiErrorRate()
        break
      case 'api_throughput':
        value = await measureApiThroughput()
        break

      // 業務指標
      case 'daily_active_users':
        value = await measureDailyActiveUsers()
        break
      case 'product_view_rate':
        value = await measureProductViewRate()
        break
      case 'inquiry_submission_rate':
        value = await measureInquirySubmissionRate()
        break
      case 'search_success_rate':
        value = await measureSearchSuccessRate()
        break

      // 安全指標
      case 'rate_limit_violation_rate':
        const rateLimitData = await measureRateLimitViolationRate()
        value = rateLimitData.rate
        metadata = { blockedIPs: rateLimitData.blockedIPs }
        break
      case 'blocked_ips_count':
        value = await measureBlockedIPsCount()
        break

      // 系統健康指標
      case 'cache_hit_rate':
        value = await measureCacheHitRate()
        break

      default:
        logger.warn(`未知的 KPI 指標: ${baseline.name}`, {
          module: 'KPIMonitoring',
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
      module: 'KPIMonitoring',
      action: 'measureKPI',
      metadata: { kpiName: baseline.name },
    })
    return null
  }
}

// === 私有輔助函數 ===

function calculateHealthScore(measurements: KPIMeasurement[]): number {
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

function generateAlertMessage(measurement: KPIMeasurement): string {
  const { name, value, baseline, alertSeverity } = measurement
  const threshold =
    alertSeverity === AlertSeverity.CRITICAL
      ? baseline.criticalThreshold
      : baseline.warningThreshold

  return `${name} 已達到${alertSeverity === AlertSeverity.CRITICAL ? '臨界' : '警告'}閾值。當前值: ${value.toFixed(2)}, 閾值: ${threshold}`
}

function generateRecommendations(measurements: KPIMeasurement[]): string[] {
  const recommendations: string[] = []

  for (const measurement of measurements) {
    if (measurement.alertSeverity) {
      recommendations.push(`檢查並優化 ${measurement.name}`)
    }
  }

  return recommendations.length > 0 ? recommendations : ['所有監控指標正常']
}

// === 具體指標測量實作 ===

async function measureApiResponseTimeAvg(): Promise<number> {
  const metricsData = metrics.getMetricsSummary(60 * 60 * 1000)
  const responseTimes = metricsData.performance.apiResponseTime
  if (responseTimes.length === 0) return 0
  return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
}

async function measureApiResponseTimeP95(): Promise<number> {
  const metricsData = metrics.getMetricsSummary(60 * 60 * 1000)
  const responseTimes = metricsData.performance.apiResponseTime.sort((a, b) => a - b)
  if (responseTimes.length === 0) return 0
  const p95Index = Math.floor(responseTimes.length * 0.95)
  return responseTimes[p95Index] || 0
}

async function measureApiErrorRate(): Promise<number> {
  const metricsData = metrics.getMetricsSummary(60 * 60 * 1000)
  return metricsData.performance.errorRate
}

async function measureApiThroughput(): Promise<number> {
  const metricsData = metrics.getMetricsSummary(60 * 60 * 1000)
  return metricsData.performance.apiResponseTime.length
}

async function measureDailyActiveUsers(): Promise<number> {
  const metricsData = metrics.getMetricsSummary(24 * 60 * 60 * 1000)
  return metricsData.performance.activeUsers
}

async function measureProductViewRate(): Promise<number> {
  const metricsData = metrics.getMetricsSummary(24 * 60 * 60 * 1000)
  return metricsData.userActions.productViews
}

async function measureInquirySubmissionRate(): Promise<number> {
  const metricsData = metrics.getMetricsSummary(24 * 60 * 60 * 1000)
  return metricsData.userActions.inquirySubmissions
}

async function measureSearchSuccessRate(): Promise<number> {
  const metricsData = metrics.getMetricsSummary(60 * 60 * 1000)
  const searchQueries = metricsData.userActions.searchQueries
  return searchQueries > 0 ? 100 : 0
}

async function measureRateLimitViolationRate(): Promise<{ rate: number; blockedIPs: number }> {
  // 動態 import 避免循環依賴
  const { getRateLimitStats } = await import('./rate-limit')
  const rateLimitStats = await getRateLimitStats()
  return {
    rate: rateLimitStats.limitRate,
    blockedIPs: rateLimitStats.blockedIPs,
  }
}

async function measureBlockedIPsCount(): Promise<number> {
  const { getRateLimitStats } = await import('./rate-limit')
  const rateLimitStats = await getRateLimitStats()
  return rateLimitStats.blockedIPs
}

async function measureCacheHitRate(): Promise<number> {
  // 待實作：從快取系統獲取統計數據
  return 0
}
