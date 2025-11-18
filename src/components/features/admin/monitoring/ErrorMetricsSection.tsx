import React from 'react'
import { Bug, AlertCircle, ShieldAlert, XCircleIcon } from 'lucide-react'
import { ErrorStats } from './types'

interface ErrorMetricsSectionProps {
  /** 錯誤統計數據 */
  errorStats: ErrorStats
}

/**
 * 錯誤監控區塊元件
 *
 * 顯示錯誤統計指標：總錯誤數、錯誤率、嚴重錯誤
 * 注意：已修正設計規範違規，移除 bg-gradient，改用純色背景
 */
export const ErrorMetricsSection = React.memo<ErrorMetricsSectionProps>(({ errorStats }) => {
  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Bug className="h-5 w-5 text-red-500 mr-2" />
          錯誤監控
        </h2>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 總錯誤數 - 修正：移除 bg-gradient-to-r */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-red-600 font-medium">總錯誤數</p>
                <p className="text-2xl font-bold text-red-700">{errorStats.totalErrors}</p>
              </div>
            </div>
          </div>

          {/* 錯誤率 - 修正：移除 bg-gradient-to-r */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-600 font-medium">錯誤率</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {errorStats.errorRate.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* 嚴重錯誤 - 修正：移除 bg-gradient-to-r */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <div className="flex items-center gap-3">
              <XCircleIcon className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600 font-medium">嚴重錯誤</p>
                <p className="text-2xl font-bold text-orange-700">{errorStats.criticalErrors}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

ErrorMetricsSection.displayName = 'ErrorMetricsSection'
