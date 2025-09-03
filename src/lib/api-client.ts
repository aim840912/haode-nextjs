/**
 * 統一 API 客戶端
 * 
 * 提供全站統一的 API 調用接口，自動處理：
 * - CSRF token 管理
 * - 錯誤處理和重試
 * - 請求/響應攔截
 * - 載入狀態管理
 */

'use client';

import { apiLogger } from '@/lib/logger';

/**
 * 從 cookie 中獲取 CSRF token
 */
function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => 
    cookie.trim().startsWith('csrf-token=')
  );
  
  return csrfCookie ? csrfCookie.split('=')[1] : null;
}

/**
 * API 請求選項
 */
interface ApiRequestOptions extends RequestInit {
  skipCSRF?: boolean;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  /** 是否對 429 錯誤啟用智能重試 */
  rateLimitRetry?: boolean;
  /** Rate limit 重試的最大等待時間（毫秒） */
  maxRetryWait?: number;
}

/**
 * API 響應類型
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string;
  code?: string;
}

/**
 * API 錯誤類
 */
export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: string;

  constructor(message: string, status: number, code?: string, details?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * CSRF 錯誤類
 */
export class CSRFError extends ApiError {
  constructor(message: string = 'CSRF token validation failed') {
    super(message, 403, 'CSRF_TOKEN_INVALID');
    this.name = 'CSRFError';
  }
}

/**
 * Rate Limit 錯誤類
 */
export class RateLimitError extends ApiError {
  public retryAfter: number;
  public limit: number;
  public remaining: number;
  public resetTime: number;

  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter: number = 60,
    limit: number = 0,
    remaining: number = 0,
    resetTime: number = 0
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.remaining = remaining;
    this.resetTime = resetTime;
  }
}

/**
 * 統一 API 客戶端類
 */
