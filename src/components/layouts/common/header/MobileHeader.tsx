'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { AuthButton } from '@/components/ui/button/AuthButton'
import { ExpandableSearchBar } from '@/components/ui/ExpandableSearchBar'
import { ThemeToggle } from '@/components/ui/theme/ThemeToggle'
import { useCart } from '@/contexts/CartContext'
import { AdminMenuContent } from './AdminMenuContent'
import { navItems } from './NavigationItems'

interface MobileHeaderProps {
  user: any
  stats: any
  isMobileAdminMenuOpen: boolean
  isMobileMenuOpen: boolean
  mobileAdminMenuRef: React.RefObject<HTMLDivElement | null>
  mobileMenuRef: React.RefObject<HTMLDivElement | null>
  mobileMenuButtonRef: React.RefObject<HTMLButtonElement | null>
  handleMobileAdminMenuToggle: () => void
  handleMobileMenuToggle: () => void
  handleMenuItemClick: () => void
}

export function MobileHeader({
  user,
  stats,
  isMobileAdminMenuOpen,
  isMobileMenuOpen,
  mobileAdminMenuRef,
  mobileMenuRef,
  mobileMenuButtonRef,
  handleMobileAdminMenuToggle,
  handleMobileMenuToggle,
  handleMenuItemClick,
}: MobileHeaderProps) {
  const pathname = usePathname()
  const { itemCount } = useCart()

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between">
        {/* Brand - 左側固定 */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <div>
            <div className="font-display text-green-900 tracking-tight text-xl">豪德製茶所</div>
            <div className="text-green-700/70 font-inter font-medium tracking-wider text-[8px]">
              HAUDE TEA
            </div>
          </div>
        </Link>

        {/* 右側:工具按鈕組 */}
        <div className="flex items-center flex-shrink-0 space-x-2">
          {/* 可展開搜尋欄 - Mobile */}
          <ExpandableSearchBar iconOnly />

          {/* 主題切換按鈕 - Mobile */}
          <ThemeToggle />

          {/* 購物車按鈕 - 僅登入用戶顯示 */}
          {user && (
            <Link
              href="/cart"
              className="relative flex items-center text-gray-700 hover:text-green-900 hover:bg-green-50 transition-all duration-200 justify-center rounded-md min-h-[44px] min-w-[44px] p-2"
              title="購物車"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
          )}

          {/* 管理員快速連結 - Mobile */}
          {user?.role === 'admin' && (
            <div className="relative" ref={mobileAdminMenuRef}>
              <button
                className={`flex items-center text-green-800 hover:text-green-900 hover:bg-green-50/50 transition-all duration-200 justify-center rounded-md min-h-[44px] min-w-[44px] p-2 ${
                  isMobileAdminMenuOpen ? 'bg-green-50 text-green-900' : ''
                }`}
                title="管理功能"
                onClick={handleMobileAdminMenuToggle}
              >
                <svg
                  className={`fill-none stroke-current transition-transform duration-200 w-5 h-5 ${
                    isMobileAdminMenuOpen ? 'rotate-180' : ''
                  }`}
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
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
                  isMobileAdminMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
              >
                <AdminMenuContent onMenuItemClick={handleMenuItemClick} stats={stats} />
              </div>
            </div>
          )}

          {/* 漢堡選單按鈕 - Mobile */}
          <button
            ref={mobileMenuButtonRef}
            className="flex items-center text-gray-700 hover:text-green-900 hover:bg-green-50 transition-all duration-200 justify-center rounded-md min-h-[44px] min-w-[44px] p-2"
            title="導航選單"
            onClick={handleMobileMenuToggle}
          >
            <svg
              className={`w-6 h-6 transition-all duration-300 ${
                isMobileMenuOpen ? 'rotate-45' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                /* X 圖標 */
                <>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </>
              ) : (
                /* 漢堡圖標 */
                <>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </>
              )}
            </svg>
          </button>

          {/* Auth Button - Mobile */}
          <AuthButton isMobile />
        </div>
      </div>

      {/* 手機版導航選單 - 折疊式 */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="py-4 border-t border-gray-100" ref={mobileMenuRef}>
          <div className="space-y-2">
            {navItems.map(item => (
              <div key={item.href} className="group">
                {item.isExternal ? (
                  <a
                    href={item.href}
                    className="block px-4 py-3 text-gray-700 hover:text-green-900 hover:bg-green-50 transition-colors duration-200 rounded-lg mx-2"
                    onClick={handleMenuItemClick}
                  >
                    <span className="font-sans font-medium text-base">{item.label}</span>
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className={`block px-4 py-3 transition-colors duration-200 rounded-lg mx-2 ${
                      isActive(item.href)
                        ? 'text-green-900 bg-green-50 font-semibold'
                        : 'text-gray-700 hover:text-green-900 hover:bg-green-50'
                    }`}
                    onClick={handleMenuItemClick}
                  >
                    <span className="font-sans font-medium text-base">{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
