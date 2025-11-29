'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Archive,
  BarChart3,
  Box,
  Calendar,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Monitor,
  Settings,
  Truck,
  X,
} from 'lucide-react'
import { useAdminSidebar } from '@/contexts/AdminSidebarContext'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: '系統管理',
    items: [
      {
        label: '儀表板',
        href: '/admin/dashboard',
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
      {
        label: '系統監控',
        href: '/admin/monitoring',
        icon: <Monitor className="h-5 w-5" />,
      },
      {
        label: '操作日誌',
        href: '/admin/audit-logs',
        icon: <FileText className="h-5 w-5" />,
      },
    ],
  },
  {
    title: '內容管理',
    items: [
      {
        label: '產品管理',
        href: '/admin/products',
        icon: <Box className="h-5 w-5" />,
      },
      {
        label: '訂單管理',
        href: '/admin/orders',
        icon: <Archive className="h-5 w-5" />,
      },
      {
        label: '詢問管理',
        href: '/admin/inquiries',
        icon: <MessageSquare className="h-5 w-5" />,
      },
      {
        label: '農場導覽',
        href: '/admin/farm-tour',
        icon: <Truck className="h-5 w-5" />,
      },
      {
        label: '行程管理',
        href: '/admin/schedule',
        icon: <Calendar className="h-5 w-5" />,
      },
      {
        label: '門市管理',
        href: '/admin/locations',
        icon: <MapPin className="h-5 w-5" />,
      },
    ],
  },
  {
    title: '設定',
    items: [
      {
        label: '網站設定',
        href: '/admin/site-settings',
        icon: <Settings className="h-5 w-5" />,
      },
    ],
  },
]

function NavLink({
  item,
  isActive,
  isCollapsed,
  onClick,
}: {
  item: NavItem
  isActive: boolean
  isCollapsed: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
        ${isCollapsed ? 'justify-center' : ''}
        ${
          isActive
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
        }
      `}
      title={isCollapsed ? item.label : undefined}
    >
      <span className={isActive ? 'text-green-600 dark:text-green-400' : ''}>{item.icon}</span>
      {!isCollapsed && <span className="font-medium">{item.label}</span>}
    </Link>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useAdminSidebar()

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard' || pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  // 桌面版側邊欄
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo 區域 */}
      <div
        className={`
        flex items-center h-16 px-4 border-b border-gray-200 dark:border-slate-700
        ${isCollapsed ? 'justify-center' : 'gap-3'}
      `}
      >
        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 dark:text-gray-100">豪德農場</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">管理後台</span>
          </div>
        )}
      </div>

      {/* 導航區域 */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group, groupIndex) => (
          <div key={group.title} className={groupIndex > 0 ? 'mt-6' : ''}>
            {!isCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {group.title}
              </h3>
            )}
            {isCollapsed && groupIndex > 0 && (
              <div className="border-t border-gray-200 dark:border-slate-700 my-2" />
            )}
            <div className="space-y-1">
              {group.items.map(item => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={isActive(item.href)}
                  isCollapsed={isCollapsed}
                  onClick={closeMobile}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* 收合按鈕（僅桌面版） */}
      <div className="hidden lg:block border-t border-gray-200 dark:border-slate-700 p-3">
        <button
          onClick={toggleCollapse}
          className={`
            flex items-center gap-2 w-full px-3 py-2 rounded-lg
            text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700
            transition-colors duration-200
            ${isCollapsed ? 'justify-center' : ''}
          `}
          title={isCollapsed ? '展開側邊欄' : '收合側邊欄'}
        >
          <ChevronLeft
            className={`h-5 w-5 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
          />
          {!isCollapsed && <span className="text-sm">收合側邊欄</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* 桌面版側邊欄 */}
      <aside
        className={`
          hidden lg:flex flex-col
          fixed left-0 top-0 h-screen z-40
          bg-white dark:bg-slate-800
          border-r border-gray-200 dark:border-slate-700
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-60'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* 手機版 Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={closeMobile}
        />
      )}

      {/* 手機版側邊欄 */}
      <aside
        className={`
          lg:hidden fixed left-0 top-0 h-screen w-72 z-50
          bg-white dark:bg-slate-800
          border-r border-gray-200 dark:border-slate-700
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* 手機版關閉按鈕 */}
        <button
          onClick={closeMobile}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>
    </>
  )
}
