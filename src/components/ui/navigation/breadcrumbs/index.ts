/**
 * Breadcrumbs - 麵包屑導航元件集合
 *
 * **模組架構**:
 * - Breadcrumbs.tsx - 主要 UI 元件
 * - BreadcrumbStructuredData.tsx - SEO 結構化資料
 * - breadcrumb-utils.ts - 工具函數
 * - breadcrumb-generators.ts - 專門產生器
 * - types.ts - 型別定義
 */

// 元件
export { Breadcrumbs } from './Breadcrumbs'
export { BreadcrumbStructuredData } from './BreadcrumbStructuredData'

// 工具函數
export { generateBreadcrumbs } from './breadcrumb-utils'

// 專門產生器
export {
  createProductBreadcrumbs,
  createMomentsBreadcrumbs,
  createLocationsBreadcrumbs,
  createAdminBreadcrumbs,
  createScheduleBreadcrumbs,
  createFarmTourBreadcrumbs,
} from './breadcrumb-generators'

// 型別和常數
export { BreadcrumbVariants } from './types'
export type { BreadcrumbItem, BreadcrumbsProps } from './types'
