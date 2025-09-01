'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/auth-context'
import { ComponentErrorBoundary } from '@/components/ErrorBoundary'
import AdminProtection from '@/components/AdminProtection'

// 動態載入管理端產品表格組件
const AdminProductsTable = dynamic(() => import('@/components/AdminProductsTable'), {
  loading: () => <div className="flex justify-center items-center h-64">載入產品清單中...</div>,
  ssr: false
})

function ProductsAdmin() {
  const { user } = useAuth()

  return (
    <AdminProtection>
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

        <Suspense fallback={
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 mx-auto mb-4"></div>
              <p className="text-gray-600">載入產品資料中...</p>
            </div>
          </div>
        }>
          <AdminProductsTable />
        </Suspense>
      </div>
    </div>
    </AdminProtection>
  )
}

ProductsAdmin.displayName = 'ProductsAdmin';

export default function ProductsAdminWithErrorBoundary() {
  return (
    <ComponentErrorBoundary>
      <ProductsAdmin />
    </ComponentErrorBoundary>
  )
}

ProductsAdminWithErrorBoundary.displayName = 'ProductsAdminWithErrorBoundary';