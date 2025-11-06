'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchSearchSuggestions } from '@/lib/api/search-api'
import { logger } from '@/lib/logger'

export interface SearchSuggestionsResponse {
  suggestions: string[]
  query: string
  count: number
}

export interface UseSearchSuggestionsOptions {
  debounceMs?: number
  minQueryLength?: number
  maxSuggestions?: number
  enableHistory?: boolean
}

/**
 * 搜尋建議和歷史功能的自訂 Hook
 */
export function useSearchSuggestions(options: UseSearchSuggestionsOptions = {}) {
  const { debounceMs = 300, minQueryLength = 2, maxSuggestions = 5, enableHistory = true } = options

  const [suggestions, setSuggestions] = useState<string[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // 載入搜尋歷史
  useEffect(() => {
    if (!enableHistory || typeof window === 'undefined') return

    try {
      const savedHistory = localStorage.getItem('searchHistory')
      if (savedHistory) {
        const history = JSON.parse(savedHistory) as string[]
        setSearchHistory(history.slice(0, 10)) // 最多保存 10 筆歷史
      }
    } catch (error) {
      logger.warn('Failed to load search history', {
        module: 'useSearchSuggestions',
        metadata: { error: String(error) },
      })
    }
  }, [enableHistory])

  // 儲存搜尋歷史
  const saveToHistory = useCallback(
    (query: string) => {
      if (!enableHistory || !query.trim() || typeof window === 'undefined') return

      try {
        setSearchHistory(prev => {
          const trimmedQuery = query.trim()
          const newHistory = [trimmedQuery, ...prev.filter(item => item !== trimmedQuery)].slice(
            0,
            10
          ) // 最多保存 10 筆

          localStorage.setItem('searchHistory', JSON.stringify(newHistory))
          return newHistory
        })
      } catch (error) {
        logger.warn('Failed to save search history', {
          module: 'useSearchSuggestions',
          metadata: { error: String(error) },
        })
      }
    },
    [enableHistory]
  )

  // 清除搜尋歷史
  const clearHistory = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem('searchHistory')
      setSearchHistory([])
    } catch (error) {
      logger.warn('Failed to clear search history', {
        module: 'useSearchSuggestions',
        metadata: { error: String(error) },
      })
    }
  }, [])

  // 獲取搜尋建議
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < minQueryLength) {
        setSuggestions([])
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const suggestions = await fetchSearchSuggestions(query, maxSuggestions)
        setSuggestions(suggestions)
      } catch (error) {
        logger.warn('Failed to fetch search suggestions', {
          module: 'useSearchSuggestions',
          metadata: { error: String(error), query: query.substring(0, 20) },
        })

        setSuggestions([])
        setError('取得搜尋建議失敗')
      } finally {
        setLoading(false)
      }
    },
    [minQueryLength, maxSuggestions]
  )

  // 防抖搜尋
  const debouncedFetchSuggestions = useCallback(
    (query: string) => {
      // 清除之前的計時器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // 設定新的計時器
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(query)
      }, debounceMs)
    },
    [fetchSuggestions, debounceMs]
  )

  // 清理計時器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    suggestions,
    searchHistory,
    loading,
    error,
    getSuggestions: debouncedFetchSuggestions,
    saveToHistory,
    clearHistory,
    clearSuggestions: () => setSuggestions([]),
  }
}
