'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface TailwindGreenButtonProps {
  /** 按鈕內容 */
  children: React.ReactNode
  /** 點擊事件 */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 自定義類名 */
  className?: string
  /** 按鈕類型 */
  type?: 'button' | 'submit' | 'reset'
  /** ARIA 標籤 */
  'aria-label'?: string
}

/**
 * 綠色 Tailwind 按鈕 - 基於使用者提供的設計
 *
 * 特色：
 * - 綠色邊框和內陰影 (#4caf50)
 * - 白色背景，hover 時變綠色
 * - 圓角設計 (rounded-3xl)
 * - 平滑的過渡動畫
 * - 支援禁用狀態
 */
export const TailwindGreenButton: React.FC<TailwindGreenButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className,
  type = 'button',
  'aria-label': ariaLabel,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        // 基礎樣式 - 改為自適應高度以避免文字溢出
        'w-full min-h-[48px] bg-white cursor-pointer rounded-3xl',
        // Flex 佈局確保內容正確居中
        'flex items-center justify-center',
        // 綠色邊框和內陰影 (改為綠色)
        'border-2 border-[#4caf50] shadow-[inset_0px_-2px_0px_1px_#4caf50]',
        // 群組和過渡效果
        'group hover:bg-[#4caf50] transition duration-300 ease-in-out',
        // 禁用狀態
        disabled && 'opacity-60 cursor-not-allowed hover:bg-white',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          // 文字樣式和佈局
          'font-medium text-[#333] flex items-center justify-center',
          // 群組 hover 效果
          'group-hover:text-white',
          // 禁用狀態下保持原色
          disabled && 'group-hover:text-[#333]'
        )}
      >
        {children}
      </span>
    </button>
  )
}
