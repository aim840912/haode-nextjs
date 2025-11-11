import { useState, useEffect, useCallback } from 'react'
import { fetchSchedule as fetchScheduleAPI, ScheduleItem } from '@/lib/api/schedule-api'
import { logger } from '@/lib/logger'

export type ScheduleStatus = 'all' | 'upcoming' | 'ongoing' | 'completed'

export interface UseScheduleReturn {
  schedule: ScheduleItem[]
  filteredSchedule: ScheduleItem[]
  loading: boolean
  error: string | null
  currentFilter: ScheduleStatus
  filterByStatus: (status: ScheduleStatus) => void
  refetch: () => Promise<void>
}

/**
 * Schedule 數據管理 Hook
 * 負責從 API 載入擺攤行程列表，並提供篩選功能
 */
export function useSchedule(): UseScheduleReturn {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [filteredSchedule, setFilteredSchedule] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentFilter, setCurrentFilter] = useState<ScheduleStatus>('all')

  const fetchSchedule = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      logger.info('開始載入擺攤行程列表', {
        module: 'useSchedule',
        action: 'fetchSchedule',
      })

      // ✅ 使用 API Client Layer
      const data = await fetchScheduleAPI()

      setSchedule(data)
      setFilteredSchedule(data) // 預設顯示所有行程

      logger.info('擺攤行程列表載入完成', {
        module: 'useSchedule',
        action: 'fetchSchedule',
        metadata: { count: data.length },
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入擺攤行程失敗'
      setError(errorMessage)

      logger.error('載入擺攤行程列表失敗', err as Error, {
        module: 'useSchedule',
        action: 'fetchSchedule',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  // 篩選行程狀態
  const filterByStatus = useCallback(
    (status: ScheduleStatus) => {
      setCurrentFilter(status)
      if (status === 'all') {
        setFilteredSchedule(schedule)
      } else {
        setFilteredSchedule(schedule.filter(item => item.status === status))
      }
    },
    [schedule]
  )

  return {
    schedule,
    filteredSchedule,
    loading,
    error,
    currentFilter,
    filterByStatus,
    refetch: fetchSchedule,
  }
}
