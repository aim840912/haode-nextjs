'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { AdminProtection } from '@/components/features/admin/AdminProtection'
import { ComponentErrorBoundary } from '@/components/ui/error/ErrorBoundary'
import { useAuth } from '@/contexts/AuthContext'

// 動態載入管理端產品表格組件
const AdminProductsTable = dynamic(
  () =>
    import('@/components/features/products/AdminProductsTable').then(mod => mod.AdminProductsTable),
  {
    loading: () => <div className="flex justify-center items-center h-64">載入產品清單中...</div>,
    ssr: false,
  }
)

function ProductsAdmin() {
  const { user } = useAuth()

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">產品管理</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">管理農產品和商品資訊</p>
              </div>

              {/* 操作按鈕組 */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {user?.role === 'admin' && (
                  <Link
                    href="/admin/products/add"
                    className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 bg-green-600 dark:bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    新增產品
                  </Link>
                )}
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 bg-gray-600 dark:bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  查看產品頁面
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <Suspense
            fallback={
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 dark:border-amber-400 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-300">載入產品資料中...</p>
                </div>
              </div>
            }
          >
            <AdminProductsTable />
          </Suspense>
        </div>
      </div>
    </AdminProtection>
  )
}

ProductsAdmin.displayName = 'ProductsAdmin'

export default function ProductsAdminWithErrorBoundary() {
  return (
    <ComponentErrorBoundary>
      <ProductsAdmin />
    </ComponentErrorBoundary>
  )
}

ProductsAdminWithErrorBoundary.displayName = 'ProductsAdminWithErrorBoundary'
