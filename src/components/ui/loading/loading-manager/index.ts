/**
 * Loading Manager - 載入狀態管理系統
 *
 * **模組架構**:
 * - LoadingManager.tsx - Provider 核心邏輯
 * - useLoading.ts - Context Hook
 * - useAsyncLoading.ts - 非同步操作 Hook
 * - LoadingIndicator.tsx - 載入指示器元件
 * - LoadingWrapper.tsx - 條件式包裝器元件
 * - PageLoading.tsx - 頁面級載入元件
 * - types.ts - 型別定義
 */

// Provider
export { LoadingManager } from './LoadingManager'

// Hooks
export { useLoading } from './useLoading'
export { useAsyncLoading } from './useAsyncLoading'

// Components
export { LoadingIndicator } from './LoadingIndicator'
export { LoadingWrapper } from './LoadingWrapper'
export { PageLoading } from './PageLoading'

// Types
export type {
  LoadingProgress,
  LoadingTask,
  LoadingContextType,
  LoadingManagerProps,
  LoadingIndicatorProps,
  LoadingWrapperProps,
  PageLoadingProps,
} from './types'
