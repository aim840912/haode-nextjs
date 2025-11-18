'use client'

import { useCallback, useState } from 'react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useAuth } from '@/contexts/AuthContext'
import { useFarmTourCalendar } from '@/hooks/useFarmTourCalendar'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/formatters'
import { INQUIRY_STATUS_LABELS, type InquiryStatus } from '@/types/inquiry'
import { CalendarStatisticsDisplay } from './farm-tour-calendar/CalendarStatistics'
import { CalendarToolbar } from './farm-tour-calendar/CalendarToolbar'
import { QuickAddInquiryModal } from './QuickAddInquiryModal'

import type { DatesSetArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'

interface FarmTourCalendarProps {
  className?: string
  defaultView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'
  height?: string | number
  onEventClick?: (eventId: string) => void
  onDateClick?: (date: Date) => void
}

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

  // 處理事件點擊
  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const eventId = clickInfo.event.id
      logger.debug('行事曆事件被點擊')

      if (onEventClick) {
        onEventClick(eventId)
      } else {
        // 預設行為：顯示事件詳情（這裡可以開啟彈窗等）
        const event = events.find(e => e.id === eventId)
        if (event) {
          const statusLabel =
            INQUIRY_STATUS_LABELS[event.extendedProps.status as InquiryStatus] ||
            event.extendedProps.status
          alert(
            `預約詳情：\n客戶：${event.extendedProps.customer_name}\n活動：${event.extendedProps.activity_title}\n人數：${event.extendedProps.visitor_count}人\n狀態：${statusLabel}`
          )
        }
      }
    },
    [events, onEventClick]
  )

  // 處理日期點擊
  const handleDateClick = useCallback(
    (dateClickInfo: DateClickArg) => {
      const clickedDate = dateClickInfo.date
      logger.debug('行事曆日期被點擊', {
        module: 'FarmTourCalendar',
        action: 'dateClick',
        metadata: { date: clickedDate.toISOString() },
      })

      if (onDateClick) {
        onDateClick(clickedDate)
      } else {
        // 預設行為：開啟快速新增預約彈窗
        if (user?.role === 'admin') {
          setSelectedDateForQuickAdd(clickedDate)
          setShowQuickAddModal(true)
        }
      }
    },
    [onDateClick, user]
  )

  // 處理事件拖放
  const handleEventDrop = useCallback(
    async (dropInfo: EventDropArg) => {
      if (user?.role !== 'admin') {
        dropInfo.revert() // 恢復原位置
        alert('只有管理員可以調整預約時間')
        return
      }

      const eventId = dropInfo.event.id
      const newDate = dropInfo.event.start

      if (!newDate) {
        dropInfo.revert()
        alert('無法獲取新的日期時間')
        return
      }

      logger.debug('事件被拖放')

      // 確認操作
      const confirmed = confirm(`確定要將此預約調整到 ${formatDate(newDate, 'short')} 嗎？`)

      if (!confirmed) {
        dropInfo.revert() // 恢復原位置
        return
      }

      // 更新事件時間
      const success = await updateEventTime(eventId, newDate)

      if (!success) {
        dropInfo.revert() // 失敗時恢復原位置
        alert('更新預約時間失敗，請稍後再試')
      } else {
        // 成功提示
        const event = events.find(e => e.id === eventId)
        if (event) {
          alert(
            `「${event.extendedProps.customer_name}」的預約時間已更新至 ${formatDate(newDate, 'short')}`
          )
        }
      }
    },
    [user, updateEventTime, events]
  )

  // 處理視圖變更和資料載入
  const handleDatesSet = useCallback(
    (dateInfo: DatesSetArg) => {
      fetchEvents(dateInfo.start, dateInfo.end)
    },
    [fetchEvents]
  )

  // 處理狀態過濾變更
  const handleStatusFilterChange = useCallback(
    (newFilter: string) => {
      if (newFilter === 'all') {
        setStatusFilter('all')
      } else {
        setStatusFilter([newFilter as InquiryStatus])
      }
    },
    [setStatusFilter]
  )

  // 處理快速新增成功
  const handleQuickAddSuccess = useCallback(
    (inquiryId: string) => {
      logger.info('快速新增預約成功', {
        module: 'FarmTourCalendar',
        action: 'quickAddSuccess',
        metadata: { inquiryId },
      })

      // 重新載入行事曆資料
      refreshData()

      // 顯示成功訊息
      alert('預約建立成功！系統將在處理後顯示在行事曆中。')
    },
    [refreshData]
  )

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
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <strong>載入失敗：</strong>
          {error}
          <button onClick={refreshData} className="ml-2 text-red-600 hover:text-red-800 underline">
            重試
          </button>
        </div>
      )}

      {/* 載入指示器 */}
      {loading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-center">
          載入行事曆資料中...
        </div>
      )}

      {/* 統計資訊 */}
      <CalendarStatisticsDisplay statistics={statistics} loading={loading} />

      {/* 行事曆 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={defaultView}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          buttonText={{
            today: '今天',
            month: '月',
            week: '週',
            day: '日',
            list: '列表',
          }}
          locale="zh-tw"
          height={height}
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          editable={user?.role === 'admin'}
          eventDrop={handleEventDrop}
          datesSet={handleDatesSet}
          dayMaxEvents={3}
          moreLinkText="更多"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          allDaySlot={false}
          nowIndicator={true}
          weekends={true}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5, 6], // 週一到週六
            startTime: '08:00',
            endTime: '18:00',
          }}
          slotMinTime="08:00:00"
          slotMaxTime="18:00:00"
          expandRows={true}
          eventDisplay="block"
          dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric' }}
        />
      </div>

      {/* 說明文字 */}
      <div className="mt-4 text-sm text-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>使用說明：</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>點擊預約查看詳細資訊</li>
              <li>點擊日期可快速新增預約</li>
              <li>使用上方按鈕過濾不同狀態</li>
            </ul>
          </div>

          {user?.role === 'admin' && (
            <div>
              <strong>管理員功能：</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>拖放預約可調整時間</li>
                <li>所有操作都會記錄日誌</li>
                <li>變更會即時同步到系統</li>
              </ul>
            </div>
          )}
        </div>
      </div>

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
