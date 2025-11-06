'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch?: (query: string) => void
  placeholder?: string
  className?: string
  showHistory?: boolean
  showSuggestions?: boolean
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = '搜尋產品名稱、描述或類別...',
  className = '',
  showHistory = true,
  showSuggestions = true,
}: SearchInputProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { suggestions, searchHistory, loading, getSuggestions, saveToHistory, clearHistory } =
    useSearchSuggestions({
      debounceMs: 300,
      minQueryLength: 2,
      maxSuggestions: 5,
      enableHistory: showHistory,
    })

  // 合併建議和歷史
  const combinedOptions = [
    ...(value.length >= 2 && showSuggestions ? suggestions : []),
    ...(value.length < 2 && showHistory ? searchHistory : []),
  ].filter((item, index, arr) => arr.indexOf(item) === index) // 去重複

  // 處理輸入變化
  const handleInputChange = (newValue: string) => {
    onChange(newValue)
    setFocusedIndex(-1)

    if (newValue.length >= 2 && showSuggestions) {
      getSuggestions(newValue)
      setIsDropdownOpen(true)
    } else if (newValue.length < 2 && showHistory && searchHistory.length > 0) {
      setIsDropdownOpen(true)
    } else {
      setIsDropdownOpen(false)
    }
  }

  // 處理選擇項目
  const handleSelectItem = (item: string) => {
    onChange(item)
    saveToHistory(item)
    setIsDropdownOpen(false)
    setFocusedIndex(-1)
    onSearch?.(item)
  }

  // 處理鍵盤事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen || combinedOptions.length === 0) {
      if (e.key === 'Enter' && value.trim()) {
        saveToHistory(value.trim())
        onSearch?.(value.trim())
        setIsDropdownOpen(false)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, combinedOptions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < combinedOptions.length) {
          handleSelectItem(combinedOptions[focusedIndex])
        } else if (value.trim()) {
          saveToHistory(value.trim())
          onSearch?.(value.trim())
          setIsDropdownOpen(false)
        }
        break
      case 'Escape':
        setIsDropdownOpen(false)
        setFocusedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // 處理焦點事件
  const handleFocus = () => {
    if (value.length >= 2 && showSuggestions && suggestions.length > 0) {
      setIsDropdownOpen(true)
    } else if (value.length < 2 && showHistory && searchHistory.length > 0) {
      setIsDropdownOpen(true)
    }
  }

  const handleBlur = (_e: React.FocusEvent) => {
    // 延遲關閉以允許點擊下拉選項
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsDropdownOpen(false)
        setFocusedIndex(-1)
      }
    }, 150)
  }

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        dropdownRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
        setFocusedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 placeholder-gray-500 bg-white pr-10 ${className}`}
        />

        {/* 載入指示器 */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* 搜尋圖示 */}
        {!loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* 下拉建議選單 */}
      {isDropdownOpen && combinedOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {/* 歷史搜尋標題 */}
          {value.length < 2 && showHistory && searchHistory.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-500">搜尋歷史</span>
              <button onClick={clearHistory} className="text-xs text-gray-400 hover:text-gray-600">
                清除
              </button>
            </div>
          )}

          {/* 建議標題 */}
          {value.length >= 2 && showSuggestions && suggestions.length > 0 && (
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-500">搜尋建議</span>
            </div>
          )}

          {/* 選項列表 */}
          {combinedOptions.map((option, index) => (
            <button
              key={`${option}-${index}`}
              onClick={() => handleSelectItem(option)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                index === focusedIndex ? 'bg-amber-50 text-amber-900' : 'text-gray-700'
              }`}
            >
              {/* 圖示 */}
              {value.length < 2 ? (
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
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
              )}
              <span className="flex-1">{option}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
