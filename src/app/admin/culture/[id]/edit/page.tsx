'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CultureItem } from '@/types/culture'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { logger } from '@/lib/logger'
import { useAuth } from '@/lib/auth-context'

// 動態載入圖片上傳器
const ImageUploader = dynamic(() => import('@/components/ImageUploader'), {
  loading: () => (
    <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
      載入圖片上傳器...
    </div>
  ),
  ssr: false,
})

export default function EditCulture({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [cultureId, setCultureId] = useState<string>('')

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    color: 'bg-gradient-to-br from-amber-400 to-amber-600',
    height: 'h-64',
    textColor: 'text-white',
    imageUrl: '',
  })
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])

  // 新增檔案上傳相關狀態
  const [hasLocalPath, setHasLocalPath] = useState(false)

  const fetchCultureItem = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/culture/${id}`)
        if (response.ok) {
          const cultureItem: CultureItem = await response.json()
          // 檢查是否為本地檔案路徑
          const isLocalPath = !!(
            cultureItem.imageUrl &&
            (cultureItem.imageUrl.startsWith('/') ||
              cultureItem.imageUrl.startsWith('C:') ||
              cultureItem.imageUrl.startsWith('/mnt/') ||
              cultureItem.imageUrl.includes(':\\'))
          )

          setHasLocalPath(isLocalPath)

          setFormData({
            title: cultureItem.title,
            subtitle: cultureItem.subtitle,
            description: cultureItem.description,
            color: cultureItem.color,
            height: cultureItem.height,
            textColor: cultureItem.textColor,
            imageUrl: isLocalPath ? '' : cultureItem.imageUrl || '',
          })

          // 設定現有圖片
          if (cultureItem.imageUrl && !isLocalPath) {
            setExistingImages([cultureItem.imageUrl])
          }
        } else {
          alert('找不到該時光典藏項目')
          router.push('/admin/culture')
        }
      } catch (error) {
        logger.error(
          '載入文化項目失敗',
          error instanceof Error ? error : new Error('Unknown error')
        )
        alert('載入失敗')
        router.push('/admin/culture')
      }
    },
    [router]
  )

  // 取得參數並載入資料
  useEffect(() => {
    const loadData = async () => {
      try {
        const { id } = await params
        setCultureId(id)
        await fetchCultureItem(id)
      } catch (error) {
        logger.error('載入資料失敗', error instanceof Error ? error : new Error('Unknown error'))
        alert('載入失敗')
        router.push('/admin/culture')
      } finally {
        setInitialLoading(false)
      }
    }

    loadData()
  }, [params, router, fetchCultureItem])

  // 載入中狀態
  if (isLoading || initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
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
    { name: '中等', value: 'h-64' },
    { name: '較高', value: 'h-80' },
    { name: '很高', value: 'h-96' },
  ]

  const textColorOptions = [
    { name: '白色', value: 'text-white' },
    { name: '黑色', value: 'text-black' },
    { name: '灰色', value: 'text-gray-700' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      logger.info('📤 提交的編輯資料', {
        metadata: {
          ...formData,
          uploadedImages: uploadedImages.length,
          existingImages: existingImages.length,
          hasLocalPath,
          cultureId,
        },
      })

      // 準備 FormData 用於檔案上傳
      const submitFormData = new FormData()
      submitFormData.append('title', formData.title)
      submitFormData.append('subtitle', formData.subtitle)
      submitFormData.append('description', formData.description)
      submitFormData.append('height', formData.height)

      // 使用上傳後的圖片 URL 或既有 URL
      if (uploadedImages.length > 0) {
        submitFormData.append('imageUrl', uploadedImages[0])
        logger.info('🔗 使用新上傳的圖片', {
          metadata: { imageUrl: uploadedImages[0], cultureId },
        })
      } else if (formData.imageUrl) {
        submitFormData.append('imageUrl', formData.imageUrl)
        logger.info('🔗 保持現有的圖片 URL', {
          metadata: { imageUrl: formData.imageUrl, cultureId },
        })
      }

      const response = await fetch(`/api/culture/${cultureId}`, {
        method: 'PUT',
        body: submitFormData, // 使用 FormData
      })

      if (response.ok) {
        router.push('/admin/culture')
      } else {
        alert('更新失敗')
      }
    } catch (error) {
      logger.error(
        'Error updating culture item:',
        error instanceof Error ? error : new Error('Unknown error')
      )
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

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
      setHasLocalPath(false) // 清除本地路徑警告
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

  // 清除圖片函數
  const clearImage = () => {
    setUploadedImages([])
    setExistingImages([])
    setFormData(prev => ({ ...prev, imageUrl: '' }))
    setHasLocalPath(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">編輯時光典藏</h1>
              <p className="text-gray-600 mt-2">修改典藏內容的詳細資訊</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/admin/culture"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </Link>
              <button
                type="submit"
                form="edit-culture-form"
                disabled={loading}
                className="px-6 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '儲存中...' : '儲存變更'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 編輯表單 */}
          <form
            id="edit-culture-form"
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-md p-6 space-y-6"
          >
            {/* 標題 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
                標題
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                placeholder="輸入標題"
              />
            </div>

            {/* 副標題 */}
            <div>
              <label htmlFor="subtitle" className="block text-sm font-medium text-gray-900 mb-2">
                副標題
              </label>
              <input
                type="text"
                id="subtitle"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                placeholder="輸入副標題"
              />
            </div>

            {/* 描述 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
                描述
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                placeholder="詳細描述時光典藏內容"
              />
            </div>

            {/* 本地路徑警告 */}
            {hasLocalPath && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong className="font-medium">⚠️ 偵測到本地檔案路徑</strong>
                    </p>
                    <p className="mt-1 text-sm text-yellow-600">
                      目前的圖片使用本地檔案路徑，無法在網頁中正常顯示。請使用下方的圖片上傳功能或輸入有效的網址。
                    </p>
                    <p className="mt-1 text-xs text-yellow-500 font-mono bg-yellow-100 px-2 py-1 rounded">
                      原路徑: (本地路徑)
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                onChange={e => {
                  handleInputChange(e)
                  // 如果輸入了新的 URL，清除上傳的圖片
                  if (e.target.value && !hasLocalPath) {
                    setUploadedImages([])
                    setExistingImages([])
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                placeholder="https://example.com/image.jpg (選填)"
              />
              {formData.imageUrl && !hasLocalPath && (
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
                productId={cultureId || 'temp-culture-id'}
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
              {hasLocalPath && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={clearImage}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    清除本地路徑並重新上傳
                  </button>
                </div>
              )}
            </div>

            {/* 高度選擇 */}
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-900 mb-2">
                卡片高度
              </label>
              <select
                id="height"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              >
                {heightOptions.map(height => (
                  <option key={height.value} value={height.value}>
                    {height.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 文字色彩 */}
            <div>
              <label htmlFor="textColor" className="block text-sm font-medium text-gray-900 mb-2">
                文字色彩
              </label>
              <select
                id="textColor"
                name="textColor"
                value={formData.textColor}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              >
                {textColorOptions.map(textColor => (
                  <option key={textColor.value} value={textColor.value}>
                    {textColor.name}
                  </option>
                ))}
              </select>
            </div>
          </form>

          {/* 即時預覽 */}
          <div className="lg:sticky lg:top-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">即時預覽</h3>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className={`relative ${formData.height} rounded-lg overflow-hidden`}>
                {formData.imageUrl || uploadedImages.length > 0 || existingImages.length > 0 ? (
                  // 顯示圖片背景
                  <div className="relative w-full h-full">
                    {hasLocalPath ? (
                      // 當是本地路徑時，顯示預設的無圖片狀態
                      <div
                        className={`${formData.color} h-full p-6 rounded-lg relative overflow-hidden`}
                      >
                        <div
                          className={`${formData.textColor} h-full flex flex-col justify-between relative z-10`}
                        >
                          <div>
                            <div className="text-sm opacity-80 mb-2">
                              {formData.subtitle || '副標題預覽'}
                            </div>
                            <h3 className="text-xl font-bold mb-3">
                              {formData.title || '標題預覽'}
                            </h3>
                            <p className="text-sm opacity-90 leading-relaxed">
                              {formData.description || '描述內容預覽...'}
                            </p>
                          </div>
                          <div className="mt-4">
                            <div className="inline-flex items-center text-sm opacity-80">
                              📷 請重新上傳圖片
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={uploadedImages[0] || existingImages[0] || formData.imageUrl}
                        alt="背景圖片"
                        fill
                        className="object-cover rounded-lg"
                      />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-30 p-6 flex flex-col justify-between">
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
                  // 顯示色塊背景
                  <div
                    className={`${formData.color} h-full p-6 rounded-lg relative overflow-hidden`}
                  >
                    <div
                      className={`${formData.textColor} h-full flex flex-col justify-between relative z-10`}
                    >
                      <div>
                        <div className="text-sm opacity-80 mb-2">
                          {formData.subtitle || '副標題預覽'}
                        </div>
                        <h3 className="text-xl font-bold mb-3">{formData.title || '標題預覽'}</h3>
                        <p className="text-sm opacity-90 leading-relaxed">
                          {formData.description || '描述內容預覽...'}
                        </p>
                      </div>
                      <div className="mt-4">
                        <div className="inline-flex items-center text-sm opacity-80">了解更多</div>
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
