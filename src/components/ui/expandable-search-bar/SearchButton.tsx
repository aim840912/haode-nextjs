'use client'

import { Search } from 'lucide-react'

interface SearchButtonProps {
  onExpand: () => void
}

export function SearchButton({ onExpand }: SearchButtonProps) {
  return (
    <button
      onClick={onExpand}
      className="flex items-center justify-center text-gray-700 hover:text-green-900 hover:bg-green-50 transition-all duration-200 rounded-md min-h-[44px] min-w-[44px] p-2"
      aria-label="開啟搜尋"
    >
      <Search className="w-5 h-5 transition-transform duration-200" />
    </button>
  )
}
