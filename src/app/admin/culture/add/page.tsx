'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '@/lib/logger'
import { useAuth } from '@/lib/auth-context'

// 動態載入圖片上傳器
const ImageUploader = dynamic(() => import('@/components/features/products/ImageUploader'), {
  loading: () => (
    <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
      載入圖片上傳器...
    </div>
  ),
  ssr: false,
})

export default function AddCulture() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { user, isLoading } = useAuth()
  const [cultureId] = useState(() => uuidv4())
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    height: 'h-64',
    imageUrl: '', // URL 圖片
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

  const heightOptions = [
    { name: '小型 (h-48)', value: 'h-48' },
    { name: '緊湊 (h-52)', value: 'h-52' },
    { name: '中小 (h-56)', value: 'h-56' },
    { name: '中等 (h-60)', value: 'h-60' },
    { name: '標準 (h-64)', value: 'h-64' },
    { name: '中大 (h-68)', value: 'h-68' },
    { name: '大型 (h-72)', value: 'h-72' },
    { name: '特大 (h-76)', value: 'h-76' },
  ]

  // 處理圖片上傳成功
  const handleImageUploadSuccess = (
    images: {
      id: string
      url?: string
      path: string
      size: 'thumbnail' | 'medium' | 'large'
      file?: File
      preview?: string
      position: number
      alt?: string
    }[]
  ) => {
    const urls = images.map(img => img.url || img.path).filter(Boolean)
    setUploadedImages(urls)
    if (urls.length > 0) {
      setFormData(prev => ({ ...prev, imageUrl: urls[0] }))
      logger.info('圖片上傳成功', {
        metadata: { imageUrl: urls[0], cultureId },
      })
    }
  }

  // 處理圖片上傳錯誤
  const handleImageUploadError = (error: string) => {
    logger.error('圖片上傳失敗', new Error(error), {
      metadata: { cultureId },
    })
    alert(`圖片上傳失敗: ${error}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      logger.info('📤 提交的資料', {
        metadata: {
          ...formData,
          uploadedImages: uploadedImages.length,
        },
      })

      // 準備 FormData 用於檔案上傳
      const submitData = new FormData()
      submitData.append('id', cultureId)
      submitData.append('title', formData.title)
      submitData.append('subtitle', formData.subtitle)
      submitData.append('description', formData.description)
      submitData.append('height', formData.height)

      // 使用上傳後的圖片 URL
      if (uploadedImages.length > 0) {
        submitData.append('imageUrl', uploadedImages[0])
        logger.info('🔗 使用已上傳圖片', {
          metadata: { imageUrl: uploadedImages[0], cultureId },
        })
      } else if (formData.imageUrl) {
        submitData.append('imageUrl', formData.imageUrl)
        logger.info('🔗 包含圖片 URL', {
          metadata: { imageUrl: formData.imageUrl, cultureId },
        })
      }

      const response = await fetch('/api/culture', {
        method: 'POST',
        body: submitData, // 使用 FormData 而不是 JSON
      })

      if (response.ok) {
        router.push('/admin/culture')
      } else {
        alert('新增失敗')
      }
    } catch (error) {
      logger.error(
        'Error adding culture item:',
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
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/admin/culture" className="text-orange-600 hover:text-orange-800">
              ← 回到時光典藏管理
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">新增時光典藏</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* 基本資訊 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">典藏標題 *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                placeholder="輸入典藏內容標題"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">副標題 *</label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                placeholder="輸入副標題"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">詳細描述 *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                placeholder="詳細描述時光典藏內容"
              />
            </div>

            {/* 圖片 URL */}
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-900 mb-2">
                典藏圖片 URL
              </label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={e => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                placeholder="https://example.com/image.jpg (選填，留空則使用色塊背景)"
              />
              {formData.imageUrl && (
                <div className="mt-2">
                  <Image
                    src={formData.imageUrl}
                    alt="圖片預覽"
                    width={128}
                    height={128}
                    className="h-32 w-32 object-cover rounded-lg border border-gray-300"
                    onError={e => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* 圖片上傳 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">典藏圖片</label>
              <ImageUploader
                productId={cultureId}
                idParamName="cultureId"
                apiEndpoint="/api/upload/images"
                onUploadSuccess={handleImageUploadSuccess}
                onUploadError={handleImageUploadError}
                maxFiles={1}
                allowMultiple={false}
                generateMultipleSizes={false}
                enableCompression={true}
                className="mb-4"
              />
              {uploadedImages.length > 0 && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ 已上傳 {uploadedImages.length} 張圖片
                </div>
              )}
            </div>

            {/* 卡片高度 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">卡片高度</label>
              <select
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              >
                {heightOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 提交按鈕 */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/admin/culture"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? '新增中...' : '新增典藏內容'}
              </button>
            </div>
          </form>

          {/* Preview */}
          <div className="lg:sticky lg:top-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">即時預覽</h3>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className={`relative ${formData.height} rounded-lg overflow-hidden`}>
                {formData.imageUrl || uploadedImages.length > 0 ? (
                  // 顯示圖片背景
                  <div className="relative w-full h-full">
                    <Image
                      src={uploadedImages[0] || formData.imageUrl}
                      alt="背景圖片"
                      fill
                      className="object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex flex-col justify-end">
                      <div>
                        <div className="text-white text-sm opacity-90 mb-2">
                          {formData.subtitle || '副標題預覽'}
                        </div>
                        <h3 className="text-white text-xl font-bold mb-3 drop-shadow-lg">
                          {formData.title || '標題預覽'}
                        </h3>
                        <p className="text-white text-sm opacity-90 leading-relaxed drop-shadow">
                          {formData.description || '描述內容預覽...'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // 顯示預設預覽
                  <div className="bg-gray-100 h-full p-6 rounded-lg relative flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-4">🖼️</div>
                      <p className="text-sm">使用上方的上傳器添加圖片</p>
                      <div className="mt-4 text-xs text-gray-400">
                        <p>標題: {formData.title || '未設定'}</p>
                        <p>副標題: {formData.subtitle || '未設定'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
