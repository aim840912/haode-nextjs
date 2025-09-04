/**
 * 關鍵性能指標（KPI）基線配置
 *
 * 定義了各個系統組件的性能基線和警報閾值
 * 這些數值用於監控系統健康狀態和觸發警報
 */

export interface KPIBaseline {
  /** 指標名稱 */
  name: string
  /** 描述 */
  description: string
  /** 目標值 */
  target: number
  /** 警告閾值 */
  warningThreshold: number
  /** 嚴重閾值 */
  criticalThreshold: number
  /** 單位 */
  unit: string
  /** 指標類型（higher_is_better 或 lower_is_better） */
  type: 'higher_is_better' | 'lower_is_better'
  /** 測量頻率（毫秒） */
  measurementInterval: number
  /** 資料保留期（天） */
  retentionDays: number
}

export interface KPICategory {
  category: string
  description: string
  baselines: KPIBaseline[]
}

/**
 * 性能監控 KPI 基線配置
 */
export const PERFORMANCE_KPI_BASELINES: KPICategory[] = [
  {
    category: 'api_performance',
    description: 'API 請求效能指標',
    baselines: [
      {
        name: 'api_response_time_avg',
        description: 'API 平均回應時間',
        target: 200, // 目標：200ms 以下
        warningThreshold: 500, // 警告：500ms 以上
        criticalThreshold: 1000, // 嚴重：1秒以上
        unit: 'ms',
        type: 'lower_is_better',
        measurementInterval: 60000, // 每分鐘測量
        retentionDays: 30,
      },
      {
        name: 'api_response_time_p95',
        description: 'API P95 回應時間',
        target: 500, // 目標：500ms 以下
        warningThreshold: 1000, // 警告：1秒以上
        criticalThreshold: 2000, // 嚴重：2秒以上
        unit: 'ms',
        type: 'lower_is_better',
        measurementInterval: 60000,
        retentionDays: 30,
      },
      {
        name: 'api_error_rate',
        description: 'API 錯誤率',
        target: 0.5, // 目標：0.5% 以下
        warningThreshold: 2.0, // 警告：2% 以上
        criticalThreshold: 5.0, // 嚴重：5% 以上
        unit: '%',
        type: 'lower_is_better',
        measurementInterval: 60000,
        retentionDays: 30,
      },
      {
        name: 'api_throughput',
        description: 'API 吞吐量',
        target: 1000, // 目標：每分鐘 1000 請求
        warningThreshold: 500, // 警告：低於 500 req/min
        criticalThreshold: 100, // 嚴重：低於 100 req/min
        unit: 'req/min',
        type: 'higher_is_better',
        measurementInterval: 60000,
        retentionDays: 30,
      },
    ],
  },
  {
    category: 'business_metrics',
    description: '業務指標',
    baselines: [
      {
        name: 'daily_active_users',
        description: '每日活躍用戶數',
        target: 100, // 目標：100 人/天
        warningThreshold: 50, // 警告：低於 50 人/天
        criticalThreshold: 20, // 嚴重：低於 20 人/天
        unit: 'users/day',
        type: 'higher_is_better',
        measurementInterval: 24 * 60 * 60 * 1000, // 每天測量
        retentionDays: 90,
      },
      {
        name: 'product_view_rate',
        description: '產品瀏覽率',
        target: 500, // 目標：每日 500 次產品瀏覽
        warningThreshold: 200, // 警告：低於 200 次/天
        criticalThreshold: 50, // 嚴重：低於 50 次/天
        unit: 'views/day',
        type: 'higher_is_better',
        measurementInterval: 24 * 60 * 60 * 1000,
        retentionDays: 90,
      },
      {
        name: 'inquiry_submission_rate',
        description: '詢問提交率',
        target: 20, // 目標：每日 20 個詢問
        warningThreshold: 5, // 警告：低於 5 個/天
        criticalThreshold: 1, // 嚴重：低於 1 個/天
        unit: 'inquiries/day',
        type: 'higher_is_better',
        measurementInterval: 24 * 60 * 60 * 1000,
        retentionDays: 90,
      },
      {
        name: 'search_success_rate',
        description: '搜尋成功率',
        target: 95.0, // 目標：95% 以上
        warningThreshold: 85.0, // 警告：低於 85%
        criticalThreshold: 70.0, // 嚴重：低於 70%
        unit: '%',
        type: 'higher_is_better',
        measurementInterval: 60000,
        retentionDays: 30,
      },
    ],
  },
  {
    category: 'security_metrics',
    description: '安全指標',
    baselines: [
      {
        name: 'rate_limit_violation_rate',
        description: 'Rate Limiting 違規率',
        target: 0.1, // 目標：0.1% 以下
        warningThreshold: 1.0, // 警告：1% 以上
        criticalThreshold: 5.0, // 嚴重：5% 以上
        unit: '%',
        type: 'lower_is_better',
        measurementInterval: 60000,
        retentionDays: 30,
      },
      {
        name: 'blocked_ips_count',
        description: '被封鎖的 IP 數量',
        target: 0, // 目標：無封鎖 IP
        warningThreshold: 5, // 警告：5 個以上
        criticalThreshold: 20, // 嚴重：20 個以上
        unit: 'ips',
        type: 'lower_is_better',
        measurementInterval: 300000, // 5分鐘
        retentionDays: 30,
      },
      {
        name: 'failed_auth_attempts',
        description: '認證失敗嘗試次數',
        target: 0, // 目標：無失敗嘗試
        warningThreshold: 10, // 警告：10 次以上/小時
        criticalThreshold: 50, // 嚴重：50 次以上/小時
        unit: 'attempts/hour',
        type: 'lower_is_better',
        measurementInterval: 60 * 60 * 1000, // 1小時
        retentionDays: 30,
      },
    ],
  },
  {
    category: 'system_health',
    description: '系統健康指標',
    baselines: [
      {
        name: 'error_tracking_availability',
        description: '錯誤追蹤系統可用性',
        target: 99.9, // 目標：99.9% 可用性
        warningThreshold: 99.0, // 警告：低於 99%
        criticalThreshold: 95.0, // 嚴重：低於 95%
        unit: '%',
        type: 'higher_is_better',
        measurementInterval: 300000, // 5分鐘
        retentionDays: 30,
      },
      {
        name: 'cache_hit_rate',
        description: '快取命中率',
        target: 85.0, // 目標：85% 以上
        warningThreshold: 70.0, // 警告：低於 70%
        criticalThreshold: 50.0, // 嚴重：低於 50%
        unit: '%',
        type: 'higher_is_better',
        measurementInterval: 60000,
        retentionDays: 7,
      },
      {
        name: 'database_connection_errors',
        description: '資料庫連線錯誤次數',
        target: 0, // 目標：無連線錯誤
        warningThreshold: 5, // 警告：5 次以上/小時
        criticalThreshold: 20, // 嚴重：20 次以上/小時
        unit: 'errors/hour',
        type: 'lower_is_better',
        measurementInterval: 60 * 60 * 1000,
        retentionDays: 30,
      },
    ],
  },
]

