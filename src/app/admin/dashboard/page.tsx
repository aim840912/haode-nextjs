'use client'

import Link from 'next/link'
import {
  BarChart3,
  Box,
  Archive,
  MessageSquare,
  Truck,
  Link2 as LinkIcon,
  Database,
  Settings,
  Bug,
  Monitor,
  FileText,
  Calendar,
  MapPin,
} from 'lucide-react'
import { AdminProtection } from '@/components/features/admin/AdminProtection'

export default function AdminDashboard() {
  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">管理控制台</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">豪德農場網站管理中心</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* 系統管理 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              系統管理
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 系統監控卡片 */}
              <Link href="/admin/monitoring" className="group">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 group-hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg group-hover:bg-cyan-200 dark:group-hover:bg-cyan-900/50 transition-colors">
                      <Monitor className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        系統監控
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">系統效能和網站分析</p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* 操作日誌卡片 */}
              <Link href="/admin/audit-logs" className="group">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 group-hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors">
                      <FileText className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        操作日誌
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">查看系統操作記錄</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* 快速操作卡片 */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* 產品管理卡片 */}
            <Link href="/admin/products" className="group">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 group-hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                    <Box className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      產品管理
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">管理農產品和商品資訊</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* 訂單管理卡片 */}
            <Link href="/admin/orders" className="group">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 group-hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                    <Archive className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      訂單管理
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">處理和追蹤客戶訂單</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* 詢問管理卡片 */}
            <Link href="/admin/inquiries" className="group">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 group-hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                    <MessageSquare className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      詢問管理
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">回覆客戶問題和諮詢</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* 農場導覽卡片 */}
            <Link href="/admin/farm-tour" className="group">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 group-hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                    <Truck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      農場導覽
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">管理導覽活動和預約</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* 行程管理卡片 */}
            <Link href="/admin/schedule" className="group">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 group-hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                    <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      行程管理
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">管理活動行程和排程</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* 門市管理卡片 */}
            <Link href="/admin/locations" className="group">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 group-hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-lg group-hover:bg-teal-200 dark:group-hover:bg-teal-900/50 transition-colors">
                    <MapPin className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      門市管理
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">管理門市據點資訊</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* 網站設定卡片 */}
            <Link href="/admin/site-settings" className="group">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 group-hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                    <Settings className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      網站設定
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">管理首頁和頁面圖片</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* 開發筆記卡片 */}
            <Link href="/admin/dev-notes" className="group">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 group-hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-lg group-hover:bg-rose-200 dark:group-hover:bg-rose-900/50 transition-colors">
                    <Bug className="h-8 w-8 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      開發筆記
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Bug 追蹤與待辦事項</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* 系統資訊 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              系統資訊
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-300">網站分析：</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Google Analytics 4 已啟用
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-300">追蹤狀態：</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">正常運作</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-300">資料庫：</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Supabase 連線正常
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-300">環境：</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {process.env.NODE_ENV === 'production' ? '正式環境' : '開發環境'}
                </span>
              </div>
            </div>
          </div>

          {/* 快速連結 */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
            <h3 className="flex items-center space-x-2 text-lg font-medium text-blue-900 dark:text-blue-300 mb-3">
              <LinkIcon className="h-5 w-5" />
              <span>外部連結</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="https://analytics.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Google Analytics 控制台</span>
                <span className="text-xs">↗</span>
              </a>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <Database className="h-4 w-4" />
                <span>Supabase 資料庫</span>
                <span className="text-xs">↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </AdminProtection>
  )
}
