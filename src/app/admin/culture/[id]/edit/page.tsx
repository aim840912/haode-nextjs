'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CultureItem } from '@/types/culture'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

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
    image: ''  // 新增上傳檔案的 base64 資料
  })
  
  // 新增檔案上傳相關狀態
  const [_imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [hasLocalPath, setHasLocalPath] = useState(false)

  const fetchCultureItem = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/culture/${id}`)
      if (response.ok) {
        const cultureItem: CultureItem = await response.json()
        // 檢查是否為本地檔案路徑
        const isLocalPath = !!(cultureItem.imageUrl && 
          (cultureItem.imageUrl.startsWith('/') || 
           cultureItem.imageUrl.startsWith('C:') || 
           cultureItem.imageUrl.startsWith('/mnt/') ||
           cultureItem.imageUrl.includes(':\\')))
        
        setHasLocalPath(isLocalPath)
        
        setFormData({
          title: cultureItem.title,
          subtitle: cultureItem.subtitle,
          description: cultureItem.description,
          color: cultureItem.color,
          height: cultureItem.height,
          textColor: cultureItem.textColor,
          imageUrl: isLocalPath ? '' : (cultureItem.imageUrl || ''),
          image: ''
        })
        
        // 如果是本地路徑，顯示在預覽中但清空 URL 欄位
        if (isLocalPath && cultureItem.imageUrl) {
          setImagePreview(cultureItem.imageUrl)
        }
      } else {
        alert('找不到該時光典藏項目')
        router.push('/admin/culture')
      }
    } catch (error) {
      console.error('Error fetching culture item:', error)
      alert('載入失敗')
      router.push('/admin/culture')
    }
  }, [router])

  // 取得參數並載入資料
  useEffect(() => {
    const loadData = async () => {
      try {
        const { id } = await params
        setCultureId(id)
        await fetchCultureItem(id)
      } catch (error) {
        console.error('Error loading data:', error)
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
    { name: '很高', value: 'h-96' }
  ]

  const textColorOptions = [
    { name: '白色', value: 'text-white' },
    { name: '黑色', value: 'text-black' },
    { name: '灰色', value: 'text-gray-700' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 準備要提交的資料，優先使用上傳的圖片
      const submitData = {
        ...formData,
        imageUrl: formData.image || formData.imageUrl // 上傳的圖片優先於 URL
      }
      
      console.log('📤 提交的編輯資料:', {
        ...submitData,
        imageUrl: submitData.imageUrl?.substring(0, 100) + (submitData.imageUrl?.length > 100 ? '...' : ''),
        hasLocalPath
      })
      
      const response = await fetch(`/api/culture/${cultureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        router.push('/admin/culture')
      } else {
        alert('更新失敗')
      }
    } catch (error) {
      console.error('Error updating culture item:', error)
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // 新增圖片上傳處理函數
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        setFormData(prev => ({ ...prev, image: result }))
        setHasLocalPath(false) // 清除本地路徑警告
      }
      reader.readAsDataURL(file)
    }
  }

  // 清除圖片函數
  const clearImage = () => {
    setImagePreview('')
    setImageFile(null)
    setFormData(prev => ({ ...prev, image: '', imageUrl: '' }))
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
          <form id="edit-culture-form" onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
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
                      原路徑: {imagePreview}
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
                onChange={(e) => {
                  handleInputChange(e)
                  // 如果輸入了新的 URL，清除上傳的圖片
                  if (e.target.value && imagePreview && !hasLocalPath) {
                    setImagePreview('')
                    setImageFile(null)
                    setFormData(prev => ({ ...prev, image: '' }))
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                placeholder="https://example.com/image.jpg (選填)"
              />
              {formData.imageUrl && !hasLocalPath && (
                <div className="mt-2">
                  <img 
                    src={formData.imageUrl} 
                    alt="圖片預覽" 
                    className="h-32 w-32 object-cover rounded-lg border border-gray-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* 圖片上傳 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                或上傳圖片檔案
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-orange-400 transition-colors">
                <div className="space-y-1 text-center">
                  {imagePreview && !hasLocalPath ? (
                    <div className="mb-4">
                      <img 
                        src={imagePreview} 
                        alt="預覽圖片" 
                        className="mx-auto h-32 w-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        移除圖片
                      </button>
                    </div>
                  ) : hasLocalPath ? (
                    <div className="mb-4">
                      <div className="text-center text-gray-500 py-8">
                        <div className="text-4xl mb-2">⚠️</div>
                        <p className="text-sm font-medium">本地檔案無法顯示</p>
                        <p className="text-xs mt-1">請重新上傳圖片</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearImage}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        清除並重新上傳
                      </button>
                    </div>
                  ) : (
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500">
                      <span>{imagePreview || hasLocalPath ? '重新上傳' : '上傳圖片'}</span>
                      <input 
                        id="image-upload" 
                        name="image-upload" 
                        type="file" 
                        className="sr-only" 
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="pl-1">或拖拽檔案到此處</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF 最大 10MB</p>
                </div>
              </div>
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
                {heightOptions.map((height) => (
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
                {textColorOptions.map((textColor) => (
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
                {(formData.imageUrl || imagePreview) ? (
                  // 顯示圖片背景
                  <div className="relative w-full h-full">
                    {hasLocalPath ? (
                      // 當是本地路徑時，顯示預設的無圖片狀態
                      <div className={`${formData.color} h-full p-6 rounded-lg relative overflow-hidden`}>
                        <div className={`${formData.textColor} h-full flex flex-col justify-between relative z-10`}>
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
                      <img 
                        src={imagePreview || formData.imageUrl} 
                        alt="背景圖片" 
                        className="w-full h-full object-cover rounded-lg"
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
                  <div className={`${formData.color} h-full p-6 rounded-lg relative overflow-hidden`}>
                    <div className={`${formData.textColor} h-full flex flex-col justify-between relative z-10`}>
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
                          了解更多
                        </div>
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