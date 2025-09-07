'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useAsyncLoading } from './LoadingManager'
import { AsyncOperation } from '@/types/infrastructure.types'

// 錯誤類型定義
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'auth',
  AUTHORIZATION = 'authorization',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown',
}

export interface AppError {
  id: string
  type: ErrorType
  message: string
  originalError?: Error
  timestamp: number
  context?: Record<string, unknown>
  retryable?: boolean
  retryCount?: number
}

interface ErrorContextType {
  errors: AppError[]
  addError: (error: Partial<AppError>) => string
  removeError: (id: string) => void
  clearErrors: () => void
  retryOperation: <T = unknown>(errorId: string, operation: AsyncOperation<T>) => Promise<void>
}

const ErrorContext = createContext<ErrorContextType | null>(null)

interface ErrorHandlerProps {
  children: ReactNode
  maxErrors?: number
  autoRemoveTimeout?: number
}

export function ErrorHandler({
  children,
  maxErrors = 5,
  autoRemoveTimeout = 5000,
}: ErrorHandlerProps) {
  const [errors, setErrors] = useState<AppError[]>([])

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }, [])

  const addError = useCallback(
    (errorData: Partial<AppError>): string => {
      const id = errorData.id || `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const newError: AppError = {
        id,
        type: errorData.type || ErrorType.UNKNOWN,
        message: errorData.message || '發生未知錯誤',
        originalError: errorData.originalError,
        timestamp: Date.now(),
        context: errorData.context,
        retryable: errorData.retryable ?? false,
        retryCount: errorData.retryCount || 0,
        ...errorData,
      }

      setErrors(prev => {
        const updated = [newError, ...prev]
        // 限制錯誤數量
        return updated.slice(0, maxErrors)
      })

      // 自動移除錯誤（非重試錯誤）
      if (!newError.retryable && autoRemoveTimeout > 0) {
        setTimeout(() => {
          removeError(id)
        }, autoRemoveTimeout)
      }

      return id
    },
    [maxErrors, autoRemoveTimeout, removeError]
  )

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const retryOperation = useCallback(
    async <T = unknown,>(errorId: string, operation: AsyncOperation<T>) => {
      const error = errors.find(e => e.id === errorId)
      if (!error || !error.retryable) return

      try {
        await operation()
        removeError(errorId)
      } catch {
        // 更新重試次數
        setErrors(prev =>
          prev.map(e => (e.id === errorId ? { ...e, retryCount: (e.retryCount || 0) + 1 } : e))
        )
      }
    },
    [errors, removeError]
  )

  return (
    <ErrorContext.Provider
      value={{
        errors,
        addError,
        removeError,
        clearErrors,
        retryOperation,
      }}
    >
      {children}
      <ErrorDisplay />
    </ErrorContext.Provider>
  )
}

export function useErrorHandler() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useErrorHandler must be used within an ErrorHandler')
  }
  return context
}

// 錯誤處理工具函數
export function classifyError(error: Error | unknown): ErrorType {
  if (!error) return ErrorType.UNKNOWN

  // 類型守衛：檢查是否為 Error 類型
  const isError = (obj: unknown): obj is Error => {
    return obj instanceof Error || (typeof obj === 'object' && obj !== null && 'message' in obj)
  }

  // 類型守衛：檢查是否有狀態碼屬性
  const hasStatus = (obj: unknown): obj is { status: number } => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'status' in obj &&
      typeof (obj as { status: unknown }).status === 'number'
    )
  }

  // 類型守衛：檢查是否有 name 屬性
  const hasName = (obj: unknown): obj is { name: string } => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'name' in obj &&
      typeof (obj as { name: unknown }).name === 'string'
    )
  }

  const message = isError(error) ? error.message?.toLowerCase() || '' : String(error).toLowerCase()
  const errorName = hasName(error) ? error.name : ''
  const status = hasStatus(error) ? error.status : 0

  // 網路錯誤
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    errorName === 'NetworkError'
  ) {
    return ErrorType.NETWORK
  }

  // 驗證錯誤
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    errorName === 'ValidationError'
  ) {
    return ErrorType.VALIDATION
  }

  // 認證錯誤
  if (message.includes('unauthorized') || message.includes('authentication') || status === 401) {
    return ErrorType.AUTHENTICATION
  }

  // 授權錯誤
  if (message.includes('forbidden') || message.includes('authorization') || status === 403) {
    return ErrorType.AUTHORIZATION
  }

  // 伺服器錯誤
  if (status >= 500 || message.includes('server') || message.includes('internal')) {
    return ErrorType.SERVER
  }

  // 客戶端錯誤
  if (status >= 400 && status < 500) {
    return ErrorType.CLIENT
  }

  return ErrorType.UNKNOWN
}

export function getErrorMessage(type: ErrorType, originalMessage?: string): string {
  const messages = {
    [ErrorType.NETWORK]: '網路連線失敗，請檢查您的網路連線',
    [ErrorType.VALIDATION]: '輸入的資料格式不正確，請檢查後重試',
    [ErrorType.AUTHENTICATION]: '請先登入才能繼續操作',
    [ErrorType.AUTHORIZATION]: '您沒有權限執行此操作',
    [ErrorType.SERVER]: '伺服器暫時無法回應，請稍後再試',
    [ErrorType.CLIENT]: '請求失敗，請檢查輸入的資料',
    [ErrorType.UNKNOWN]: '發生未知錯誤，請稍後再試',
  }

  return originalMessage || messages[type]
}

export function isRetryableError(type: ErrorType): boolean {
  return [ErrorType.NETWORK, ErrorType.SERVER].includes(type)
}

// 便利的錯誤處理 Hook
export function useAsyncWithError() {
  const { addError } = useErrorHandler()
  const loadingResult = useAsyncLoading()
  const { executeWithLoading } = loadingResult || { executeWithLoading: async (fn: any) => fn() }

  const executeWithErrorHandling = useCallback(
    async <T = unknown,>(
      asyncFunction: AsyncOperation<T>,
      options: {
        taskId?: string
        loadingMessage?: string
        errorMessage?: string
        context?: Record<string, unknown>
        timeout?: number
      } = {}
    ): Promise<T> => {
      try {
        return await executeWithLoading(
          asyncFunction,
          options.taskId,
          options.loadingMessage,
          options.timeout
        )
      } catch (error) {
        const errorType = classifyError(error)
        const errorMessage = getErrorMessage(errorType, options.errorMessage)

        addError({
          type: errorType,
          message: errorMessage,
          originalError: error instanceof Error ? error : new Error(String(error)),
          context: options.context,
          retryable: isRetryableError(errorType),
        })

        throw error
      }
    },
    [addError, executeWithLoading]
  )

  return { executeWithErrorHandling }
}

// 錯誤顯示組件
function ErrorDisplay() {
  const { errors, removeError, retryOperation } = useErrorHandler()

  if (errors.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {errors.slice(0, 3).map(error => (
        <ErrorToast
          key={error.id}
          error={error}
          onDismiss={() => removeError(error.id)}
          onRetry={error.retryable ? operation => retryOperation(error.id, operation) : undefined}
        />
      ))}
    </div>
  )
}

interface ErrorToastProps {
  error: AppError
  onDismiss: () => void
  onRetry?: (operation: AsyncOperation) => void
}

function ErrorToast({ error, onDismiss, onRetry }: ErrorToastProps) {
  const getErrorIcon = (type: ErrorType) => {
    switch (type) {
      case ErrorType.NETWORK:
        return '🌐'
      case ErrorType.VALIDATION:
        return '⚠️'
      case ErrorType.AUTHENTICATION:
        return '🔒'
      case ErrorType.AUTHORIZATION:
        return '🚫'
      case ErrorType.SERVER:
        return '🔧'
      default:
        return '❌'
    }
  }

  const getErrorColor = (type: ErrorType) => {
    switch (type) {
      case ErrorType.NETWORK:
        return 'border-blue-200 bg-blue-50 text-blue-800'
      case ErrorType.VALIDATION:
        return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return 'border-orange-200 bg-orange-50 text-orange-800'
      case ErrorType.SERVER:
        return 'border-red-200 bg-red-50 text-red-800'
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800'
    }
  }

  return (
    <div
      className={`
      border rounded-lg p-4 shadow-lg transition-all duration-300
      ${getErrorColor(error.type)}
    `}
    >
      <div className="flex items-start space-x-3">
        <span className="text-xl">{getErrorIcon(error.type)}</span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{error.message}</p>

          {error.retryCount && error.retryCount > 0 && (
            <p className="text-xs opacity-75 mt-1">重試次數: {error.retryCount}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onRetry && (
            <button
              onClick={() => onRetry(() => Promise.resolve())}
              className="text-xs px-2 py-1 rounded hover:opacity-75 transition-opacity"
            >
              重試
            </button>
          )}

          <button
            onClick={onDismiss}
            className="text-xs opacity-60 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
