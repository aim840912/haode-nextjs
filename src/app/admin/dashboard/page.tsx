'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import {
  ClockIcon,
  LockClosedIcon,
  ChartBarIcon,
  CubeIcon,
  ArchiveBoxIcon,
  ChatBubbleLeftRightIcon,
  TruckIcon,
  NewspaperIcon,
  LinkIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const { user, isLoading } = useAuth()

  // 除錯信息（僅在開發環境中顯示）
  if (process.env.NODE_ENV === 'development') {
    console.log('AdminDashboard render:', { user: !!user, isLoading })
  }

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <ClockIcon className="h-12 w-12 text-gray-400 animate-pulse" />
          </div>
          <p className="text-gray-600">載入中...</p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-gray-400 mt-2">Debug: Auth loading...</p>
          )}
        </div>
      </div>
    )
  }

  // 未登入檢查
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="flex justify-center mb-8">
            <LockClosedIcon className="h-16 w-16 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">需要登入</h1>
          <p className="text-gray-600 mb-8">此頁面需要管理員權限才能存取</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 mb-4 bg-gray-100 p-2 rounded">
              Debug: User not authenticated - redirecting to login
            </div>
          )}
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">管理控制台</h1>
              <p className="text-gray-600 mt-2">豪德農場網站管理中心</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/admin/analytics"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📊 網站分析
              </Link>
              <Link
                href="/"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                回到首頁
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 快速操作卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* 網站分析卡片 */}
          <Link href="/admin/analytics" className="group">
            <div className="bg-white p-6 rounded-xl shadow-sm border group-hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">網站分析</h3>
                  <p className="text-sm text-gray-600">查看訪客統計和行為分析</p>
                </div>
              </div>
            </div>
          </Link>

          {/* 產品管理卡片 */}
          <Link href="/admin/products" className="group">
            <div className="bg-white p-6 rounded-xl shadow-sm border group-hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <CubeIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">產品管理</h3>
                  <p className="text-sm text-gray-600">管理農產品和商品資訊</p>
                </div>
              </div>
            </div>
          </Link>

          {/* 訂單管理卡片 */}
          <Link href="/admin/orders" className="group">
            <div className="bg-white p-6 rounded-xl shadow-sm border group-hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                  <ArchiveBoxIcon className="h-8 w-8 text-amber-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">訂單管理</h3>
                  <p className="text-sm text-gray-600">處理和追蹤客戶訂單</p>
                </div>
              </div>
            </div>
          </Link>

          {/* 諮詢管理卡片 */}
          <Link href="/admin/inquiries" className="group">
            <div className="bg-white p-6 rounded-xl shadow-sm border group-hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">客戶諮詢</h3>
                  <p className="text-sm text-gray-600">回覆客戶問題和諮詢</p>
                </div>
              </div>
            </div>
          </Link>

          {/* 農場導覽卡片 */}
          <Link href="/admin/farm-tour" className="group">
            <div className="bg-white p-6 rounded-xl shadow-sm border group-hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                  <TruckIcon className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">農場導覽</h3>
                  <p className="text-sm text-gray-600">管理導覽活動和預約</p>
                </div>
              </div>
            </div>
          </Link>

          {/* 新聞管理卡片 */}
          <Link href="/admin/news" className="group">
            <div className="bg-white p-6 rounded-xl shadow-sm border group-hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <NewspaperIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">最新消息</h3>
                  <p className="text-sm text-gray-600">發佈和管理農場消息</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 系統資訊 */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">系統資訊</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">網站分析：</span>
              <span className="text-green-600 font-medium">Google Analytics 4 已啟用</span>
            </div>
            <div>
              <span className="text-gray-600">追蹤狀態：</span>
              <span className="text-blue-600 font-medium">正常運作</span>
            </div>
            <div>
              <span className="text-gray-600">資料庫：</span>
              <span className="text-green-600 font-medium">Supabase 連線正常</span>
            </div>
            <div>
              <span className="text-gray-600">環境：</span>
              <span className="text-amber-600 font-medium">
                {process.env.NODE_ENV === 'production' ? '正式環境' : '開發環境'}
              </span>
            </div>
          </div>
        </div>

        {/* 快速連結 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="flex items-center space-x-2 text-lg font-medium text-blue-900 mb-3">
            <LinkIcon className="h-5 w-5" />
            <span>外部連結</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-blue-700 hover:text-blue-800"
            >
              <ChartBarIcon className="h-4 w-4" />
              <span>Google Analytics 控制台</span>
              <span className="text-xs">↗</span>
            </a>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-blue-700 hover:text-blue-800"
            >
              <CircleStackIcon className="h-4 w-4" />
              <span>Supabase 資料庫</span>
              <span className="text-xs">↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
