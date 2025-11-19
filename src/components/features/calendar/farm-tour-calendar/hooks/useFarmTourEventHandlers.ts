/**
 * FarmTourCalendar 事件處理 Hook
 *
 * 集中管理行事曆的所有事件處理邏輯
 */

import { useCallback } from 'react'
import { logger } from '@/lib/logger'
import { formatDate } from '@/lib/utils/formatters'
import type { User } from '@/types/auth'
import { INQUIRY_STATUS_LABELS, type InquiryStatus } from '@/types/inquiry'
import type { DatesSetArg, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'

interface UseEventHandlersParams {
  /** 行事曆事件列表 */
  events: EventInput[]
  /** 使用者資訊 */
  user: User | null
  /** 更新事件時間函數 */
  updateEventTime: (eventId: string, newDate: Date) => Promise<boolean>
  /** 重新載入資料函數 */
  fetchEvents: (start: Date, end: Date) => void
  /** 設定狀態過濾函數 */
  setStatusFilter: (filter: 'all' | InquiryStatus[]) => void
  /** 重新整理資料函數 */
  refreshData: () => void
  /** 設定快速新增彈窗顯示狀態 */
  setShowQuickAddModal: (show: boolean) => void
  /** 設定選擇的日期 */
  setSelectedDateForQuickAdd: (date: Date | null) => void
  /** 自訂事件點擊處理 */
  onEventClick?: (eventId: string) => void
  /** 自訂日期點擊處理 */
  onDateClick?: (date: Date) => void
}

export function useFarmTourEventHandlers({
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
}: UseEventHandlersParams) {
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
        if (event?.extendedProps) {
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
    [onDateClick, user, setSelectedDateForQuickAdd, setShowQuickAddModal]
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
        if (event?.extendedProps) {
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

  return {
    handleEventClick,
    handleDateClick,
    handleEventDrop,
    handleDatesSet,
    handleStatusFilterChange,
    handleQuickAddSuccess,
  }
}
