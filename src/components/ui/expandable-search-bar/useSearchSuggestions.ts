import { useState, useEffect } from 'react'
import { SearchResult } from '@/types/search'
import { useDebounce } from '@/hooks/useDebounce'
import { searchContent } from '@/lib/api/search-api'
import { logger } from '@/lib/logger'

export function useSearchSuggestions(query: string, showSuggestions: boolean, isExpanded: boolean) {
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery.trim() || !showSuggestions || !isExpanded) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    const fetchSuggestions = async () => {
      setIsLoading(true)
      try {
        const data = await searchContent(debouncedQuery, { limit: 5 })
        setSuggestions(data.results || [])
        setShowDropdown(data.results?.length > 0)
      } catch (error) {
        logger.error('搜尋建議失敗', error as Error, {
          module: 'ExpandableSearchBar',
          action: 'fetchSuggestions',
          metadata: { query: debouncedQuery },
        })
        setSuggestions([])
        setShowDropdown(false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedQuery, showSuggestions, isExpanded])

  return {
    suggestions,
    isLoading,
    showDropdown,
    setShowDropdown,
    setSuggestions,
  }
}
