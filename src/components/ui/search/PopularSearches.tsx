'use client'

import { useState, useEffect } from 'react'
import { fetchSearchStats, type SearchStatsResponse } from '@/lib/api/search-api'
import { logger } from '@/lib/logger'

interface PopularSearchesProps {
  onSearchSelect?: (query: string) => void
  className?: string
  showStats?: boolean
  limit?: number
}

export function PopularSearches({
  onSearchSelect,
  className = '',
  showStats = false,
  limit = 5,
}: PopularSearchesProps) {
  const [data, setData] = useState<SearchStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPopularSearches = async () => {
      try {
        setLoading(true)
        setError(null)

        const result = await fetchSearchStats()
        setData(result)
      } catch (error) {
        logger.warn('Failed to fetch popular searches', {
          module: 'PopularSearches',
          metadata: { error: String(error) },
        })
        setError('無法載入熱門搜尋')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPopularSearches()
  }, [limit])

  const handleSearchClick = (query: string) => {
    onSearchSelect?.(query)
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full"></div>
          <span className="text-sm text-gray-500">載入熱門搜尋中...</span>
        </div>
      </div>
    )
  }

  if (error || !data || data.popularSearches.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-600">熱門搜尋</span>
        </div>
        <p className="text-xs text-gray-400">{error || '暫無熱門搜尋資料'}</p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-4 h-4 text-amber-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
        <span className="text-sm font-medium text-gray-700">熱門搜尋</span>
        {showStats && data.summary.totalSearches > 0 && (
          <span className="text-xs text-gray-500">(共 {data.summary.totalSearches} 次搜尋)</span>
        )}
      </div>

      <div className="space-y-2">
        {data.popularSearches.map((search, index) => (
          <button
            key={`${search.query}-${index}`}
            onClick={() => handleSearchClick(search.query)}
            className="w-full text-left p-2 rounded-md hover:bg-amber-50 hover:text-amber-900 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono w-4">{index + 1}</span>
                <span className="text-sm text-gray-700 group-hover:text-amber-900">
                  {search.query}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {showStats && <span className="text-xs text-gray-400">{search.count} 次</span>}
                <svg
                  className="w-3 h-3 text-gray-300 group-hover:text-amber-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {showStats && data.summary && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 space-y-1">
            <div>總搜尋次數: {data.summary.totalSearches}</div>
            <div>搜尋關鍵字: {data.summary.uniqueQueries} 個</div>
            {data.summary.averageExecutionTime > 0 && (
              <div>平均回應時間: {data.summary.averageExecutionTime.toFixed(1)}ms</div>
            )}
          </div>
        </div>
      )}

      <div className="mt-2 text-xs text-gray-400">過去 {data.period.daysBack} 天的熱門搜尋</div>
    </div>
  )
}
