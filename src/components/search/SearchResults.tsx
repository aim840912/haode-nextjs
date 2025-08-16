'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SearchResult, SearchResponse, SearchFilters } from '@/types/search'
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'

interface SearchResultsProps {
  query: string
  filters?: SearchFilters
  onFiltersChange?: (filters: SearchFilters) => void
}

export function SearchResults({ query, filters, onFiltersChange }: SearchResultsProps) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null)

  // 載入搜尋結果
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearchResponse(null)
      return
    }

    const fetchResults = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const searchParams = new URLSearchParams({ q: query })
        
        // 添加篩選參數
        if (filters?.type && filters.type.length > 0) {
          searchParams.append('type', filters.type.join(','))
        }
        if (filters?.category && filters.category.length > 0) {
          searchParams.append('category', filters.category.join(','))
        }
        if (filters?.priceRange) {
          searchParams.append('minPrice', filters.priceRange[0].toString())
          searchParams.append('maxPrice', filters.priceRange[1].toString())
        }
        if (filters?.minRating) {
          searchParams.append('minRating', filters.minRating.toString())
        }

        const response = await fetch(`/api/search?${searchParams.toString()}`)
        
        if (!response.ok) {
          throw new Error('搜尋失敗')
        }

        const data: SearchResponse = await response.json()
        setResults(data.results)
        setSearchResponse(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '搜尋時發生錯誤')
        setResults([])
        setSearchResponse(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [query, filters])

  // 渲染搜尋結果項目
  const renderResultItem = (result: SearchResult) => (
    <Link 
      key={result.id}
      href={result.url}
      className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200"
    >
      <div className="flex gap-4">
        {/* 圖片 */}
        {result.image && (
          <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={result.image}
              alt={result.title}
              width={80}
              height={80}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        )}
        
        {/* 內容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate mb-2">
                {result.title}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {result.description}
              </p>
              
              {/* 標籤和類別 */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  result.type === 'product' ? 'bg-blue-100 text-blue-800' :
                  result.type === 'news' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {result.type === 'product' ? '產品' :
                   result.type === 'news' ? '新聞' :
                   result.type}
                </span>
                
                {result.category && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {result.category}
                  </span>
                )}
              </div>
            </div>
            
            {/* 價格或其他資訊 */}
            <div className="flex-shrink-0 text-right">
              {result.price && (
                <div className="text-lg font-bold text-green-600 mb-1">
                  NT$ {result.price.toLocaleString()}
                </div>
              )}
              {result.rating && (
                <div className="text-sm text-yellow-600">
                  ⭐ {result.rating.toFixed(1)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )

  if (!query.trim()) {
    return (
      <div className="text-center py-12">
        <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">請輸入搜尋關鍵字</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 搜尋資訊和篩選器 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {isLoading ? (
            '搜尋中...'
          ) : searchResponse ? (
            <>
              找到 <span className="font-medium">{searchResponse.total}</span> 個結果
              {searchResponse.processingTime && (
                <span className="ml-2">
                  (耗時 {searchResponse.processingTime}ms)
                </span>
              )}
            </>
          ) : null}
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
        >
          <AdjustmentsHorizontalIcon className="w-4 h-4" />
          篩選
        </button>
      </div>

      {/* 篩選器面板 */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 類型篩選 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                類型
              </label>
              <div className="space-y-2">
                {['product', 'news'].map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters?.type?.includes(type as SearchResult['type']) || false}
                      onChange={(e) => {
                        const currentTypes = filters?.type || []
                        const newTypes = e.target.checked
                          ? [...currentTypes, type as SearchResult['type']]
                          : currentTypes.filter(t => t !== type)
                        onFiltersChange?.({
                          ...filters,
                          type: newTypes.length > 0 ? newTypes : undefined
                        })
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {type === 'product' ? '產品' : 
                       type === 'news' ? '新聞' : type}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* 價格範圍 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                價格範圍
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="最低"
                  value={filters?.priceRange?.[0] || ''}
                  onChange={(e) => {
                    const min = parseInt(e.target.value) || 0
                    const max = filters?.priceRange?.[1] || 10000
                    onFiltersChange?.({
                      ...filters,
                      priceRange: [min, max]
                    })
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="最高"
                  value={filters?.priceRange?.[1] || ''}
                  onChange={(e) => {
                    const max = parseInt(e.target.value) || 10000
                    const min = filters?.priceRange?.[0] || 0
                    onFiltersChange?.({
                      ...filters,
                      priceRange: [min, max]
                    })
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>
            
            {/* 最低評分 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最低評分
              </label>
              <select
                value={filters?.minRating || ''}
                onChange={(e) => {
                  const minRating = parseFloat(e.target.value) || undefined
                  onFiltersChange?.({
                    ...filters,
                    minRating
                  })
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
              >
                <option value="">不限</option>
                <option value="4.5">4.5 星以上</option>
                <option value="4.0">4.0 星以上</option>
                <option value="3.5">3.5 星以上</option>
                <option value="3.0">3.0 星以上</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 載入狀態 */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500">搜尋中...</p>
        </div>
      )}

      {/* 錯誤狀態 */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 搜尋結果 */}
      {!isLoading && !error && results.length > 0 && (
        <div className="space-y-4">
          {results.map(renderResultItem)}
        </div>
      )}

      {/* 無結果 */}
      {!isLoading && !error && results.length === 0 && searchResponse && (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            沒有找到相關結果
          </h3>
          <p className="text-gray-500 mb-6">
            請嘗試使用不同的關鍵字或調整篩選條件
          </p>
          <div className="text-sm text-gray-600">
            搜尋建議：
            <ul className="mt-2 space-y-1">
              <li>• 檢查拼字是否正確</li>
              <li>• 嘗試更短或更通用的關鍵字</li>
              <li>• 移除一些篩選條件</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}