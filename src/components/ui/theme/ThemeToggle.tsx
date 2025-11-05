'use client'

import { useTheme } from '@/contexts/ThemeContext'
import type { Theme } from '@/types/theme'

/**
 * 主題切換按鈕元件
 *
 * 功能特色：
 * - 支援 light / dark / system 三種模式循環切換
 * - 響應式設計（桌面版顯示文字，手機版僅圖標）
 * - 符合 Haude 專案的綠色農場風格
 * - 無障礙支援（aria-label）
 */
export function ThemeToggle() {
  const { theme, effectiveTheme, setTheme } = useTheme()

  /**
   * 循環切換主題：light → dark → system → light
   */
  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(nextTheme)
  }

  /**
   * 根據主題返回對應的圖標
   */
  const renderIcon = () => {
    if (theme === 'light') {
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
    } else if (theme === 'dark') {
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
    } else {
      // 電腦/系統圖標（跟隨系統）
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
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      )
    }
  }

  /**
   * 主題名稱顯示
   */
  const themeLabels: Record<Theme, string> = {
    light: '淺色',
    dark: '深色',
    system: '系統',
  }

  /**
   * 無障礙標籤（含當前實際主題資訊）
   */
  const ariaLabel = `切換主題 (目前: ${themeLabels[theme]}${theme === 'system' ? ` - ${effectiveTheme === 'dark' ? '深色' : '淺色'}` : ''})`

  return (
    <button
      onClick={toggleTheme}
      className="
        inline-flex items-center gap-2
        p-2 sm:px-3 sm:py-2
        rounded-lg
        bg-white dark:bg-slate-800
        text-gray-700 dark:text-gray-200
        border border-gray-300 dark:border-slate-600
        hover:bg-gray-50 dark:hover:bg-slate-700
        hover:border-green-500 dark:hover:border-green-400
        transition-all duration-200
        shadow-sm hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900
      "
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {/* 圖標 */}
      {renderIcon()}

      {/* 文字標籤（桌面版顯示） */}
      <span className="hidden sm:inline text-sm font-medium">{themeLabels[theme]}</span>

      {/* 當前實際主題指示器（system 模式下顯示） */}
      {theme === 'system' && (
        <span className="hidden md:inline text-xs text-gray-500 dark:text-gray-400">
          ({effectiveTheme === 'dark' ? '深色' : '淺色'})
        </span>
      )}
    </button>
  )
}
