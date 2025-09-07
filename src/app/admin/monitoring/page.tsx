'use client'

import dynamic from 'next/dynamic'
import AdminProtection from '@/components/AdminProtection'

// 動態導入監控儀表板組件以減少初始 Bundle 大小
const MonitoringDashboard = dynamic(
  () => import('@/components/admin/MonitoringDashboard'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入監控儀表板中...</p>
        </div>
      </div>
    ),
    ssr: false
  }
)

export default function AdminMonitoringPage() {
  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* 頁面標題 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">系統監控</h1>
            <p className="mt-2 text-gray-600">監控系統運行狀態、效能指標和錯誤統計</p>
          </div>

          {/* 動態載入的監控儀表板 */}
          <MonitoringDashboard />
        </div>
      </div>
    </AdminProtection>
  )
}