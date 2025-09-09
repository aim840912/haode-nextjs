'use client'

// import { useState } from 'react';
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import AdminProtection from '@/components/AdminProtection'
import { logger } from '@/lib/logger'

// 動態導入 FarmTourCalendar 以減少初始 Bundle 大小
const FarmTourCalendar = dynamic(() => import('@/components/calendar/FarmTourCalendar'), {
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">載入行事曆中...</p>
      </div>
    </div>
  ),
  ssr: false,
})

export default function FarmTourCalendarPage() {
  const router = useRouter()

  // 處理事件點擊 - 跳轉到詢問單詳情
  const handleEventClick = (eventId: string) => {
    router.push(`/admin/inquiries?highlight=${eventId}`)
  }

  // 處理日期點擊 - 傳遞給 FarmTourCalendar 組件處理快速新增
  const handleDateClick = (date: Date) => {
    logger.debug('選擇日期', {
      module: 'FarmTourCalendarPage',
      action: 'handleDateClick',
      metadata: { date: date.toISOString() },
    })
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* 頁面標題 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">農場導覽預約行事曆</h1>
              <p className="text-gray-600">
                視覺化管理所有農場導覽預約，支援拖放調整時間和快速新增預約
              </p>
            </div>

            {/* 導航按鈕 */}
            <div className="flex gap-3">
              <Link
                href="/admin/inquiries"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                詢問單列表
              </Link>

              <Link
                href="/admin/farm-tour"
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
              >
                活動管理
              </Link>

              <Link
                href="/admin/dashboard"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                回到儀表板
              </Link>
            </div>
          </div>

          {/* 功能說明卡片 */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">多視圖切換</h3>
                  <p className="text-sm text-gray-600">月、週、日、列表視圖</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">狀態標記</h3>
                  <p className="text-sm text-gray-600">顏色區分不同狀態</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">拖放操作</h3>
                  <p className="text-sm text-gray-600">直接調整預約時間</p>
                </div>
              </div>
            </div>
          </div>

          {/* 行事曆組件 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <FarmTourCalendar
              defaultView="dayGridMonth"
              height={700}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
              className="farm-tour-calendar-admin"
            />
          </div>

          {/* 使用提示 */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">使用提示</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <ul className="space-y-1">
                    <li>• 點擊預約事件可查看詳細資訊並跳轉到詢問單</li>
                    <li>• 拖放預約事件可直接調整參觀日期</li>
                    <li>• 使用狀態過濾器查看特定狀態的預約</li>
                  </ul>
                  <ul className="space-y-1">
                    <li>• 點擊空白日期可快速新增預約</li>
                    <li>• 統計資訊會即時更新顯示當前資料</li>
                    <li>• 所有變更都會自動記錄到系統日誌</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminProtection>
  )
}
