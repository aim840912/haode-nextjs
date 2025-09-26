'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import AuthButton from '@/components/ui/button/AuthButton'
import SocialLinks from '@/components/features/social/SocialLinks'
import { ExpandableSearchBar } from '@/components/ui/ExpandableSearchBar'
import { useAuth } from '@/contexts/AuthContext'
import { useInquiryStatsContext } from '@/contexts/InquiryStatsContext'

export default function Header() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { stats } = useInquiryStatsContext()

  // 滾動狀態管理
  const [isScrolled, setIsScrolled] = useState(false)

  // 管理員選單狀態管理
  const [isDesktopAdminMenuOpen, setIsDesktopAdminMenuOpen] = useState(false)
  const [isMobileAdminMenuOpen, setIsMobileAdminMenuOpen] = useState(false)

  // 手機版導航選單狀態管理
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // ref 引用
  const desktopAdminMenuRef = useRef<HTMLDivElement>(null)
  const mobileAdminMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)

  // 滾動偵測效果
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleScroll = () => {
      // 使用 throttle 提升效能
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const scrollPosition = window.scrollY
        const threshold = 50 // 滾動超過 50px 時觸發縮小效果

        setIsScrolled(scrollPosition > threshold)

        // 滾動時關閉手機版選單
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false)
        }
      }, 10) // 10ms 的 throttle 延遲
    }

    // 初始檢查
    handleScroll()

    window.addEventListener('scroll', handleScroll)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        desktopAdminMenuRef.current &&
        !desktopAdminMenuRef.current.contains(event.target as Node)
      ) {
        setIsDesktopAdminMenuOpen(false)
      }
      if (
        mobileAdminMenuRef.current &&
        !mobileAdminMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileAdminMenuOpen(false)
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 點擊處理函數
  const handleDesktopAdminMenuToggle = () => {
    setIsDesktopAdminMenuOpen(!isDesktopAdminMenuOpen)
  }

  const handleMobileAdminMenuToggle = () => {
    setIsMobileAdminMenuOpen(!isMobileAdminMenuOpen)
  }

  const handleMobileMenuToggle = () => {
    const newState = !isMobileMenuOpen
    setIsMobileMenuOpen(newState)

    // 發送自定義事件通知 HeaderSpacer 更新高度
    const event = new CustomEvent('mobileMenuToggle', {
      detail: { isOpen: newState },
    })
    document.dispatchEvent(event)
  }

  const handleMenuItemClick = () => {
    setIsDesktopAdminMenuOpen(false)
    setIsMobileAdminMenuOpen(false)
    setIsMobileMenuOpen(false)

    // 發送自定義事件通知 HeaderSpacer 更新高度
    const event = new CustomEvent('mobileMenuToggle', {
      detail: { isOpen: false },
    })
    document.dispatchEvent(event)
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  const navItems = [
    { href: '/', label: '農業探索', isExternal: false },
    { href: '/farm-tour', label: '觀光果園', isExternal: false },
    { href: '/products', label: '產品介紹', isExternal: false },
    { href: '/locations', label: '門市據點', isExternal: false },
    { href: '/schedule', label: '擺攤行程', isExternal: false },
    { href: '/news', label: '農產新聞', isExternal: false },
  ]

  return (
    <header
      className={`fixed top-0 w-full backdrop-blur-lg z-50 transition-all duration-300 min-h-[60px] ${
        isScrolled ? 'bg-amber-50/98 shadow-md' : 'bg-white/95'
      }`}
    >
      <nav
        className={`max-w-7xl mx-auto px-8 transition-all duration-300 ${
          isScrolled ? 'py-1' : 'py-4 lg:py-5'
        }`}
      >
        <div className="hidden lg:block">
          {/* Desktop Layout */}
          {isScrolled ? (
            /* 滾動時：緊湊單行佈局 */
            <div className="flex items-center justify-between h-12">
              {/* 左側：品牌 + 導航 */}
              <div className="flex items-center gap-6 h-8">
                {/* 品牌標誌（縮小版）*/}
                <Link href="/" className="flex items-center">
                  <div className="flex items-center gap-2 h-8">
                    <div className="font-display text-amber-900 tracking-tight text-xl transition-all duration-300">
                      豪德製茶所
                    </div>
                    <div className="text-amber-700/70 font-inter font-medium tracking-wider text-[8px] transition-all duration-300">
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
                            className={`text-gray-700 hover:text-amber-900 transition-colors duration-200 text-xs font-sans font-medium ${
                              isActive(item.href) ? 'text-amber-900' : ''
                            }`}
                          >
                            {item.label}
                          </span>
                          <div
                            className={`absolute bottom-0 left-0 h-0.5 bg-amber-900 transition-all duration-300 ${
                              isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                            }`}
                          ></div>
                        </a>
                      ) : (
                        <Link href={item.href} className="block py-2 px-2">
                          <span
                            className={`text-gray-700 hover:text-amber-900 transition-colors duration-200 text-xs font-sans font-medium ${
                              isActive(item.href) ? 'text-amber-900' : ''
                            }`}
                          >
                            {item.label}
                          </span>
                          <div
                            className={`absolute bottom-0 left-0 h-0.5 bg-amber-900 transition-all duration-300 ${
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

                {/* Social Links */}
                <SocialLinks size="sm" />

                {/* 管理員快速連結 */}
                {user?.role === 'admin' && (
                  <div className="relative" ref={desktopAdminMenuRef}>
                    <button
                      className="w-10 h-10 flex items-center justify-center text-amber-800 hover:text-amber-900 hover:bg-amber-50/50 transition-colors duration-200 rounded-md"
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
                      <div className="py-2">
                        {/* 系統管理 */}
                        <div className="px-3 py-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            系統管理
                          </p>
                        </div>
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                          onClick={handleMenuItemClick}
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                          </svg>
                          管理儀表板
                        </Link>
                        <Link
                          href="/admin/monitoring"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                          onClick={handleMenuItemClick}
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                          </svg>
                          系統監控
                        </Link>
                        <Link
                          href="/admin/audit-logs"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                          onClick={handleMenuItemClick}
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10.5V11C15.4,11 16,11.4 16,12V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V12C8,11.4 8.4,11 9,11V10.5C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,8.7 10.2,10.5V11H13.8V10.5C13.8,8.7 12.8,8.2 12,8.2Z" />
                          </svg>
                          操作日誌
                        </Link>
                        <Link
                          href="/admin/analytics"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                          onClick={handleMenuItemClick}
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                          </svg>
                          網站分析
                        </Link>

                        {/* 內容管理 */}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <div className="px-3 py-1">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              內容管理
                            </p>
                          </div>
                          <Link
                            href="/admin/products"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                            onClick={handleMenuItemClick}
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
                            </svg>
                            產品管理
                          </Link>
                          <Link
                            href="/admin/news"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                            onClick={handleMenuItemClick}
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                            </svg>
                            新聞管理
                          </Link>
                          <Link
                            href="/admin/farm-tour"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                            onClick={handleMenuItemClick}
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12,3L6,7.58V6H4V9.11L1,11.4L1.58,12.25L2,12L2,21H10C10,19.9 10.9,19 12,19C13.1,19 14,19.9 14,21H22V12L22.42,12.25L23,11.4L12,3M12,8.75A2.25,2.25 0 0,1 14.25,11A2.25,2.25 0 0,1 12,13.25A2.25,2.25 0 0,1 9.75,11A2.25,2.25 0 0,1 12,8.75Z" />
                            </svg>
                            農場導覽管理
                          </Link>
                          <Link
                            href="/admin/schedule"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                            onClick={handleMenuItemClick}
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z" />
                            </svg>
                            行程管理
                          </Link>
                          <Link
                            href="/admin/locations"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                            onClick={handleMenuItemClick}
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
                              className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                              onClick={handleMenuItemClick}
                            >
                              <div className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
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
                    </div>
                  </div>
                )}

                <AuthButton />
              </div>
            </div>
          ) : (
            /* 未滾動時：原始兩層佈局 */
            <>
              {/* 上層：品牌和登入 */}
              <div className="flex items-center justify-between mb-4">
                <Link href="/" className="flex items-center">
                  <div>
                    <div className="font-display text-amber-900 tracking-tight text-3xl transition-all duration-300">
                      豪德製茶所
                    </div>
                    <div className="text-amber-700/70 font-inter font-medium tracking-wider text-xs transition-all duration-300">
                      HAUDE TEA
                    </div>
                  </div>
                </Link>
                <AuthButton />
              </div>

              {/* 下層：導航選單和工具列 */}
              <div className="flex items-center justify-between py-2">
                {/* 左側：導航選單 */}
                <div className="flex items-center space-x-5">
                  {navItems.map(item => (
                    <div key={item.href} className="group relative">
                      {item.isExternal ? (
                        <a href={item.href} className="block py-2">
                          <span
                            className={`text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-sans font-medium ${
                              isActive(item.href) ? 'text-amber-900' : ''
                            }`}
                          >
                            {item.label}
                          </span>
                          <div
                            className={`absolute bottom-0 left-0 h-0.5 bg-amber-900 transition-all duration-300 ${
                              isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                            }`}
                          ></div>
                        </a>
                      ) : (
                        <Link href={item.href} className="block py-2">
                          <span
                            className={`text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-sans font-medium ${
                              isActive(item.href) ? 'text-amber-900' : ''
                            }`}
                          >
                            {item.label}
                          </span>
                          <div
                            className={`absolute bottom-0 left-0 h-0.5 bg-amber-900 transition-all duration-300 ${
                              isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                            }`}
                          ></div>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>

                {/* 右側：工具列 */}
                <div className="flex items-center space-x-3">
                  <ExpandableSearchBar iconOnly />
                  <SocialLinks size="sm" />
                  {user?.role === 'admin' && (
                    <div className="relative" ref={desktopAdminMenuRef}>
                      <button
                        className="flex items-center p-2.5 text-amber-800 hover:text-amber-900 hover:bg-amber-50/50 transition-colors duration-200 min-h-[52px] min-w-[52px] justify-center rounded-md"
                        title="管理功能"
                        onClick={handleDesktopAdminMenuToggle}
                      >
                        <svg
                          className="w-6 h-6"
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
                        <div className="py-2">
                          {/* 系統管理 */}
                          <div className="px-3 py-1">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              系統管理
                            </p>
                          </div>
                          <Link
                            href="/admin/dashboard"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                            onClick={handleMenuItemClick}
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                            </svg>
                            管理儀表板
                          </Link>
                          <Link
                            href="/admin/monitoring"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                            onClick={handleMenuItemClick}
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                            </svg>
                            系統監控
                          </Link>
                          <Link
                            href="/admin/audit-logs"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                            onClick={handleMenuItemClick}
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10.5V11C15.4,11 16,11.4 16,12V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V12C8,11.4 8.4,11 9,11V10.5C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,8.7 10.2,10.5V11H13.8V10.5C13.8,8.7 12.8,8.2 12,8.2Z" />
                            </svg>
                            操作日誌
                          </Link>
                          <Link
                            href="/admin/analytics"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                            onClick={handleMenuItemClick}
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                            </svg>
                            網站分析
                          </Link>

                          {/* 內容管理 */}
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <div className="px-3 py-1">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                內容管理
                              </p>
                            </div>
                            <Link
                              href="/admin/products"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                              onClick={handleMenuItemClick}
                            >
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
                              </svg>
                              產品管理
                            </Link>
                            <Link
                              href="/admin/news"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                              onClick={handleMenuItemClick}
                            >
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                              </svg>
                              新聞管理
                            </Link>
                            <Link
                              href="/admin/farm-tour"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                              onClick={handleMenuItemClick}
                            >
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12,3L6,7.58V6H4V9.11L1,11.4L1.58,12.25L2,12L2,21H10C10,19.9 10.9,19 12,19C13.1,19 14,19.9 14,21H22V12L22.42,12.25L23,11.4L12,3M12,8.75A2.25,2.25 0 0,1 14.25,11A2.25,2.25 0 0,1 12,13.25A2.25,2.25 0 0,1 9.75,11A2.25,2.25 0 0,1 12,8.75Z" />
                              </svg>
                              農場導覽管理
                            </Link>
                            <Link
                              href="/admin/schedule"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                              onClick={handleMenuItemClick}
                            >
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z" />
                              </svg>
                              行程管理
                            </Link>
                            <Link
                              href="/admin/locations"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                              onClick={handleMenuItemClick}
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
                                className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                                onClick={handleMenuItemClick}
                              >
                                <div className="flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
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
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between">
            {/* Brand - 左側固定 */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <div>
                <div
                  className={`font-display text-amber-900 tracking-tight transition-all duration-300 ${
                    isScrolled ? 'text-lg' : 'text-2xl'
                  }`}
                >
                  豪德製茶所
                </div>
                <div
                  className={`text-amber-700/70 font-inter font-medium tracking-wider transition-all duration-300 ${
                    isScrolled ? 'text-[8px]' : 'text-xs'
                  }`}
                >
                  HAUDE TEA
                </div>
              </div>
            </Link>

            {/* 右側：工具按鈕組 */}
            <div className="flex items-center flex-shrink-0 space-x-1">
              {/* 可展開搜尋欄 - Mobile */}
              <ExpandableSearchBar iconOnly />

              {/* 管理員快速連結 - Mobile */}
              {user?.role === 'admin' && (
                <div className="relative" ref={mobileAdminMenuRef}>
                  <button
                    className={`flex items-center text-amber-800 hover:text-amber-900 hover:bg-amber-50/50 transition-all duration-200 justify-center rounded-md min-h-[52px] min-w-[52px] ${
                      isScrolled ? 'p-2' : 'p-2.5'
                    } ${isMobileAdminMenuOpen ? 'bg-amber-50 text-amber-900' : ''}`}
                    title="管理功能"
                    onClick={handleMobileAdminMenuToggle}
                  >
                    <svg
                      className={`fill-none stroke-current transition-transform duration-200 ${
                        isScrolled ? 'w-5 h-5' : 'w-6 h-6'
                      } ${isMobileAdminMenuOpen ? 'rotate-180' : ''}`}
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
                    <div className="py-2">
                      {/* 系統管理 */}
                      <div className="px-3 py-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          系統管理
                        </p>
                      </div>
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                        onClick={handleMenuItemClick}
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                        </svg>
                        管理儀表板
                      </Link>
                      <Link
                        href="/admin/monitoring"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                        onClick={handleMenuItemClick}
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                        </svg>
                        系統監控
                      </Link>
                      <Link
                        href="/admin/audit-logs"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                        onClick={handleMenuItemClick}
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10.5V11C15.4,11 16,11.4 16,12V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V12C8,11.4 8.4,11 9,11V10.5C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,8.7 10.2,10.5V11H13.8V10.5C13.8,8.7 12.8,8.2 12,8.2Z" />
                        </svg>
                        操作日誌
                      </Link>
                      <Link
                        href="/admin/analytics"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                        onClick={handleMenuItemClick}
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                        </svg>
                        網站分析
                      </Link>

                      {/* 內容管理 */}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <div className="px-3 py-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            內容管理
                          </p>
                        </div>
                        <Link
                          href="/admin/products"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                          onClick={handleMenuItemClick}
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
                          </svg>
                          產品管理
                        </Link>
                        <Link
                          href="/admin/news"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                          onClick={handleMenuItemClick}
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                          </svg>
                          新聞管理
                        </Link>
                        <Link
                          href="/admin/farm-tour"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                          onClick={handleMenuItemClick}
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12,3L6,7.58V6H4V9.11L1,11.4L1.58,12.25L2,12L2,21H10C10,19.9 10.9,19 12,19C13.1,19 14,19.9 14,21H22V12L22.42,12.25L23,11.4L12,3M12,8.75A2.25,2.25 0 0,1 14.25,11A2.25,2.25 0 0,1 12,13.25A2.25,2.25 0 0,1 9.75,11A2.25,2.25 0 0,1 12,8.75Z" />
                          </svg>
                          農場導覽管理
                        </Link>
                        <Link
                          href="/admin/schedule"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                          onClick={handleMenuItemClick}
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z" />
                          </svg>
                          行程管理
                        </Link>
                        <Link
                          href="/admin/locations"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                          onClick={handleMenuItemClick}
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
                            className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-900"
                            onClick={handleMenuItemClick}
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
                  </div>
                </div>
              )}

              {/* 漢堡選單按鈕 - Mobile */}
              <button
                ref={mobileMenuButtonRef}
                className="flex items-center text-gray-700 hover:text-amber-900 hover:bg-amber-50 transition-all duration-200 justify-center rounded-md min-h-[44px] min-w-[44px] p-2"
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
                        className="block px-4 py-3 text-gray-700 hover:text-amber-900 hover:bg-amber-50 transition-colors duration-200 rounded-lg mx-2"
                        onClick={handleMenuItemClick}
                      >
                        <span className="font-sans font-medium text-base">{item.label}</span>
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className={`block px-4 py-3 transition-colors duration-200 rounded-lg mx-2 ${
                          isActive(item.href)
                            ? 'text-amber-900 bg-amber-50 font-semibold'
                            : 'text-gray-700 hover:text-amber-900 hover:bg-amber-50'
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
      </nav>
    </header>
  )
}
