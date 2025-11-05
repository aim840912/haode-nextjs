'use client'

import { useAuth } from '@/contexts/AuthContext'
import Breadcrumbs, { createScheduleBreadcrumbs } from '@/components/ui/navigation/Breadcrumbs'
import { useSchedule } from '@/hooks/useSchedule'
import { formatDate } from '@/lib/utils/formatters'

export default function SchedulePage() {
  const { user } = useAuth()

  // ✅ 使用 Custom Hook 管理行程資料
  const { filteredSchedule, loading, error, filterByStatus } = useSchedule()

  const getStatusColor = (status: 'upcoming' | 'ongoing' | 'completed') => {
    switch (status) {
      case 'upcoming':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'ongoing':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'completed':
        return 'bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400'
      default:
        return 'bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusText = (status: 'upcoming' | 'ongoing' | 'completed') => {
    switch (status) {
      case 'upcoming':
        return '即將到來'
      case 'ongoing':
        return '進行中'
      case 'completed':
        return '已結束'
      default:
        return '未知'
    }
  }

  const formatScheduleDate = (dateString: string) => {
    return formatDate(dateString, 'full')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Breadcrumbs items={createScheduleBreadcrumbs()} enableStructuredData={true} />
        </div>
      </div>

      {/* Header - 統一簡潔設計 */}
      <div className="bg-white dark:bg-slate-800 py-4 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h1 className="text-xl sm:text-2xl font-light text-amber-900 dark:text-amber-300 mb-1">
                擺攤行程
              </h1>
            </div>
            <div className="flex space-x-3">
              {/* 行事曆檢視按鈕 - 所有用戶都可見 */}
              <a
                href="/schedule/calendar"
                className="px-4 py-2 bg-amber-900 hover:bg-amber-800 text-white rounded-full text-sm transition-colors flex items-center space-x-2"
              >
                <span>行事曆檢視</span>
              </a>

              {/* 管理員專用按鈕 */}
              {user && user.role === 'admin' && (
                <>
                  <a
                    href="/admin/schedule"
                    className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 transition-colors flex items-center space-x-2"
                  >
                    <span>行程管理</span>
                  </a>
                  <a
                    href="/admin/schedule/add"
                    className="px-4 py-2 bg-green-600 text-white rounded-full text-sm hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <span>新增行程</span>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div>
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={() => filterByStatus('all')}
              className="px-4 py-2 bg-amber-500 text-white border border-amber-500 rounded-lg hover:bg-amber-600 transition-colors font-medium"
            >
              全部行程
            </button>
            <button
              onClick={() => filterByStatus('upcoming')}
              className="px-4 py-2 bg-green-500 border border-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              即將到來
            </button>
            <button
              onClick={() => filterByStatus('completed')}
              className="px-4 py-2 bg-gray-500 border border-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              已結束
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 dark:border-amber-400"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">載入行程資料中...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
              >
                重新載入
              </button>
            </div>
          )}

          {/* Market Schedule Cards */}
          {!loading && !error && (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredSchedule.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-gray-500 dark:text-gray-400">
                  目前沒有符合條件的行程
                </div>
              ) : (
                filteredSchedule.map(schedule => (
                  <div
                    key={schedule.id}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                        {schedule.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(schedule.status as 'upcoming' | 'ongoing' | 'completed')}`}
                      >
                        {getStatusText(schedule.status as 'upcoming' | 'ongoing' | 'completed')}
                      </span>
                    </div>

                    {/* Date and Time */}
                    <div className="flex items-center mb-3 text-amber-700 dark:text-amber-300">
                      <span className="font-medium">{formatScheduleDate(schedule.date)}</span>
                    </div>
                    <div className="flex items-center mb-3 text-gray-600 dark:text-gray-300">
                      <span>{schedule.time}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-start mb-4 text-gray-600 dark:text-gray-300">
                      <div>
                        <div className="font-medium">{schedule.location}</div>
                        <div className="text-sm mt-1">{schedule.description}</div>
                      </div>
                    </div>

                    {/* Products */}
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        販售商品：
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {schedule.products.map((product, index) => (
                          <span
                            key={index}
                            className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full text-sm"
                          >
                            {product}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Special Offer */}
                    {schedule.specialOffer && (
                      <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-400 dark:border-orange-500 rounded-r-lg">
                        <div className="text-sm font-medium text-orange-700 dark:text-orange-300">
                          特別優惠
                        </div>
                        <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                          {schedule.specialOffer}
                        </div>
                      </div>
                    )}

                    {/* Weather Note */}
                    {schedule.weatherNote && schedule.status === 'upcoming' && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-500 rounded-r-lg">
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          天氣提醒
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          {schedule.weatherNote}
                        </div>
                      </div>
                    )}

                    {/* Contact */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <span className="text-sm">{schedule.contact}</span>
                      </div>
                      {schedule.status === 'upcoming' && (
                        <button className="bg-amber-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-800 dark:hover:bg-amber-700 transition-colors">
                          設定提醒
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
