'use client'

import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { SearchInputProps } from './types'

export function SearchInput({
  query,
  isExpanded,
  iconOnly,
  placeholder,
  isLoading,
  onQueryChange,
  onKeyDown,
  onFocus,
  onSearchClick,
  onClearClick,
  onCollapseClick,
  inputRef,
}: SearchInputProps) {
  return (
    <div
      className={cn(
        'relative transition-all duration-300 ease-out',
        iconOnly && isExpanded ? 'w-full lg:w-96' : isExpanded ? 'w-full' : 'w-10'
      )}
    >
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        placeholder={placeholder || '搜尋產品...'}
        className={cn(
          'w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all duration-300 text-gray-900 placeholder-gray-500',
          iconOnly && isExpanded ? 'bg-white shadow-lg ring-1 ring-gray-200' : 'bg-white'
        )}
      />

      {/* 搜尋圖示 */}
      <Search
        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer"
        onClick={onSearchClick}
      />

      {/* 載入指示器 / 清除按鈕 / 關閉按鈕 */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shadow-sm" />
        ) : iconOnly && isExpanded ? (
          <X
            className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 hover:scale-110 transition-all duration-200 rounded-full hover:bg-gray-100 p-0.5"
            onClick={onCollapseClick}
          />
        ) : query ? (
          <X
            className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 hover:scale-110 transition-all duration-200 rounded-full hover:bg-gray-100 p-0.5"
            onClick={onClearClick}
          />
        ) : null}
      </div>
    </div>
  )
}
