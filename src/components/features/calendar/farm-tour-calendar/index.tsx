/**
 * FarmTourCalendar 主元件
 *
 * 農場體驗預約行事曆元件（簡化版 - 使用 react-calendar）
 * - 移除 FullCalendar 依賴
 * - 只保留月視圖
 * - 移除拖放功能（可在詳情頁修改日期）
 */

'use client'

export { type FarmTourCalendarProps } from './types'

import { useState, useCallback, useEffect } from 'react'
import { SimpleCalendar, type CalendarEvent } from '@/components/ui/calendar'
import type { InquiryStatus } from '@/types/inquiry'
import { useAuth } from '@/contexts/AuthContext'
import { useFarmTourCalendar } from '@/hooks/useFarmTourCalendar'
import { cn } from '@/lib/utils/cn'
import { QuickAddInquiryModal } from '../QuickAddInquiryModal'
import { CalendarStatisticsDisplay } from './CalendarStatistics'
import { CalendarToolbar } from './CalendarToolbar'
import { CalendarErrorState } from './components/CalendarErrorState'
import { CalendarLoadingState } from './components/CalendarLoadingState'
import { CalendarUsageGuide } from './components/CalendarUsageGuide'
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
    refreshData,
    statusFilter,
    setStatusFilter,
  } = useFarmTourCalendar({
    defaultView,
    enableDragAndDrop: false, // 簡化版不支持拖放
  })

  // 初始載入
  useEffect(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    fetchEvents(startOfMonth, endOfMonth)
  }, [fetchEvents])

  // 轉換事件格式
  const calendarEvents: CalendarEvent[] = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor: event.backgroundColor,
    textColor: event.textColor,
    extendedProps: event.extendedProps,
  }))

  // 事件點擊處理
  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      if (onEventClick) {
        onEventClick(event.id)
      }
    },
    [onEventClick]
  )

  // 日期點擊處理
  const handleDateClick = useCallback(
    (date: Date) => {
      if (onDateClick) {
        onDateClick(date)
      }

      // 管理員可以快速新增
      if (user?.role === 'admin') {
        setSelectedDateForQuickAdd(date)
        setShowQuickAddModal(true)
      }
    },
    [onDateClick, user?.role]
  )

  // 月份變更處理
  const handleMonthChange = useCallback(
    (startDate: Date, endDate: Date) => {
      fetchEvents(startDate, endDate)
    },
    [fetchEvents]
  )

  // 狀態篩選變更
  const handleStatusFilterChange = useCallback(
    (newFilter: string) => {
      if (newFilter === 'all') {
        setStatusFilter('all')
      } else {
        setStatusFilter([newFilter] as InquiryStatus[])
      }
    },
    [setStatusFilter]
  )

  // 快速新增成功
  const handleQuickAddSuccess = useCallback(() => {
    setShowQuickAddModal(false)
    setSelectedDateForQuickAdd(null)
    refreshData()
  }, [refreshData])

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
      <SimpleCalendar
        events={calendarEvents}
        height={height}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
        onMonthChange={handleMonthChange}
      />

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
