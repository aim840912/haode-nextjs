'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import type { Theme } from '@/types/theme'

/**
 * 主題切換按鈕元件
 *
 * 功能特色：
 * - 支援 light / dark 兩種模式切換
 * - 響應式設計（桌面版顯示文字，手機版僅圖標）
 * - 符合 Haude 專案的綠色農場風格
 * - 無障礙支援（aria-label）
 * - 避免 hydration mismatch（使用 isMounted 確保客戶端渲染一致性）
 */
export function ThemeToggle() {
  const { theme, effectiveTheme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)

  // 確保元件在客戶端 mount 後才顯示 localStorage 依賴的內容
  useEffect(() => {
    setIsMounted(true)
  }, [])

  /**
   * 循環切換主題：light → dark → light
   */
  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
  }

  /**
   * 根據主題返回對應的圖標
   */
  const renderIcon = () => {
    if (theme === 'light' || effectiveTheme === 'light') {
      // 太陽圖標（淺色模式）
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )
    } else {
      // 月亮圖標（深色模式）
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )
    }
  }

  /**
   * 主題名稱顯示
   */
  const themeLabels: Record<'light' | 'dark', string> = {
    light: '淺色',
    dark: '深色',
  }

  /**
   * 無障礙標籤和顯示文字
   * 在 mount 前使用 effectiveTheme，避免 hydration mismatch
   */
  const displayTheme = isMounted && (theme === 'light' || theme === 'dark') ? theme : effectiveTheme
  const ariaLabel = `切換主題 (目前: ${themeLabels[displayTheme]})`

  return (
    <button
      onClick={toggleTheme}
      className="
        flex items-center justify-center
        p-2
        rounded-md
        text-gray-700 dark:text-gray-200
        hover:text-green-900 hover:bg-green-50
        transition-all duration-200
        min-h-[44px] min-w-[44px]
      "
      aria-label={ariaLabel}
      title={ariaLabel}
      suppressHydrationWarning
    >
      {/* 圖標 */}
      {renderIcon()}
    </button>
  )
}
