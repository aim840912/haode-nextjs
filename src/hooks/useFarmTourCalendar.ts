'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchFarmTourCalendar,
  updateFarmTourVisitDate,
  type CalendarEvent,
  type CalendarStatistics,
} from '@/lib/api/farm-tour-api'
import { logger } from '@/lib/logger'
import type { InquiryStatus } from '@/types/inquiry'

export interface UseFarmTourCalendarOptions {
  defaultView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'
  enableDragAndDrop?: boolean
  statusFilter?: InquiryStatus[] | 'all'
}

export interface UseFarmTourCalendarReturn {
  // 資料狀態
  events: CalendarEvent[]
  statistics: CalendarStatistics | null
  loading: boolean
  error: string | null

  // 操作方法
  fetchEvents: (start: Date, end: Date) => Promise<void>
  updateEventTime: (eventId: string, newDate: Date) => Promise<boolean>
  refreshData: () => Promise<void>

  // 設定狀態
  statusFilter: InquiryStatus[] | 'all'
  setStatusFilter: (filter: InquiryStatus[] | 'all') => void
}

export function useFarmTourCalendar(
  options: UseFarmTourCalendarOptions = {}
): UseFarmTourCalendarReturn {
  const { enableDragAndDrop = true, statusFilter: initialStatusFilter = 'all' } = options

  const { user } = useAuth()

  // 狀態管理
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [statistics, setStatistics] = useState<CalendarStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<InquiryStatus[] | 'all'>(initialStatusFilter)

  // 當前查詢參數（用於重新整理）
  const [currentRange, setCurrentRange] = useState<{ start: Date; end: Date } | null>(null)

  // 取得事件資料
  const fetchEvents = useCallback(
    async (start: Date, end: Date) => {
      setLoading(true)
      setError(null)
      setCurrentRange({ start, end })

      try {
        const status =
          statusFilter !== 'all'
            ? Array.isArray(statusFilter)
              ? statusFilter.join(',')
              : statusFilter
            : undefined

        const data = await fetchFarmTourCalendar(start, end, status)
        setEvents(data.events)
        setStatistics(data.statistics)

        logger.debug('農場導覽行事曆資料載入成功')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '未知錯誤'
        setError(errorMessage)
        logger.error('載入農場導覽行事曆資料失敗')
        setEvents([])
        setStatistics(null)
      } finally {
        setLoading(false)
      }
    },
    [statusFilter]
  )

  // 更新事件時間（拖放功能）
  const updateEventTime = useCallback(
    async (eventId: string, newDate: Date): Promise<boolean> => {
      if (!enableDragAndDrop || !user || user.role !== 'admin') {
        logger.warn('無權限執行拖放操作')
        return false
      }

      try {
        const success = await updateFarmTourVisitDate(eventId, newDate)

        if (success) {
          // 更新本地事件資料
          setEvents(prevEvents =>
            prevEvents.map(event =>
              event.id === eventId ? { ...event, start: newDate.toISOString() } : event
            )
          )

          logger.info('預約時間更新成功')
        }

        return success
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '更新失敗'
        logger.error('更新預約時間失敗')
        setError(errorMessage)
        return false
      }
    },
    [enableDragAndDrop, user]
  )

  // 重新整理資料
  const refreshData = useCallback(async () => {
    if (currentRange) {
      await fetchEvents(currentRange.start, currentRange.end)
    }
  }, [currentRange, fetchEvents])

  // 當狀態過濾變更時，重新取得資料
  const handleStatusFilterChange = useCallback(
    (filter: InquiryStatus[] | 'all') => {
      setStatusFilter(filter)
      // 觸發重新載入資料
      if (currentRange) {
        fetchEvents(currentRange.start, currentRange.end)
      }
    },
    [currentRange, fetchEvents]
  )

  return {
    // 資料狀態
    events,
    statistics,
    loading,
    error,

    // 操作方法
    fetchEvents,
    updateEventTime,
    refreshData,

    // 設定狀態
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
  }
}
