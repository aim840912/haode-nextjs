'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/auth-context'
import { ComponentErrorBoundary } from '@/components/ui/error/ErrorBoundary'
import AdminProtection from '@/components/features/admin/AdminProtection'

// 動態載入管理端精彩時刻表格組件
const AdminMomentsTable = dynamic(() => import('@/components/features/moments/AdminMomentsTable'), {
  loading: () => <div className="flex justify-center items-center h-64">載入精彩時刻清單中...</div>,
  ssr: false,
})

function MomentsAdmin() {
  const { user } = useAuth()

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">精彩時刻管理</h1>
            <div className="space-x-4">
              {user?.role === 'admin' && (
                <Link
                  href="/admin/moments/add"
                  className="bg-amber-900 text-white px-6 py-2 rounded-lg hover:bg-amber-800 transition-colors"
                >
                  新增精彩時刻
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

          <Suspense
            fallback={
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">載入精彩時刻資料中...</p>
                </div>
              </div>
            }
          >
            <AdminMomentsTable />
          </Suspense>
        </div>
      </div>
    </AdminProtection>
  )
}

MomentsAdmin.displayName = 'MomentsAdmin'

export default function MomentsAdminWithErrorBoundary() {
  return (
    <ComponentErrorBoundary>
      <MomentsAdmin />
    </ComponentErrorBoundary>
  )
}

MomentsAdminWithErrorBoundary.displayName = 'MomentsAdminWithErrorBoundary'
