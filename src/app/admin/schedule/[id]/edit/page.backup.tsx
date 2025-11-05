'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ScheduleItem } from '@/types/schedule'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import TimePickerChinese from '@/components/ui/form/TimePickerChinese'
import AdminProtection from '@/components/features/admin/AdminProtection'
import { useToast } from '@/components/ui/feedback/Toast'

export default function EditSchedule({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [scheduleId, setScheduleId] = useState<string>('')
  const [newProduct, setNewProduct] = useState('')

  const [formData, setFormData] = useState({
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

  const [timeRange, setTimeRange] = useState({
    startTime: '',
    endTime: '',
  })

  // 表單驗證狀態
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const marketSuggestions = [
    '台中逢甲夜市',
    '台北士林夜市',
    '高雄六合夜市',
    '彰化員林市集',
    '台南花園夜市',
    '桃園中壢夜市',
  ]

  // Parse time range string into start and end times
  const parseTimeRange = (timeStr: string) => {
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

  // Format start and end times into time range string
  const formatTimeRange = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return ''
    return `${startTime}-${endTime}`
  }

  // 驗證單一欄位
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'title':
        return !value || !value.trim() ? '請輸入市集或夜市名稱' : ''

      case 'location':
        return !value || !value.trim() ? '請輸入詳細地址' : ''

      case 'date':
        return !value ? '請選擇日期' : ''

      case 'contact':
        if (!value || !value.trim()) return '請輸入聯絡電話'

        // 台灣電話格式增強驗證 - 支援多種格式
        // 1. 移除格式字元（空白、中線、括號）保留數字、加號、分機標記
        const cleanPhone = value.replace(/[\s\-()]/g, '')

        // 2. 驗證主要號碼格式
        // 支援格式：
        // - 手機: 09xxxxxxxx, +8869xxxxxxxx
        // - 市話: 0x-xxxxxxx (區碼2-3碼，號碼6-8碼)
        // - 特殊: 0800xxxxxx, 0204xxxxxx, 070xxxxxxx
        // - 分機: #123, ext.123, 轉123
        const phoneRegex =
          /^(\+?886)?0?(9\d{8}|[2-8]\d{7,8}|800\d{6}|204\d{6}|70\d{7})((?:#|ext\.?|轉)\d+)?$/i

        if (!phoneRegex.test(cleanPhone)) {
          return '電話格式不正確'
        }

        return ''

      case 'startTime':
        return !timeRange.startTime ? '請選擇開始時間' : ''

      case 'endTime':
        if (!timeRange.endTime) return '請選擇結束時間'
        // 檢查結束時間是否晚於開始時間
        if (timeRange.startTime && timeRange.endTime) {
          const start = timeRange.startTime.split(':').map(Number)
          const end = timeRange.endTime.split(':').map(Number)
          const startMinutes = start[0] * 60 + start[1]
          const endMinutes = end[0] * 60 + end[1]
          if (endMinutes <= startMinutes) {
            return '結束時間必須晚於開始時間'
          }
        }
        return ''

      case 'products':
        return formData.products.length === 0 ? '請至少新增一項販售商品' : ''

      default:
        return ''
    }
  }

  // 驗證所有欄位
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const fieldsToValidate = [
      'title',
      'location',
      'date',
      'contact',
      'startTime',
      'endTime',
      'products',
    ]

    fieldsToValidate.forEach(field => {
      const error = validateField(
        field,
        field === 'products' ? formData.products : formData[field as keyof typeof formData]
      )
      if (error) {
        newErrors[field] = error
      }
    })

    setErrors(newErrors)
    // 標記所有欄位為已觸碰，以顯示錯誤
    const newTouched: Record<string, boolean> = {}
    fieldsToValidate.forEach(field => {
      newTouched[field] = true
    })
    setTouched(newTouched)

    return Object.keys(newErrors).length === 0
  }

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

  useEffect(() => {
    params.then(({ id }) => {
      setScheduleId(id)
      fetchSchedule(id)
    })
  }, [params, fetchSchedule])

  if (initialLoading) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">載入中...</div>
        </div>
      </AdminProtection>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 執行完整表單驗證
    const isValid = validateForm()
    if (!isValid) {
      toast.warning('表單驗證失敗', '請檢查並填寫所有必填欄位', [
        {
          label: '知道了',
          onClick: () => {},
          variant: 'primary',
        },
      ])
      return
    }

    setLoading(true)

    // 顯示載入提示
    const loadingToastId = toast.loading('更新中', '正在儲存行程資料...')

    try {
      const formattedTime = formatTimeRange(timeRange.startTime, timeRange.endTime)
      const submitData = {
        ...formData,
        time: formattedTime,
      }

      // 注意：空字串會直接傳給後端，由後端處理轉換為 null
      // 不需要在前端特殊處理

      const response = await fetch(`/api/schedule/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      // 移除載入提示
      toast.removeToast(loadingToastId)

      if (response.ok) {
        // 顯示成功提示
        toast.success('更新成功！', '行程資料已成功更新，即將返回列表頁面')

        // 延遲跳轉讓用戶看到成功訊息
        setTimeout(() => {
          router.push('/admin/schedule')
        }, 1500)
      } else {
        // 解析錯誤響應
        const errorData = await response.json().catch(() => null)

        // 正確提取錯誤訊息（支援新舊錯誤格式）
        const errorMessage =
          errorData?.error?.message || // 新錯誤系統格式
          errorData?.message || // 舊格式相容
          errorData?.error || // 最後才嘗試直接使用 error
          '更新失敗，請稍後再試'

        // 確保 errorMessage 是字串
        const displayMessage =
          typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)

        // 針對驗證錯誤提供更詳細的訊息
        if (response.status === 400) {
          toast.error('資料驗證失敗', displayMessage, [
            {
              label: '查看錯誤',
              onClick: () => {
                // 可以在這裡添加滾動到錯誤欄位的邏輯
                logger.error('行程編輯頁驗證錯誤', new Error(displayMessage), {
                  module: 'EditSchedulePage',
                  action: 'handleValidationError',
                  metadata: { scheduleId, errorMessage: displayMessage },
                })
              },
              variant: 'secondary',
            },
          ])
        } else {
          toast.error(`更新失敗 (${response.status})`, displayMessage)
        }

        logger.error(
          'Failed to update schedule:',
          new Error(`HTTP ${response.status}: ${displayMessage}`)
        )
      }
    } catch (error) {
      // 移除載入提示
      toast.removeToast(loadingToastId)

      const errorMsg = error instanceof Error ? error.message : '未知錯誤'
      toast.error('更新失敗', `網路錯誤：${errorMsg}。請檢查網路連線後重試。`)

      logger.error(
        'Error updating schedule:',
        error instanceof Error ? error : new Error('Unknown error')
      )
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    // 即時驗證（如果欄位已被觸碰過）
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }))
    }
  }

  // 處理欄位失焦事件
  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true,
    }))
    // 驗證欄位
    const value =
      fieldName === 'startTime' || fieldName === 'endTime'
        ? timeRange[fieldName]
        : formData[fieldName as keyof typeof formData]
    const error = validateField(fieldName, value)
    setErrors(prev => ({
      ...prev,
      [fieldName]: error,
    }))
  }

  const handleTimeChange = (timeType: 'startTime' | 'endTime', value: string) => {
    setTimeRange(prev => ({
      ...prev,
      [timeType]: value,
    }))

    // 即時驗證時間欄位
    if (touched[timeType]) {
      const error = validateField(timeType, value)
      setErrors(prev => ({
        ...prev,
        [timeType]: error,
      }))
    }
  }

  const handleAddProduct = () => {
    if (newProduct.trim() && !formData.products.includes(newProduct.trim())) {
      const updatedProducts = [...formData.products, newProduct.trim()]
      setFormData(prev => ({
        ...prev,
        products: updatedProducts,
      }))
      setNewProduct('')

      // 清除 products 欄位的錯誤（如果有的話）
      if (touched.products && updatedProducts.length > 0) {
        setErrors(prev => ({
          ...prev,
          products: '',
        }))
      }
    }
  }

  const handleRemoveProduct = (productToRemove: string) => {
    const updatedProducts = formData.products.filter(p => p !== productToRemove)
    setFormData(prev => ({
      ...prev,
      products: updatedProducts,
    }))

    // 即時驗證 products 欄位
    if (touched.products) {
      const error = validateField('products', updatedProducts)
      setErrors(prev => ({
        ...prev,
        products: error,
      }))
    }
  }

  const handleProductKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddProduct()
    }
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/admin/schedule" className="text-purple-600 hover:text-purple-800">
                ← 回到行程管理
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">編輯擺攤行程</h1>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
            {/* 基本資訊 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  市集/夜市名稱 *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('title')}
                  required
                  list="market-suggestions"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 ${
                    touched.title && errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="輸入市集或夜市名稱"
                />
                {touched.title && errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
                <datalist id="market-suggestions">
                  {marketSuggestions.map(market => (
                    <option key={market} value={market} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">狀態</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                >
                  <option value="upcoming">即將到來</option>
                  <option value="ongoing">進行中</option>
                  <option value="completed">已結束</option>
                </select>
              </div>
            </div>

            {/* 地點 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">詳細地址 *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                onBlur={() => handleBlur('location')}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 ${
                  touched.location && errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="完整地址，包含縣市區域"
              />
              {touched.location && errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* 日期時間 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">日期 *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('date')}
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 ${
                    touched.date && errors.date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {touched.date && errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">開始時間 *</label>
                <div onBlur={() => handleBlur('startTime')}>
                  <TimePickerChinese
                    value={timeRange.startTime}
                    onChange={time => handleTimeChange('startTime', time)}
                    required
                    className="w-full"
                  />
                </div>
                {touched.startTime && errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">結束時間 *</label>
                <div onBlur={() => handleBlur('endTime')}>
                  <TimePickerChinese
                    value={timeRange.endTime}
                    onChange={time => handleTimeChange('endTime', time)}
                    required
                    className="w-full"
                  />
                </div>
                {touched.endTime && errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
                )}
                {timeRange.startTime && timeRange.endTime && !errors.endTime && (
                  <div className="mt-2 text-sm text-gray-600">
                    時間範圍：{formatTimeRange(timeRange.startTime, timeRange.endTime)}
                  </div>
                )}
              </div>
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">地點描述</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                placeholder="攤位位置、交通資訊等補充說明"
              />
            </div>

            {/* 販售商品 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">販售商品 *</label>

              {/* 新增商品輸入框 */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={newProduct}
                    onChange={e => setNewProduct(e.target.value)}
                    onKeyPress={handleProductKeyPress}
                    onBlur={() => handleBlur('products')}
                    list="product-suggestions"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    placeholder="輸入商品名稱"
                  />
                  <datalist id="product-suggestions">
                    <option value="有機蔬菜" />
                    <option value="梅山紅肉李" />
                    <option value="手工茶包組合" />
                    <option value="梅山咖啡豆" />
                    <option value="當季蔬菜箱" />
                    <option value="蜜餞禮盒" />
                  </datalist>
                </div>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!newProduct.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  新增
                </button>
              </div>

              {/* 已新增的商品標籤 */}
              {formData.products.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {formData.products.map((product, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm"
                      >
                        {product}
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(product)}
                          className="ml-1 text-amber-600 hover:text-amber-800 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-600">
                已新增 {formData.products.length} 項商品{' '}
                {formData.products.length === 0 && '（至少需要一項商品）'}
              </div>

              {/* 驗證錯誤訊息 */}
              {touched.products && errors.products && (
                <p className="mt-1 text-sm text-red-600">{errors.products}</p>
              )}
            </div>

            {/* 聯絡資訊和優惠 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">聯絡電話 *</label>
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('contact')}
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 ${
                    touched.contact && errors.contact ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="聯絡電話"
                />
                {touched.contact && errors.contact && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">特別優惠</label>
                <input
                  type="text"
                  name="specialOffer"
                  value={formData.specialOffer}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  placeholder="例如：買二送一、滿額折扣等"
                />
              </div>
            </div>

            {/* 天氣備註 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">天氣備註</label>
              <input
                type="text"
                name="weatherNote"
                value={formData.weatherNote}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                placeholder="例如：如遇雨天取消、有遮陽棚等"
              />
            </div>

            {/* 預覽區 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">即時預覽</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {formData.title || '市集名稱'}
                  </h4>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      formData.status === 'upcoming'
                        ? 'bg-green-100 text-green-800'
                        : formData.status === 'ongoing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {formData.status === 'upcoming'
                      ? '即將到來'
                      : formData.status === 'ongoing'
                        ? '進行中'
                        : '已結束'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-3">
                  <div>
                    📅{' '}
                    {formData.date
                      ? new Date(formData.date).toLocaleDateString('zh-TW', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '請選擇日期'}
                  </div>
                  <div>
                    ⏰ {formatTimeRange(timeRange.startTime, timeRange.endTime) || '請選擇時間'}
                  </div>
                  <div>📍 {formData.location || '請輸入地址'}</div>
                  <div>📞 {formData.contact || '請輸入聯絡電話'}</div>
                </div>

                {formData.description && (
                  <div className="text-sm text-gray-600 mb-3">
                    <div className="font-medium">描述：</div>
                    <div>{formData.description}</div>
                  </div>
                )}

                {formData.products.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">販售商品：</div>
                    <div className="flex flex-wrap gap-1">
                      {formData.products.map((product, index) => (
                        <span
                          key={index}
                          className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs"
                        >
                          {product}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {formData.specialOffer && (
                  <div className="bg-orange-50 border-l-4 border-orange-400 p-2 rounded-r text-sm mb-3">
                    <div className="text-orange-700 font-medium">🎁 特別優惠</div>
                    <div className="text-orange-600">{formData.specialOffer}</div>
                  </div>
                )}

                {formData.weatherNote && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded-r text-sm">
                    <div className="text-blue-700 font-medium">🌤️ 天氣備註</div>
                    <div className="text-blue-600">{formData.weatherNote}</div>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-3">
                  更新時間：{new Date().toLocaleDateString('zh-TW')}
                </div>
              </div>
            </div>

            {/* 提交按鈕 */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/admin/schedule"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-800 font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={loading || formData.products.length === 0}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '更新中...' : '更新行程'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminProtection>
  )
}
