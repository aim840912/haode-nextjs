/**
 * ErrorHandler - 向後兼容匯出
 *
 * **重構說明**:
 * - 原始 372 行已拆分為模組化架構
 * - 實際實作已移至 ./error-handler/ 目錄
 * - 此檔案僅用於維持向後兼容性
 *
 * **模組架構**:
 * - ErrorHandler.tsx - Provider 核心邏輯 (95 行)
 * - useErrorHandler.ts - Context Hook (15 行)
 * - error-utils.ts - 工具函數 (125 行)
 * - useAsyncWithError.ts - 整合載入和錯誤處理 Hook (75 行)
 * - ErrorDisplay.tsx - 錯誤顯示容器 (30 行)
 * - ErrorToast.tsx - 錯誤 Toast 元件 (90 行)
 * - types.ts - 型別定義 (85 行)
 * - index.ts - 統一匯出 (35 行)
 */

// Provider
export { ErrorHandler } from './error-handler'

// Hooks
export { useErrorHandler } from './error-handler'
export { useAsyncWithError } from './error-handler'

// Components
export { ErrorDisplay } from './error-handler'
export { ErrorToast } from './error-handler'

// Utils
export { classifyError, getErrorMessage, isRetryableError } from './error-handler'

// Types
export { ErrorType } from './error-handler'
export type {
  AppError,
  ErrorContextType,
  ErrorHandlerProps,
  ErrorToastProps,
} from './error-handler/types'
