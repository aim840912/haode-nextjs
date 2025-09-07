'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Product } from '@/types/product'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { logger } from '@/lib/logger'
import { useAuth } from '@/lib/auth-context'
import { useCSRFToken } from '@/hooks/useCSRFToken'

// 動態載入圖片上傳器，減少初始 bundle 大小
const ImageUploader = dynamic(() => import('@/components/ImageUploader'), {
  loading: () => <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">載入圖片上傳器...</div>,
  ssr: false
})

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [productId, setProductId] = useState<string>('')
  const [categories, setCategories] = useState<string[]>([])
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const { user, isLoading } = useAuth()
  const { token: csrfToken, loading: csrfLoading, error: csrfError } = useCSRFToken()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '季節水果',
    price: 0,
    salePrice: 0,
    isOnSale: false,
    saleEndDate: '',
    inventory: 0,
    images: [''],
    isActive: true,
    showInCatalog: true
  })

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/products/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch {
      // 忽略分類載入錯誤，不影響表單功能
    }
  }, [])

  const fetchProduct = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`)
      if (response.ok) {
        const responseData = await response.json()
        
        // 檢查回應格式是否正確
        if (!responseData.success || !responseData.data) {
          logger.error('產品資料格式錯誤', undefined, { metadata: { responseData } })
          alert('產品資料格式錯誤')
          router.push('/admin/products')
          return
        }
        
        const product: Product = responseData.data
        
        // 根據是否為特價商品來設定正確的價格顯示
        const isOnSale = product.isOnSale || false
        const displayPrice = isOnSale ? product.originalPrice || product.price : product.price
        const displaySalePrice = isOnSale ? product.price : 0
        
        setFormData({
          name: product.name,
          description: product.description,
          category: product.category,
          price: displayPrice, // 顯示原價
          salePrice: displaySalePrice, // 顯示特價
          isOnSale: isOnSale,
          saleEndDate: product.saleEndDate || '',
          inventory: product.inventory,
          images: product.images.length > 0 ? product.images : [''],
          isActive: product.isActive,
          showInCatalog: product.showInCatalog ?? true
        })
        
        logger.info('產品資料載入成功', { metadata: { productId: id, productName: product.name } })
      } else {
        const errorText = await response.text().catch(() => 'Unknown error')
        logger.error('產品載入失敗', undefined, { metadata: { productId: id, status: response.status, error: errorText } })
        alert(`產品不存在 (${response.status})`)
        router.push('/admin/products')
      }
    } catch (error) {
      logger.error('產品載入發生錯誤', error instanceof Error ? error : new Error(String(error)), { metadata: { productId: id } })
      alert(`載入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setInitialLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchCategories()
    params.then(({ id }) => {
      setProductId(id)
      fetchProduct(id)
    })
  }, [params, fetchProduct, fetchCategories])

  // 載入中狀態
  if (isLoading || initialLoading) {
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
    
    // 防止在 CSRF token 未準備好時提交
    if (csrfLoading || !csrfToken) {
      alert('請稍候，正在初始化安全驗證...')
      return
    }
    
    if (csrfError) {
      alert('安全驗證初始化失敗，請重新整理頁面')
      return
    }
    
    setLoading(true)

    try {
      // 根據是否為特價商品設定正確的價格
      const { salePrice: _unusedSalePrice, ...productDataWithoutSalePrice } = formData
      const productData = {
        ...productDataWithoutSalePrice,
        images: formData.images.filter(img => img.trim() !== ''),
        // 如果是特價商品，設定特價為當前售價，原價為 originalPrice
        // 如果不是特價商品，設定原價為當前售價，originalPrice 為 null
        price: formData.isOnSale ? formData.salePrice : formData.price,
        originalPrice: formData.isOnSale ? formData.price : null
      }


      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken
      }

      const response = await fetch(`/api/admin-proxy/products`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ id: productId, ...productData })
      })

      
      if (response.ok) {
        await response.json()
        router.push('/admin/products')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        alert(`更新失敗: ${errorData.error || response.status}`)
      }
    } catch {
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              value
    }))
  }

  const handleImageUploadSuccess = (images: Array<{ id: string; url?: string; path: string; size: string; position: number }>) => {
    const urls = images.map(img => img.url || img.path).filter(Boolean)
    setUploadedImages(prev => [...prev, ...urls])
    
    // 同時更新 formData 中的 images
    setFormData(prev => ({
      ...prev,
      images: [...prev.images.filter(img => img.trim() !== ''), ...urls]
    }))
  }

  const handleImageUploadError = (error: string) => {
    logger.error('圖片上傳錯誤', new Error(error))
    alert(`圖片上傳失敗: ${error}`)
  }


  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }))
  }

  const removeImageField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const updateImageField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? value : img)
    }))
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-900 font-medium">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              href="/admin/products"
              className="text-amber-600 hover:text-amber-800"
            >
              ← 回到產品列表
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">編輯產品</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              產品名稱 *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
              placeholder="輸入產品名稱"
            />
          </div>


          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              產品描述 *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
              placeholder="輸入產品描述"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              產品分類 *
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              onFocus={() => setShowCategorySuggestions(true)}
              onBlur={() => {
                // 延遲隱藏建議，讓點擊建議項目有時間執行
                setTimeout(() => setShowCategorySuggestions(false), 200)
              }}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
              placeholder="輸入產品分類或選擇現有分類"
            />
            
            {/* 分類建議下拉列表 */}
            {showCategorySuggestions && categories.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2 text-xs text-gray-500 bg-gray-50 border-b">
                  現有分類（點擊選擇）
                </div>
                {categories
                  .filter(category => 
                    category.toLowerCase().includes(formData.category.toLowerCase())
                  )
                  .map((category, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, category }))
                        setShowCategorySuggestions(false)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-amber-50 focus:bg-amber-50 focus:outline-none text-gray-900"
                    >
                      {category}
                    </button>
                  ))
                }
                {categories.filter(category => 
                  category.toLowerCase().includes(formData.category.toLowerCase())
                ).length === 0 && formData.category && (
                  <div className="px-3 py-2 text-gray-500 text-sm">
                    將建立新分類：&ldquo;{formData.category}&rdquo;
                  </div>
                )}
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-1">
              可輸入新分類或從現有分類中選擇
            </div>
          </div>

          {/* 價格設定 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">價格設定</h3>
            
            {/* 原價 - 必填 */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                原價 (NT$) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                placeholder="輸入產品原價"
              />
              <div className="text-xs text-gray-500 mt-1">
                產品的標準售價
              </div>
            </div>

            {/* 特價設定 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  name="isOnSale"
                  checked={formData.isOnSale}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded mr-2"
                />
                <label className="text-sm font-medium text-gray-800">
                  設為特價商品
                </label>
              </div>
              
              {formData.isOnSale && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        特價 (NT$) *
                      </label>
                      <input
                        type="number"
                        name="salePrice"
                        value={formData.salePrice}
                        onChange={handleInputChange}
                        required={formData.isOnSale}
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                        placeholder="輸入特價"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        特價結束日期
                      </label>
                      <input
                        type="date"
                        name="saleEndDate"
                        value={formData.saleEndDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                      />
                    </div>
                  </div>
                  
                  {formData.price > 0 && formData.salePrice > 0 && formData.price > formData.salePrice && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="text-sm text-green-800">
                        <span className="font-medium">折扣：</span>
                        {Math.round((1 - formData.salePrice / formData.price) * 100)}% OFF
                        <span className="ml-2">（省 NT$ {formData.price - formData.salePrice}）</span>
                      </div>
                    </div>
                  )}
                  
                  {formData.salePrice >= formData.price && formData.price > 0 && formData.salePrice > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <div className="text-sm text-red-800">
                        <span className="font-medium">注意：</span>
                        特價不能大於或等於原價
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              庫存數量 *
            </label>
            <input
              type="number"
              name="inventory"
              value={formData.inventory}
              onChange={handleInputChange}
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              產品圖片
            </label>
            <p className="text-xs text-gray-600 mb-3">
              支援上傳圖片檔案或輸入圖片 URL。建議圖片尺寸為 400x400 像素以上。
            </p>
            
            {/* 圖片上傳組件 */}
            <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">上傳新圖片</h4>
              <ImageUploader
                productId={productId}
                onUploadSuccess={handleImageUploadSuccess}
                onUploadError={handleImageUploadError}
                maxFiles={5}
                allowMultiple={true}
                generateMultipleSizes={false}
                enableCompression={true}
                className="mb-4"
              />
              {uploadedImages.length > 0 && (
                <div className="text-sm text-green-600">
                  本次編輯已上傳 {uploadedImages.length} 張新圖片
                </div>
              )}
            </div>

            {/* 現有圖片 URL 編輯 */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-3">現有圖片 URL</h4>
              <p className="text-xs text-gray-500 mb-3">
                可直接編輯現有的圖片 URL，或透過上方上傳組件新增圖片。
              </p>
            </div>
            <div className="space-y-4">
              {formData.images.map((image, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex gap-2 mb-3">
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => updateImageField(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                      placeholder="輸入圖片 URL"
                    />
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        title="刪除此圖片"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {image.trim() && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-600 mb-2">圖片預覽：</div>
                      <div className="w-32 h-32 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center relative">
                        <Image
                          src={image}
                          alt={`產品圖片 ${index + 1}`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="text-red-500 text-xs text-center p-2">圖片載入失敗<br/>請檢查 URL</div>';
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageField}
                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-sm"
              >
                + 新增圖片
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm font-medium text-gray-800">
                上架販售
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="showInCatalog"
                checked={formData.showInCatalog}
                onChange={handleInputChange}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm font-medium text-gray-800">
                顯示於產品介紹頁面
              </label>
              <span className="ml-2 text-xs text-gray-500">
                (取消勾選則此產品不會出現在前台產品頁面)
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <Link
              href="/admin/products"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-800 font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading || csrfLoading || !csrfToken}
              className="px-6 py-2 bg-amber-900 text-white rounded-md hover:bg-amber-800 transition-colors disabled:opacity-50"
            >
              {loading ? '更新中...' : csrfLoading ? '初始化中...' : '更新產品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}