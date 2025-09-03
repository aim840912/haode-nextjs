'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Product } from '@/types/product'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useCSRFToken } from '@/hooks/useCSRFToken'
import { useToast } from '@/components/Toast'
import SafeImage from './SafeImage'
import { logger } from '@/lib/logger'
import AdminProductFilter, { AdminFilterState } from './AdminProductFilter'

interface AdminProductsTableProps {
  onDelete?: (id: string) => void
  onToggleActive?: (id: string, isActive: boolean) => void
  refreshTrigger?: number
}

// 搜尋歷史記錄管理
const SEARCH_HISTORY_KEY = 'admin_product_search_history'
const MAX_SEARCH_HISTORY = 5

class SearchHistoryManager {
  static getHistory(): string[] {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]')
    } catch {
      return []
    }
  }

  static addToHistory(searchTerm: string): void {
    if (typeof window === 'undefined' || !searchTerm.trim()) return

    const history = this.getHistory()
    const filtered = history.filter(term => term !== searchTerm)
    const newHistory = [searchTerm, ...filtered].slice(0, MAX_SEARCH_HISTORY)

    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
    } catch (error) {
      logger.warn('Failed to save search history', { error, module: 'SearchHistoryManager', action: 'addToHistory' })
    }
  }

  static clearHistory(): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY)
    } catch (error) {
      logger.warn('Failed to clear search history', { error, module: 'SearchHistoryManager', action: 'clearHistory' })
    }
  }
}

