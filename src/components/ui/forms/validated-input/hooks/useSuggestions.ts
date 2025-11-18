import { useState } from 'react'

interface UseSuggestionsOptions {
  suggestions: string[]
  onFocus?: () => void
  onBlur?: () => void
  onChange: (value: string | number) => void
  onSuggestionSelect?: (suggestion: string) => void
}

/**
 * 管理建議列表的顯示和選擇邏輯
 */
export function useSuggestions({
  suggestions,
  onFocus,
  onBlur,
  onChange,
  onSuggestionSelect,
}: UseSuggestionsOptions) {
  const [showSuggestions, setShowSuggestions] = useState(false)

  /**
   * 處理聚焦
   */
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
    onFocus?.()
  }

  /**
   * 處理失焦 - 延遲隱藏建議列表，讓用戶有機會點擊建議項目
   */
  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200)
    onBlur?.()
  }

  /**
   * 選擇建議項目
   */
  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    onSuggestionSelect?.(suggestion)
  }

  return {
    showSuggestions,
    handleFocus,
    handleBlur,
    handleSuggestionClick,
  }
}
