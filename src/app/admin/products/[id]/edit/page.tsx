'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Product } from '@/types/product'
import Link from 'next/link'

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [productId, setProductId] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    emoji: '',
    description: '',
    category: 'fruits' as 'fruits' | 'coffee' | 'vegetables' | 'tea',
    price: 0,
    inventory: 0,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images: []
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