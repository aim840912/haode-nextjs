'use client'

import Link from 'next/link'

interface AdminMenuContentProps {
  onMenuItemClick: () => void
  stats?: {
    unread_count: number
  }
}

export function AdminMenuContent({ onMenuItemClick, stats }: AdminMenuContentProps) {
  return (
    <div className="py-2">
      {/* 系統管理 */}
      <div className="px-3 py-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">系統管理</p>
      </div>
      <Link
        href="/admin/dashboard"
        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-900"
        onClick={onMenuItemClick}
      >
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
        管理儀表板
      </Link>
      <Link
        href="/admin/monitoring"
        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-900"
        onClick={onMenuItemClick}
      >
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
        </svg>
        系統監控
      </Link>
      <Link
        href="/admin/audit-logs"
        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-900"
        onClick={onMenuItemClick}
      >
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10.5V11C15.4,11 16,11.4 16,12V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V12C8,11.4 8.4,11 9,11V10.5C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,8.7 10.2,10.5V11H13.8V10.5C13.8,8.7 12.8,8.2 12,8.2Z" />
        </svg>
        操作日誌
      </Link>
      <Link
        href="/admin/analytics"
        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-900"
        onClick={onMenuItemClick}
      >
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
        </svg>
        網站分析
      </Link>

      {/* 內容管理 */}
      <div className="border-t border-gray-100 mt-1 pt-1">
        <div className="px-3 py-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">內容管理</p>
        </div>
        <Link
          href="/admin/products"
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-900"
          onClick={onMenuItemClick}
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
          </svg>
          產品管理
        </Link>
        <Link
          href="/admin/farm-tour"
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-900"
          onClick={onMenuItemClick}
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12,3L6,7.58V6H4V9.11L1,11.4L1.58,12.25L2,12L2,21H10C10,19.9 10.9,19 12,19C13.1,19 14,19.9 14,21H22V12L22.42,12.25L23,11.4L12,3M12,8.75A2.25,2.25 0 0,1 14.25,11A2.25,2.25 0 0,1 12,13.25A2.25,2.25 0 0,1 9.75,11A2.25,2.25 0 0,1 12,8.75Z" />
          </svg>
          農場導覽管理
        </Link>
        <Link
          href="/admin/schedule"
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-900"
          onClick={onMenuItemClick}
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z" />
          </svg>
          行程管理
        </Link>
        <Link
          href="/admin/locations"
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-900"
          onClick={onMenuItemClick}
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          門市管理
        </Link>

        {/* 詢問管理 */}
        <div className="border-t border-gray-100 mt-1 pt-1">
          <Link
            href="/admin/inquiries"
            className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-900"
            onClick={onMenuItemClick}
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
              </svg>
              詢問管理
            </div>
            {stats && stats.unread_count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                {stats.unread_count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  )
}
