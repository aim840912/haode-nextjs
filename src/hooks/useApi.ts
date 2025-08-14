'use client';

import { useState, useCallback } from 'react';
import { ApiResponse } from '@/lib/api-response';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (
    apiCall: () => Promise<Response>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: string) => void;
      skipLoading?: boolean;
    }
  ) => {
    if (!options?.skipLoading) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const response = await apiCall();
      const result: ApiResponse<T> = await response.json();

      if (result.success && result.data !== undefined) {
        setState({
          data: result.data,
          loading: false,
          error: null
        });
        options?.onSuccess?.(result.data);
        return result.data;
      } else {
        const errorMessage = result.error || '請求失敗';
        setState({
          data: null,
          loading: false,
          error: errorMessage
        });
        options?.onError?.(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '網路錯誤';
      setState({
        data: null,
        loading: false,
        error: errorMessage
      });
      options?.onError?.(errorMessage);
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}

// 預定義的 API 呼叫 Hook
export function useApiCall<T>(url: string, options?: RequestInit) {
  const { execute, ...state } = useApi<T>();

  const call = useCallback((customOptions?: RequestInit) => {
    return execute(() => fetch(url, { ...options, ...customOptions }));
  }, [url, options, execute]);

  return {
    ...state,
    call
  };
}

// 帶重試機制的 API Hook
export function useApiWithRetry<T>(maxRetries: number = 3, retryDelay: number = 1000) {
  const [retryCount, setRetryCount] = useState(0);
  const { execute, ...state } = useApi<T>();

  const executeWithRetry = useCallback(async (
    apiCall: () => Promise<Response>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: string) => void;
    }
  ) => {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt);
        return await execute(apiCall, {
          ...options,
          skipLoading: attempt > 0 // 重試時不顯示載入狀態
        });
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    throw lastError!;
  }, [execute, maxRetries, retryDelay]);

  return {
    ...state,
    execute: executeWithRetry,
    retryCount
  };
}