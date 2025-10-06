import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ScheduleItem } from '@/types/schedule'
import { logger } from '@/lib/logger'
import { useToast } from '@/components/ui/feedback/Toast'

interface FormData {
  title: string
  location: string
  date: string
  time: string
  status: 'upcoming' | 'ongoing' | 'completed'
  products: string[]
  description: string
  contact: string
  specialOffer: string
  weatherNote: string
}

interface TimeRange {
  startTime: string
  endTime: string
}

/**
 * Parse time range string into start and end times
 */
export const parseTimeRange = (timeStr: string): TimeRange => {
  if (!timeStr) return { startTime: '', endTime: '' }
  const parts = timeStr.split('-')
  if (parts.length === 2) {
    return {
      startTime: parts[0].trim(),
      endTime: parts[1].trim(),
    }
  }
  return { startTime: '', endTime: '' }
}

/**
 * Format start and end times into time range string
 */
export const formatTimeRange = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return ''
  return `${startTime}-${endTime}`
}

export function useScheduleData(params: Promise<{ id: string }>) {
  const router = useRouter()
  const toast = useToast()

  const [initialLoading, setInitialLoading] = useState(true)
  const [scheduleId, setScheduleId] = useState<string>('')

  const [formData, setFormData] = useState<FormData>({
    title: '',
    location: '',
    date: '',
    time: '',
    status: 'upcoming' as 'upcoming' | 'ongoing' | 'completed',
    products: [] as string[],
    description: '',
    contact: '',
    specialOffer: '',
    weatherNote: '',
  })

  const [timeRange, setTimeRange] = useState<TimeRange>({
    startTime: '',
    endTime: '',
  })

  /**
   * 從 API 獲取行程資料
   */
  const fetchSchedule = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/schedule/${id}`)
        if (response.ok) {
          const result = await response.json()
          // API 返回格式: { success: true, data: ScheduleItem, message: string, timestamp: string }
          const schedule: ScheduleItem = result.data
          const parsedTime = parseTimeRange(schedule.time)
          setFormData({
            title: schedule.title,
            location: schedule.location,
            date: schedule.date,
            time: schedule.time,
            status: schedule.status,
            products: Array.isArray(schedule.products) ? schedule.products : [],
            description: schedule.description,
            contact: schedule.contact,
            specialOffer: schedule.specialOffer || '',
            weatherNote: schedule.weatherNote || '',
          })
          setTimeRange(parsedTime)
        } else {
          // 解析錯誤響應
          const errorData = await response.json().catch(() => null)

          // 正確提取錯誤訊息（支援新舊錯誤格式）
          const errorMessage =
            errorData?.error?.message || // 新錯誤系統格式
            errorData?.message || // 舊格式相容
            errorData?.error || // 最後才嘗試直接使用 error
            '無法載入行程資料'

          // 確保 errorMessage 是字串
          const displayMessage =
            typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)

          if (response.status === 404) {
            toast.error('行程不存在', '找不到指定的行程，將返回列表頁面', [
              {
                label: '返回列表',
                onClick: () => router.push('/admin/schedule'),
                variant: 'primary',
              },
            ])
            setTimeout(() => router.push('/admin/schedule'), 3000)
          } else {
            toast.error(`載入失敗 (${response.status})`, displayMessage, [
              {
                label: '重試',
                onClick: () => fetchSchedule(id),
                variant: 'primary',
              },
              {
                label: '返回',
                onClick: () => router.push('/admin/schedule'),
                variant: 'secondary',
              },
            ])
          }

          logger.error(
            'Failed to fetch schedule:',
            new Error(`HTTP ${response.status}: ${displayMessage}`)
          )
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知錯誤'
        toast.error('載入失敗', `網路錯誤：${errorMsg}`, [
          {
            label: '重試',
            onClick: () => fetchSchedule(id),
            variant: 'primary',
          },
          {
            label: '返回',
            onClick: () => router.push('/admin/schedule'),
            variant: 'secondary',
          },
        ])

        logger.error(
          'Error fetching schedule:',
          error instanceof Error ? error : new Error('Unknown error')
        )
      } finally {
        setInitialLoading(false)
      }
    },
    [router, toast]
  )

  /**
   * 處理 params Promise 並獲取資料
   */
  useEffect(() => {
    params.then(({ id }) => {
      setScheduleId(id)
      fetchSchedule(id)
    })
  }, [params, fetchSchedule])

  return {
    initialLoading,
    scheduleId,
    formData,
    setFormData,
    timeRange,
    setTimeRange,
    fetchSchedule,
  }
}
