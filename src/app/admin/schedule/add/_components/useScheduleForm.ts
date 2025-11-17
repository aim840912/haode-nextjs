/**
 * 擺攤行程表單狀態管理 Hook
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'
import { validateField, formatTimeRange } from './validation'
import type { ScheduleFormData, TimeRange, FieldErrors } from './types'

const INITIAL_FORM_DATA: ScheduleFormData = {
  title: '',
  location: '',
  date: new Date().toISOString().split('T')[0],
  time: '',
  status: 'upcoming' as const,
  products: [] as string[],
  description: '',
  contact: '0912-345-678',
  specialOffer: '',
  weatherNote: '',
}

const INITIAL_TIME_RANGE: TimeRange = {
  startTime: '18:00', // 預設下午 6 點（夜市通常開始時間）
  endTime: '22:00', // 預設晚上 10 點（夜市通常結束時間）
}

const INITIAL_FIELD_ERRORS: FieldErrors = {
  title: '',
  location: '',
  date: '',
  time: '',
  contact: '',
}

export function useScheduleForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [newProduct, setNewProduct] = useState('')
  const [formData, setFormData] = useState<ScheduleFormData>(INITIAL_FORM_DATA)
  const [timeRange, setTimeRange] = useState<TimeRange>(INITIAL_TIME_RANGE)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(INITIAL_FIELD_ERRORS)

  /**
   * 處理表單提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      // Format time range
      const formattedTime = formatTimeRange(timeRange.startTime, timeRange.endTime)

      // 驗證所有必填欄位
      const newFieldErrors: FieldErrors = {
        title: validateField('title', formData.title),
        location: validateField('location', formData.location),
        date: validateField('date', formData.date),
        time: validateField('time', formattedTime, timeRange),
        contact: validateField('contact', formData.contact),
      }

      setFieldErrors(newFieldErrors)

      // 如果有任何錯誤，停止提交
      const hasErrors = Object.values(newFieldErrors).some(error => error !== '')

      if (hasErrors) {
        setSubmitError('請修正表單中的錯誤')
        return
      }

      const submitData = {
        ...formData,
        time: formattedTime,
      }

      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error?.message || '未知錯誤'
        throw new Error(errorMessage)
      }

      setSubmitSuccess('擺攤行程新增成功！')
      setTimeout(() => router.push('/admin/schedule'), 1500)
    } catch (error) {
      logger.error('新增擺攤行程失敗', error as Error)
      setSubmitError((error as Error).message || '新增失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

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

    // 即時驗證
    const error = validateField(name, value, timeRange)
    setFieldErrors(prev => ({ ...prev, [name]: error }))
  }

  /**
   * 處理時間變更
   */
  const handleTimeChange = (timeType: 'startTime' | 'endTime', value: string) => {
    setTimeRange(prev => ({
      ...prev,
      [timeType]: value,
    }))

    // 重新驗證時間欄位
    const updatedTimeRange = { ...timeRange, [timeType]: value }
    const timeError = validateField(
      'time',
      formatTimeRange(updatedTimeRange.startTime, updatedTimeRange.endTime),
      updatedTimeRange
    )
    setFieldErrors(prev => ({ ...prev, time: timeError }))
  }

  /**
   * 新增產品到列表
   */
  const handleAddProduct = () => {
    if (newProduct.trim()) {
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, newProduct.trim()],
      }))
      setNewProduct('')
    }
  }

  /**
   * 從列表移除產品
   */
  const handleRemoveProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }))
  }

  return {
    // State
    loading,
    formData,
    timeRange,
    newProduct,
    submitError,
    submitSuccess,
    fieldErrors,

    // Setters
    setNewProduct,

    // Handlers
    handleSubmit,
    handleInputChange,
    handleTimeChange,
    handleAddProduct,
    handleRemoveProduct,
  }
}
