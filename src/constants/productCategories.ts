/**
 * 產品分類常數定義
 * 當資料庫中沒有產品時，提供預設的分類選項
 */

export const DEFAULT_PRODUCT_CATEGORIES = [
  // 水果類
  '當季水果',
  '進口水果',
  '有機水果',
] as const

/**
 * 分類描述對應
 */
export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  當季水果: '時令新鮮水果',
  進口水果: '進口精選水果',
  有機水果: '有機認證水果',
}

/**
 * 分類圖示對應（可用於未來 UI 增強）
 */
export const CATEGORY_ICONS: Record<string, string> = {
  當季水果: '🍎',
  進口水果: '🥝',
  有機水果: '🍊',
}

/**
 * 取得所有預設分類
 */
export function getDefaultCategories(): string[] {
  return [...DEFAULT_PRODUCT_CATEGORIES]
}

/**
 * 檢查分類是否為預設分類
 */
export function isDefaultCategory(category: string): boolean {
  return DEFAULT_PRODUCT_CATEGORIES.includes(category as any)
}

/**
 * 取得分類描述
 */
export function getCategoryDescription(category: string): string {
  return CATEGORY_DESCRIPTIONS[category] || '未知分類'
}

/**
 * 取得分類圖示
 */
export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] || '📦'
}
