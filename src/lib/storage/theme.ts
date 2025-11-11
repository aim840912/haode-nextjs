/**
 * 主題相關的 localStorage 工具
 * 提供類型安全的主題偏好儲存和讀取
 */

import { logger } from '@/lib/logger'
import type { Theme } from '@/types/theme'

const THEME_STORAGE_KEY = 'haude-theme-preference'

/**
 * 從 localStorage 讀取主題偏好
 * @returns 儲存的主題偏好，預設為 'system'
 */
export function getTheme(): Theme {
  try {
    // SSR 環境檢查
    if (typeof window === 'undefined') {
      return 'system'
    }

    const stored = localStorage.getItem(THEME_STORAGE_KEY)

    if (!stored) {
      return 'system'
    }

    // 驗證讀取的值是否為有效的主題
    const parsed = JSON.parse(stored) as Theme
    if (parsed === 'light' || parsed === 'dark' || parsed === 'system') {
      logger.debug('成功讀取主題偏好', { metadata: { theme: parsed } })
      return parsed
    }

    logger.warn('讀取到無效的主題值，使用預設值', { metadata: { invalid: parsed } })
    return 'system'
  } catch (error) {
    logger.error('讀取主題偏好失敗', error as Error)
    return 'system'
  }
}

/**
 * 儲存主題偏好到 localStorage
 * @param theme - 要儲存的主題
 * @returns 是否儲存成功
 */
export function setTheme(theme: Theme): boolean {
  try {
    // SSR 環境檢查
    if (typeof window === 'undefined') {
      return false
    }

    // 驗證輸入
    if (theme !== 'light' && theme !== 'dark' && theme !== 'system') {
      logger.error('嘗試儲存無效的主題值', new Error(`Invalid theme: ${theme}`))
      return false
    }

    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme))
    logger.debug('成功儲存主題偏好', { metadata: { theme } })
    return true
  } catch (error) {
    logger.error('儲存主題偏好失敗', error as Error)
    return false
  }
}

/**
 * 移除主題偏好（恢復預設值）
 * @returns 是否移除成功
 */
export function removeTheme(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false
    }

    localStorage.removeItem(THEME_STORAGE_KEY)
    logger.debug('成功移除主題偏好')
    return true
  } catch (error) {
    logger.error('移除主題偏好失敗', error as Error)
    return false
  }
}
