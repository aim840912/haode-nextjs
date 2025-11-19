'use client'

import { cn } from '@/lib/utils/cn'
import { SuggestionItem } from './SuggestionItem'
import { SuggestionDropdownProps } from './types'

export function SuggestionDropdown({
  suggestions,
  selectedIndex,
  query,
  iconOnly,
  onSelectSuggestion,
  onViewAll,
  dropdownRef,
}: SuggestionDropdownProps) {
  return (
    <div
      ref={dropdownRef}
      className={cn(
        'absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto backdrop-blur-sm animate-in slide-in-from-top-2 fade-in duration-200',
        iconOnly && 'w-full lg:w-96'
      )}
    >
      {suggestions.map((suggestion, index) => (
        <SuggestionItem
          key={suggestion.id}
          suggestion={suggestion}
          isSelected={index === selectedIndex}
          index={index}
          onClick={() => onSelectSuggestion(suggestion)}
        />
      ))}

      {/* 查看更多結果 */}
      <div
        onClick={onViewAll}
        className="px-4 py-3 text-center text-sm font-medium text-amber-700 hover:text-amber-800 cursor-pointer border-t border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-all duration-200 rounded-b-lg"
      >
        查看所有搜尋結果 →
      </div>
    </div>
  )
}
