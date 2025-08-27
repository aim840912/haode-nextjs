'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/types/product'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useCSRFToken } from '@/hooks/useCSRFToken'
import SafeImage from './SafeImage'

interface ProductsTableProps {
  onDelete?: (id: string) => void
  onToggleActive?: (id: string, isActive: boolean) => void
  refreshTrigger?: number  // 外部觸發重新載入的信號
}

export default function ProductsTable({ onDelete, onToggleActive, refreshTrigger }: ProductsTableProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { token: csrfToken, loading: csrfLoading, error: csrfError } = useCSRFToken()

  useEffect(() => {
    fetchProducts()
  }, [])

  // 監聽外部重新載入觸發器
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchProducts()
    }
  }, [refreshTrigger])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 使用安全的 admin-proxy API，自動驗證管理員權限
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin-proxy/products?t=${timestamp}`, {
        cache: 'no-cache',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('ProductsTable fetchProducts - 獲取的資料:', data)
      
      // Admin API 回傳格式為 { products: [...] }
      const products = data.products || data
      setProducts(Array.isArray(products) ? products : [])
    } catch (error) {
      console.error('Error fetching products:', error)
      setError(error instanceof Error ? error.message : '載入產品資料失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) {
      alert('請先登入')
      return
    }
    
    if (!confirm('確定要刪除此產品嗎？這將同時刪除產品的所有圖片資料。')) return
    
    // 防止在 CSRF token 未準備好時執行
    if (csrfLoading || !csrfToken) {
      alert('請稍候，正在初始化安全驗證...')
      return
    }
    
    if (csrfError) {
      alert('安全驗證初始化失敗，請重新整理頁面')
      return
    }
    
    try {
      const headers: HeadersInit = {}
      
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken
      }

      const response = await fetch(`/api/admin-proxy/products?id=${id}`, { 
        method: 'DELETE',
        headers,
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      // 解析回應以取得刪除詳情
      const data = await response.json()
      
      // 立即從本地狀態移除產品，提供即時更新體驗
      setProducts(prevProducts => prevProducts.filter(p => p.id !== id))
      
      // 顯示詳細的刪除結果
      if (data.imageCleanup) {
        const { success, deletedCount, verification } = data.imageCleanup
        let message = '✅ 產品已成功刪除'
        
        if (success && deletedCount > 0) {
          message += `\n🖼️ 已清理 ${deletedCount} 個圖片檔案`
          if (verification?.verified) {
            message += '\n✅ 圖片清理已驗證完成'
          } else if (verification?.remainingFiles?.length > 0) {
            message += `\n⚠️ 發現 ${verification.remainingFiles.length} 個圖片檔案未完全清理`
          }
        } else if (deletedCount === 0) {
          message += '\nℹ️ 此產品沒有關聯的圖片檔案'
        } else if (!success) {
          message += `\n⚠️ 圖片清理失敗: ${data.imageCleanup.error || '未知錯誤'}`
        }
        
        alert(message)
      } else {
        alert('✅ 產品已成功刪除')
      }
      
      // 呼叫父組件的回調函數
      onDelete?.(id)
      
    } catch (error) {
      console.error('Error deleting product:', error)
      const errorMessage = error instanceof Error ? error.message : '刪除失敗，請稍後再試'
      alert(errorMessage)
      
      // 如果刪除失敗，重新獲取數據以確保狀態一致
      await fetchProducts()
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    if (!user) {
      alert('請先登入')
      return
    }
    
    const newActiveState = !isActive
    
    // 防止在 CSRF token 未準備好時執行
    if (csrfLoading || !csrfToken) {
      alert('請稍候，正在初始化安全驗證...')
      return
    }
    
    if (csrfError) {
      alert('安全驗證初始化失敗，請重新整理頁面')
      return
    }
    
    try {
      // 立即更新本地狀態以提供即時反饋
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === id ? { ...p, isActive: newActiveState } : p
        )
      )
      
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
        body: JSON.stringify({ id, isActive: newActiveState })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // 呼叫父組件的回調函數
      onToggleActive?.(id, newActiveState)
      
    } catch (error) {
      console.error('Error updating product:', error)
      alert('更新失敗，請稍後再試')
      
      // 如果更新失敗，恢復原始狀態
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === id ? { ...p, isActive: isActive } : p
        )
      )
    }
  }

  const handleToggleShowInCatalog = async (id: string, showInCatalog: boolean) => {
    if (!user) {
      alert('請先登入')
      return
    }
    
    const newShowState = !showInCatalog
    
    // 防止在 CSRF token 未準備好時執行
    if (csrfLoading || !csrfToken) {
      alert('請稍候，正在初始化安全驗證...')
      return
    }
    
    if (csrfError) {
      alert('安全驗證初始化失敗，請重新整理頁面')
      return
    }
    
    try {
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
        body: JSON.stringify({ id, showInCatalog: newShowState })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('handleToggleShowInCatalog - 更新成功:', result)
      
      // 更新成功後重新載入整個產品列表，確保資料同步
      await fetchProducts()
      
    } catch (error) {
      console.error('Error updating product:', error)
      alert('更新失敗，請稍後再試')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 mx-auto mb-4"></div>
          <p className="text-gray-600">載入產品資料中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchProducts}
            className="bg-amber-900 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors"
          >
            重新載入
          </button>
        </div>
      </div>
    )
  }

  return (
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
              上架狀態
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              產品頁顯示
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
                  <div className="relative mr-3" style={{ width: '48px', height: '48px' }}>
                    <SafeImage
                      src={product.images?.[0] || '/images/placeholder.jpg'}
                      alt={product.name || '產品圖片'}
                      fill
                      className="object-cover rounded"
                      sizes="48px"
                    />
                  </div>
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
                    onClick={() => handleToggleActive(product.id, product.isActive)}
                    disabled={csrfLoading || !csrfToken}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
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
              <td className="px-6 py-4 whitespace-nowrap">
                {(() => {
                  const showInCatalog = product.showInCatalog ?? true
                  return user?.role === 'admin' ? (
                    <button
                      onClick={() => handleToggleShowInCatalog(product.id, showInCatalog)}
                      disabled={csrfLoading || !csrfToken}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                        showInCatalog
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {showInCatalog ? '顯示中' : '已隱藏'}
                    </button>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      showInCatalog
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {showInCatalog ? '顯示中' : '已隱藏'}
                    </span>
                  )
                })()}
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
                      disabled={csrfLoading || !csrfToken}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
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
          {user?.role === 'admin' && (
            <Link 
              href="/admin/products/add"
              className="inline-block mt-4 bg-amber-900 text-white px-6 py-2 rounded-lg hover:bg-amber-800 transition-colors"
            >
              新增第一個產品
            </Link>
          )}
        </div>
      )}
    </div>
  )
}