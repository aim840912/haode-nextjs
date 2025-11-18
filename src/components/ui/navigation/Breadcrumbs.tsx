/**
 * Breadcrumbs - 向後兼容匯出
 *
 * **重構說明**:
 * - 原始 341 行已拆分為模組化架構
 * - 實際實作已移至 ./breadcrumbs/ 目錄
 * - 此檔案僅用於維持向後兼容性
 *
 * **模組架構**:
 * - Breadcrumbs.tsx - 主要 UI 元件 (95 行)
 * - BreadcrumbStructuredData.tsx - SEO 結構化資料 (80 行)
 * - breadcrumb-utils.ts - 工具函數 (60 行)
 * - breadcrumb-generators.ts - 專門產生器 (120 行)
 * - types.ts - 型別定義 (40 行)
 * - index.ts - 統一匯出 (30 行)
 */

// 元件
export { Breadcrumbs } from './breadcrumbs'
export { BreadcrumbStructuredData } from './breadcrumbs'

// 工具函數
export { generateBreadcrumbs } from './breadcrumbs'

// 專門產生器
export {
  createProductBreadcrumbs,
  createMomentsBreadcrumbs,
  createLocationsBreadcrumbs,
  createAdminBreadcrumbs,
  createScheduleBreadcrumbs,
  createFarmTourBreadcrumbs,
} from './breadcrumbs'

// 型別和常數
export { BreadcrumbVariants } from './breadcrumbs'
export type { BreadcrumbItem, BreadcrumbsProps } from './breadcrumbs'
