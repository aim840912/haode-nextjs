/**
 * 詢價統計資料 Hook
 * 提供即時詢價統計資料，包含智能輪詢和快取機制
 * 
 * 優化功能：
 * 1. 頁面可見性檢測 - 隱藏時停止輪詢
 * 2. 動態輪詢間隔 - 根據使用者活動和未讀狀態調整
 * 3. localStorage 快取 - 減少初始載入 API 呼叫
 * 4. 使用者活動追蹤 - 智能調整輪詢頻率
 * 
 * 輪詢策略：
 * - 有未讀詢價：30 秒
 * - 無未讀，活躍 < 5 分鐘：30 秒
 * - 無未讀，活躍 5-10 分鐘：2 分鐘
 * - 無未讀，閒置 > 10 分鐘：5 分鐘
 * - 頁面隱藏：停止輪詢
 * 
 * 預期資源節省：60-80%
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-auth';

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
}

export function useInquiryStats(baseRefreshInterval = 30000): UseInquiryStatsReturn {
  const { user } = useAuth();
  const [stats, setStats] = useState<InquiryStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheKeyRef = useRef('inquiry-stats-cache');

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
      console.warn('Failed to load cached stats:', err);
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
      console.warn('Failed to save stats cache:', err);
    }
  }, []);

  // 計算動態輪詢間隔
  const getDynamicInterval = useCallback(() => {
    if (!isVisible) return null; // 頁面隱藏時不輪詢
    
    const timeSinceLastActivity = Date.now() - lastActivity;
    const hasUnread = stats && stats.unread_count > 0;

    // 有未讀詢價：30 秒輪詢
    if (hasUnread) {
      return baseRefreshInterval;
    }

    // 閒置超過 10 分鐘：5 分鐘輪詢
    if (timeSinceLastActivity > 600000) {
      return 300000;
    }

    // 閒置超過 5 分鐘：2 分鐘輪詢
    if (timeSinceLastActivity > 300000) {
      return 120000;
    }

    // 一般情況：30 秒輪詢
    return baseRefreshInterval;
  }, [isVisible, lastActivity, stats, baseRefreshInterval]);

  // 更新使用者活動時間
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  const fetchStats = async (signal?: AbortSignal): Promise<void> => {
    if (!isAdmin) {
      setStats(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 取得認證 token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('認證失敗');
      }

      const response = await fetch('/api/inquiries/stats?timeframe=30', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '取得統計資料失敗');
      }

      const result = await response.json();
      
      if (result.success && result.data?.summary) {
        const newStats = result.data.summary;
        setStats(newStats);
        setLastUpdated(new Date());
        setError(null);
        
        // 儲存到快取
        saveCachedStats(newStats);
      } else {
        throw new Error('統計資料格式錯誤');
      }
    } catch (err) {
      // 如果是 AbortError，不設定錯誤狀態
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      console.error('Error fetching inquiry stats:', err);
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  // 手動重新整理函數
  const refresh = async (): Promise<void> => {
    // 取消之前的請求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

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
          refresh();
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
          console.log('[useInquiryStats] Loaded from cache:', cachedStats);
        }
      }
      
      // 然後發起 API 請求
      refresh();
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
  }, [user, isAdmin, loadCachedStats, refresh]);

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
          console.log(`[useInquiryStats] Polling with interval: ${dynamicInterval}ms, hasUnread: ${stats?.unread_count || 0}`);
        }
        refresh();
      }
    }, dynamicInterval);

    // 清理函數
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAdmin, loading, isVisible, getDynamicInterval, refresh]);

  // 元件卸載時清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
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
    lastUpdated
  };
}