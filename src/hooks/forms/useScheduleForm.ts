import { useState, useCallback } from 'react'
import { useToast } from '@/components/ui/feedback/Toast'
import { logger } from '@/lib/logger'
import { ScheduleItem } from '@/types/schedule'

interface TimeRange {
  startTime: string
  endTime: string
}

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

export function useScheduleForm() {
  const toast = useToast()
  const [initialLoading, setInitialLoading] = useState(true)
  const [newProduct, setNewProduct] = useState('')

  const [formData, setFormData] = useState<FormData>({
    title: '',
    location: '',
    date: '',
    time: '',
    status: 'upcoming',
    products: [],
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
   * Parse time range string into start and end times
   */
  const parseTimeRange = (timeStr: string): TimeRange => {
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
  const formatTimeRange = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return ''
    return `${startTime}-${endTime}`
  }

  /**
   * 載入行程資料
   */
  const fetchSchedule = useCallback(
    async (id: string, router: any) => {
      try {
        const response = await fetch(`/api/schedule/${id}`)
        if (response.ok) {
          const result = await response.json()
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
          const errorData = await response.json().catch(() => null)
          const errorMessage =
            errorData?.error?.message ||
            errorData?.message ||
            errorData?.error ||
            '無法載入行程資料'
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
                onClick: () => fetchSchedule(id, router),
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
            onClick: () => fetchSchedule(id, router),
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
    [toast]
  )

  /**
   * 處理輸入變更
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  /**
   * 處理時間變更
   */
  const handleTimeChange = (timeType: 'startTime' | 'endTime', value: string) => {
    setTimeRange(prev => ({
      ...prev,
      [timeType]: value,
    }))
  }

  /**
   * 新增商品
   */
  const handleAddProduct = () => {
    if (newProduct.trim() && !formData.products.includes(newProduct.trim())) {
      const updatedProducts = [...formData.products, newProduct.trim()]
      setFormData(prev => ({
        ...prev,
        products: updatedProducts,
      }))
      setNewProduct('')
      return updatedProducts
    }
    return formData.products
  }

  /**
   * 移除商品
   */
  const handleRemoveProduct = (productToRemove: string) => {
    const updatedProducts = formData.products.filter(p => p !== productToRemove)
    setFormData(prev => ({
      ...prev,
      products: updatedProducts,
    }))
    return updatedProducts
  }

  return {
    formData,
    timeRange,
    newProduct,
    initialLoading,
    setNewProduct,
    setFormData,
    setTimeRange,
    parseTimeRange,
    formatTimeRange,
    fetchSchedule,
    handleInputChange,
    handleTimeChange,
    handleAddProduct,
    handleRemoveProduct,
  }
}
