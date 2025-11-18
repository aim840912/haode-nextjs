import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { HeartIcon, InquiryIcon, LogoutIcon, UserIcon } from './icons'
import { UserDropdownMenuProps } from './types'

/**
 * 用戶下拉選單元件
 *
 * 包含：
 * - 用戶資訊顯示
 * - 個人資料連結
 * - 詢問單連結
 * - 有興趣的產品連結（含數量徽章）
 * - 登出按鈕
 */
export const UserDropdownMenu = React.memo<UserDropdownMenuProps>(
  ({ user, isMobile, isOpen, isLoggingOut, interestedCount, onLogout, onClose }) => {
    if (!isOpen) {
      return null
    }

    return (
      <div
        className={cn(
          'absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50',
          isMobile ? 'w-56' : 'w-48'
        )}
      >
        {/* 用戶資訊 */}
        <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-100">{user.email}</div>

        {/* 個人資料 */}
        <Link
          href="/profile?tab=profile"
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
          onClick={onClose}
        >
          <UserIcon className="w-4 h-4 mr-2" />
          個人資料
        </Link>

        {/* 詢問單問答紀錄 */}
        <Link
          href="/inquiry"
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
          onClick={onClose}
        >
          <InquiryIcon className="w-4 h-4 mr-2" />
          詢問單問答紀錄
        </Link>

        {/* 有興趣的產品 */}
        <Link
          href="/profile?tab=interests"
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
          onClick={onClose}
        >
          <HeartIcon className="w-4 h-4 mr-2" />
          <span className="flex items-center justify-between w-full">
            有興趣的產品
            {interestedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                {interestedCount}
              </span>
            )}
          </span>
        </Link>

        {/* 登出按鈕 */}
        <div className="border-t border-gray-100 mt-1 pt-1">
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <LogoutIcon className="w-4 h-4 mr-2" />
            {isLoggingOut ? '登出中...' : '登出'}
          </button>
        </div>
      </div>
    )
  }
)

UserDropdownMenu.displayName = 'UserDropdownMenu'
