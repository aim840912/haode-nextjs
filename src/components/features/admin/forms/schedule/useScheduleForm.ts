import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'
import { formatDate } from '@/lib/utils/formatters'
import { validatePhone } from '@/lib/utils/validation'

interface ScheduleFormData {
  title: string
  location: string
  date: string
  time: string
  status: 'upcoming' | 'completed' | 'cancelled'
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

interface FieldErrors {
  title: string
  location: string
  date: string
  time: string
  contact: string
}

export function useScheduleForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [newProduct, setNewProduct] = useState('')

  const [formData, setFormData] = useState<ScheduleFormData>({
    title: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    status: 'upcoming',
    products: [],
    description: '',
    contact: '0912-345-678',
    specialOffer: '',
    weatherNote: '',
  })

  const [timeRange, setTimeRange] = useState<TimeRange>({
    startTime: '18:00',
    endTime: '22:00',
  })

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    title: '',
    location: '',
    date: '',
    time: '',
    contact: '',
  })

  const formatTimeRange = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return ''
    return `${startTime}-${endTime}`
  }

  const validateField = (field: string, value: unknown) => {
    const stringValue = String(value)
    switch (field) {
      case 'title':
        return !stringValue.trim() ? '請輸入市集/夜市名稱' : ''
      case 'location':
        return !stringValue.trim() ? '請輸入詳細地址' : ''
      case 'date':
        return !stringValue ? '請選擇日期' : ''
      case 'time':
        const formattedTime = formatTimeRange(timeRange.startTime, timeRange.endTime)
        return !formattedTime ? '請選擇開始時間和結束時間' : ''
      case 'contact':
        if (!stringValue.trim()) return '請輸入聯絡電話'
        const result = validatePhone(stringValue)
        if (!result.valid) {
          return result.message || '請輸入有效的台灣電話號碼（手機或市話）'
        }
        return ''
      default:
        return ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)

    const updatedFormData = {
      ...formData,
      time: formatTimeRange(timeRange.startTime, timeRange.endTime),
    }

    const errors = {
      title: validateField('title', updatedFormData.title),
      location: validateField('location', updatedFormData.location),
      date: validateField('date', updatedFormData.date),
      time: validateField('time', updatedFormData.time),
      contact: validateField('contact', updatedFormData.contact),
    }

    setFieldErrors(errors)

    if (Object.values(errors).some(error => error)) {
      setSubmitError('請修正表單錯誤後再提交')
      return
    }

    setLoading(true)

    try {
      const scheduleData = {
        ...updatedFormData,
        date: formatDate(new Date(updatedFormData.date)),
      }

      const response = await fetch('/api/admin/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '新增失敗')
      }

      setSubmitSuccess('擺攤行程新增成功！')
      setTimeout(() => router.push('/admin/schedule'), 1500)
    } catch (error) {
      logger.error('新增擺攤行程失敗', error)
      setSubmitError(error instanceof Error ? error.message : '新增失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
  }

  const handleTimeChange = (timeType: 'startTime' | 'endTime', value: string) => {
    setTimeRange(prev => {
      const updated = { ...prev, [timeType]: value }
      const formattedTime = formatTimeRange(updated.startTime, updated.endTime)
      setFormData(prevForm => ({ ...prevForm, time: formattedTime }))
      setFieldErrors(prevErrors => ({ ...prevErrors, time: validateField('time', formattedTime) }))
      return updated
    })
  }

  const handleAddProduct = () => {
    if (newProduct.trim() && !formData.products.includes(newProduct.trim())) {
      setFormData(prev => ({ ...prev, products: [...prev.products, newProduct.trim()] }))
      setNewProduct('')
    }
  }

  const handleRemoveProduct = (productToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(product => product !== productToRemove),
    }))
  }

  const handleProductKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddProduct()
    }
  }

  return {
    formData,
    timeRange,
    newProduct,
    loading,
    submitError,
    submitSuccess,
    fieldErrors,
    setNewProduct,
    handleSubmit,
    handleInputChange,
    handleTimeChange,
    handleAddProduct,
    handleRemoveProduct,
    handleProductKeyPress,
  }
}
