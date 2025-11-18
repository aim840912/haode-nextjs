/**
 * ProgressiveLoading - 向後兼容匯出
 *
 * **重構說明**:
 * - 原始 345 行已拆分為模組化架構
 * - 實際實作已移至 ./progressive-loading/ 目錄
 * - 此檔案僅用於維持向後兼容性
 *
 * **模組架構**:
 * - ProgressiveLoading.tsx - 漸進式載入容器 (95 行)
 * - DataLoading.tsx - 資料載入元件 (110 行)
 * - ProgressiveImage.tsx - 圖片漸進式載入 (130 行)
 * - ProgressiveList.tsx - 列表漸進式載入 (115 行)
 * - index.ts - 統一匯出 (20 行)
 */

// 元件
export { ProgressiveLoading } from './progressive-loading'
export { DataLoading } from './progressive-loading'
export { ProgressiveImage } from './progressive-loading'
export { ProgressiveList } from './progressive-loading'

// 型別
export type { ProgressiveLoadingProps } from './progressive-loading'
export type { DataLoadingProps } from './progressive-loading'
export type { ProgressiveImageProps } from './progressive-loading'
export type { ProgressiveListProps } from './progressive-loading'
