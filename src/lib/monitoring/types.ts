/**
 * 監控共用類型定義
 */

/**
 * 時間範圍參數
 */
export interface TimeRange {
  /** 開始時間（ISO 8601 格式） */
  startDate?: string
  /** 結束時間（ISO 8601 格式） */
  endDate?: string
  /** 天數（如果未提供 startDate/endDate） */
  days?: number
}

/**
 * 重新導出 KPI 基線相關類型
 */
export type { KPIBaseline } from '@/config/kpi-baselines'
export { AlertSeverity } from '@/config/kpi-baselines'
