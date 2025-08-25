/**
 * React Hook for Rate Limiting Status Management
 * 
 * 提供 rate limiting 狀態的前端管理，包括：
 * - 追蹤當前的 rate limit 狀態
 * - 顯示剩餘請求次數和重置時間
 * - 自動處理 429 錯誤的用戶提示
 * - 智能重試機制
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RateLimitError } from '@/lib/api-client';

/**
 * Rate Limit 狀態資訊
 */
export interface RateLimitStatus {
  /** 當前限制數 */
  limit: number;
  /** 剩餘請求數 */
  remaining: number;
  /** 重置時間（Unix 時間戳） */
  resetTime: number;
  /** 是否被限制 */
  isLimited: boolean;
  /** 限制解除的剩餘時間（秒） */
  timeUntilReset: number;
  /** 最後更新時間 */
  lastUpdated: Date;
}

/**
 * Rate Limit 通知類型
 */
export interface RateLimitNotification {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Hook 狀態
 */
interface UseRateLimitStatusReturn {
  /** 當前 rate limit 狀態 */
  status: RateLimitStatus;
  /** 活躍的通知列表 */
  notifications: RateLimitNotification[];
  /** 處理 rate limit 錯誤 */
  handleRateLimitError: (error: RateLimitError, endpoint?: string) => void;
  /** 更新狀態（從響應標頭） */
  updateFromHeaders: (headers: Headers) => void;
  /** 清除通知 */
  clearNotification: (id: string) => void;
  /** 清除所有通知 */
  clearAllNotifications: () => void;
  /** 計算重試延遲 */
  getRetryDelay: () => number;
  /** 檢查是否可以發送請求 */
  canMakeRequest: () => boolean;
}

/**
 * 默認 Rate Limit 狀態
 */
const defaultStatus: RateLimitStatus = {
  limit: 0,
  remaining: 0,
  resetTime: 0,
  isLimited: false,
  timeUntilReset: 0,
  lastUpdated: new Date()
};

/**
 * Rate Limiting 狀態管理 Hook
 */
export function useRateLimitStatus(): UseRateLimitStatusReturn {
  const [status, setStatus] = useState<RateLimitStatus>(defaultStatus);
  const [notifications, setNotifications] = useState<RateLimitNotification[]>([]);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const notificationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * 更新狀態中的剩餘時間
   */
  const updateTimeUntilReset = useCallback(() => {
    setStatus(prev => {
      if (prev.resetTime === 0) return prev;
      
      const now = Date.now() / 1000;
      const timeUntilReset = Math.max(0, prev.resetTime - now);
      
      return {
        ...prev,
        timeUntilReset: Math.ceil(timeUntilReset),
        isLimited: timeUntilReset > 0 && prev.remaining === 0
      };
    });
  }, []);

  /**
   * 啟動倒數計時器
   */
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(updateTimeUntilReset, 1000) as NodeJS.Timeout;
  }, [updateTimeUntilReset]);

  /**
   * 停止倒數計時器
   */
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  /**
   * 從 HTTP 響應標頭更新狀態
   */
  const updateFromHeaders = useCallback((headers: Headers) => {
    const limit = parseInt(headers.get('X-RateLimit-Limit') || '0');
    const remaining = parseInt(headers.get('X-RateLimit-Remaining') || '0');
    const resetTime = parseInt(headers.get('X-RateLimit-Reset') || '0');
    
    if (limit > 0) {
      const now = Date.now() / 1000;
      const timeUntilReset = Math.max(0, resetTime - now);
      
      setStatus({
        limit,
        remaining,
        resetTime,
        isLimited: remaining === 0 && timeUntilReset > 0,
        timeUntilReset: Math.ceil(timeUntilReset),
        lastUpdated: new Date()
      });

      // 如果有限制，啟動計時器
      if (timeUntilReset > 0) {
        startTimer();
      } else {
        stopTimer();
      }

      // 發出警告通知
      if (remaining <= limit * 0.1 && remaining > 0) { // 剩餘不到 10%
        addNotification({
          type: 'warning',
          title: 'API 請求接近限制',
          message: `剩餘 ${remaining} 次請求，將於 ${formatTime(timeUntilReset)} 後重置`,
          duration: 5000
        });
      }
    }
  }, [startTimer, stopTimer]);

  /**
   * 處理 Rate Limit 錯誤
   */
  const handleRateLimitError = useCallback((error: RateLimitError, endpoint?: string) => {
    const now = Date.now() / 1000;
    const timeUntilReset = Math.max(0, error.resetTime - now);
    
    setStatus({
      limit: error.limit,
      remaining: error.remaining,
      resetTime: error.resetTime,
      isLimited: true,
      timeUntilReset: Math.ceil(timeUntilReset),
      lastUpdated: new Date()
    });

    // 啟動計時器
    startTimer();

    // 添加錯誤通知
    const endpointName = endpoint?.split('/').pop() || 'API';
    addNotification({
      type: 'error',
      title: '請求頻率超出限制',
      message: `${endpointName} ${error.message}，請等待 ${formatTime(error.retryAfter)} 後重試`,
      duration: error.retryAfter * 1000,
      action: {
        label: '了解更多',
        onClick: () => {
          console.info('Rate Limit Info:', {
            limit: error.limit,
            remaining: error.remaining,
            resetTime: new Date(error.resetTime * 1000),
            retryAfter: error.retryAfter
          });
        }
      }
    });
  }, [startTimer]);

  /**
   * 添加通知
   */
  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    const timeout = notificationTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      notificationTimeouts.current.delete(id);
    }
  }, []);

  const addNotification = useCallback((
    notification: Omit<RateLimitNotification, 'id'>
  ) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: RateLimitNotification = {
      id,
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);

    // 設置自動清除
    if (notification.duration && notification.duration > 0) {
      const timeout = setTimeout(() => {
        clearNotification(id);
      }, notification.duration);
      
      notificationTimeouts.current.set(id, timeout);
    }
  }, [clearNotification]);


  /**
   * 清除所有通知
   */
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    
    // 清除所有計時器
    notificationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    notificationTimeouts.current.clear();
  }, []);

  /**
   * 計算建議的重試延遲
   */
  const getRetryDelay = useCallback((): number => {
    if (!status.isLimited) return 0;
    return Math.max(status.timeUntilReset * 1000, 1000); // 至少 1 秒
  }, [status]);

  /**
   * 檢查是否可以發送請求
   */
  const canMakeRequest = useCallback((): boolean => {
    return !status.isLimited || status.timeUntilReset === 0;
  }, [status]);

  /**
   * 格式化時間顯示
   */
  function formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} 秒`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 
        ? `${minutes} 分 ${remainingSeconds} 秒` 
        : `${minutes} 分`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 
        ? `${hours} 時 ${minutes} 分` 
        : `${hours} 時`;
    }
  }

  // 清理計時器
  useEffect(() => {
    return () => {
      stopTimer();
      notificationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [stopTimer]);

  // 當組件掛載時，檢查是否有需要恢復的狀態
  useEffect(() => {
    updateTimeUntilReset();
  }, [updateTimeUntilReset]);

  return {
    status,
    notifications,
    handleRateLimitError,
    updateFromHeaders,
    clearNotification,
    clearAllNotifications,
    getRetryDelay,
    canMakeRequest
  };
}

/**
 * 用於顯示 Rate Limit 狀態的組件 Hook
 */
export function useRateLimitDisplay() {
  const { status, notifications, clearNotification } = useRateLimitStatus();

  /**
   * 格式化狀態為用戶友好的文字
   */
  const getStatusText = useCallback(() => {
    if (status.limit === 0) return '無限制';
    
    if (status.isLimited) {
      return `已達限制，${status.timeUntilReset} 秒後恢復`;
    }
    
    return `剩餘 ${status.remaining}/${status.limit} 次請求`;
  }, [status]);

  /**
   * 獲取狀態顏色
   */
  const getStatusColor = useCallback(() => {
    if (status.limit === 0) return 'text-gray-500';
    if (status.isLimited) return 'text-red-600';
    if (status.remaining / status.limit < 0.2) return 'text-amber-600';
    return 'text-green-600';
  }, [status]);

  /**
   * 獲取進度百分比
   */
  const getProgressPercentage = useCallback(() => {
    if (status.limit === 0) return 100;
    return Math.round((status.remaining / status.limit) * 100);
  }, [status]);

  return {
    status,
    notifications,
    clearNotification,
    getStatusText,
    getStatusColor,
    getProgressPercentage
  };
}

/**
 * 高階組件 Hook：自動處理 API 調用的 Rate Limiting
 */
export function useApiWithRateLimit<T = any>() {
  const rateLimitStatus = useRateLimitStatus();

  const callApi = useCallback(async (
    apiCall: () => Promise<T>,
    endpoint?: string
  ): Promise<T> => {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      if (error instanceof RateLimitError) {
        rateLimitStatus.handleRateLimitError(error, endpoint);
        throw error;
      }
      throw error;
    }
  }, [rateLimitStatus]);

  return {
    ...rateLimitStatus,
    callApi
  };
}