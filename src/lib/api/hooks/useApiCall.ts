/**
 * React Hook 用於 API 調用
 *
 * 提供標準化的 API 調用狀態管理:
 * - 載入狀態追蹤
 * - 錯誤處理
 * - 資料快取
 * - 狀態重置
 */

'use client'

import { useState, useCallback } from 'react'
import { ApiResponse } from '@/types/infrastructure.types'

interface UseApiCallState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApiCall<T = unknown>() {
  const [state, setState] = useState<UseApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async <R = T>(apiCall: () => Promise<ApiResponse<R>>): Promise<R | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await apiCall()

        if (response.success && response.data) {
          setState({
            data: response.data as T,
            loading: false,
            error: null,
          })
          return response.data
        } else {
          const error = response.error || '請求失敗'
          setState({
            data: null,
            loading: false,
            error,
          })
          return null
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知錯誤'
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        })
        return null
      }
    },
    []
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}
