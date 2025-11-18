import React from 'react'
import { BarChart3, ShieldCheck, Cpu, FlaskConical } from 'lucide-react'

/**
 * 系統狀態區塊元件
 *
 * 顯示各系統服務的運行狀態：Vercel Analytics、安全監控、系統效能、測試環境
 */
export const SystemStatusSection = React.memo(() => {
  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">系統狀態</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Vercel Analytics */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-blue-900">Vercel Analytics</p>
            <p className="text-blue-600 text-sm">網站流量分析</p>
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 mt-2">
              已啟用
            </span>
          </div>

          {/* 安全監控 */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <ShieldCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-green-900">安全監控</p>
            <p className="text-green-600 text-sm">系統安全狀態</p>
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 mt-2">
              正常運行
            </span>
          </div>

          {/* 系統效能 */}
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Cpu className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-purple-900">系統效能</p>
            <p className="text-purple-600 text-sm">伺服器運行狀態</p>
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 mt-2">
              良好
            </span>
          </div>

          {/* 測試環境 */}
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <FlaskConical className="h-8 w-8 text-amber-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-amber-900">測試環境</p>
            <p className="text-amber-600 text-sm">開發測試狀態</p>
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
              待完成
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})

SystemStatusSection.displayName = 'SystemStatusSection'
