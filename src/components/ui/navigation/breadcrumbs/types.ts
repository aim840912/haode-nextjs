/**
 * Breadcrumbs 型別定義
 */

export interface BreadcrumbItem {
  /** 顯示文字 */
  name: string
  /** 連結路徑，最後一項通常不提供（表示當前頁面） */
  href?: string
  /** 是否為當前頁面 */
  current?: boolean
}

export interface BreadcrumbsProps {
  /** 麵包屑項目列表 */
  items: BreadcrumbItem[]
  /** 自訂樣式 */
  className?: string
  /** 分隔符號 */
  separator?: string
  /** 是否顯示首頁連結 */
  showHome?: boolean
  /** 是否啟用結構化資料 */
  enableStructuredData?: boolean
  /** 網站基礎 URL */
  baseUrl?: string
}

/**
 * 預設樣式變體
 */
export const BreadcrumbVariants = {
  default: '',
  compact: 'text-xs',
  large: 'text-base',
  card: 'bg-white p-4 rounded-lg shadow-sm border',
  minimal: 'text-gray-500',
  dark: 'text-gray-300',
}
