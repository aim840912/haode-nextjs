/**
 * FarmTourCalendar 主元件
 *
 * 農場體驗預約行事曆元件（重構版）
 * - 整合所有子模組
 * - 主元件保持簡潔（< 80 行）
 * - 向後相容原始匯入路徑
 */

'use client'

export { type FarmTourCalendarProps } from './types'

import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import { useAuth } from '@/contexts/AuthContext'
import { useFarmTourCalendar } from '@/hooks/useFarmTourCalendar'
import { cn } from '@/lib/utils/cn'
import { QuickAddInquiryModal } from '../QuickAddInquiryModal'
import { CalendarStatisticsDisplay } from './CalendarStatistics'
import { CalendarToolbar } from './CalendarToolbar'
import { CalendarErrorState } from './components/CalendarErrorState'
import { CalendarLoadingState } from './components/CalendarLoadingState'
import { CalendarUsageGuide } from './components/CalendarUsageGuide'
import { useFarmTourEventHandlers } from './hooks/useFarmTourEventHandlers'
import { getCalendarConfig } from './utils/calendarConfig'
import type { FarmTourCalendarProps } from './types'

export function FarmTourCalendar({
  className = '',
  defaultView = 'dayGridMonth',
  height = 'auto',
  onEventClick,
  onDateClick,
}: FarmTourCalendarProps) {
  const { user } = useAuth()

  // 快速新增彈窗狀態
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [selectedDateForQuickAdd, setSelectedDateForQuickAdd] = useState<Date | null>(null)

  // 行事曆資料和狀態
  const {
    events,
    statistics,
    loading,
    error,
    fetchEvents,
    updateEventTime,
    refreshData,
    statusFilter,
    setStatusFilter,
    calendarRef,
  } = useFarmTourCalendar({
    defaultView,
    enableDragAndDrop: user?.role === 'admin',
  })

  // 事件處理器
  const {
    handleEventClick,
    handleDateClick,
    handleEventDrop,
    handleDatesSet,
    handleStatusFilterChange,
    handleQuickAddSuccess,
  } = useFarmTourEventHandlers({
    events,
    user,
    updateEventTime,
    fetchEvents,
    setStatusFilter,
    refreshData,
    setShowQuickAddModal,
    setSelectedDateForQuickAdd,
    onEventClick,
    onDateClick,
  })

  // FullCalendar 配置
  const calendarConfig = getCalendarConfig({
    defaultView,
    height,
    events,
    editable: user?.role === 'admin',
    eventClick: handleEventClick,
    dateClick: handleDateClick,
    eventDrop: handleEventDrop,
    datesSet: handleDatesSet,
  })

  return (
    <div className={cn('farm-tour-calendar', className)}>
      {/* 工具列 */}
      <CalendarToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        onRefresh={refreshData}
        onAddInquiry={
          user?.role === 'admin'
            ? () => {
                setSelectedDateForQuickAdd(null)
                setShowQuickAddModal(true)
              }
            : undefined
        }
        isAdmin={user?.role === 'admin'}
        loading={loading}
        statistics={statistics}
      />

      {/* 錯誤顯示 */}
      {error && <CalendarErrorState error={error} onRetry={refreshData} />}

      {/* 載入指示器 */}
      {loading && <CalendarLoadingState />}

      {/* 統計資訊 */}
      <CalendarStatisticsDisplay statistics={statistics} loading={loading} />

      {/* 行事曆 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <FullCalendar ref={calendarRef} {...calendarConfig} />
      </div>

      {/* 使用說明 */}
      <CalendarUsageGuide isAdmin={user?.role === 'admin'} />

      {/* 快速新增預約彈窗 */}
      <QuickAddInquiryModal
        isOpen={showQuickAddModal}
        onClose={() => {
          setShowQuickAddModal(false)
          setSelectedDateForQuickAdd(null)
        }}
        selectedDate={selectedDateForQuickAdd}
        onSuccess={handleQuickAddSuccess}
      />
    </div>
  )
}
