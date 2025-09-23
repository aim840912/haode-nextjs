'use client'

import { useState } from 'react'
import { logger } from '@/lib/logger'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/AuthContext'
import { getFullImageUrl } from '@/lib/utils/image-url-utils'
import { SimpleImage } from '@/components/ui/image/OptimizedImage'
import { v4 as uuidv4 } from 'uuid'
import { AdminPageLoader } from '@/components/ui/loading/PageLoader'
import AdminProtection from '@/components/features/admin/AdminProtection'

// 動態載入圖片上傳器，減少初始 bundle 大小
const ImageUploader = dynamic(() => import('@/components/features/products/ImageUploader'), {
  loading: () => (
    <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
      載入圖片上傳器...
    </div>
  ),
  ssr: false,
})

// 驗證圖片 URL 是否有效（避免 emoji 或無效 URL 傳遞給 Image 組件）
const isValidImageUrl = (url: string | undefined): boolean => {
  if (!url) return false
  // 檢查是否包含 emoji 字符
  const emojiRegex =
    /[\u{1F000}-\u{1F9FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
  if (emojiRegex.test(url)) return false
  // 檢查是否為有效的相對或絕對路徑
  return url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://')
}

export default function AddLocation() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')
  // 新增狀態來儲存圖片路徑對應關係
  const [imagePaths, setImagePaths] = useState<Map<string, string>>(new Map())
  const [locationId] = useState(() => uuidv4())
  const { user, isLoading } = useAuth()

  // 錯誤狀態管理
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    title: '',
    address: '',
    phone: '',
    hours: '',
  })

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    address: '',
    landmark: '',
    phone: '',
    lineId: '',
    hours: '',
    closedDays: '',
    parking: '',
    publicTransport: '',
    features: [''],
    specialties: [''],
    coordinates: {
      lat: 23.5519, // 台灣中心點作為預設值
      lng: 120.5564,
    },
    image: '',
    isMain: false,
  })

  // 驗證函數
  const validateField = (field: string, value: any) => {
    switch (field) {
      case 'name':
        return !value.trim() ? '請輸入門市名稱' : ''
      case 'title':
        return !value.trim() ? '請輸入完整標題' : ''
      case 'address':
        return !value.trim() ? '請輸入門市地址' : ''
      case 'phone':
        if (!value.trim()) return '請輸入電話號碼'
        // 台灣電話格式簡單驗證 (09xxxxxxxx 或 0x-xxxxxxx)
        const phoneRegex = /^(09\d{8}|0\d{1,2}-\d{6,8})$/
        return !phoneRegex.test(value.replace(/\s+/g, '')) ? '電話格式不正確' : ''
      case 'hours':
        return !value.trim() ? '請輸入營業時間' : ''
      default:
        return ''
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // 清除對應欄位錯誤
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      const error = validateField(field, value)
      setFieldErrors(prev => ({ ...prev, [field]: error }))
    }
  }

  // 載入中狀態
  if (isLoading) {
    return (
      <AdminProtection>
        <AdminPageLoader message="載入門市管理介面中..." />
      </AdminProtection>
    )
  }

  // 未登入檢查
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-8">🔒</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">需要登入</h1>
          <p className="text-gray-600 mb-8">此頁面需要管理員權限才能存取</p>
          <div className="space-x-4">
            <Link
              href="/login"
              className="inline-block bg-amber-900 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors"
            >
              立即登入
            </Link>
            <Link
              href="/"
              className="inline-block border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
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

    // 欄位級驗證
    const newFieldErrors = {
      name: validateField('name', formData.name),
      title: validateField('title', formData.title),
      address: validateField('address', formData.address),
      phone: validateField('phone', formData.phone),
      hours: validateField('hours', formData.hours),
    }

    setFieldErrors(newFieldErrors)

    // 檢查是否有任何錯誤
    const hasErrors = Object.values(newFieldErrors).some(error => error !== '')
    if (hasErrors) {
      setSubmitError('請修正表單中的錯誤後再提交')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: locationId, // 包含前端生成的 UUID
          ...formData,
          image: uploadedImageUrl || formData.image || '',
          features: formData.features.filter(feature => feature.trim() !== ''),
          specialties: formData.specialties.filter(specialty => specialty.trim() !== ''),
          coordinates:
            formData.coordinates.lat && formData.coordinates.lng
              ? formData.coordinates
              : { lat: 23.5519, lng: 120.5564 }, // 台灣中心點作為預設值
        }),
      })

      if (response.ok) {
        setSubmitSuccess('門市新增成功！正在跳轉...')
        setTimeout(() => {
          router.push('/admin/locations')
        }, 1500)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setSubmitError(errorData.message || '新增失敗，請稍後再試')
      }
    } catch (error) {
      logger.error(
        'Error creating location:',
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
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }))

    // 清除對應欄位錯誤
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      const error = validateField(name, newValue)
      setFieldErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const addFeatureField = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ''],
    }))
  }

  const removeFeatureField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  const updateFeatureField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => (i === index ? value : feature)),
    }))
  }

  const addSpecialtyField = () => {
    setFormData(prev => ({
      ...prev,
      specialties: [...prev.specialties, ''],
    }))
  }

  const removeSpecialtyField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }))
  }

  const updateSpecialtyField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.map((specialty, i) => (i === index ? value : specialty)),
    }))
  }

  const handleImageUploadSuccess = (
    images: Array<{ url?: string; path?: string; preview?: string }>
  ) => {
    if (images.length > 0 && images[0].url) {
      const imageUrl = images[0].url
      const imagePath = images[0].path

      if (imagePath) {
        // 儲存 URL 和 path 的對應關係
        setImagePaths(prev => new Map(prev).set(imageUrl, imagePath))
      }

      setUploadedImageUrl(imageUrl)
      setFormData(prev => ({ ...prev, image: imageUrl }))
      logger.info('門市圖片上傳成功', {
        metadata: { url: imageUrl, path: imagePath },
      })
    }
  }

  const handleImageUploadError = (error: string) => {
    logger.error('門市圖片上傳失敗', new Error(error))
    setSubmitError(`圖片上傳失敗: ${error}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/admin/locations" className="text-amber-600 hover:text-amber-800">
              ← 回到門市管理
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">新增門市</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-white rounded-lg shadow-md p-6 space-y-6"
          >
            {/* 錯誤訊息顯示 */}
            {submitError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
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
                    <p className="text-sm font-medium text-red-800">{submitError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 成功訊息顯示 */}
            {submitSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
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
                    <p className="text-sm font-medium text-green-800">{submitSuccess}</p>
                  </div>
                </div>
              </div>
            )}
            {/* 基本資訊 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">基本資訊</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    門市名稱 *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={() => {
                      const error = validateField('name', formData.name)
                      setFieldErrors(prev => ({ ...prev, name: error }))
                    }}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                      fieldErrors.name
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-amber-500'
                    }`}
                    placeholder="例：總店"
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    完整標題 *
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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                      fieldErrors.title
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-amber-500'
                    }`}
                    placeholder="例：豪德製茶所總店"
                  />
                  {fieldErrors.title && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">門市地址 *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  onBlur={() => {
                    const error = validateField('address', formData.address)
                    setFieldErrors(prev => ({ ...prev, address: error }))
                  }}
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                    fieldErrors.address
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-amber-500'
                  }`}
                  placeholder="完整地址"
                />
                {fieldErrors.address && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">地標說明</label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                  placeholder="例：埔里酒廠對面"
                />
              </div>
            </div>

            {/* 聯絡資訊 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">聯絡資訊</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    電話號碼 *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={() => {
                      const error = validateField('phone', formData.phone)
                      setFieldErrors(prev => ({ ...prev, phone: error }))
                    }}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                      fieldErrors.phone
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-amber-500'
                    }`}
                    placeholder="例：049-291-5678"
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">LINE ID</label>
                  <input
                    type="text"
                    name="lineId"
                    value={formData.lineId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                    placeholder="例：@haudetea"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    營業時間 *
                  </label>
                  <input
                    type="text"
                    name="hours"
                    value={formData.hours}
                    onChange={handleInputChange}
                    onBlur={() => {
                      const error = validateField('hours', formData.hours)
                      setFieldErrors(prev => ({ ...prev, hours: error }))
                    }}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                      fieldErrors.hours
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-amber-500'
                    }`}
                    placeholder="例：09:00-19:00"
                  />
                  {fieldErrors.hours && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.hours}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">公休日</label>
                  <input
                    type="text"
                    name="closedDays"
                    value={formData.closedDays}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                    placeholder="例：週一公休"
                  />
                </div>
              </div>
            </div>

            {/* 交通資訊 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">交通資訊</h3>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">停車資訊</label>
                <input
                  type="text"
                  name="parking"
                  value={formData.parking}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                  placeholder="例：店前免費停車場（30個車位）"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">大眾運輸</label>
                <input
                  type="text"
                  name="publicTransport"
                  value={formData.publicTransport}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                  placeholder="例：埔里轉運站步行5分鐘"
                />
              </div>
            </div>

            {/* 特色服務 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">特色服務</h3>

              <div className="mb-4">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={e => updateFeatureField(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                      placeholder="輸入特色服務"
                    />
                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeatureField(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeatureField}
                  className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm"
                >
                  + 新增服務項目
                </button>
              </div>
            </div>

            {/* 主打商品 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">主打商品</h3>

              <div className="mb-4">
                {formData.specialties.map((specialty, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={specialty}
                      onChange={e => updateSpecialtyField(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                      placeholder="輸入主打商品"
                    />
                    {formData.specialties.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSpecialtyField(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSpecialtyField}
                  className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm"
                >
                  + 新增商品項目
                </button>
              </div>
            </div>

            {/* 其他設定 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">其他設定</h3>

              {/* 圖片上傳 */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  門市圖片 (選填)
                </label>
                <ImageUploader
                  productId={locationId}
                  module="locations"
                  maxFiles={1}
                  allowMultiple={false}
                  generateMultipleSizes={false}
                  enableCompression={true}
                  onUploadSuccess={handleImageUploadSuccess}
                  onUploadError={handleImageUploadError}
                  className="mb-4"
                />
                {uploadedImageUrl && (
                  <div className="mt-2 text-sm text-green-600">✓ 圖片上傳成功</div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isMain"
                  checked={formData.isMain}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm font-medium text-gray-800">設為總店</label>
              </div>
            </div>

            {/* 提交按鈕 */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/admin/locations"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-800 font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-amber-900 text-white rounded-md hover:bg-amber-800 transition-colors disabled:opacity-50"
              >
                {loading ? '新增中...' : '新增門市'}
              </button>
            </div>
          </form>

          {/* Preview */}
          <div className="lg:sticky lg:top-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">即時預覽</h3>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Preview Card */}
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-6 text-center relative">
                <div className="mb-3">
                  {uploadedImageUrl && isValidImageUrl(uploadedImageUrl) ? (
                    <SimpleImage
                      src={getFullImageUrl(uploadedImageUrl)}
                      alt="門市圖片"
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded-lg mx-auto border-2 border-white shadow-sm"
                    />
                  ) : formData.image && isValidImageUrl(formData.image) ? (
                    <SimpleImage
                      src={getFullImageUrl(formData.image)}
                      alt="門市圖片"
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded-lg mx-auto border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                      <span className="text-gray-400 text-sm">無圖片</span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {formData.title || '門市標題預覽'}
                </h3>
                <div className="text-sm text-gray-600">{formData.name || '門市名稱'}</div>
                {formData.isMain && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    總店
                  </span>
                )}
              </div>

              <div className="p-4">
                <div className="space-y-2 mb-4">
                  <div className="flex items-start">
                    <span className="mr-2 text-sm">📍</span>
                    <span className="text-sm text-gray-700">{formData.address || '門市地址'}</span>
                  </div>
                  {formData.landmark && (
                    <div className="text-xs text-gray-500 ml-5">{formData.landmark}</div>
                  )}
                  <div className="flex items-center">
                    <span className="mr-2 text-sm">📞</span>
                    <span className="text-sm text-gray-700">{formData.phone || '電話號碼'}</span>
                  </div>
                  {formData.lineId && (
                    <div className="flex items-center">
                      <span className="mr-2 text-sm">💬</span>
                      <span className="text-sm text-gray-700">LINE: {formData.lineId}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className="mr-2 text-sm">⏰</span>
                    <span className="text-sm text-gray-700">{formData.hours || '營業時間'}</span>
                  </div>
                  {formData.closedDays && (
                    <div className="text-xs text-gray-500 ml-5">{formData.closedDays}</div>
                  )}
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">特色服務</h4>
                  <div className="space-y-1">
                    {formData.features
                      .filter(f => f.trim())
                      .map((feature, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-600">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">主打商品</h4>
                  <div className="flex flex-wrap gap-1">
                    {formData.specialties
                      .filter(s => s.trim())
                      .map((specialty, index) => (
                        <span
                          key={index}
                          className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs"
                        >
                          {specialty}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
