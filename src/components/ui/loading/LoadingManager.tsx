/**
 * LoadingManager - 向後兼容匯出
 *
 * **重構說明**:
 * - 原始 373 行已拆分為模組化架構
 * - 實際實作已移至 ./loading-manager/ 目錄
 * - 此檔案僅用於維持向後兼容性
 *
 * **模組架構**:
 * - LoadingManager.tsx - Provider 核心邏輯 (170 行)
 * - useLoading.ts - Context Hook (15 行)
 * - useAsyncLoading.ts - 非同步操作 Hook (50 行)
 * - LoadingIndicator.tsx - 載入指示器元件 (60 行)
 * - LoadingWrapper.tsx - 條件式包裝器元件 (40 行)
 * - PageLoading.tsx - 頁面級載入元件 (70 行)
 * - types.ts - 型別定義 (130 行)
 * - index.ts - 統一匯出 (35 行)
 */

// Provider
export { LoadingManager } from './loading-manager'

// Hooks
export { useLoading } from './loading-manager'
export { useAsyncLoading } from './loading-manager'

// Components
export { LoadingIndicator } from './loading-manager'
export { LoadingWrapper } from './loading-manager'
export { PageLoading } from './loading-manager'

// Types
export type {
  LoadingProgress,
  LoadingTask,
  LoadingContextType,
  LoadingManagerProps,
  LoadingIndicatorProps,
  LoadingWrapperProps,
  PageLoadingProps,
} from './loading-manager/types'
