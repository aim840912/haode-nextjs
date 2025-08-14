'use client'

import { useState, useEffect } from 'react'

interface VisitorStats {
  total_visits: number
  unique_visitors: number  
  today_visits: number
  date: string
}

interface VisitorCounterProps {
  className?: string
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function VisitorCounter({ 
  className = '', 
  showDetails = false, 
  size = 'md' 
}: VisitorCounterProps) {
  const [stats, setStats] = useState<VisitorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVisitorStats()
  }, [])

  const fetchVisitorStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stats/visitors', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch visitor statistics')
      }

      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching visitor stats:', err)
      setError('無法載入訪客統計')
      // 設置預設值以免影響頁面顯示
      setStats({
        total_visits: 0,
        unique_visitors: 0,
        today_visits: 0,
        date: new Date().toISOString().split('T')[0]
      })
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toLocaleString()
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs'
      case 'lg':
        return 'text-lg'
      default:
        return 'text-sm'
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${getSizeClasses()} ${className}`}>
        <div className="animate-pulse flex items-center space-x-1">
          <span>🌍</span>
          <span>載入中...</span>
        </div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className={`flex items-center space-x-2 ${getSizeClasses()} ${className} text-gray-500`}>
        <span>🌍</span>
        <span>統計載入失敗</span>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className={`${getSizeClasses()} ${className}`}>
      {showDetails ? (
        // 詳細顯示模式（用於管理後台）
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">👥</span>
              <div>
                <div className="text-sm text-gray-600">總訪客數</div>
                <div className="text-xl font-bold text-gray-800">
                  {formatNumber(stats.unique_visitors)}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📊</span>
              <div>
                <div className="text-sm text-gray-600">總瀏覽數</div>
                <div className="text-xl font-bold text-gray-800">
                  {formatNumber(stats.total_visits)}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🗓️</span>
              <div>
                <div className="text-sm text-gray-600">今日訪客</div>
                <div className="text-xl font-bold text-gray-800">
                  {formatNumber(stats.today_visits)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // 簡潔顯示模式（用於頁面底部）
        <div className="flex items-center space-x-4 text-gray-600">
          <div className="flex items-center space-x-1">
            <span>🌍</span>
            <span>總訪客：{formatNumber(stats.unique_visitors)}</span>
          </div>
          <div className="hidden sm:flex items-center space-x-1">
            <span>📈</span>
            <span>瀏覽次數：{formatNumber(stats.total_visits)}</span>
          </div>
          <div className="hidden md:flex items-center space-x-1">
            <span>👋</span>
            <span>今日：{stats.today_visits}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// 訪客追蹤 Hook
export function useVisitorTracking() {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        // 生成客戶端瀏覽器指紋（簡化版）
        const fingerprint = generateBrowserFingerprint()
        
        await fetch('/api/stats/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page_path: window.location.pathname,
            page_title: document.title,
            referrer: document.referrer,
            visitor_fingerprint: fingerprint
          }),
        })
      } catch (error) {
        console.error('Failed to track visit:', error)
        // 追蹤失敗不影響用戶體驗
      }
    }

    // 避免重複追蹤同一個頁面（使用 sessionStorage）
    const currentPage = window.location.pathname
    const trackedPages = JSON.parse(sessionStorage.getItem('tracked_pages') || '[]')
    
    if (!trackedPages.includes(currentPage)) {
      trackVisit()
      trackedPages.push(currentPage)
      sessionStorage.setItem('tracked_pages', JSON.stringify(trackedPages))
    }
  }, [])
}

// 生成簡單的瀏覽器指紋
function generateBrowserFingerprint(): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx!.textBaseline = 'top'
  ctx!.font = '14px Arial'
  ctx!.fillText('Browser fingerprint', 2, 2)
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|')
  
  // 使用簡單的 hash 函數
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36)
}