import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils/cn'

interface InterestButtonProps {
  /** 產品 ID */
  productId: string
  /** 產品名稱 */
  productName: string
  /** 是否已加入興趣 */
  isInterested: boolean
  /** 點擊事件處理 */
  onToggle: (productId: string, productName: string, e?: React.MouseEvent) => void
  /** 按鈕樣式變體 */
  variant?: 'icon' | 'button'
  /** 按鈕大小 */
  size?: 'sm' | 'md' | 'lg'
  /** 是否禁用 */
  disabled?: boolean
  /** 自定義類名 */
  className?: string
}

/**
 * 興趣按鈕元件
 *
 * 統一的產品興趣切換按鈕，支援：
 * - 圖標和按鈕兩種變體
 * - 多種大小選項
 * - 自定義樣式
 * - 統一的視覺回饋
 */
export const InterestButton = React.memo<InterestButtonProps>(
  ({
    productId,
    productName,
    isInterested,
    onToggle,
    variant = 'icon',
    size = 'md',
    disabled = false,
    className = '',
  }) => {
    const { user } = useAuth()

    const handleClick = (e: React.MouseEvent) => {
      if (disabled) return
      onToggle(productId, productName, e)
    }

    // 檢查是否為未登入狀態
    const isLoggedOut = !user?.id
    const isDisabledDueToAuth = disabled || isLoggedOut

    // 取得圖標大小
    const getIconSize = () => {
      switch (size) {
        case 'sm':
          return 'w-4 h-4'
        case 'lg':
          return 'w-6 h-6'
        case 'md':
        default:
          return 'w-5 h-5'
      }
    }

    // 取得基礎樣式
    const getBaseStyles = () => {
      return cn(
        'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50',
        isDisabledDueToAuth
          ? 'opacity-60 cursor-not-allowed'
          : 'cursor-pointer hover:scale-110 active:scale-95'
      )
    }

    // 取得提示文字
    const getTooltipText = () => {
      if (isLoggedOut) {
        return '請先登入以收藏產品'
      }
      return isInterested ? '移除收藏' : '加入收藏'
    }

    // 圖標變體
    if (variant === 'icon') {
      const iconStyles = size === 'sm' ? 'p-1' : size === 'lg' ? 'p-3' : 'p-2'

      return (
        <button
          onClick={handleClick}
          disabled={isDisabledDueToAuth}
          className={cn(
            getBaseStyles(),
            iconStyles,
            'rounded-full hover:bg-red-50',
            isLoggedOut && 'bg-gray-100',
            className
          )}
          title={getTooltipText()}
          aria-label={getTooltipText()}
        >
          {isInterested ? (
            <svg className={cn(getIconSize(), 'text-red-500 fill-current')} viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg
              className={cn(
                getIconSize(),
                isLoggedOut ? 'text-gray-300' : 'text-gray-400 hover:text-red-500',
                'transition-colors'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
        </button>
      )
    }

    // 按鈕變體
    const getButtonSize = () => {
      switch (size) {
        case 'sm':
          return 'px-3 py-1 text-sm'
        case 'lg':
          return 'px-6 py-3 text-base'
        case 'md':
        default:
          return 'px-4 py-2 text-sm'
      }
    }

    const buttonStyles = isLoggedOut
      ? 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
      : isInterested
        ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100'
        : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100 hover:border-red-200 hover:text-red-600'

    return (
      <button
        onClick={handleClick}
        disabled={isDisabledDueToAuth}
        className={cn(
          getBaseStyles(),
          getButtonSize(),
          buttonStyles,
          'rounded-lg font-medium flex items-center justify-center gap-2',
          className
        )}
        aria-label={getTooltipText()}
        title={getTooltipText()}
      >
        {isInterested ? (
          <>
            <svg className={cn(getIconSize(), 'text-red-500 fill-current')} viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            已收藏
          </>
        ) : (
          <>
            <svg
              className={cn(getIconSize(), isLoggedOut && 'text-gray-300')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {isLoggedOut ? '請先登入' : '我有興趣'}
          </>
        )}
      </button>
    )
  }
)

InterestButton.displayName = 'InterestButton'
