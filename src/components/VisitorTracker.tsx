'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface VisitorTrackerProps {
  children: React.ReactNode
}

export default function VisitorTracker({ children }: VisitorTrackerProps) {
  const pathname = usePathname()

  useEffect(() => {
    const trackVisit = async () => {
      try {
        // 避免在 SSR 階段執行
        if (typeof window === 'undefined') return

        // 生成客戶端瀏覽器指紋（簡化版）
        const fingerprint = generateBrowserFingerprint()
        
        // 檢查是否已經追蹤過此頁面（避免重複計算）
        const sessionKey = `tracked_${pathname}`
        const alreadyTracked = sessionStorage.getItem(sessionKey)
        
        // 如果這個會話中已經追蹤過這個頁面，就不重複追蹤
        if (alreadyTracked) return

        const response = await fetch('/api/stats/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page_path: pathname,
            page_title: document.title,
            referrer: document.referrer,
            visitor_fingerprint: fingerprint
          }),
        })

        if (response.ok) {
          // 標記此頁面在此會話中已被追蹤
          sessionStorage.setItem(sessionKey, 'true')
          
          const data = await response.json()
          
          // 可以在這裡處理追蹤結果，例如存儲訪客 ID
          if (data.visitor_id) {
            localStorage.setItem('visitor_id', data.visitor_id)
          }
          
          // 如果是新訪客，可以觸發歡迎事件
          if (data.is_new_visitor) {
            console.log('Welcome, new visitor!')
            // 這裡可以加入新訪客的特殊處理邏輯
          }
        }
      } catch (error) {
        console.error('Failed to track visit:', error)
        // 追蹤失敗不應影響用戶體驗
      }
    }

    // 延遲執行追蹤，避免影響頁面載入性能
    const timeoutId = setTimeout(trackVisit, 1000)
    
    return () => clearTimeout(timeoutId)
  }, [pathname])

  return <>{children}</>
}

// 生成簡單的瀏覽器指紋
function generateBrowserFingerprint(): string {
  if (typeof window === 'undefined') return 'ssr'
  
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('Fingerprint', 2, 2)
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      canvas.toDataURL(),
      (navigator as any).hardwareConcurrency?.toString() || '0',
      (navigator as any).deviceMemory?.toString() || '0'
    ].join('|')
    
    // 使用簡單的 hash 函數
    let hash = 0
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36).substring(0, 16)
  } catch (error) {
    console.warn('Failed to generate fingerprint:', error)
    // 如果生成指紋失敗，使用隨機值
    return Math.random().toString(36).substring(2, 18)
  }
}