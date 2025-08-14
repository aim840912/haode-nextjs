'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Product } from '@/types/product'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [productId, setProductId] = useState<string>('')
  const { user, isLoading } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    emoji: '',
    description: '',
    category: 'fruits' as 'fruits' | 'coffee' | 'vegetables' | 'tea',
    price: 0,
    inventory: 0,
    images: [''],
    isActive: true
  })

  const fetchProduct = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`)
      if (response.ok) {
        const product: Product = await response.json()
        setFormData({
          name: product.name,
          emoji: product.emoji,
          description: product.description,
          category: product.category,
          price: product.price,
          inventory: product.inventory,
          images: product.images.length > 0 ? product.images : [''],
          isActive: product.isActive
        })
      } else {
        alert('產品不存在')
        router.push('/admin/products')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      alert('載入失敗')
    } finally {
      setInitialLoading(false)
    }
  }, [router])

  useEffect(() => {
    params.then(({ id }) => {
      setProductId(id)
      fetchProduct(id)
    })
  }, [params, fetchProduct])

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
    setLoading(true)

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images: formData.images.filter(img => img.trim() !== '')
        })
      })

      if (response.ok) {
        router.push('/admin/products')
      } else {
        alert('更新失敗')
      }
    } catch (error) {
      console.error('Error updating product:', error)
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
              產品圖示 (Emoji) *
            </label>
            <input
              type="text"
              name="emoji"
              value={formData.emoji}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
              placeholder="輸入 emoji，例如：🍑"
              maxLength={2}
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

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              產品分類 *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
            >
              <option value="fruits">水果類</option>
              <option value="coffee">咖啡類</option>
              <option value="vegetables">蔬菜類</option>
              <option value="tea">茶葉類</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                價格 (NT$) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                placeholder="0"
              />
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
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              產品圖片
            </label>
            <p className="text-xs text-gray-600 mb-3">
              支援 JPG、PNG、WebP 格式的圖片 URL。建議圖片尺寸為 400x400 像素以上。
            </p>
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
                      <div className="w-32 h-32 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                        <img
                          src={image}
                          alt={`產品圖片 ${index + 1}`}
                          className="max-w-full max-h-full object-cover"
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

          <div className="flex justify-end space-x-4 pt-6">
            <Link
              href="/admin/products"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-800 font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-amber-900 text-white rounded-md hover:bg-amber-800 transition-colors disabled:opacity-50"
            >
              {loading ? '更新中...' : '更新產品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}