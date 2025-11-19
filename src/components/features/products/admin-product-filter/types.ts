/**
 * AdminProductFilter 型別定義
 *
 * 此檔案包含篩選器元件所需的所有型別定義
 */

/**
 * 管理員產品篩選狀態
 */
export interface AdminFilterState {
  /** 搜尋關鍵字 */
  search: string
  /** 篩選的產品類別 */
  categories: string[]
  /** 庫存狀態篩選 */
  availability: 'all' | 'in_stock' | 'out_of_stock'
  /** 上架狀態篩選 */
  status: 'all' | 'active' | 'inactive'
  /** 價格區間 */
  priceRange: {
    min: number
    max: number
  }
  /** 排序方式 */
  sortBy:
    | 'name'
    | 'price_low'
    | 'price_high'
    | 'category'
    | 'inventory'
    | 'created_desc'
    | 'created_asc'
}

/**
 * AdminProductFilter 元件的 props
 */
export interface AdminProductFilterProps {
  /** 篩選條件變更時的回調函數 */
  onFilterChange: (filters: AdminFilterState) => void
  /** 可用的產品類別列表 */
  availableCategories: string[]
  /** 當前顯示的產品數量 */
  productCount: number
  /** 總產品數量 */
  totalCount: number
  /** 載入狀態 */
  loading?: boolean
}