class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetries: number;
  private defaultRetryDelay: number;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.NEXT_PUBLIC_API_URL || '')
      : '';
    this.defaultTimeout = 30000; // 30 秒
    this.defaultRetries = 2; // 增加預設重試次數
    this.defaultRetryDelay = 1000; // 1 秒
  }

  /**
   * 準備請求標頭
   */
  private prepareHeaders(
    headers: HeadersInit = {},
    skipCSRF = false,
    method = 'GET'
  ): HeadersInit {
    const preparedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...Object.fromEntries(
        headers instanceof Headers ? headers.entries() : 
        Array.isArray(headers) ? headers :
        Object.entries(headers)
      )
    };

    // 為寫入操作添加 CSRF token
    if (!skipCSRF && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      const csrfToken = getCSRFTokenFromCookie();
      if (csrfToken) {
        preparedHeaders['X-CSRF-Token'] = csrfToken;
      } else {
        apiLogger.warn('No CSRF token available for write operation', {
          module: 'api-client',
          action: 'prepareHeaders',
          metadata: { method, endpoint: 'unknown' }
        });
      }
    }

    return preparedHeaders;
  }

  /**
   * 創建帶超時的 fetch
   */
  private async fetchWithTimeout(
    url: string, 
    options: RequestInit, 
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: options.signal || controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 處理 API 錯誤
   */
  private async handleApiError(response: Response): Promise<never> {
    let errorData: any;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const message = errorData.error || `Request failed with status ${response.status}`;
    const code = errorData.code;
    const details = errorData.details;

    // 特殊處理 CSRF 錯誤
    if (response.status === 403 && (code === 'CSRF_TOKEN_INVALID' || code === 'INVALID_ORIGIN')) {
      throw new CSRFError(message);
    }

    // 特殊處理 Rate Limit 錯誤
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0');
      const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
      const resetTime = parseInt(response.headers.get('X-RateLimit-Reset') || '0');
      
      throw new RateLimitError(message, retryAfter, limit, remaining, resetTime);
    }

    throw new ApiError(message, response.status, code, details);
  }

  /**
   * 執行帶重試的請求
   */
  private async executeWithRetry<T>(
    url: string,
    options: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    const {
      skipCSRF = false,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      timeout = this.defaultTimeout,
      rateLimitRetry = true,
      maxRetryWait = 60000, // 預設最多等待 60 秒
      ...fetchOptions
    } = options;

    const method = fetchOptions.method || 'GET';
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const headers = this.prepareHeaders(fetchOptions.headers, skipCSRF, method);
        
        const response = await this.fetchWithTimeout(url, {
          ...fetchOptions,
          headers
        }, timeout);

        if (!response.ok) {
          await this.handleApiError(response);
        }

        const data = await response.json();
        return data as ApiResponse<T>;

      } catch (error) {
        lastError = error as Error;

        // 不重試的錯誤類型（客戶端錯誤）
        if (error instanceof CSRFError || 
            error instanceof ApiError && [400, 401, 403, 404, 422].includes(error.status)) {
          throw error;
        }

        // 特殊處理 Rate Limit 錯誤
        if (error instanceof RateLimitError) {
          // 檢查是否啟用了 rate limit 重試
          if (rateLimitRetry && attempt < retries) {
            const waitTime = Math.min(error.retryAfter * 1000, maxRetryWait);
            apiLogger.warn('Rate limit exceeded, retrying after delay', {
              module: 'api-client',
              action: 'executeWithRetry',
              metadata: {
                attempt: attempt + 1,
                maxAttempts: retries + 1,
                waitTime,
                rateLimitInfo: {
                  limit: error.limit,
                  remaining: error.remaining,
                  resetTime: new Date(error.resetTime * 1000).toLocaleTimeString()
                }
              }
            });
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          // 如果不啟用重試或重試次數用完，拋出錯誤
          throw error;
        }

        // 其他錯誤的重試邏輯（網路錯誤、5xx 錯誤等）
        if (attempt < retries) {
          apiLogger.warn('API request failed, retrying', {
            module: 'api-client',
            action: 'executeWithRetry',
            metadata: {
              attempt: attempt + 1,
              maxAttempts: retries + 1,
              error: (error as Error).message,
              url
            }
          });
          const exponentialBackoff = retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, exponentialBackoff));
          continue;
        }
      }
    }

    throw lastError!;
  }

  /**
   * GET 請求
   */
  async get<T = any>(
    endpoint: string, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.executeWithRetry<T>(url, {
      ...options,
      method: 'GET'
    });
  }

  /**
   * POST 請求
   */
  async post<T = any>(
    endpoint: string, 
    data?: any, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.executeWithRetry<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * PUT 請求
   */
  async put<T = any>(
    endpoint: string, 
    data?: any, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.executeWithRetry<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * PATCH 請求
   */
  async patch<T = any>(
    endpoint: string, 
    data?: any, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.executeWithRetry<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * DELETE 請求
   */
  async delete<T = any>(
    endpoint: string, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.executeWithRetry<T>(url, {
      ...options,
      method: 'DELETE'
    });
  }

  /**
   * 上傳檔案
   */
  async upload<T = any>(
    endpoint: string,
    file: File | FormData,
    options: Omit<ApiRequestOptions, 'body'> = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const { skipCSRF = false, ...otherOptions } = options;

    // FormData 請求不需要設置 Content-Type
    const headers: Record<string, string> = {};
    
    // 添加 CSRF token
    if (!skipCSRF) {
      const csrfToken = getCSRFTokenFromCookie();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return this.executeWithRetry<T>(url, {
      ...otherOptions,
      method: 'POST',
      headers,
      body: file instanceof File ? (() => {
        const formData = new FormData();
        formData.append('file', file);
        return formData;
      })() : file
    });
  }
}

// 導出單例實例
export const apiClient = new ApiClient();

/**
 * 便捷的 API 調用函數
 */
export const api = {
  get: <T = any>(endpoint: string, options?: ApiRequestOptions) => 
    apiClient.get<T>(endpoint, options),
    
  post: <T = any>(endpoint: string, data?: any, options?: ApiRequestOptions) => 
    apiClient.post<T>(endpoint, data, options),
    
  put: <T = any>(endpoint: string, data?: any, options?: ApiRequestOptions) => 
    apiClient.put<T>(endpoint, data, options),
    
  patch: <T = any>(endpoint: string, data?: any, options?: ApiRequestOptions) => 
    apiClient.patch<T>(endpoint, data, options),
    
  delete: <T = any>(endpoint: string, options?: ApiRequestOptions) => 
    apiClient.delete<T>(endpoint, options),
    
  upload: <T = any>(endpoint: string, file: File | FormData, options?: Omit<ApiRequestOptions, 'body'>) => 
    apiClient.upload<T>(endpoint, file, options)
};

/**
 * React Hook 用於 API 調用
 */
import { useState, useCallback } from 'react';

interface UseApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApiCall<T = any>() {
  const [state, setState] = useState<UseApiCallState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async <R = T>(
    apiCall: () => Promise<ApiResponse<R>>
  ): Promise<R | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiCall();
      
      if (response.success && response.data) {
        setState({
          data: response.data as any,
          loading: false,
          error: null
        });
        return response.data;
      } else {
        const error = response.error || '請求失敗';
        setState({
          data: null,
          loading: false,
          error
        });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      setState({
        data: null,
        loading: false,
        error: errorMessage
      });
      return null;
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