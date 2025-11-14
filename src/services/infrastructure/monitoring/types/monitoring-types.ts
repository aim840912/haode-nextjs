/**
 * 監控服務統一架構類型定義
 *
 * 設計理念：
 * - 使用 Collector 模式整合 3 個監控服務
 * - 定義統一的 MetricData 格式
 * - 提供可擴展的監控架構
 */

/**
 * 指標類型
 */
export enum MetricType {
  /** 速率限制監控 */
  RATE_LIMIT = 'rate_limit',
  /** KPI 效能監控 */
  KPI = 'kpi',
  /** 審計統計 */
  AUDIT = 'audit',
}

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
 * 資料收集選項
 */
export interface CollectorOptions extends TimeRange {
  /** 指標過濾條件 */
  filters?: Record<string, unknown>
  /** 聚合粒度（hour、day、week、month） */
  granularity?: 'hour' | 'day' | 'week' | 'month'
  /** 限制返回數量 */
  limit?: number
  /** 是否包含詳細資料 */
  includeDetails?: boolean
}

/**
 * 警報嚴重程度
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * 監控警報
 */
export interface MonitoringAlert {
  /** 警報 ID */
  id: string
  /** 警報類型 */
  type: string
  /** 嚴重程度 */
  severity: AlertSeverity
  /** 警報訊息 */
  message: string
  /** 詳細資訊 */
  details: Record<string, unknown>
  /** 觸發時間 */
  triggeredAt: string
  /** 是否已解決 */
  resolved: boolean
  /** 解決時間 */
  resolvedAt?: string
}

/**
 * 統一的指標資料格式
 */
export interface MetricData<T = number | Record<string, unknown>> {
  /** 指標類型 */
  type: MetricType
  /** 指標名稱 */
  name: string
  /** 指標值 */
  value: T
  /** 單位（可選） */
  unit?: string
  /** 時間戳記 */
  timestamp: number
  /** 額外的元資料 */
  metadata?: Record<string, unknown>
  /** 相關警報 */
  alerts?: MonitoringAlert[]
}

/**
 * 指標收集器介面
 * 每個監控領域（RateLimit、KPI、Audit）實作此介面
 */
export interface MetricsCollector {
  /**
   * 收集指標資料
   * @param options 收集選項
   * @returns 指標資料陣列
   */
  collect(options?: CollectorOptions): Promise<MetricData[]>

  /**
   * 取得收集器類型
   */
  getMetricType(): MetricType

  /**
   * 取得支援的指標名稱列表
   */
  getSupportedMetrics(): string[]

  /**
   * 檢查是否支援特定指標
   */
  supportsMetric(metricName: string): boolean
}

/**
 * 監控報告
 */
export interface MonitoringReport {
  /** 報告 ID */
  id: string
  /** 報告標題 */
  title: string
  /** 報告類型 */
  type: MetricType | 'summary'
  /** 生成時間 */
  generatedAt: string
  /** 時間範圍 */
  timeRange: TimeRange
  /** 整體健康評分（0-100） */
  healthScore: number
  /** 指標資料 */
  metrics: MetricData[]
  /** 警報列表 */
  alerts: MonitoringAlert[]
  /** 建議事項 */
  recommendations: string[]
  /** 摘要 */
  summary: {
    totalMetrics: number
    totalAlerts: number
    criticalAlerts: number
    highAlerts: number
  }
}

/**
 * 監控服務選項
 */
export interface MonitoringServiceOptions {
  /** 是否啟用自動收集 */
  autoCollect?: boolean
  /** 自動收集間隔（毫秒） */
  collectInterval?: number
  /** 是否啟用警報 */
  enableAlerts?: boolean
}

/**
 * 監控服務介面
 * 統一入口點，協調各個 Collector
 */
export interface MonitoringService {
  /**
   * 註冊收集器
   */
  registerCollector(collector: MetricsCollector): void

  /**
   * 收集所有指標
   */
  collectAllMetrics(options?: CollectorOptions): Promise<MetricData[]>

  /**
   * 收集特定類型的指標
   */
  collectMetricsByType(type: MetricType, options?: CollectorOptions): Promise<MetricData[]>

  /**
   * 收集特定指標
   */
  collectMetric(metricName: string, options?: CollectorOptions): Promise<MetricData | null>

  /**
   * 生成監控報告
   */
  generateReport(
    type: MetricType | 'summary',
    options?: CollectorOptions
  ): Promise<MonitoringReport>

  /**
   * 取得所有警報
   */
  getAlerts(severity?: AlertSeverity): Promise<MonitoringAlert[]>

  /**
   * 取得所有註冊的收集器
   */
  getCollectors(): MetricsCollector[]
}
