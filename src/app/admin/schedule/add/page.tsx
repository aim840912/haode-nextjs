'use client'
import { formatDate } from '@/lib/utils/formatters'
import { validatePhone } from '@/lib/utils/validation'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import { useAuth } from '@/contexts/AuthContext'
import TimePickerChinese from '@/components/ui/form/TimePickerChinese'
import AdminProtection from '@/components/features/admin/AdminProtection'
import { AdminPageLoader } from '@/components/ui/loading/PageLoader'

export default function AddSchedule() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { user, isLoading } = useAuth()
  const [newProduct, setNewProduct] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    date: '',
    time: '',
    status: 'upcoming' as const,
    products: [] as string[],
    description: '',
    contact: '0912-345-678',
    specialOffer: '',
    weatherNote: '',
  })

  const [timeRange, setTimeRange] = useState({
    startTime: '18:00', // 預設下午 6 點（夜市通常開始時間）
    endTime: '22:00', // 預設晚上 10 點（夜市通常結束時間）
  })

  // 錯誤狀態管理
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState({
    title: '',
    location: '',
    date: '',
    time: '',
    contact: '',
  })

  // 驗證函數
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

  // Format start and end times into time range string
  const formatTimeRange = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return ''
    return `${startTime}-${endTime}`
  }

  // 載入中狀態
  if (isLoading) {
    return (
      <AdminProtection>
        <AdminPageLoader message="載入擺攤行程管理介面中..." />
      </AdminProtection>
    )
  }

  // 未登入檢查
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-8">🔒</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">需要登入</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">此頁面需要管理員權限才能存取</p>
          <div className="space-x-4">
            <Link
              href="/login"
              className="inline-block bg-amber-900 dark:bg-amber-800 text-white px-6 py-3 rounded-lg hover:bg-amber-800 dark:hover:bg-amber-700 transition-colors"
            >
              立即登入
            </Link>
            <Link
              href="/"
              className="inline-block border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              回到首頁
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      const formattedTime = formatTimeRange(timeRange.startTime, timeRange.endTime)

      // 欄位級驗證
      const newFieldErrors = {
        title: validateField('title', formData.title),
        location: validateField('location', formData.location),
        date: validateField('date', formData.date),
        time: validateField('time', formattedTime),
        contact: validateField('contact', formData.contact),
      }

      setFieldErrors(newFieldErrors)

      // 檢查是否有任何錯誤
      const hasErrors = Object.values(newFieldErrors).some(error => error !== '')
      if (hasErrors) {
        setSubmitError('請修正表單中的錯誤後再提交')
        setLoading(false)
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

      if (response.ok) {
        setSubmitSuccess('行程新增成功！正在跳轉...')
        setTimeout(() => {
          router.push('/admin/schedule')
        }, 1500)
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error?.message || '未知錯誤'
        setSubmitError(`新增失敗: ${errorMessage}`)
      }
    } catch (error) {
      logger.error(
        'Error adding schedule:',
        error instanceof Error ? error : new Error('Unknown error')
      )
      setSubmitError('網路連線錯誤，請檢查網路後再試')
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

    // 清除對應欄位錯誤
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      const error = validateField(name, value)
      setFieldErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const handleTimeChange = (timeType: 'startTime' | 'endTime', value: string) => {
    setTimeRange(prev => {
      const newTimeRange = { ...prev, [timeType]: value }

      // 清除時間錯誤
      if (fieldErrors.time) {
        const formattedTime = formatTimeRange(newTimeRange.startTime, newTimeRange.endTime)
        const error = validateField('time', formattedTime)
        setFieldErrors(prevErrors => ({ ...prevErrors, time: error }))
      }

      return newTimeRange
    })
  }

  const handleAddProduct = () => {
    if (newProduct.trim() && !formData.products.includes(newProduct.trim())) {
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, newProduct.trim()],
      }))
      setNewProduct('')
    }
  }

  const handleRemoveProduct = (productToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(p => p !== productToRemove),
    }))
  }

  const handleProductKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddProduct()
    }
  }

  const marketSuggestions = [
    '台中逢甲夜市',
    '台北士林夜市',
    '高雄六合夜市',
    '彰化員林市集',
    '台南花園夜市',
    '桃園中壢夜市',
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/admin/schedule"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
            >
              ← 回到行程管理
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">新增擺攤行程</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 space-y-6"
        >
          {/* 錯誤訊息顯示 */}
          {submitError && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    {submitError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 成功訊息顯示 */}
          {submitSuccess && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    {submitSuccess}
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* 基本資訊 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                市集/夜市名稱 *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                onBlur={() => {
                  const error = validateField('title', formData.title)
                  setFieldErrors(prev => ({ ...prev, title: error }))
                }}
                required
                list="market-suggestions"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700 ${
                  fieldErrors.title
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-slate-600 focus:ring-purple-500'
                }`}
                placeholder="輸入市集或夜市名稱"
              />
              {fieldErrors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.title}</p>
              )}
              <datalist id="market-suggestions">
                {marketSuggestions.map(market => (
                  <option key={market} value={market} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                狀態
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
              >
                <option value="upcoming">即將到來</option>
                <option value="ongoing">進行中</option>
                <option value="completed">已結束</option>
              </select>
            </div>
          </div>

          {/* 地點 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              詳細地址 *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              onBlur={() => {
                const error = validateField('location', formData.location)
                setFieldErrors(prev => ({ ...prev, location: error }))
              }}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700 ${
                fieldErrors.location
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-slate-600 focus:ring-purple-500'
              }`}
              placeholder="完整地址，包含縣市區域"
            />
            {fieldErrors.location && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.location}</p>
            )}
          </div>

          {/* 日期時間 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                日期 *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                onBlur={() => {
                  const error = validateField('date', formData.date)
                  setFieldErrors(prev => ({ ...prev, date: error }))
                }}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700 ${
                  fieldErrors.date
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-slate-600 focus:ring-purple-500'
                }`}
              />
              {fieldErrors.date && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                開始時間 *
              </label>
              <TimePickerChinese
                value={timeRange.startTime}
                onChange={time => handleTimeChange('startTime', time)}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                結束時間 *
              </label>
              <TimePickerChinese
                value={timeRange.endTime}
                onChange={time => handleTimeChange('endTime', time)}
                required
                className="w-full"
              />
              {timeRange.startTime && timeRange.endTime && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  時間範圍：{formatTimeRange(timeRange.startTime, timeRange.endTime)}
                </div>
              )}
              {fieldErrors.time && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.time}</p>
              )}
            </div>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              地點描述
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="攤位位置、交通資訊等補充說明"
            />
          </div>

          {/* 販售商品 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              販售商品
            </label>

            {/* 新增商品輸入框 */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={newProduct}
                  onChange={e => setNewProduct(e.target.value)}
                  onKeyPress={handleProductKeyPress}
                  list="product-suggestions"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="輸入商品名稱"
                />
                <datalist id="product-suggestions">
                  <option value="有機蔬菜" />
                  <option value="梅山紅肉李" />
                  <option value="手工茶包組合" />
                  <option value="梅山咖啡豆" />
                  <option value="當季蔬菜箱" />
                  <option value="蜜養禮盒" />
                </datalist>
              </div>
              <button
                type="button"
                onClick={handleAddProduct}
                disabled={!newProduct.trim()}
                className="px-4 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full text-sm border border-amber-200 dark:border-amber-700"
                    >
                      {product}
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product)}
                        className="ml-1 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500 dark:text-gray-400">
              已新增 {formData.products.length} 項商品{' '}
              {formData.products.length === 0 && '（商品為選填項目，可留空）'}
            </div>
          </div>

          {/* 聯絡資訊和優惠 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                聯絡電話 *
              </label>
              <input
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                onBlur={() => {
                  const error = validateField('contact', formData.contact)
                  setFieldErrors(prev => ({ ...prev, contact: error }))
                }}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700 ${
                  fieldErrors.contact
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-slate-600 focus:ring-purple-500'
                }`}
                placeholder="聯絡電話"
              />
              {fieldErrors.contact && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.contact}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                特別優惠
              </label>
              <input
                type="text"
                name="specialOffer"
                value={formData.specialOffer}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="例如：買二送一、滿額折扣等"
              />
            </div>
          </div>

          {/* 天氣備註 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              天氣備註
            </label>
            <input
              type="text"
              name="weatherNote"
              value={formData.weatherNote}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="例如：如遇雨天取消、有遮陽棚等"
            />
          </div>

          {/* 預覽區 */}
          <div className="border-t border-gray-200 dark:border-slate-600 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">預覽</h3>
            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formData.title || '市集名稱'}
                </h4>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    formData.status === 'upcoming'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : formData.status === 'ongoing'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {formData.status === 'upcoming'
                    ? '即將到來'
                    : formData.status === 'ongoing'
                      ? '進行中'
                      : '已結束'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
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
              </div>

              {formData.products.length > 0 && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    販售商品：
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.products.map((product, index) => (
                      <span
                        key={index}
                        className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-full text-xs border border-amber-200 dark:border-amber-700"
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formData.specialOffer && (
                <div className="bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-400 dark:border-orange-600 p-2 rounded-r text-sm">
                  <div className="text-orange-700 dark:text-orange-300 font-medium">
                    🎁 特別優惠
                  </div>
                  <div className="text-orange-600 dark:text-orange-400">
                    {formData.specialOffer}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 提交按鈕 */}
          <div className="flex justify-end space-x-4 pt-6">
            <Link
              href="/admin/schedule"
              className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '新增中...' : '新增行程'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
