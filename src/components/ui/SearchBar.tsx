'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useDebounce } from '@/hooks/useDebounce'
import { SearchResult } from '@/types/search'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  showSuggestions?: boolean
  className?: string
}

export function SearchBar({ 
  placeholder = '搜尋產品、新聞...',
  onSearch,
  showSuggestions = true,
  className = ''
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // 搜尋建議
  useEffect(() => {
    if (!debouncedQuery.trim() || !showSuggestions) {
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
        console.error('搜尋建議失敗:', error)
        setSuggestions([])
        setShowDropdown(false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedQuery, showSuggestions])

  // 處理鍵盤導航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
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
        setShowDropdown(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
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
    inputRef.current?.blur()
  }

  // 選擇建議項目
  const handleSelectSuggestion = (suggestion: SearchResult) => {
    router.push(suggestion.url)
    setShowDropdown(false)
    setQuery('')
    inputRef.current?.blur()
  }

  // 清除搜尋
  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setShowDropdown(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
        />
        
        {/* 搜尋圖示 */}
        <MagnifyingGlassIcon 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer"
          onClick={handleSearch}
        />
        
        {/* 載入指示器 / 清除按鈕 */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          ) : query ? (
            <XMarkIcon 
              className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600"
              onClick={handleClear}
            />
          ) : null}
        </div>
      </div>

      {/* 搜尋建議下拉選單 */}
      {showDropdown && suggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${
                index === selectedIndex 
                  ? 'bg-green-50 border-l-4 border-green-500' 
                  : 'hover:bg-gray-50'
              } ${index > 0 ? 'border-t border-gray-100' : ''}`}
            >
              <div className="flex items-center gap-3">
                {/* 類型圖示 */}
                <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                  suggestion.type === 'product' ? 'bg-blue-500' :
                  suggestion.type === 'news' ? 'bg-green-500' :
                  'bg-gray-500'
                }`} />
                
                {/* 內容 */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.title}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.description}
                  </div>
                  {suggestion.category && (
                    <div className="text-xs text-gray-400 mt-1">
                      {suggestion.category}
                    </div>
                  )}
                </div>
                
                {/* 價格或類型標籤 */}
                <div className="flex-shrink-0 text-right">
                  {suggestion.price && (
                    <div className="text-sm font-medium text-green-600">
                      NT$ {suggestion.price.toLocaleString()}
                    </div>
                  )}
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    suggestion.type === 'product' ? 'bg-blue-100 text-blue-800' :
                    suggestion.type === 'news' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {suggestion.type === 'product' ? '產品' :
                     suggestion.type === 'news' ? '新聞' :
                     suggestion.type}
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
            }}
            className="px-4 py-3 text-center text-sm text-green-600 hover:text-green-700 cursor-pointer border-t border-gray-100 bg-gray-50"
          >
            查看所有搜尋結果
          </div>
        </div>
      )}
    </div>
  )
}