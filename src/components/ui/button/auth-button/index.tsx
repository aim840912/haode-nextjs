'use client'

import React from 'react'
import { cn } from '@/lib/utils/cn'
import { InitialState, LoadingState, LoginLink } from './AuthButtonStates'
import { ChevronDownIcon, UserIcon } from './icons'
import { AuthButtonProps } from './types'
import { UserDropdownMenu } from './UserDropdownMenu'
import { useAuthButton } from './useAuthButton'

/**
 * 認證按鈕元件
 *
 * **重構說明**:
 * - 原始 395 行縮減為 ~100 行
 * - SVG 圖示抽取到 icons.tsx (移除 6 個未使用圖示)
 * - 業務邏輯抽取到 useAuthButton hook
 * - 下拉選單拆分為 UserDropdownMenu 元件
 * - 狀態元件拆分為 AuthButtonStates
 * - 主元件只負責 UI 編排和樣式
 */
export function AuthButton({ isMobile = false }: AuthButtonProps) {
  const {
    user,
    isLoading,
    isLoggingOut,
    isDropdownOpen,
    interestedCount,
    hasMounted,
    dropdownRef,
    handleLogout,
    toggleDropdown,
    closeDropdown,
  } = useAuthButton()

  // 共用樣式
  const baseClasses = isMobile
    ? 'px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 border border-green-200'
    : 'px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 border border-green-200 h-8'

  const loginClasses = 'text-green-900 bg-green-50 hover:bg-green-100'

  // 在客戶端掛載前，顯示統一的初始狀態以避免 hydration 錯誤
  if (!hasMounted) {
    return (
      <InitialState isMobile={isMobile} baseClasses={baseClasses} loginClasses={loginClasses} />
    )
  }

  // 客戶端已掛載但正在載入時，顯示載入狀態
  if (isLoading) {
    return (
      <LoadingState isMobile={isMobile} baseClasses={baseClasses} loginClasses={loginClasses} />
    )
  }

  // 客戶端已掛載且有用戶資料時，顯示用戶下拉選單
  if (user) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className={cn(
            baseClasses,
            'text-green-900 bg-green-50 hover:bg-green-100',
            isDropdownOpen && 'bg-green-100'
          )}
        >
          <UserIcon className="w-4 h-4" />
          {isMobile ? (
            <span className="sr-only">{user.name}</span>
          ) : (
            <span className="truncate max-w-[120px]">{user.name}</span>
          )}
          <ChevronDownIcon
            className={cn('w-4 h-4 transition-transform', isDropdownOpen && 'rotate-180')}
          />
        </button>

        <UserDropdownMenu
          user={user}
          isMobile={isMobile}
          isOpen={isDropdownOpen}
          isLoggingOut={isLoggingOut}
          interestedCount={interestedCount}
          onLogout={handleLogout}
          onClose={closeDropdown}
        />
      </div>
    )
  }

  // 客戶端已掛載且無用戶資料時，顯示登入連結
  return <LoginLink isMobile={isMobile} baseClasses={baseClasses} loginClasses={loginClasses} />
}
