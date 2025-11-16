'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SocialLinks } from '@/components/features/social/SocialLinks'
import { AuthButton } from '@/components/ui/button/AuthButton'
import { ExpandableSearchBar } from '@/components/ui/ExpandableSearchBar'
import { ThemeToggle } from '@/components/ui/theme/ThemeToggle'
import { AdminMenuContent } from './AdminMenuContent'
import { navItems } from './NavigationItems'

interface DesktopHeaderProps {
  user: any
  stats: any
  isDesktopAdminMenuOpen: boolean
  desktopAdminMenuRef: React.RefObject<HTMLDivElement | null>
  handleDesktopAdminMenuToggle: () => void
  handleMenuItemClick: () => void
}

export function DesktopHeader({
  user,
  stats,
  isDesktopAdminMenuOpen,
  desktopAdminMenuRef,
  handleDesktopAdminMenuToggle,
  handleMenuItemClick,
}: DesktopHeaderProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  return (
    <div className="hidden lg:block">
      {/* Desktop Layout - 統一緊湊樣式 */}
      <div className="flex items-center justify-between h-12">
        {/* 左側：品牌 + 導航 */}
        <div className="flex items-center gap-6 h-8">
          {/* 品牌標誌（緊湊版）*/}
          <Link href="/" className="flex items-center">
            <div className="flex items-center gap-2 h-8">
              <div className="font-display text-green-900 dark:text-green-300 tracking-tight text-2xl">
                豪德製茶所
              </div>
              <div className="text-green-700/70 dark:text-green-400/70 font-inter font-medium tracking-wider text-[8px]">
                HAUDE TEA
              </div>
            </div>
          </Link>

          {/* 導航選單（緊湊版）*/}
          <div className="flex items-center space-x-2">
            {navItems.map(item => (
              <div key={item.href} className="group relative flex items-center min-h-[32px]">
                {item.isExternal ? (
                  <a href={item.href} className="block py-2 px-2">
                    <span
                      className={`text-gray-700 dark:text-gray-300 hover:text-green-900 dark:hover:text-green-300 transition-colors duration-200 text-sm font-sans font-medium ${
                        isActive(item.href) ? 'text-green-900 dark:text-green-300' : ''
                      }`}
                    >
                      {item.label}
                    </span>
                    <div
                      className={`absolute bottom-0 left-0 h-0.5 bg-green-900 dark:bg-green-300 transition-all duration-300 ${
                        isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    ></div>
                  </a>
                ) : (
                  <Link href={item.href} className="block py-2 px-2">
                    <span
                      className={`text-gray-700 dark:text-gray-300 hover:text-green-900 dark:hover:text-green-300 transition-colors duration-200 text-sm font-sans font-medium ${
                        isActive(item.href) ? 'text-green-900 dark:text-green-300' : ''
                      }`}
                    >
                      {item.label}
                    </span>
                    <div
                      className={`absolute bottom-0 left-0 h-0.5 bg-green-900 dark:bg-green-300 transition-all duration-300 ${
                        isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    ></div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 右側：工具 + AuthButton */}
        <div className="flex items-center space-x-2 h-8">
          {/* 可展開搜尋欄 */}
          <ExpandableSearchBar iconOnly />

          {/* 主題切換按鈕 */}
          <ThemeToggle />

          {/* Social Links */}
          <SocialLinks size="sm" />

          {/* 管理員快速連結 */}
          {user?.role === 'admin' && (
            <div className="relative" ref={desktopAdminMenuRef}>
              <button
                className="w-10 h-10 flex items-center justify-center text-green-800 dark:text-green-300 hover:text-green-900 dark:hover:text-green-200 hover:bg-green-50/50 dark:hover:bg-slate-700/50 transition-colors duration-200 rounded-md"
                title="管理功能"
                onClick={handleDesktopAdminMenuToggle}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <div
                className={`absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border-2 border-gray-300 transition-all duration-200 z-[9999] ${
                  isDesktopAdminMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
              >
                <AdminMenuContent onMenuItemClick={handleMenuItemClick} stats={stats} />
              </div>
            </div>
          )}

          <AuthButton />
        </div>
      </div>
    </div>
  )
}
