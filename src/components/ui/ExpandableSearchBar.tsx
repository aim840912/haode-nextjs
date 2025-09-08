'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useDebounce } from '@/hooks/useDebounce'
import { SearchResult } from '@/types/search'
import { logger } from '@/lib/logger'

interface ExpandableSearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  showSuggestions?: boolean
  className?: string
  iconOnly?: boolean
}

export function ExpandableSearchBar({
  placeholder = '搜尋產品、新聞...',
  onSearch,
  showSuggestions = true,
  className = '',
  iconOnly = false,
}: ExpandableSearchBarProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isExpanded, setIsExpanded] = useState(!iconOnly)

  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // 搜尋建議
  useEffect(() => {
    if (!debouncedQuery.trim() || !showSuggestions || !isExpanded) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    const fetchSuggestions = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`)
        const data = await response.json()
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

  // 處理鍵盤導航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === 'Escape') {
        handleCollapse()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex])
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        handleCollapse()
        break
    }
  }

  // 處理搜尋
  const handleSearch = () => {
    if (!query.trim()) return

    if (onSearch) {
      onSearch(query)
    } else {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }

    setShowDropdown(false)
    if (iconOnly) {
      handleCollapse()
    }
  }

  // 選擇建議項目
  const handleSelectSuggestion = (suggestion: SearchResult) => {
    router.push(suggestion.url)
    setShowDropdown(false)
    setQuery('')
    if (iconOnly) {
      handleCollapse()
    }
  }

  // 展開搜尋欄
  const handleExpand = () => {
    setIsExpanded(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  // 收合搜尋欄
  const handleCollapse = useCallback(() => {
    if (!iconOnly) return

    setShowDropdown(false)
    setSelectedIndex(-1)
    setQuery('')
    setIsExpanded(false)
    inputRef.current?.blur()
  }, [iconOnly])

  // 清除搜尋
  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setShowDropdown(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // 點擊外部關閉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setSelectedIndex(-1)
        if (iconOnly && !query.trim()) {
          handleCollapse()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [iconOnly, query, handleCollapse])

  // 只顯示圖標的模式
  if (iconOnly && !isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="p-2 text-gray-600 hover:text-amber-900 transition-all duration-200 rounded-full hover:bg-gray-100 hover:scale-110 active:scale-95"
        aria-label="開啟搜尋"
      >
        <MagnifyingGlassIcon className="w-5 h-5 transition-transform duration-200" />
      </button>
    )
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 背景遮罩 (手機版展開時) */}
      {iconOnly && isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={handleCollapse}
        />
      )}

      {/* 桌面版展開時的容器 */}
      <div
        className={`${
          iconOnly && isExpanded
            ? 'fixed lg:absolute right-4 lg:right-0 top-16 lg:top-0 z-50 lg:w-96 w-[calc(100vw-2rem)]'
            : 'relative'
        }`}
      >
        <div
          className={`relative transition-all duration-300 ease-out ${
            iconOnly && isExpanded ? 'w-full lg:w-96' : isExpanded ? 'w-full' : 'w-10'
          }`}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder={placeholder}
            className={`w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all duration-300 text-gray-900 placeholder-gray-500 ${
              iconOnly && isExpanded ? 'bg-white shadow-lg ring-1 ring-gray-200' : 'bg-white'
            }`}
          />

          {/* 搜尋圖示 */}
          <MagnifyingGlassIcon
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer"
            onClick={handleSearch}
          />

          {/* 載入指示器 / 清除按鈕 / 關閉按鈕 */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shadow-sm" />
            ) : iconOnly && isExpanded ? (
              <XMarkIcon
                className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 hover:scale-110 transition-all duration-200 rounded-full hover:bg-gray-100 p-0.5"
                onClick={handleCollapse}
              />
            ) : query ? (
              <XMarkIcon
                className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 hover:scale-110 transition-all duration-200 rounded-full hover:bg-gray-100 p-0.5"
                onClick={handleClear}
              />
            ) : null}
          </div>
        </div>

        {/* 搜尋建議下拉選單 */}
        {showDropdown && suggestions.length > 0 && isExpanded && (
          <div
            ref={dropdownRef}
            className={`absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto backdrop-blur-sm animate-in slide-in-from-top-2 fade-in duration-200 ${
              iconOnly ? 'w-full lg:w-96' : ''
            }`}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`px-4 py-3 cursor-pointer transition-all duration-200 ${
                  index === selectedIndex
                    ? 'bg-amber-50 border-l-4 border-amber-500 shadow-sm'
                    : 'hover:bg-gray-50 hover:shadow-sm'
                } ${index > 0 ? 'border-t border-gray-100' : ''} first:rounded-t-lg last:rounded-b-lg`}
              >
                <div className="flex items-center gap-3">
                  {/* 類型圖示 */}
                  <div
                    className={`flex-shrink-0 w-3 h-3 rounded-full shadow-sm ${
                      suggestion.type === 'product'
                        ? 'bg-blue-500'
                        : suggestion.type === 'news'
                          ? 'bg-green-500'
                          : 'bg-gray-500'
                    }`}
                  />

                  {/* 內容 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{suggestion.title}</div>
                    <div className="text-sm text-gray-500 truncate">{suggestion.description}</div>
                    {suggestion.category && (
                      <div className="text-xs text-gray-400 mt-1">{suggestion.category}</div>
                    )}
                  </div>

                  {/* 價格或類型標籤 */}
                  <div className="flex-shrink-0 text-right space-y-1">
                    {suggestion.price && (
                      <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        NT$ {suggestion.price.toLocaleString()}
                      </div>
                    )}
                    <div
                      className={`text-xs font-medium px-2.5 py-1 rounded-full shadow-sm ${
                        suggestion.type === 'product'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : suggestion.type === 'news'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}
                    >
                      {suggestion.type === 'product'
                        ? '產品'
                        : suggestion.type === 'news'
                          ? '新聞'
                          : suggestion.type}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 查看更多結果 */}
            <div
              onClick={() => {
                router.push(`/search?q=${encodeURIComponent(query)}`)
                setShowDropdown(false)
                if (iconOnly) handleCollapse()
              }}
              className="px-4 py-3 text-center text-sm font-medium text-amber-700 hover:text-amber-800 cursor-pointer border-t border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-all duration-200 rounded-b-lg"
            >
              查看所有搜尋結果 →
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
