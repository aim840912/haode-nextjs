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
  const [locationId] = useState(() => `location-${Date.now()}`)
  const { user, isLoading } = useAuth()

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

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
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

    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        router.push('/admin/locations')
      } else {
        alert('新增失敗')
      }
    } catch (error) {
      logger.error(
        'Error creating location:',
        error instanceof Error ? error : new Error('Unknown error')
      )
      alert('新增失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
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
    alert(`圖片上傳失敗: ${error}`)
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
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
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
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                    placeholder="例：總店"
                  />
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
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                    placeholder="例：豪德茶業總店"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">門市地址 *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                  placeholder="完整地址"
                />
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
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                    placeholder="例：049-291-5678"
                  />
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
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                    placeholder="例：09:00-19:00"
                  />
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
