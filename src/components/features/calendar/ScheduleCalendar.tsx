'use client'

import { useCallback, useState } from 'react'
import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/react'
import {
  MapPin,
  Calendar,
  Clock,
  ShoppingBag,
  DollarSign,
  CloudRain,
  FileText,
  Phone,
} from 'lucide-react'
import {
  useScheduleCalendar,
  type ScheduleCalendarEvent,
  type ScheduleStatus,
} from '@/hooks/useScheduleCalendar'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/formatters'

// 狀態過濾選項 - 客戶版本（移除「進行中」）
const statusOptions = [
  { value: 'all' as const, label: '全部狀態', color: '#6B7280' },
  { value: 'upcoming' as const, label: '即將到來', color: '#10b981' },
  { value: 'completed' as const, label: '已結束', color: '#6b7280' },
]

interface ScheduleCalendarProps {
  className?: string
  height?: string | number

  // 外部狀態控制（受控模式）
  statusFilter?: ScheduleStatus
  onStatusFilterChange?: (filter: ScheduleStatus) => void

  // 控制是否顯示內部篩選按鈕
  hideStatusFilter?: boolean
}

export function ScheduleCalendar({
  className = '',
  height = 'auto',
  statusFilter: externalStatusFilter,
  onStatusFilterChange: externalOnChange,
  hideStatusFilter = false,
}: ScheduleCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<ScheduleCalendarEvent | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)

  // 使用外部狀態或內部狀態
  const initialFilter = externalStatusFilter || 'all'
  const {
    events,
    statistics,
    loading,
    error,
    refreshData,
    statusFilter: internalStatusFilter,
    setStatusFilter: internalSetStatusFilter,
  } = useScheduleCalendar(initialFilter)

  // 決定使用外部還是內部狀態
  const currentStatusFilter = externalStatusFilter ?? internalStatusFilter

  // 處理狀態變更（受控或非受控模式）
  const handleStatusFilterChange = useCallback(
    (newFilter: ScheduleStatus) => {
      if (externalOnChange) {
        externalOnChange(newFilter)
      } else {
        internalSetStatusFilter(newFilter)
      }
    },
    [externalOnChange, internalSetStatusFilter]
  )

  // 處理事件點擊 - 顯示詳細資訊
  const handleEventClick = useCallback(
    (clickInfo: { event: { id: string } }) => {
      const eventId = clickInfo.event.id
      const event = events.find(e => e.id === eventId)

      logger.debug(`擺攤行程事件被點擊: ${eventId}`)

      if (event) {
        setSelectedEvent(event)
        setShowEventModal(true)
      }
    },
    [events]
  )

  // 關閉事件詳情彈窗
  const closeEventModal = useCallback(() => {
    setShowEventModal(false)
    setSelectedEvent(null)
  }, [])

  // 格式化日期時間
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr)
    return {
      date: formatDate(date, 'short'),
      time: date.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    }
  }

  return (
    <div className={cn('schedule-calendar', className)}>
      {/* 工具列 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* 狀態過濾器 - 條件渲染 */}
        {!hideStatusFilter && (
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleStatusFilterChange(option.value)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg border transition-all duration-200',
                  currentStatusFilter === option.value
                    ? 'border-transparent text-white shadow-md'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                )}
                style={{
                  backgroundColor:
                    currentStatusFilter === option.value ? option.color : 'transparent',
                }}
              >
                {option.label}
                {statistics && (
                  <span className="ml-1 text-xs">
                    {option.value === 'all'
                      ? `(${statistics.total})`
                      : `(${statistics.byStatus[option.value] || 0})`}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 錯誤顯示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300">
          <strong>載入失敗：</strong>
          {error}
          <button
            onClick={refreshData}
            className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
          >
            重試
          </button>
        </div>
      )}

      {/* 載入指示器 */}
      {loading && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-300 text-center">
          載入擺攤行程中...
        </div>
      )}

      {/* 行事曆 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
          buttonText={{
            today: '今天',
          }}
          locale="zh-tw"
          height={height}
          events={events}
          eventClick={handleEventClick}
          dayMaxEvents={3}
          moreLinkText="更多"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          nowIndicator={true}
          weekends={true}
          eventDisplay="block"
          dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric' }}
          // 移除互動功能 - 客戶只能檢視
          editable={false}
          selectable={false}
        />
      </div>

      {/* 說明文字 */}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong className="text-gray-700 dark:text-gray-200">使用說明：</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>點擊擺攤行程查看詳細資訊</li>
              <li>使用上方按鈕過濾不同狀態</li>
            </ul>
          </div>

          <div>
            <strong className="text-gray-700 dark:text-gray-200">圖例說明：</strong>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span>即將到來的擺攤行程</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span>進行中的擺攤行程</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-500"></div>
                <span>已結束的擺攤行程</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 事件詳情彈窗 */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">擺攤行程詳情</h3>
                <button
                  onClick={closeEventModal}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 text-gray-900 dark:text-gray-100">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <strong>{selectedEvent.extendedProps.location}</strong>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <strong>{formatDateTime(selectedEvent.start).date}</strong>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <strong>{formatDateTime(selectedEvent.start).time}</strong>
                </div>

                {selectedEvent.extendedProps.products &&
                  selectedEvent.extendedProps.products.length > 0 && (
                    <div className="flex items-start gap-3">
                      <ShoppingBag className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>供應商品：</strong>
                        <div className="mt-1">
                          {selectedEvent.extendedProps.products.join('、')}
                        </div>
                      </div>
                    </div>
                  )}

                {selectedEvent.extendedProps.specialOffer && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>特別優惠：</strong>
                      <div className="mt-1 text-red-600 dark:text-red-400">
                        {selectedEvent.extendedProps.specialOffer}
                      </div>
                    </div>
                  </div>
                )}

                {selectedEvent.extendedProps.weatherNote && (
                  <div className="flex items-start gap-3">
                    <CloudRain className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>天氣備註：</strong>
                      <div className="mt-1">{selectedEvent.extendedProps.weatherNote}</div>
                    </div>
                  </div>
                )}

                {selectedEvent.extendedProps.description && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>詳細說明：</strong>
                      <div className="mt-1">{selectedEvent.extendedProps.description}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>聯絡資訊：</strong>
                    <div className="mt-1">{selectedEvent.extendedProps.contact}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeEventModal}
                  className="px-4 py-2 bg-slate-600 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
