/**
 * 主題系統類型定義
 */

/**
 * 主題模式
 * - light: 淺色模式
 * - dark: 深色模式
 * - system: 跟隨系統偏好
 */
export type Theme = 'light' | 'dark' | 'system'

/**
 * 實際應用的主題（解析後的主題）
 */
export type EffectiveTheme = 'light' | 'dark'

/**
 * 主題 Context 類型
 */
export interface ThemeContextType {
  /** 當前主題模式 */
  theme: Theme
  /** 實際應用的主題（system 解析後） */
  effectiveTheme: EffectiveTheme
  /** 設定主題 */
  setTheme: (theme: Theme) => void
  /** 是否在客戶端環境 */
  isClient: boolean
}
