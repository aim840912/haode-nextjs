'use client'

import Link from 'next/link'
import {
  ChartBarIcon,
  CubeIcon,
  ArchiveBoxIcon,
  ChatBubbleLeftRightIcon,
  TruckIcon,
  LinkIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  BugAntIcon,
} from '@heroicons/react/24/outline'
import { AdminProtection } from '@/components/features/admin/AdminProtection'

export default function AdminDashboard() {
  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">管理控制台</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">豪德農場網站管理中心</p>
              </div>
              <div className="flex space-x-4">
                <Link
                  href="/admin/analytics"
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  網站分析
                </Link>
                <Link
                  href="/"
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
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
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 group-hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <ChartBarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      網站分析
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      查看訪客統計和行為分析
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* 產品管理卡片 */}
            <Link href="/admin/products" className="group">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 group-hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                    <CubeIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
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
                    <ArchiveBoxIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
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

            {/* 諮詢管理卡片 */}
            <Link href="/admin/inquiries" className="group">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 group-hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                    <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      客戶諮詢
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
                    <TruckIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
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

            {/* 網站設定卡片 */}
            <Link href="/admin/site-settings" className="group">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 group-hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                    <Cog6ToothIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
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
                    <BugAntIcon className="h-8 w-8 text-rose-600 dark:text-rose-400" />
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
                <ChartBarIcon className="h-4 w-4" />
                <span>Google Analytics 控制台</span>
                <span className="text-xs">↗</span>
              </a>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <CircleStackIcon className="h-4 w-4" />
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
