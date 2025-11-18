/**
 * Error Handler - 錯誤處理管理系統
 *
 * **模組架構**:
 * - ErrorHandler.tsx - Provider 核心邏輯
 * - useErrorHandler.ts - Context Hook
 * - error-utils.ts - 工具函數（分類、訊息、可重試判斷）
 * - useAsyncWithError.ts - 整合載入和錯誤處理 Hook
 * - ErrorDisplay.tsx - 錯誤顯示容器
 * - ErrorToast.tsx - 錯誤 Toast 元件
 * - types.ts - 型別定義
 */

// Provider
export { ErrorHandler } from './ErrorHandler'

// Hooks
export { useErrorHandler } from './useErrorHandler'
export { useAsyncWithError } from './useAsyncWithError'

// Components
export { ErrorDisplay } from './ErrorDisplay'
export { ErrorToast } from './ErrorToast'

// Utils
export { classifyError, getErrorMessage, isRetryableError } from './error-utils'

// Types
export { ErrorType } from './types'
export type { AppError, ErrorContextType, ErrorHandlerProps, ErrorToastProps } from './types'
