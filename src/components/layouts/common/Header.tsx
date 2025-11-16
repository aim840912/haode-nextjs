'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useInquiryStatsContext } from '@/contexts/InquiryStatsContext'
import { useHeaderState } from './header/useHeaderState'
import { DesktopHeader } from './header/DesktopHeader'
import { MobileHeader } from './header/MobileHeader'

/**
 * Header 元件 - 網站頂部導航欄
 *
 * 架構:
 * - useHeaderState: 狀態管理 Hook (選單開合、外部點擊偵測)
 * - DesktopHeader: 桌面版佈局 (≥ lg breakpoint)
 * - MobileHeader: 移動版佈局 (< lg breakpoint)
 * - AdminMenuContent: 共用的管理員選單內容
 */
export function Header() {
  const { user } = useAuth()
  const { stats } = useInquiryStatsContext()

  const {
    isDesktopAdminMenuOpen,
    isMobileAdminMenuOpen,
    isMobileMenuOpen,
    desktopAdminMenuRef,
    mobileAdminMenuRef,
    mobileMenuRef,
    mobileMenuButtonRef,
    handleDesktopAdminMenuToggle,
    handleMobileAdminMenuToggle,
    handleMobileMenuToggle,
    handleMenuItemClick,
  } = useHeaderState()

  return (
    <header className="fixed top-0 w-full backdrop-blur-lg z-50 bg-green-50/98 dark:bg-slate-900/98 shadow-md min-h-[60px]">
      <nav className="max-w-7xl mx-auto px-8 py-1">
        <DesktopHeader
          user={user}
          stats={stats}
          isDesktopAdminMenuOpen={isDesktopAdminMenuOpen}
          desktopAdminMenuRef={desktopAdminMenuRef}
          handleDesktopAdminMenuToggle={handleDesktopAdminMenuToggle}
          handleMenuItemClick={handleMenuItemClick}
        />

        <MobileHeader
          user={user}
          stats={stats}
          isMobileAdminMenuOpen={isMobileAdminMenuOpen}
          isMobileMenuOpen={isMobileMenuOpen}
          mobileAdminMenuRef={mobileAdminMenuRef}
          mobileMenuRef={mobileMenuRef}
          mobileMenuButtonRef={mobileMenuButtonRef}
          handleMobileAdminMenuToggle={handleMobileAdminMenuToggle}
          handleMobileMenuToggle={handleMobileMenuToggle}
          handleMenuItemClick={handleMenuItemClick}
        />
      </nav>
    </header>
  )
}
