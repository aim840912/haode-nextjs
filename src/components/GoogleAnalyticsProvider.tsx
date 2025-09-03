'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView, trackError, performanceEvents, logGAStatus } from '@/lib/analytics'
import { logger } from '@/lib/logger'

interface GoogleAnalyticsProviderProps {
  children: React.ReactNode
}

export default function GoogleAnalyticsProvider({ children }: GoogleAnalyticsProviderProps) {
  const pathname = usePathname()

  useEffect(() => {
    // 延遲執行以確保 GA 腳本已載入
    const timer = setTimeout(() => {
      logGAStatus()
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // 路由變更時追蹤頁面瀏覽
    const timer = setTimeout(() => {
      trackPageView(pathname)
    }, 100)

    return () => clearTimeout(timer)
  }, [pathname])

  useEffect(() => {
    // 追蹤頁面載入性能
    const handleLoad = () => {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigationTiming) {
        const loadTime = navigationTiming.loadEventEnd - navigationTiming.loadEventStart
        performanceEvents.pageLoadTime(loadTime, pathname)
      }

      // 追蹤首次內容繪製
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            performanceEvents.firstContentfulPaint(entry.startTime)
          }
        }
      })

      try {
        observer.observe({ entryTypes: ['paint'] })
      } catch (error) {
        // 某些瀏覽器可能不支援 Paint Timing API
        logger.warn('Paint Timing API not supported', { error, module: 'GoogleAnalyticsProvider', action: 'observePaintTiming' })
      }

      return () => observer.disconnect()
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [pathname])

  useEffect(() => {
    // 全域錯誤追蹤
    const handleError = (event: ErrorEvent) => {
      trackError(new Error(event.message), `Global Error: ${event.filename}:${event.lineno}`)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(new Error(String(event.reason)), 'Unhandled Promise Rejection')
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return <>{children}</>
}

// React Hook for using GA4 in components
export function useGoogleAnalytics() {
  return {
    trackEvent: (eventName: string, parameters: Record<string, any> = {}) => {
      const { trackEvent } = require('@/lib/analytics')
      trackEvent(eventName, parameters)
    },
    
    trackError: (error: Error, context?: string) => {
      trackError(error, context)
    },

    trackPageView: (path: string, title?: string) => {
      trackPageView(path, title)
    }
  }
}