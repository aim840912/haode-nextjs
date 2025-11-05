import { ChartBarIcon, EyeIcon, ChatBubbleLeftIcon, BoltIcon } from '@heroicons/react/24/outline'
import { formatDate } from '@/lib/utils/formatters'
import {
  InquiryStatus,
  InquiryType,
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUS_COLORS,
  INQUIRY_TYPE_LABELS,
  INQUIRY_TYPE_COLORS,
} from '@/types/inquiry'

interface InquiryStats {
  total: number
  unread: number
  unreplied: number
}

interface DetailedStats {
  summary: {
    total_inquiries: number
    unread_count: number
    unreplied_count: number
    read_rate: number
    reply_rate: number
    completion_rate: number
    cancellation_rate: number
    avg_response_time_hours: number
  }
  status_breakdown?: Record<
    InquiryStatus,
    {
      count: number
      total_amount: number
      percentage: number
    }
  >
  type_breakdown?: Record<
    InquiryType,
    {
      count: number
      total_amount: number
      percentage: number
    }
  >
  daily_trends: Array<{
    date: string
    total_inquiries: number
    replied_inquiries: number
    reply_rate: number
    total_amount?: number
  }>
  timeframe_days: number
}

interface InquiryStatsProps {
  stats: InquiryStats
  detailedStats: DetailedStats | null
}

export default function InquiryStatsComponent({ stats, detailedStats }: InquiryStatsProps) {
  return (
    <>
      {/* 統計儀表板 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        {/* 總詢問單 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                總詢問單
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.total}
              </p>
              {detailedStats?.summary?.completion_rate && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  完成率 {detailedStats.summary.completion_rate}%
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 未讀詢問 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                未讀詢問
              </p>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.unread}
                </p>
                {stats.unread > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                    需關注
                  </span>
                )}
              </div>
              {detailedStats?.summary?.read_rate && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  已讀率 {detailedStats.summary.read_rate}%
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 未回覆詢問 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <ChatBubbleLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                未回覆詢問
              </p>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.unreplied}
                </p>
                {stats.unreplied > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                    待處理
                  </span>
                )}
              </div>
              {detailedStats?.summary?.reply_rate && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  回覆率 {detailedStats.summary.reply_rate}%
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 平均回覆時間 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <BoltIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                平均回覆時間
              </p>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {detailedStats?.summary?.avg_response_time_hours
                    ? `${detailedStats.summary.avg_response_time_hours}h`
                    : '--'}
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">最近 30 天</p>
            </div>
          </div>
        </div>
      </div>

      {/* 狀態分析和類型分析 */}
      {detailedStats?.status_breakdown && detailedStats?.type_breakdown && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* 狀態分組統計 */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              狀態分析
            </h3>
            <div className="space-y-3">
              {Object.entries(detailedStats.status_breakdown).map(([status, data]) => {
                const statusData = data as {
                  count: number
                  total_amount: number
                  percentage: number
                }
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          INQUIRY_STATUS_COLORS[status as InquiryStatus]
                        }`}
                      >
                        {INQUIRY_STATUS_LABELS[status as InquiryStatus]}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {statusData.count} 筆 ({statusData.percentage}%)
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      NT$ {statusData.total_amount.toLocaleString()}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 類型分組統計 */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              類型分析
            </h3>
            <div className="space-y-3">
              {Object.entries(detailedStats.type_breakdown).map(([type, data]) => {
                const typeData = data as {
                  count: number
                  total_amount: number
                  percentage: number
                }
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          INQUIRY_TYPE_COLORS[type as InquiryType]
                        }`}
                      >
                        {INQUIRY_TYPE_LABELS[type as InquiryType]}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {typeData.count} 筆 ({typeData.percentage}%)
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      NT$ {typeData.total_amount.toLocaleString()}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 每日趨勢圖表 */}
      {detailedStats?.daily_trends && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            詢價趨勢分析 (最近 {detailedStats.timeframe_days} 天)
          </h3>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {detailedStats.daily_trends.slice(-7).map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {formatDate(day.date, 'short').replace(/\//g, '/').split('/').slice(1).join('/')}
                </div>
                <div className="bg-gray-100 dark:bg-slate-700 rounded p-3">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {day.total_inquiries}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">新詢問</div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {day.total_inquiries > 0
                      ? Math.round((day.replied_inquiries / day.total_inquiries) * 100)
                      : 0}
                    % 回覆率
                  </div>
                  {day.total_amount && day.total_amount > 0 && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      NT$ {day.total_amount.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 趨勢總覽 */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-slate-600">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {detailedStats.daily_trends.reduce((sum, day) => sum + day.total_inquiries, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">總詢問數</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {detailedStats.daily_trends.reduce((sum, day) => sum + day.replied_inquiries, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">已回覆數</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {detailedStats.daily_trends.reduce((sum, day) => sum + (day.total_amount || 0), 0) >
                0
                  ? `NT$ ${detailedStats.daily_trends.reduce((sum, day) => sum + (day.total_amount || 0), 0).toLocaleString()}`
                  : '--'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">總金額</div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
