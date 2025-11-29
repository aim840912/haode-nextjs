'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, Home, LogOut, Menu, User } from 'lucide-react'
import { useAdminSidebar } from '@/contexts/AdminSidebarContext'
import { useAuth } from '@/contexts/AuthContext'

// 頁面標題對應表
const pageTitles: Record<string, string> = {
  '/admin': '儀表板',
  '/admin/dashboard': '儀表板',
  '/admin/monitoring': '系統監控',
  '/admin/audit-logs': '操作日誌',
  '/admin/products': '產品管理',
  '/admin/orders': '訂單管理',
  '/admin/inquiries': '詢問管理',
  '/admin/farm-tour': '農場導覽',
  '/admin/schedule': '行程管理',
  '/admin/locations': '門市管理',
  '/admin/site-settings': '網站設定',
}

function getPageTitle(pathname: string): string {
  // 精確匹配
  if (pageTitles[pathname]) {
    return pageTitles[pathname]
  }

  // 前綴匹配（處理子頁面如 /admin/products/add）
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path) && path !== '/admin') {
      return title
    }
  }

  return '管理後台'
}

export function AdminHeader() {
  const pathname = usePathname()
  const { isCollapsed, openMobile } = useAdminSidebar()
  const { user, logout } = useAuth()

  const pageTitle = getPageTitle(pathname)

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header
      className={`
        fixed top-0 right-0 z-30 h-16
        bg-white dark:bg-slate-800
        border-b border-gray-200 dark:border-slate-700
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'lg:left-16' : 'lg:left-60'}
        left-0
      `}
    >
      <div className="flex items-center justify-between h-full px-4">
        {/* 左側：漢堡選單 + 標題 */}
        <div className="flex items-center gap-4">
          {/* 手機版漢堡選單 */}
          <button
            onClick={openMobile}
            className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700"
          >
            <Menu className="h-6 w-6" />
          </button>

          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{pageTitle}</h1>
        </div>

        {/* 右側：用戶資訊 */}
        <div className="flex items-center gap-2">
          {/* 前往前台按鈕 */}
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">前往前台</span>
            <ExternalLink className="h-3 w-3" />
          </Link>

          {/* 用戶選單 */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.email?.split('@')[0] || 'Admin'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="登出"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
