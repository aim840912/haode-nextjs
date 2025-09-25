'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { logger } from '@/lib/logger'

interface CategorySelectorProps {
  value: string
  onChange: (category: string) => void
  error?: string
  disabled?: boolean
  className?: string
}

function CategorySelector({
  value,
  onChange,
  error,
  disabled = false,
  className = '',
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [customCategory, setCustomCategory] = useState('')

  // 載入分類資料
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products/categories')

      if (response.ok) {
        const result = await response.json()
        const categoriesData = result.data || result

        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData)

          // 如果沒有選擇分類且有分類資料，設定第一個為預設值
          if (!value && categoriesData.length > 0) {
            onChange(categoriesData[0])
          }
        }
      }
    } catch (error) {
      logger.warn('載入分類資料失敗', {
        module: 'CategorySelector',
        metadata: { error: String(error) },
      })
    } finally {
      setLoading(false)
    }
  }, [value, onChange])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // 處理分類選擇
  const handleCategorySelect = useCallback(
    (category: string) => {
      onChange(category)
      setShowSuggestions(false)
      setCustomCategory('')
    },
    [onChange]
  )

  // 處理自定義分類
  const handleCustomCategory = useCallback(() => {
    if (customCategory.trim()) {
      const newCategory = customCategory.trim()

      // 添加到分類列表（如果不存在）
      if (!categories.includes(newCategory)) {
        setCategories(prev => [...prev, newCategory])
      }

      onChange(newCategory)
      setCustomCategory('')
      setShowSuggestions(false)
    }
  }, [customCategory, categories, onChange])

  // 分類建議
  const categoryRecommendations = [
    '蔬菜類',
    '水果類',
    '肉類',
    '海鮮類',
    '乳製品',
    '穀物類',
    '調味料',
    '茶葉',
    '咖啡',
    '保健食品',
    '有機蔬菜',
    '有機水果',
    '冷凍食品',
    '加工食品',
    '其他',
  ]

  const availableSuggestions = categoryRecommendations.filter(cat => !categories.includes(cat))

  if (loading) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">產品分類</label>
        <div className="relative">
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 animate-pulse">
            <div className="h-5 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        產品分類 <span className="text-red-500">*</span>
      </label>

      <div className="relative">
        {/* 主選擇器 */}
        <select
          value={value}
          onChange={e => handleCategorySelect(e.target.value)}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
            ${error ? 'border-red-300' : 'border-gray-300'}
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
          `}
        >
          <option value="">請選擇分類...</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        {/* 下拉箭頭 */}
        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* 分類建議按鈕 */}
      {!disabled && availableSuggestions.length > 0 && (
        <button
          type="button"
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="mt-2 text-sm text-amber-600 hover:text-amber-500 underline"
        >
          {showSuggestions ? '收起建議分類' : '查看建議分類'}
        </button>
      )}

      {/* 建議分類列表 */}
      {showSuggestions && (
        <div className="mt-2 p-3 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-600 mb-2">建議分類：</p>
          <div className="flex flex-wrap gap-1">
            {availableSuggestions.map(category => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategorySelect(category)}
                className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-amber-50 hover:border-amber-200 transition-colors"
              >
                {category}
              </button>
            ))}
          </div>

          {/* 自定義分類 */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-2">自定義分類：</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                placeholder="輸入新分類..."
                className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCustomCategory()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleCustomCategory}
                disabled={!customCategory.trim()}
                className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                新增
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 錯誤訊息 */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

// 使用 memo 優化效能，避免不必要的重渲染
export default memo(CategorySelector)
