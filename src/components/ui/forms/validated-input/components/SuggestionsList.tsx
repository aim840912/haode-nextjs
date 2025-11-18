import React from 'react'

interface SuggestionsListProps {
  show: boolean
  suggestions: string[]
  onSelect: (suggestion: string) => void
}

/**
 * 建議列表元件
 */
export const SuggestionsList = React.memo(function SuggestionsList({
  show,
  suggestions,
  onSelect,
}: SuggestionsListProps) {
  if (!show || suggestions.length === 0) return null

  return (
    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          type="button"
          className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
})
