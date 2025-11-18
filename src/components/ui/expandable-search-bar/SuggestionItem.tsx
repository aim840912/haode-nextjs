'use client'

import { cn } from '@/lib/utils/cn'
import { SuggestionItemProps } from './types'

export function SuggestionItem({ suggestion, isSelected, index, onClick }: SuggestionItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'px-4 py-3 cursor-pointer transition-all duration-200',
        isSelected
          ? 'bg-amber-50 border-l-4 border-amber-500 shadow-sm'
          : 'hover:bg-gray-50 hover:shadow-sm',
        index > 0 && 'border-t border-gray-100',
        'first:rounded-t-lg last:rounded-b-lg'
      )}
    >
      <div className="flex items-center gap-3">
        {/* 類型圖示 */}
        <div
          className={cn(
            'flex-shrink-0 w-3 h-3 rounded-full shadow-sm',
            suggestion.type === 'product' ? 'bg-blue-500' : 'bg-gray-500'
          )}
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
            className={cn(
              'text-xs font-medium px-2.5 py-1 rounded-full shadow-sm',
              suggestion.type === 'product'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            )}
          >
            {suggestion.type === 'product' ? '產品' : suggestion.type}
          </div>
        </div>
      </div>
    </div>
  )
}
