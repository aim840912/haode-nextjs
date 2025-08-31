/**
 * CSRF Token React Hook
 * 
 * 提供自動管理 CSRF token 的功能，包括：
 * - 自動獲取和刷新 token
 * - 監控 token 有效性
 * - 提供 token 給 API 調用使用
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface CSRFTokenState {
  token: string | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

interface UseCSRFTokenReturn {
  token: string | null;
  loading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
  clearToken: () => Promise<void>;
  isTokenValid: boolean;
}

/**
 * 從 cookie 中獲取 CSRF token
 */
function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => 
    cookie.trim().startsWith('csrf-token=')
  );
  
  return csrfCookie ? csrfCookie.split('=')[1] : null;
}

/**
 * 驗證 token 格式
 */
function isValidTokenFormat(token: string | null): boolean {
  return !!(token && /^[a-f0-9]{64}$/.test(token));
}

/**
 * CSRF Token Hook
 */
export function useCSRFToken(): UseCSRFTokenReturn {
  const [state, setState] = useState<CSRFTokenState>({
    token: null,
    loading: true,
    error: null,
    lastFetched: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef(state);
  
  // Keep stateRef in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /**
   * 清理資源
   */
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  /**
   * 從伺服器獲取新的 CSRF token
   */
  const fetchToken = useCallback(async (forceRefresh = false): Promise<void> => {
    // 清理之前的請求
    cleanup();
    
    // 創建新的 AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // 檢查是否可以使用現有的 cookie token
      if (!forceRefresh) {
        const cookieToken = getTokenFromCookie();
        if (isValidTokenFormat(cookieToken)) {
          setState(prev => ({
            ...prev,
            token: cookieToken,
            loading: false,
            lastFetched: Date.now()
          }));
          return;
        }
      }

      // 從伺服器獲取 token
      const url = forceRefresh ? '/api/csrf-token?refresh=true' : '/api/csrf-token';
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.token) {
        throw new Error(data.error || '無效的伺服器響應');
      }

      setState(prev => ({
        ...prev,
        token: data.token,
        loading: false,
        error: null,
        lastFetched: Date.now()
      }));

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 請求被取消，不更新狀態
        return;
      }

      logger.error('Failed to fetch CSRF token', error instanceof Error ? error : undefined, { metadata: { error: error instanceof Error ? error.message : String(error) } });
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '獲取 CSRF token 失敗'
      }));
    }
  }, [cleanup]);

  /**
   * 刷新 token
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    await fetchToken(true);
  }, [fetchToken]);

  /**
   * 清除 token
   */
  const clearToken = useCallback(async (): Promise<void> => {
    cleanup();
    
    try {
      // 調用伺服器清除 token
      await fetch('/api/csrf-token', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      logger.warn('Failed to clear token on server', { metadata: { error: error instanceof Error ? error.message : String(error) } });
    }

    setState({
      token: null,
      loading: false,
      error: null,
      lastFetched: null
    });
  }, [cleanup]);

  /**
   * 檢查 token 是否需要刷新
   */
  const checkTokenExpiry = useCallback(() => {
    const { lastFetched } = stateRef.current;
    if (!lastFetched) return;

    const now = Date.now();
    const tokenAge = now - lastFetched;
    const maxAge = 23 * 60 * 60 * 1000; // 23小時（在24小時過期前刷新）

    if (tokenAge > maxAge) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('CSRF token is near expiry, refreshing...');
      }
      fetchToken(true);
    }
  }, [fetchToken]);

  /**
   * 初始化 token - 優先從 cookie 獲取，如果沒有則從伺服器獲取
   */
  useEffect(() => {
    // 立即嘗試從 cookie 獲取 token
    const existingToken = getTokenFromCookie();
    if (process.env.NODE_ENV === 'development') {
      logger.debug('CSRF cookie token found', { metadata: { tokenPreview: existingToken ? existingToken.substring(0, 8) + '...' : 'none' } });
    }
    
    if (isValidTokenFormat(existingToken)) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Using existing CSRF token from cookie');
      }
      setState(prev => ({
        ...prev,
        token: existingToken,
        loading: false,
        lastFetched: Date.now()
      }));
    } else {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('No valid cookie token, fetching from server');
      }
      // 如果 cookie 中沒有有效 token，則從伺服器獲取
      fetchToken();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * 設置定期檢查和頁面可見性監聽
   */
  useEffect(() => {
    // 設置定期檢查 token 有效性
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000); // 每5分鐘檢查一次

    // 監聽頁面可見性變化，重新獲得焦點時檢查 token
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkTokenExpiry();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkTokenExpiry]);

  /**
   * 組件卸載時清理
   */
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    token: state.token,
    loading: state.loading,
    error: state.error,
    refreshToken,
    clearToken,
    isTokenValid: isValidTokenFormat(state.token)
  };
}

/**
 * CSRF Token Provider Context
 * 為整個應用提供 CSRF token
 */
const CSRFTokenContext = createContext<UseCSRFTokenReturn | null>(null);

interface CSRFTokenProviderProps {
  children: ReactNode;
}

export function CSRFTokenProvider({ children }: CSRFTokenProviderProps) {
  const csrfToken = useCSRFToken();
  
  return React.createElement(
    CSRFTokenContext.Provider,
    { value: csrfToken },
    children
  );
}

/**
 * 獲取 CSRF token 的便捷 hook
 */
export function useCSRFContext(): UseCSRFTokenReturn {
  const context = useContext(CSRFTokenContext);
  if (!context) {
    throw new Error('useCSRFContext must be used within a CSRFTokenProvider');
  }
  return context;
}

/**
 * 輕量級 hook，只返回 token 值
 */
export function useCSRFTokenValue(): string | null {
  const { token } = useCSRFToken();
  return token;
}