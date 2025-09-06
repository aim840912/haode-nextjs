/**
 * 客戶端錯誤追蹤 Hook
 * 提供簡單的錯誤追蹤和使用者行為監控功能
 */

'use client'

import { useCallback, useEffect } from 'react'
import { logger } from '@/lib/logger'

interface ErrorTrackingConfig {
  enableConsoleErrors?: boolean
  enableUnhandledRejections?: boolean
  enableNavigationTracking?: boolean
  enablePerformanceMonitoring?: boolean
}

interface UserAction extends Record<string, unknown> {
  action: string
  path: string
  timestamp: number
  metadata?: Record<string, any>
}

interface PerformanceMetrics extends Record<string, unknown> {
  loadTime: number
  renderTime: number
  navigationTime: number
  timestamp: number
  path: string
}

export function useErrorTracking(config: ErrorTrackingConfig = {}) {
  // Navigation functionality removed to avoid unused import
  
  const {
    enableConsoleErrors = true,
    enableUnhandledRejections = true,
    enableNavigationTracking = true,
    enablePerformanceMonitoring = true,
  } = config

  // 追蹤使用者行為
  const trackUserAction = useCallback((
    action: string, 
    metadata?: Record<string, any>
  ) => {
    const userAction: UserAction = {
      action,
      path: window.location.pathname,
      timestamp: Date.now(),
      metadata
    }

    logger.info('使用者行為追蹤', {
      module: 'ErrorTracking',
      action: 'userAction',
      metadata: userAction
    })

    // 儲存到本地儲存以供分析（最多保留 50 筆）
    try {
      const stored = localStorage.getItem('user_actions') || '[]'
      const actions: UserAction[] = JSON.parse(stored)
      
      actions.push(userAction)
      
      // 只保留最新的 50 筆記錄
      if (actions.length > 50) {
        actions.splice(0, actions.length - 50)
      }
      
      localStorage.setItem('user_actions', JSON.stringify(actions))
    } catch (error) {
      logger.warn('無法儲存使用者行為記錄', { 
        metadata: { error: String(error) } 
      })
    }
  }, [])

  // 追蹤錯誤
  const trackError = useCallback((
    error: Error | string,
    context?: string,
    metadata?: Record<string, any>
  ) => {
    const errorMessage = typeof error === 'string' ? error : error.message

    logger.error(`客戶端錯誤: ${context || '未知'}`, 
      typeof error === 'object' ? error : new Error(errorMessage), {
      module: 'ErrorTracking',
      action: 'trackError',
      metadata: {
        context,
        path: window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        ...metadata
      }
    })
  }, [])

  // 效能監控
  const trackPerformance = useCallback((metrics: Partial<PerformanceMetrics>) => {
    const performanceData: PerformanceMetrics = {
      loadTime: 0,
      renderTime: 0,
      navigationTime: 0,
      timestamp: Date.now(),
      path: window.location.pathname,
      ...metrics
    }

    logger.info('效能指標', {
      module: 'ErrorTracking',
      action: 'performance',
      metadata: performanceData
    })
  }, [])

  // 追蹤表單提交成功率
  const trackFormSubmission = useCallback((
    formType: string,
    success: boolean,
    errorMessage?: string,
    metadata?: Record<string, any>
  ) => {
    logger.info('表單提交追蹤', {
      module: 'ErrorTracking',
      action: 'formSubmission',
      metadata: {
        formType,
        success,
        errorMessage,
        path: window.location.pathname,
        timestamp: Date.now(),
        ...metadata
      }
    })

    // 更新表單成功率統計
    try {
      const statsKey = `form_stats_${formType}`
      const stored = localStorage.getItem(statsKey) || '{"total":0,"success":0}'
      const stats = JSON.parse(stored)
      
      stats.total += 1
      if (success) {
        stats.success += 1
      }
      
      localStorage.setItem(statsKey, JSON.stringify(stats))
    } catch (error) {
      logger.warn('無法更新表單統計', { 
        metadata: { error: String(error) } 
      })
    }
  }, [])

  // 取得表單成功率
  const getFormSuccessRate = useCallback((formType: string): { 
    total: number; 
    success: number; 
    rate: number 
  } => {
    try {
      const statsKey = `form_stats_${formType}`
      const stored = localStorage.getItem(statsKey) || '{"total":0,"success":0}'
      const stats = JSON.parse(stored)
      
      return {
        total: stats.total,
        success: stats.success,
        rate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0
      }
    } catch {
      return { total: 0, success: 0, rate: 0 }
    }
  }, [])

  // 設置全域錯誤處理器
  useEffect(() => {
    if (!enableConsoleErrors && !enableUnhandledRejections) return

    // 捕獲 JavaScript 錯誤
    const handleError = (event: ErrorEvent) => {
      if (enableConsoleErrors) {
        trackError(event.error || event.message, 'JavaScriptError', {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        })
      }
    }

    // 捕獲未處理的 Promise 拒絕
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (enableUnhandledRejections) {
        trackError(
          event.reason instanceof Error ? event.reason : String(event.reason),
          'UnhandledPromiseRejection'
        )
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [enableConsoleErrors, enableUnhandledRejections, trackError])

  // 導航追蹤
  useEffect(() => {
    if (!enableNavigationTracking) return

    const startTime = Date.now()

    const handleRouteChange = () => {
      const navigationTime = Date.now() - startTime
      
      trackUserAction('navigation', {
        path: window.location.pathname,
        navigationTime
      })
    }

    // 監聽瀏覽器歷史變化
    window.addEventListener('popstate', handleRouteChange)

    return () => {
      window.addEventListener('popstate', handleRouteChange)
      handleRouteChange() // 追蹤當前頁面載入
    }
  }, [enableNavigationTracking, trackUserAction])

  // 效能監控
  useEffect(() => {
    if (!enablePerformanceMonitoring || typeof window === 'undefined') return

    // 頁面載入完成後測量效能
    const measurePerformance = () => {
      if ('performance' in window && 'timing' in window.performance) {
        const timing = window.performance.timing
        const loadTime = timing.loadEventEnd - timing.navigationStart
        const renderTime = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart
        const navigationTime = timing.responseEnd - timing.fetchStart

        trackPerformance({
          loadTime,
          renderTime, 
          navigationTime
        })
      }
    }

    // 使用 setTimeout 確保頁面完全載入
    const timeoutId = setTimeout(measurePerformance, 1000)

    return () => clearTimeout(timeoutId)
  }, [enablePerformanceMonitoring, trackPerformance])

  return {
    trackUserAction,
    trackError,
    trackPerformance,
    trackFormSubmission,
    getFormSuccessRate,
  }
}