import { ReactNode } from 'react'
import { AsyncOperation } from '@/types/infrastructure.types'

/**
 * 錯誤類型
 */
export enum ErrorType {
  /** 網路錯誤 */
  NETWORK = 'network',
  /** 驗證錯誤 */
  VALIDATION = 'validation',
  /** 認證錯誤 */
  AUTHENTICATION = 'auth',
  /** 授權錯誤 */
  AUTHORIZATION = 'authorization',
  /** 伺服器錯誤 */
  SERVER = 'server',
  /** 客戶端錯誤 */
  CLIENT = 'client',
  /** 未知錯誤 */
  UNKNOWN = 'unknown',
}

/**
 * 應用程式錯誤
 */
export interface AppError {
  /** 錯誤 ID */
  id: string
  /** 錯誤類型 */
  type: ErrorType
  /** 錯誤訊息 */
  message: string
  /** 原始錯誤物件 */
  originalError?: Error
  /** 時間戳記 */
  timestamp: number
  /** 錯誤上下文 */
  context?: Record<string, unknown>
  /** 是否可重試 */
  retryable?: boolean
  /** 重試次數 */
  retryCount?: number
}

/**
 * Error Context 類型
 */
export interface ErrorContextType {
  /** 所有錯誤 */
  errors: AppError[]
  /** 新增錯誤 */
  addError: (error: Partial<AppError>) => string
  /** 移除錯誤 */
  removeError: (id: string) => void
  /** 清除所有錯誤 */
  clearErrors: () => void
  /** 重試操作 */
  retryOperation: <T = unknown>(errorId: string, operation: AsyncOperation<T>) => Promise<void>
}

/**
 * ErrorHandler Props
 */
export interface ErrorHandlerProps {
  /** 子元件 */
  children: ReactNode
  /** 最大錯誤數量 */
  maxErrors?: number
  /** 自動移除超時（毫秒） */
  autoRemoveTimeout?: number
}

/**
 * ErrorToast Props
 */
export interface ErrorToastProps {
  /** 錯誤物件 */
  error: AppError
  /** 關閉回調 */
  onDismiss: () => void
  /** 重試回調 */
  onRetry?: (operation: AsyncOperation) => void
}
