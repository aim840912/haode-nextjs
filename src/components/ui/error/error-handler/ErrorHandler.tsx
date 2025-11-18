'use client'

import { createContext, useCallback, useState } from 'react'
import { AsyncOperation } from '@/types/infrastructure.types'
import { ErrorDisplay } from './ErrorDisplay'
import { ErrorType } from './types'
import type { AppError, ErrorContextType, ErrorHandlerProps } from './types'

export const ErrorContext = createContext<ErrorContextType | null>(null)

/**
 * 錯誤處理器 Provider
 *
 * 提供全域錯誤管理，支援：
 * - 錯誤收集和顯示
 * - 自動移除超時
 * - 錯誤重試機制
 * - 最大錯誤數量限制
 */
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
