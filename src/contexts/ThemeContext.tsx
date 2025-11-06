'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { logger } from '@/lib/logger'
import { getTheme, setTheme as saveTheme } from '@/lib/storage/theme'
import type { Theme, EffectiveTheme, ThemeContextType } from '@/types/theme'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * Theme Provider
 * 提供主題切換功能，支援 light / dark / system 三種模式
 *
 * 功能特色：
 * - 支援三種主題模式（light / dark / system）
 * - 自動跟隨系統偏好（當選擇 system 時）
 * - 持久化到 localStorage
 * - 正確處理 SSR/CSR hydration
 * - 無閃爍載入（FOUC free）
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>('light')
  const [isClient, setIsClient] = useState(false)

  // 從 localStorage 載入主題偏好
  useEffect(() => {
    setIsClient(true)
    const savedTheme = getTheme()
    setThemeState(savedTheme)
    logger.debug('載入主題偏好', { metadata: { theme: savedTheme } })
  }, [])

  // 解析實際應用的主題（處理 system 模式）
  useEffect(() => {
    if (!isClient) return undefined

    /**
     * 解析主題：將 system 轉換為實際的 light/dark
     */
    const resolveTheme = (currentTheme: Theme): EffectiveTheme => {
      if (currentTheme === 'system') {
        // 檢查系統偏好
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        return prefersDark ? 'dark' : 'light'
      }
      return currentTheme
    }

    /**
     * 更新實際應用的主題並操作 DOM
     */
    const updateEffectiveTheme = () => {
      const resolved = resolveTheme(theme)
      setEffectiveTheme(resolved)

      // 更新 HTML class for Tailwind dark mode
      const html = document.documentElement
      if (resolved === 'dark') {
        html.classList.add('dark')
        logger.debug('套用深色主題')
      } else {
        html.classList.remove('dark')
        logger.debug('套用淺色主題')
      }
    }

    updateEffectiveTheme()

    // 監聽系統主題變更（僅在 theme 為 system 時）
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        logger.debug('系統主題偏好改變', { metadata: { prefersDark: e.matches } })
        updateEffectiveTheme()
      }

      // 使用現代瀏覽器 API
      mediaQuery.addEventListener('change', handleChange)

      return () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }

    return undefined
  }, [theme, isClient])

  /**
   * 切換主題並儲存到 localStorage
   */
  const setTheme = (newTheme: Theme) => {
    logger.info('切換主題', { metadata: { from: theme, to: newTheme } })
    setThemeState(newTheme)
    saveTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, isClient }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * useTheme Hook
 * 用於在元件中存取主題相關功能
 *
 * @throws 如果在 ThemeProvider 外使用會拋出錯誤
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, effectiveTheme, setTheme } = useTheme()
 *
 *   return (
 *     <div className="bg-white dark:bg-gray-900">
 *       Current theme: {effectiveTheme}
 *       <button onClick={() => setTheme('dark')}>Dark</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme 必須在 ThemeProvider 內使用')
  }
  return context
}
