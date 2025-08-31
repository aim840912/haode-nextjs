/**
 * 詢價統計資料 Hook
 * 提供即時詢價統計資料，包含智能輪詢和快取機制
 * 
 * 優化功能：
 * 1. 頁面可見性檢測 - 隱藏時停止輪詢
 * 2. 動態輪詢間隔 - 根據使用者活動和未讀狀態調整
 * 3. localStorage 快取 - 減少初始載入 API 呼叫
 * 4. 使用者活動追蹤 - 智能調整輪詢頻率
 * 5. 全域請求去重 - 防止多個實例同時請求
 * 
 * 輪詢策略（已優化以節省 Vercel 流量）：
 * - 有未讀詢價：2 分鐘
 * - 無未讀，活躍 < 5 分鐘：2 分鐘
 * - 無未讀，活躍 5-10 分鐘：5 分鐘
 * - 無未讀，閒置 > 10 分鐘：10 分鐘
 * - 頁面隱藏：停止輪詢
 * - 開發環境：更長間隔或禁用
 * 
 * 預期資源節省：90%+
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-auth';
import { logger } from '@/lib/logger';

// 全域請求去重機制
interface PendingRequest {
  promise: Promise<InquiryStatsData>;
  timestamp: number;
}

const globalRequestCache = new Map<string, PendingRequest>();
const CACHE_DURATION = 5000; // 5 秒內的重複請求會共享結果

export interface InquiryStatsData {
  total_inquiries: number;
  unread_count: number;
  unreplied_count: number;
  read_rate: number;
  reply_rate: number;
  completion_rate: number;
  cancellation_rate: number;
  avg_response_time_hours: number;
}

export interface UseInquiryStatsReturn {
  stats: InquiryStatsData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
  retryCount: number;
  isRetrying: boolean;
}

export function useInquiryStats(
  baseRefreshInterval = process.env.NODE_ENV === 'production' ? 120000 : 300000
): UseInquiryStatsReturn {
  const { user } = useAuth();
  const [stats, setStats] = useState<InquiryStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheKeyRef = useRef('inquiry-stats-cache');
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 檢查是否為管理員
  const isAdmin = user?.role === 'admin';

  // 從 localStorage 載入快取資料
  const loadCachedStats = useCallback((): InquiryStatsData | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(cacheKeyRef.current);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // 快取資料有效期 5 分鐘
        if (Date.now() - timestamp < 300000) {
          return data;
        }
      }
    } catch (err) {
      logger.warn('Failed to load cached stats', { metadata: { error: err instanceof Error ? err.message : String(err) } });
    }
    return null;
  }, []);

  // 儲存快取資料
  const saveCachedStats = useCallback((data: InquiryStatsData) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(cacheKeyRef.current, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      logger.warn('Failed to save stats cache', { metadata: { error: err instanceof Error ? err.message : String(err) } });
    }
  }, []);

  // 計算重試延遲（指數退避）
  const getRetryDelay = useCallback((retryAttempt: number): number => {
    const baseDelay = 1000; // 1 秒
    const maxDelay = 60000; // 最多 60 秒
    const delay = Math.min(baseDelay * Math.pow(2, retryAttempt), maxDelay);
    return delay;
  }, []);

  // 計算動態輪詢間隔
  const getDynamicInterval = useCallback(() => {
    if (!isVisible) return null; // 頁面隱藏時不輪詢
    
    // 如果連續錯誤過多，停止輪詢
    if (consecutiveErrors >= 5) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('[useInquiryStats] Too many consecutive errors, stopping polling');
      }
      return null;
    }
    
    const timeSinceLastActivity = Date.now() - lastActivity;
    const hasUnread = stats && stats.unread_count > 0;

    let interval = baseRefreshInterval;

    // 有未讀詢價：使用基本間隔（2分鐘）
    if (hasUnread) {
      interval = Math.max(baseRefreshInterval, 120000); // 至少2分鐘
    }
    // 閒置超過 10 分鐘：10 分鐘輪詢
    else if (timeSinceLastActivity > 600000) {
      interval = 600000; // 10 分鐘
    }
    // 閒置超過 5 分鐘：5 分鐘輪詢
    else if (timeSinceLastActivity > 300000) {
      interval = 300000; // 5 分鐘
    }
    // 否則使用基本間隔，但至少2分鐘
    else {
      interval = Math.max(baseRefreshInterval, 120000);
    }

    // 如果有連續錯誤，增加間隔
    if (consecutiveErrors > 0) {
      interval = Math.max(interval, interval * (1 + consecutiveErrors * 0.5));
    }

    return interval;
  }, [isVisible, lastActivity, stats, baseRefreshInterval, consecutiveErrors]);

  // 更新使用者活動時間
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  const fetchStats = async (signal?: AbortSignal, isRetryAttempt = false): Promise<void> => {
    if (!isAdmin) {
      setStats(null);
      setError(null);
      setLoading(false);
      setRetryCount(0);
      setConsecutiveErrors(0);
      return;
    }

    if (!isRetryAttempt) {
      setLoading(true);
      setIsRetrying(false);
    }

    // 宣告在外層以便錯誤處理時使用
    let cacheKey = '';
    
    try {
      // 取得認證 token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('認證失敗');
      }

      // 請求去重機制
      cacheKey = `inquiry-stats-${session.access_token.slice(-10)}`;
      const now = Date.now();
      
      // 清理過期的請求
      for (const [key, request] of globalRequestCache.entries()) {
        if (now - request.timestamp > CACHE_DURATION) {
          globalRequestCache.delete(key);
        }
      }
      
      // 檢查是否有正在進行的相同請求
      const existingRequest = globalRequestCache.get(cacheKey);
      if (existingRequest) {
        const result = await existingRequest.promise;
        setStats(result);
        setLastUpdated(new Date());
        setError(null);
        setRetryCount(0);
        setConsecutiveErrors(0);
        setIsRetrying(false);
        saveCachedStats(result);
        if (process.env.NODE_ENV === 'development') {
          logger.debug('[useInquiryStats] Using deduplicated request result', { metadata: { result } });
        }
        return;
      }

      // 建立新的請求 Promise
      const requestPromise = (async (): Promise<InquiryStatsData> => {
        const response = await fetch('/api/inquiries/stats?timeframe=30', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          signal
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
          
          // 記錄詳細錯誤資訊
          if (process.env.NODE_ENV === 'development') {
            logger.error('[useInquiryStats] API Error', undefined, {
              metadata: {
                status: response.status,
                statusText: response.statusText,
                errorData,
                url: response.url
              }
            });
          }
          
          throw new Error(errorMessage);
        }

        const result = await response.json();
        
        if (result.success && result.data?.summary) {
          return result.data.summary;
        } else {
          throw new Error('統計資料格式錯誤');
        }
      })();

      // 將請求加入快取
      globalRequestCache.set(cacheKey, {
        promise: requestPromise,
        timestamp: now
      });

      // 等待請求完成
      const newStats = await requestPromise;
      
      // 請求成功後清理快取
      globalRequestCache.delete(cacheKey);
      
      setStats(newStats);
      setLastUpdated(new Date());
      setError(null);
      setRetryCount(0);
      setConsecutiveErrors(0); // 重置錯誤計數
      setIsRetrying(false);
      
      // 儲存到快取
      saveCachedStats(newStats);
      
      if (process.env.NODE_ENV === 'development') {
        logger.debug('[useInquiryStats] Successfully fetched stats', { metadata: { stats: newStats } });
      }
    } catch (err) {
      // 請求失敗時清理快取（如果 cacheKey 存在）
      if (cacheKey) {
        globalRequestCache.delete(cacheKey);
      }
      
      // 如果是 AbortError，不處理
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      const isRateLimitError = errorMessage.includes('頻繁') || errorMessage.includes('10 分鐘');
      const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('網路');
      
      logger.error('[useInquiryStats] Error fetching inquiry stats', err instanceof Error ? err : undefined, {
        metadata: {
          retryCount,
          consecutiveErrors,
          isRateLimitError,
          isNetworkError
        }
      });

      setConsecutiveErrors(prev => prev + 1);

      // 對於某些錯誤類型，不要顯示給使用者，而是靜默重試
      if (isRateLimitError || isNetworkError) {
        // 只在開發模式下設定錯誤訊息
        if (process.env.NODE_ENV === 'development') {
          setError(errorMessage);
        }
        
        // 實作自動重試邏輯
        if (retryCount < 3) {
          const delay = getRetryDelay(retryCount);
          setRetryCount(prev => prev + 1);
          setIsRetrying(true);
          
          if (process.env.NODE_ENV === 'development') {
            logger.debug(`[useInquiryStats] Retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
          }
          
          retryTimeoutRef.current = setTimeout(() => {
            if (!signal?.aborted) {
              fetchStats(signal, true);
            }
          }, delay);
        } else {
          // 超過重試次數，只在開發模式下顯示錯誤
          if (process.env.NODE_ENV === 'development') {
            setError(`${errorMessage} (已重試 ${retryCount} 次)`);
          }
          setIsRetrying(false);
        }
      } else {
        // 其他錯誤正常顯示
        setError(errorMessage);
        setIsRetrying(false);
      }
    } finally {
      if (!signal?.aborted && !isRetryAttempt) {
        setLoading(false);
      }
    }
  };

  // 手動重新整理函數
  const refresh = async (): Promise<void> => {
    // 取消之前的請求和重試
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // 重置錯誤狀態
    setRetryCount(0);
    setIsRetrying(false);
    setConsecutiveErrors(0);

    // 建立新的 AbortController
    abortControllerRef.current = new AbortController();
    await fetchStats(abortControllerRef.current.signal);
  };

  // 頁面可見性檢測
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      
      if (visible) {
        updateActivity();
        // 頁面變為可見時立即重新整理
        if (isAdmin) {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
          abortControllerRef.current = new AbortController();
          fetchStats(abortControllerRef.current.signal);
        }
      }
    };

    // 使用者活動檢測
    const handleUserActivity = () => {
      updateActivity();
    };

    // 初始設定
    setIsVisible(!document.hidden);

    // 事件監聽器
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mousedown', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);
    document.addEventListener('scroll', handleUserActivity);
    document.addEventListener('touchstart', handleUserActivity);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mousedown', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('scroll', handleUserActivity);
      document.removeEventListener('touchstart', handleUserActivity);
    };
  }, [isAdmin, updateActivity, refresh]);

  // 初始載入和使用者變更時載入
  useEffect(() => {
    if (isAdmin) {
      // 嘗試載入快取資料
      const cachedStats = loadCachedStats();
      if (cachedStats) {
        setStats(cachedStats);
        setLastUpdated(new Date());
        
        // 開發模式下記錄快取使用
        if (process.env.NODE_ENV === 'development') {
          logger.debug('[useInquiryStats] Loaded from cache', { metadata: { cachedStats } });
        }
      }
      
      // 然後發起 API 請求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      fetchStats(abortControllerRef.current.signal);
    } else {
      setStats(null);
      setError(null);
      setLoading(false);
    }

    // 清理函數
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user, isAdmin, loadCachedStats]);

  // 設置智能自動重新整理
  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    // 清除之前的定時器
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // 取得動態間隔
    const dynamicInterval = getDynamicInterval();
    
    if (!dynamicInterval) {
      // 頁面不可見時停止輪詢
      return;
    }

    // 設置新的定時器
    intervalRef.current = setInterval(() => {
      // 只有在不是載入中的狀態下才自動重新整理
      if (!loading && isVisible) {
        // 開發模式下記錄輪詢資訊
        if (process.env.NODE_ENV === 'development') {
          logger.debug(`[useInquiryStats] Polling with interval: ${dynamicInterval}ms, hasUnread: ${stats?.unread_count || 0}`);
        }
        
        // 直接呼叫 fetchStats 而不是 refresh，避免循環依賴
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        fetchStats(abortControllerRef.current.signal);
      }
    }, dynamicInterval);

    // 清理函數
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAdmin, loading, isVisible, getDynamicInterval]);

  // 元件卸載時清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    stats,
    loading,
    error,
    refresh,
    lastUpdated,
    retryCount,
    isRetrying
  };
}