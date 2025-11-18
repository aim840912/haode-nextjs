import { SearchResult } from '@/types/search'

export function useKeyboardNavigation(
  showDropdown: boolean,
  suggestions: SearchResult[],
  selectedIndex: number,
  setSelectedIndex: (index: number | ((prev: number) => number)) => void,
  onSelectSuggestion: (suggestion: SearchResult) => void,
  onSearch: () => void,
  onCollapse: () => void
) {
  return (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === 'Escape') {
        onCollapse()
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
          onSelectSuggestion(suggestions[selectedIndex])
        } else {
          onSearch()
        }
        break
      case 'Escape':
        onCollapse()
        break
    }
  }
}