export default function AdminProductsTable({
  onDelete,
  onToggleActive,
  refreshTrigger,
}: AdminProductsTableProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AdminFilterState>({
    search: '',
    categories: [],
    availability: 'all',
    status: 'all',
    catalogVisibility: 'all',
    priceRange: { min: 0, max: 10000 },
    sortBy: 'name',
  })
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  const { user } = useAuth()
  const { token: csrfToken, loading: csrfLoading, error: csrfError } = useCSRFToken()
  const { success, error: errorToast, warning, loading: loadingToast, removeToast } = useToast()

  useEffect(() => {
    fetchProducts()
    setSearchHistory(SearchHistoryManager.getHistory())
  }, [])

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchProducts()
    }
  }, [refreshTrigger])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin-proxy/products?t=${timestamp}`, {
        cache: 'no-cache',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const products = data.products || data
      setProducts(Array.isArray(products) ? products : [])
    } catch (error) {
      logger.error('Error fetching products', error as Error, {
        metadata: { component: 'AdminProductsTable' },
      })
      setError(error instanceof Error ? error.message : '載入產品資料失敗')
    } finally {
      setLoading(false)
    }
  }

  // 獲取所有可用類別
  const availableCategories = useMemo(() => {
    const categories = [...new Set(products.map(product => product.category))]
    return categories.sort()
  }, [products])

  // 篩選和排序產品
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products]

    // 搜尋篩選
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm) ||
          product.id.toLowerCase().includes(searchTerm)
      )
    }

    // 類別篩選
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product => filters.categories.includes(product.category))
    }

    // 庫存狀態篩選
    if (filters.availability === 'in_stock') {
      filtered = filtered.filter(product => product.inventory > 0)
    } else if (filters.availability === 'out_of_stock') {
      filtered = filtered.filter(product => product.inventory <= 0)
    }

    // 上架狀態篩選
    if (filters.status === 'active') {
      filtered = filtered.filter(product => product.isActive)
    } else if (filters.status === 'inactive') {
      filtered = filtered.filter(product => !product.isActive)
    }

    // 目錄顯示篩選
    if (filters.catalogVisibility === 'visible') {
      filtered = filtered.filter(product => product.showInCatalog ?? true)
    } else if (filters.catalogVisibility === 'hidden') {
      filtered = filtered.filter(product => !(product.showInCatalog ?? true))
    }

    // 價格區間篩選
    if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) {
      filtered = filtered.filter(
        product =>
          product.price >= filters.priceRange.min && product.price <= filters.priceRange.max
      )
    }

    // 排序
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_low':
          return a.price - b.price
        case 'price_high':
          return b.price - a.price
        case 'category':
          return a.category.localeCompare(b.category)
        case 'inventory':
          return b.inventory - a.inventory
        case 'created_desc':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        case 'created_asc':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return filtered
  }, [products, filters])

  const handleFilterChange = useCallback(
    (newFilters: AdminFilterState) => {
      setFilters(newFilters)

      // 如果有搜尋詞且與之前不同，加入歷史記錄
      if (newFilters.search && newFilters.search !== filters.search && newFilters.search.trim()) {
        SearchHistoryManager.addToHistory(newFilters.search.trim())
        setSearchHistory(SearchHistoryManager.getHistory())
      }
    },
    [filters.search]
  )

  const handleDelete = async (id: string) => {
    if (!user) {
      warning('請先登入', '您需要登入後才能刪除產品')
      return
    }

    const productToDelete = products.find(p => p.id === id)
    const productName = productToDelete?.name || '產品'

    if (!confirm(`確定要刪除「${productName}」嗎？這將同時刪除產品的所有圖片資料。`)) return

    if (csrfLoading || !csrfToken) {
      warning('請稍候', '正在初始化安全驗證...')
      return
    }

    if (csrfError) {
      errorToast('安全驗證失敗', '請重新整理頁面後再試')
      return
    }

    const loadingId = loadingToast('刪除產品中', `正在刪除「${productName}」...`)

    try {
      const headers: HeadersInit = {}

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken
      }

      const response = await fetch(`/api/admin-proxy/products?id=${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      removeToast(loadingId)
      setProducts(prevProducts => prevProducts.filter(p => p.id !== id))

      if (data.imageCleanup) {
        const { success: imageSuccess, deletedCount, verification } = data.imageCleanup
        let message = `產品「${productName}」已成功刪除`

        if (imageSuccess && deletedCount > 0) {
          message += `\n🖼️ 已清理 ${deletedCount} 個圖片檔案`
          if (verification?.verified) {
            message += '\n✅ 圖片清理已驗證完成'
          } else if (verification?.remainingFiles?.length > 0) {
            message += `\n⚠️ 發現 ${verification.remainingFiles.length} 個圖片檔案未完全清理`
          }
        } else if (deletedCount === 0) {
          message += '\nℹ️ 此產品沒有關聯的圖片檔案'
        } else if (!imageSuccess) {
          message += `\n⚠️ 圖片清理失敗: ${data.imageCleanup.error || '未知錯誤'}`
        }

        success('刪除成功', message)
      } else {
        success('刪除成功', `產品「${productName}」已成功刪除`)
      }

      onDelete?.(id)
    } catch (error) {
      logger.error('Error deleting product', error as Error, {
        metadata: { productId: id, component: 'AdminProductsTable' },
      })
      removeToast(loadingId)

      const errorMessage = error instanceof Error ? error.message : '刪除失敗，請稍後再試'
      errorToast('刪除失敗', `無法刪除產品「${productName}」: ${errorMessage}`, [
        {
          label: '重試',
          onClick: () => handleDelete(id),
          variant: 'primary',
        },
      ])

      await fetchProducts()
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    if (!user) {
      warning('請先登入', '您需要登入後才能修改產品狀態')
      return
    }

    const productToUpdate = products.find(p => p.id === id)
    const productName = productToUpdate?.name || '產品'
    const newActiveState = !isActive
    const actionText = newActiveState ? '啟用' : '停用'

    if (csrfLoading || !csrfToken) {
      warning('請稍候', '正在初始化安全驗證...')
      return
    }

    if (csrfError) {
      errorToast('安全驗證失敗', '請重新整理頁面後再試')
      return
    }

    try {
      setProducts(prevProducts =>
        prevProducts.map(p => (p.id === id ? { ...p, isActive: newActiveState } : p))
      )

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken
      }

      const response = await fetch(`/api/admin-proxy/products`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ id, isActive: newActiveState }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      success(`${actionText}成功`, `產品「${productName}」已${actionText}`)
      onToggleActive?.(id, newActiveState)
    } catch (error) {
      logger.error('Error updating product', error as Error, {
        metadata: { productId: id, component: 'AdminProductsTable' },
      })

      const errorMessage = error instanceof Error ? error.message : '更新失敗，請稍後再試'
      errorToast(`${actionText}失敗`, `無法${actionText}產品「${productName}」: ${errorMessage}`, [
        {
          label: '重試',
          onClick: () => handleToggleActive(id, isActive),
          variant: 'primary',
        },
      ])

      setProducts(prevProducts =>
        prevProducts.map(p => (p.id === id ? { ...p, isActive: isActive } : p))
      )
    }
  }

  const handleToggleShowInCatalog = async (id: string, showInCatalog: boolean) => {
    if (!user) {
      warning('請先登入', '您需要登入後才能修改產品目錄狀態')
      return
    }

    const productToUpdate = products.find(p => p.id === id)
    const productName = productToUpdate?.name || '產品'
    const newShowState = !showInCatalog
    const actionText = newShowState ? '顯示在目錄' : '從目錄隱藏'

    if (csrfLoading || !csrfToken) {
      warning('請稍候', '正在初始化安全驗證...')
      return
    }

    if (csrfError) {
      errorToast('安全驗證失敗', '請重新整理頁面後再試')
      return
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken
      }

      const response = await fetch(`/api/admin-proxy/products`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ id, showInCatalog: newShowState }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      await fetchProducts()
      success(`${actionText}成功`, `產品「${productName}」已${actionText}`)
    } catch (error) {
      logger.error('Error updating product', error as Error, {
        metadata: { productId: id, component: 'AdminProductsTable' },
      })

      const errorMessage = error instanceof Error ? error.message : '更新失敗，請稍後再試'
      errorToast(`${actionText}失敗`, `無法${actionText}產品「${productName}」: ${errorMessage}`, [
        {
          label: '重試',
          onClick: () => handleToggleShowInCatalog(id, showInCatalog),
          variant: 'primary',
        },
      ])
    }
  }

  const clearSearchHistory = () => {
    SearchHistoryManager.clearHistory()
    setSearchHistory([])
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminProductFilter
          onFilterChange={handleFilterChange}
          availableCategories={[]}
          productCount={0}
          totalCount={0}
          loading={true}
        />
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 mx-auto mb-4"></div>
            <p className="text-gray-600">載入產品資料中...</p>
          </div>
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
    <div className="space-y-6">
      {/* Filter Component */}
      <AdminProductFilter
        onFilterChange={handleFilterChange}
        availableCategories={availableCategories}
        productCount={filteredAndSortedProducts.length}
        totalCount={products.length}
        loading={loading}
      />

      {/* Search History */}
      {searchHistory.length > 0 && filters.search === '' && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">最近搜尋</h3>
            <button
              onClick={clearSearchHistory}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              清除歷史
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((term, index) => (
              <button
                key={index}
                onClick={() => setFilters(prev => ({ ...prev, search: term }))}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products Table */}
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
            {filteredAndSortedProducts.map(product => (
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
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">NT$ {product.price}</span>
                    {product.isOnSale &&
                      product.originalPrice &&
                      product.originalPrice > product.price && (
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
                  <span
                    className={`font-medium ${product.inventory <= 0 ? 'text-red-600' : product.inventory <= 10 ? 'text-yellow-600' : 'text-green-600'}`}
                  >
                    {product.inventory}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user?.role === 'admin' ? (
                    <button
                      onClick={() => handleToggleActive(product.id, product.isActive)}
                      disabled={csrfLoading || !csrfToken}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                        product.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {product.isActive ? '上架中' : '已下架'}
                    </button>
                  ) : (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
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
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {showInCatalog ? '顯示中' : '已隱藏'}
                      </button>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          showInCatalog ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
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

        {filteredAndSortedProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">沒有找到符合條件的產品</p>
            {user?.role === 'admin' && products.length === 0 && (
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
    </div>
  )
}
