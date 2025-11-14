/**
 * KPI Collector 特定類型定義
 */

import { MetricsCollector, MetricData } from './monitoring-types'
import { KPIBaseline, AlertSeverity } from '@/config/kpi-baselines'

/**
 * KPI 測量結果
 */
export interface KPIMeasurement {
  /** 指標名稱 */
  name: string
  /** 指標值 */
  value: number
  /** 基線配置 */
  baseline: KPIBaseline
  /** 警報嚴重程度 */
  alertSeverity: AlertSeverity | null
  /** 時間戳記 */
  timestamp: number
  /** 額外元資料 */
  metadata?: Record<string, unknown>
}

/**
 * KPI 報告
 */
export interface KPIReport {
  /** 報告生成時間 */
  timestamp: string
  /** 整體健康評分（0-100） */
  overallHealthScore: number
  /** 測量結果 */
  measurements: KPIMeasurement[]
  /** 警報列表 */
  alerts: Array<{
    kpi: string
    severity: AlertSeverity
    message: string
    currentValue: number
    threshold: number
  }>
  /** 建議事項 */
  recommendations: string[]
}

/**
 * KPI 歷史資料點
 */
export interface KPIHistoryPoint {
  /** KPI 名稱 */
  name: string
  /** 值 */
  value: number
  /** 時間戳記 */
  timestamp: number
}

/**
 * KPI Collector 介面
 * 擴展基礎 MetricsCollector，增加 KPI 特定功能
 */
export interface KPICollector extends MetricsCollector {
  /**
   * 測量所有 KPI 指標
   */
  measureAllKPIs(): Promise<KPIMeasurement[]>

  /**
   * 測量單一 KPI 指標
   */
  measureKPI(kpiName: string): Promise<KPIMeasurement | null>

  /**
   * 生成 KPI 報告
   */
  generateKPIReport(): Promise<KPIReport>

  /**
   * 取得 KPI 歷史資料
   */
  getKPIHistory(kpiName: string, limit?: number): Promise<KPIHistoryPoint[]> | KPIHistoryPoint[]

  /**
   * 計算健康評分
   */
  calculateHealthScore(measurements: KPIMeasurement[]): number

  /**
   * 取得所有支援的 KPI 基線
   */
  getKPIBaselines(): KPIBaseline[]

  /**
   * 取得特定 KPI 的基線
   */
  getKPIBaseline(kpiName: string): KPIBaseline | null
}

/**
 * KPI Metric Data
 * 繼承 MetricData，為 KPI 指標提供類型安全
 */
export interface KPIMetricData extends MetricData<number> {
  metadata?: {
    baseline?: KPIBaseline
    alertSeverity?: AlertSeverity | null
    threshold?: number
    percentageOfBaseline?: number
  }
}
