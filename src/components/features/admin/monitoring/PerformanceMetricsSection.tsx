import React from 'react'
import { Zap, Clock, RotateCw, BarChart3 } from 'lucide-react'
import { PerformanceStats } from './types'

interface PerformanceMetricsSectionProps {
  /** 效能統計數據 */
  performanceStats: PerformanceStats
}

/**
 * 效能監控區塊元件
 *
 * 顯示效能統計指標：平均回應時間、總請求數、限制率
 * 注意：已修正設計規範違規，移除 bg-gradient，改用純色背景
 */
export const PerformanceMetricsSection = React.memo<PerformanceMetricsSectionProps>(
  ({ performanceStats }) => {
    return (
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Zap className="h-5 w-5 text-blue-500 mr-2" />
            效能監控
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 平均回應時間 - 修正：移除 bg-gradient-to-r */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">平均回應時間</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {performanceStats.avgResponseTime.toFixed(0)}ms
                  </p>
                </div>
              </div>
            </div>

            {/* 總請求數 - 修正：移除 bg-gradient-to-r */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-center gap-3">
                <RotateCw className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-600 font-medium">總請求數</p>
                  <p className="text-2xl font-bold text-green-700">
                    {performanceStats.totalRequests}
                  </p>
                </div>
              </div>
            </div>

            {/* 限制率 - 修正：移除 bg-gradient-to-r */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600 font-medium">限制率</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {performanceStats.limitRate.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

PerformanceMetricsSection.displayName = 'PerformanceMetricsSection'
