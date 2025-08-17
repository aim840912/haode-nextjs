'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/types/product'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { ComponentErrorBoundary } from '@/components/ErrorBoundary'

function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) {
      alert('請先登入')
      return
    }
    
    if (!confirm('確定要刪除此產品嗎？')) return
    
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      setProducts(products.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('刪除失敗')
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    if (!user) {
      alert('請先登入')
      return
    }
    
    try {
      await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })
      fetchProducts()
    } catch (error) {
      console.error('Error updating product:', error)
      alert('更新失敗')
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">產品管理</h1>
          <div className="space-x-4">
            {user?.role === 'admin' && (
              <Link 
                href="/admin/products/add"
                className="bg-amber-900 text-white px-6 py-2 rounded-lg hover:bg-amber-800 transition-colors"
              >
                新增產品
              </Link>
            )}
            <Link 
              href="/"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              回到首頁
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  產品
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分類
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  價格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  庫存
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.images[0] && (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">NT$ {product.price}</span>
                      {product.isOnSale && product.originalPrice && product.originalPrice > product.price && (
                        <>
                          <span className="text-xs text-gray-500 line-through">
                            NT$ {product.originalPrice}
                          </span>
                          <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-xs font-medium">
                            特價
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.inventory}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user?.role === 'admin' ? (
                      <button
                        onClick={() => toggleActive(product.id, product.isActive)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.isActive ? '上架中' : '已下架'}
                      </button>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? '上架中' : '已下架'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user?.role === 'admin' ? (
                      <div className="space-x-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="text-amber-600 hover:text-amber-900"
                        >
                          編輯
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          刪除
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">需要登入</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">尚無產品資料</p>
              <Link 
                href="/admin/products/add"
                className="inline-block mt-4 bg-amber-900 text-white px-6 py-2 rounded-lg hover:bg-amber-800 transition-colors"
              >
                新增第一個產品
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProductsAdminWithErrorBoundary() {
  return (
    <ComponentErrorBoundary>
      <ProductsAdmin />
    </ComponentErrorBoundary>
  )
}