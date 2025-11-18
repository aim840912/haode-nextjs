'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { ExpandableSearchBarProps } from './types'
import { useSearchSuggestions } from './useSearchSuggestions'
import { useKeyboardNavigation } from './useKeyboardNavigation'
import { SearchButton } from './SearchButton'
import { SearchInput } from './SearchInput'
import { SuggestionDropdown } from './SuggestionDropdown'

export function ExpandableSearchBar({
  placeholder,
  onSearch,
  showSuggestions = true,
  className = '',
  iconOnly = false,
}: ExpandableSearchBarProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isExpanded, setIsExpanded] = useState(!iconOnly)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const { suggestions, isLoading, showDropdown, setShowDropdown, setSuggestions } =
    useSearchSuggestions(query, showSuggestions, isExpanded)

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
  const handleSelectSuggestion = useCallback(
    (suggestion: { url: string }) => {
      router.push(suggestion.url)
      setShowDropdown(false)
      setQuery('')
      if (iconOnly) {
        handleCollapse()
      }
    },
    [router, iconOnly]
  )

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

  // 鍵盤導航
  const handleKeyDown = useKeyboardNavigation(
    showDropdown,
    suggestions,
    selectedIndex,
    setSelectedIndex,
    handleSelectSuggestion,
    handleSearch,
    handleCollapse
  )

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
    return <SearchButton onExpand={handleExpand} />
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* 背景遮罩 (手機版展開時) */}
      {iconOnly && isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={handleCollapse}
        />
      )}

      {/* 桌面版展開時的容器 */}
      <div
        className={cn(
          iconOnly && isExpanded
            ? 'fixed lg:absolute right-4 lg:right-0 top-20 lg:top-1/2 lg:-translate-y-1/2 z-50 lg:w-96 w-[calc(100vw-2rem)]'
            : 'relative'
        )}
      >
        <SearchInput
          query={query}
          isExpanded={isExpanded}
          iconOnly={iconOnly}
          placeholder={placeholder}
          isLoading={isLoading}
          onQueryChange={setQuery}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onSearchClick={handleSearch}
          onClearClick={handleClear}
          onCollapseClick={handleCollapse}
          inputRef={inputRef}
        />

        {/* 搜尋建議下拉選單 */}
        {showDropdown && suggestions.length > 0 && isExpanded && (
          <SuggestionDropdown
            suggestions={suggestions}
            selectedIndex={selectedIndex}
            query={query}
            iconOnly={iconOnly}
            onSelectSuggestion={handleSelectSuggestion}
            onViewAll={() => {
              router.push(`/search?q=${encodeURIComponent(query)}`)
              setShowDropdown(false)
              if (iconOnly) handleCollapse()
            }}
            dropdownRef={dropdownRef}
          />
        )}
      </div>
    </div>
  )
}
