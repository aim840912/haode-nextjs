'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchResults } from '@/components/search/SearchResults'
import { SearchBar } from '@/components/ui/SearchBar'
import { SearchFilters } from '@/types/search'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})

  useEffect(() => {
    const q = searchParams.get('q') || ''
    setQuery(q)
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">搜尋結果</h1>
              {query && (
                <p className="text-gray-600 mt-1">
                  搜尋關鍵字：<span className="font-medium">&quot;{query}&quot;</span>
                </p>
              )}
            </div>
            
            {/* 搜尋欄 */}
            <div className="w-full lg:w-96">
              <SearchBar 
                placeholder="重新搜尋..."
                onSearch={(newQuery) => {
                  setQuery(newQuery)
                  window.history.pushState(
                    {}, 
                    '', 
                    `/search?q=${encodeURIComponent(newQuery)}`
                  )
                }}
                showSuggestions={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchResults 
          query={query}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
    </div>
  )
}