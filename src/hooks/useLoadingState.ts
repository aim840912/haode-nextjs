'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { logger } from '@/lib/logger'

export interface LoadingError {
  message: string
  code?: string | number
  retryable: boolean
  timestamp: number
}

export interface LoadingProgress {
  current: number
  total: number
  message?: string
}

export interface LoadingState {
  isLoading: boolean
  error: LoadingError | null
  progress: LoadingProgress | null
  retryCount: number
  canRetry: boolean
}

export interface UseLoadingStateOptions {
  maxRetries?: number
  retryDelay?: number
  showLoadingAfterMs?: number
  logErrors?: boolean
  errorModule?: string
}

const DEFAULT_OPTIONS: Required<UseLoadingStateOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  showLoadingAfterMs: 200,
  logErrors: true,
  errorModule: 'LoadingState',
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }

  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    progress: null,
    retryCount: 0,
    canRetry: false,
  })

  const [shouldShowLoading, setShouldShowLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 智慧載入顯示：延遲顯示載入狀態
  useEffect(() => {
    if (state.isLoading) {
      timeoutRef.current = setTimeout(() => {
        setShouldShowLoading(true)
      }, config.showLoadingAfterMs)
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setShouldShowLoading(false)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [state.isLoading, config.showLoadingAfterMs])

  const startLoading = useCallback((progressMessage?: string) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: progressMessage ? { current: 0, total: 100, message: progressMessage } : null,
    }))
  }, [])

  const updateProgress = useCallback((progress: Partial<LoadingProgress>) => {
    setState(prev => ({
      ...prev,
      progress: prev.progress ? { ...prev.progress, ...progress } : null,
    }))
  }, [])

  const setError = useCallback(
    (error: string | Error | LoadingError, retryable = true) => {
      const loadingError: LoadingError =
        typeof error === 'string'
          ? { message: error, retryable, timestamp: Date.now() }
          : error instanceof Error
            ? { message: error.message, retryable, timestamp: Date.now() }
            : error

      if (config.logErrors) {
        logger.error(
          'Loading operation failed',
          loadingError instanceof Error ? loadingError : new Error(String(loadingError)),
          {
            module: config.errorModule,
            metadata: {
              retryCount: state.retryCount,
              canRetry: loadingError.retryable && state.retryCount < config.maxRetries,
            },
          }
        )
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: loadingError,
        progress: null,
        canRetry: loadingError.retryable && prev.retryCount < config.maxRetries,
      }))
    },
    [config.logErrors, config.errorModule, config.maxRetries, state.retryCount]
  )

  const stopLoading = useCallback((success = true) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: success ? null : prev.error,
      progress: null,
      retryCount: success ? 0 : prev.retryCount,
    }))
  }, [])

  const retry = useCallback(() => {
    if (!state.canRetry) return Promise.reject(new Error('Cannot retry'))

    setState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      canRetry: false,
      error: null,
    }))

    return new Promise<void>(resolve => {
      const delay = config.retryDelay * Math.pow(2, state.retryCount) // 指數退避
      retryTimeoutRef.current = setTimeout(() => {
        resolve()
      }, delay)
    })
  }, [state.canRetry, state.retryCount, config.retryDelay])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      progress: null,
      retryCount: 0,
      canRetry: false,
    })
    setShouldShowLoading(false)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
  }, [])

  // 便利方法：執行異步操作
  const executeAsync = useCallback(
    async <T>(
      asyncOperation: (updateProgress: (progress: Partial<LoadingProgress>) => void) => Promise<T>,
      progressMessage?: string
    ): Promise<T> => {
      startLoading(progressMessage)

      let retries = 0
      const maxRetries = config.maxRetries

      while (retries <= maxRetries) {
        try {
          const result = await asyncOperation(updateProgress)
          stopLoading(true)
          return result
        } catch (error) {
          if (retries === maxRetries) {
            // 最後一次重試失敗
            setError(error as Error, retries < maxRetries)
            throw error
          } else {
            // 準備重試
            retries++
            setState(prev => ({ ...prev, retryCount: retries }))

            // 等待重試延遲
            const delay = config.retryDelay * Math.pow(2, retries - 1)
            await new Promise(resolve => setTimeout(resolve, delay))

            logger.info('Retrying operation', {
              module: config.errorModule,
              metadata: { attempt: retries, maxRetries, delay },
            })
          }
        }
      }

      throw new Error('Unexpected end of retry loop')
    },
    [
      startLoading,
      updateProgress,
      stopLoading,
      setError,
      config.maxRetries,
      config.retryDelay,
      config.errorModule,
    ]
  )

  // 清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    }
  }, [])

  return {
    ...state,
    shouldShowLoading, // 智慧載入顯示狀態
    startLoading,
    stopLoading,
    updateProgress,
    setError,
    retry,
    reset,
    executeAsync,
  }
}

// 便利 Hook：專門用於 API 請求
export function useApiLoading(options: UseLoadingStateOptions = {}) {
  return useLoadingState({
    errorModule: 'API',
    logErrors: true,
    ...options,
  })
}

// 便利 Hook：專門用於表單提交
export function useFormLoading(options: UseLoadingStateOptions = {}) {
  return useLoadingState({
    errorModule: 'Form',
    showLoadingAfterMs: 0, // 表單提交立即顯示載入
    maxRetries: 1, // 表單通常不需要多次重試
    ...options,
  })
}

// 便利 Hook：專門用於資料載入
export function useDataLoading(options: UseLoadingStateOptions = {}) {
  return useLoadingState({
    errorModule: 'DataLoading',
    showLoadingAfterMs: 300, // 資料載入可以稍微延遲
    maxRetries: 3,
    ...options,
  })
}
