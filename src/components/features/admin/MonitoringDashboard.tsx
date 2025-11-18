'use client'

import { Eye, Search, Phone, Users } from 'lucide-react'
import { ErrorMetricsSection } from './monitoring/ErrorMetricsSection'
import { ErrorState } from './monitoring/ErrorState'
import { LoadingState } from './monitoring/LoadingState'
import { MetricCard } from './monitoring/MetricCard'
import { PerformanceMetricsSection } from './monitoring/PerformanceMetricsSection'
import { SystemStatusSection } from './monitoring/SystemStatusSection'
import { useMockMetrics } from './monitoring/useMockMetrics'

/**
 * 監控儀表板主元件
 *
 * 顯示業務指標、錯誤監控、效能監控和系統狀態
 *
 * **重構說明**:
 * - 原始 412 行縮減為 ~60 行主元件
 * - 拆分為 8 個獨立子元件/hook
 * - 修正設計規範違規（移除所有 bg-gradient）
 * - 邏輯與 UI 分離（useMockMetrics hook）
 */
export function MonitoringDashboard() {
  const { metrics, errorStats, performanceStats, isLoading, error } = useMockMetrics()

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  return (
    <div className="space-y-6">
      {/* 業務指標概覽 - 使用統一的 MetricCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="頁面瀏覽"
          value={metrics.userActions.pageViews}
          icon={Eye}
          iconColor="blue"
        />
        <MetricCard
          label="產品查看"
          value={metrics.userActions.productViews}
          icon={Search}
          iconColor="green"
        />
        <MetricCard
          label="詢價提交"
          value={metrics.userActions.inquirySubmissions}
          icon={Phone}
          iconColor="amber"
        />
        <MetricCard
          label="活躍用戶"
          value={metrics.performance.activeUsers}
          icon={Users}
          iconColor="purple"
        />
      </div>

      {/* 錯誤監控 */}
      {errorStats && <ErrorMetricsSection errorStats={errorStats} />}

      {/* 效能監控 */}
      {performanceStats && <PerformanceMetricsSection performanceStats={performanceStats} />}

      {/* 系統狀態 */}
      <SystemStatusSection />
    </div>
  )
}
