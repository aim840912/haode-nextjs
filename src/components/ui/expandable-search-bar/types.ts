import { SearchResult } from '@/types/search'

export interface ExpandableSearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  showSuggestions?: boolean
  className?: string
  iconOnly?: boolean
}

export interface SearchInputProps {
  query: string
  isExpanded: boolean
  iconOnly: boolean
  placeholder?: string
  isLoading: boolean
  onQueryChange: (query: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onFocus: () => void
  onSearchClick: () => void
  onClearClick: () => void
  onCollapseClick: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

export interface SuggestionDropdownProps {
  suggestions: SearchResult[]
  selectedIndex: number
  query: string
  iconOnly: boolean
  onSelectSuggestion: (suggestion: SearchResult) => void
  onViewAll: () => void
  dropdownRef: React.RefObject<HTMLDivElement | null>
}

export interface SuggestionItemProps {
  suggestion: SearchResult
  isSelected: boolean
  index: number
  onClick: () => void
}