/**
 * 警報嚴重性級別
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

/**
 * 檢查指標是否超過閾值
 */
export function checkKPIThreshold(
  baseline: KPIBaseline,
  currentValue: number
): AlertSeverity | null {
  if (baseline.type === 'lower_is_better') {
    if (currentValue >= baseline.criticalThreshold) {
      return AlertSeverity.CRITICAL
    } else if (currentValue >= baseline.warningThreshold) {
      return AlertSeverity.WARNING
    }
  } else {
    // higher_is_better
    if (currentValue <= baseline.criticalThreshold) {
      return AlertSeverity.CRITICAL
    } else if (currentValue <= baseline.warningThreshold) {
      return AlertSeverity.WARNING
    }
  }

  return null // 在正常範圍內
}

/**
 * 取得特定類別的 KPI 基線
 */
export function getKPIBaselines(category: string): KPIBaseline[] {
  const categoryConfig = PERFORMANCE_KPI_BASELINES.find(c => c.category === category)
  return categoryConfig?.baselines || []
}

/**
 * 取得所有 KPI 基線
 */
export function getAllKPIBaselines(): KPIBaseline[] {
  return PERFORMANCE_KPI_BASELINES.flatMap(category => category.baselines)
}

/**
 * 根據名稱查找 KPI 基線
 */
export function getKPIBaselineByName(name: string): KPIBaseline | undefined {
  return getAllKPIBaselines().find(baseline => baseline.name === name)
}
