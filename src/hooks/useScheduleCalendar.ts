'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import { logger } from '@/lib/logger'

export interface ScheduleCalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  backgroundColor: string
  borderColor: string
  extendedProps: {
    location: string
    products: string[]
    specialOffer?: string
    weatherNote?: string
    contact: string
    status: 'upcoming' | 'ongoing' | 'completed'
    description: string
  }
}

export interface ScheduleCalendarStatistics {
  total: number
  byStatus: {
    upcoming: number
    ongoing: number
    completed: number
    [key: string]: number
  }
}

export interface UseScheduleCalendarReturn {
  // 資料狀態
  events: ScheduleCalendarEvent[]
  statistics: ScheduleCalendarStatistics | null
  loading: boolean
  error: string | null

  // 操作方法
  fetchEvents: () => Promise<void>
  refreshData: () => Promise<void>

  // 設定狀態
  statusFilter: 'all' | 'upcoming' | 'ongoing' | 'completed'
  setStatusFilter: (filter: 'all' | 'upcoming' | 'ongoing' | 'completed') => void

  // 行事曆參考
  calendarRef: React.RefObject<FullCalendar | null>
}

export function useScheduleCalendar(): UseScheduleCalendarReturn {
  const calendarRef = useRef<FullCalendar | null>(null)

  // 狀態管理
  const [events, setEvents] = useState<ScheduleCalendarEvent[]>([])
  const [allEvents, setAllEvents] = useState<ScheduleCalendarEvent[]>([])
  const [statistics, setStatistics] = useState<ScheduleCalendarStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>(
    'all'
  )

  // 更新過濾後的事件
  const updateFilteredEvents = useCallback(
    (eventsData: ScheduleCalendarEvent[], filter: string) => {
      let filteredEvents = eventsData

      if (filter !== 'all') {
        filteredEvents = eventsData.filter(event => event.extendedProps.status === filter)
      }

      setEvents(filteredEvents)

      logger.debug(
        `更新過濾後的事件: 過濾器=${filter}, 總數=${eventsData.length}, 過濾後=${filteredEvents.length}`
      )
    },
    []
  )

  // 計算統計資料
  const calculateStatistics = useCallback((eventsData: ScheduleCalendarEvent[]) => {
    const stats: ScheduleCalendarStatistics = {
      total: eventsData.length,
      byStatus: {
        upcoming: 0,
        ongoing: 0,
        completed: 0,
      },
    }

    eventsData.forEach(event => {
      const status = event.extendedProps.status
      if (status in stats.byStatus) {
        stats.byStatus[status]++
      }
    })

    setStatistics(stats)

    logger.debug(
      `計算統計資料: 總數=${stats.total}, 即將到來=${stats.byStatus.upcoming}, 進行中=${stats.byStatus.ongoing}, 已結束=${stats.byStatus.completed}`
    )
  }, [])

  // 從 API 獲取事件資料
  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      logger.debug('開始獲取擺攤行程行事曆資料')

      const response = await fetch('/api/schedule/calendar')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const apiResponse = await response.json()
      const eventsData = apiResponse.data || []

      logger.info(`成功獲取擺攤行程行事曆資料: ${eventsData.length} 個事件`)

      setAllEvents(eventsData)
      calculateStatistics(eventsData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '載入行事曆資料失敗'
      logger.error(`獲取擺攤行程行事曆資料失敗: ${errorMessage}`)
      setError(errorMessage)
      setEvents([])
      setStatistics(null)
      setAllEvents([])
    } finally {
      setLoading(false)
    }
  }, [calculateStatistics])

  // 刷新資料
  const refreshData = useCallback(async () => {
    logger.info('用戶手動刷新擺攤行程行事曆資料')
    await fetchEvents()
  }, [fetchEvents])

  // 設定狀態過濾器並更新事件
  const handleSetStatusFilter = useCallback(
    (filter: 'all' | 'upcoming' | 'ongoing' | 'completed') => {
      setStatusFilter(filter)

      logger.debug(`更新狀態過濾器: ${filter}`)
    },
    []
  )

  // 初始載入資料
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // 當狀態過濾器改變時更新事件
  useEffect(() => {
    if (allEvents.length > 0) {
      updateFilteredEvents(allEvents, statusFilter)
    }
  }, [allEvents, statusFilter, updateFilteredEvents])

  return {
    // 資料狀態
    events,
    statistics,
    loading,
    error,

    // 操作方法
    fetchEvents,
    refreshData,

    // 設定狀態
    statusFilter,
    setStatusFilter: handleSetStatusFilter,

    // 行事曆參考
    calendarRef,
  }
}
