'use client'

import { Search } from 'lucide-react'

interface SearchButtonProps {
  onExpand: () => void
}

export function SearchButton({ onExpand }: SearchButtonProps) {
  return (
    <button
      onClick={onExpand}
      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-amber-900 transition-all duration-200 rounded-full hover:bg-gray-100 hover:scale-110 active:scale-95"
      aria-label="開啟搜尋"
    >
      <Search className="w-5 h-5 transition-transform duration-200" />
    </button>
  )
}
