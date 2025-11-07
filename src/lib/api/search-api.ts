/**
 * Search API 客戶端包裝層
 * 提供類型安全的 API 呼叫函數，供客戶端元件使用
 */

import { apiClient } from '@/lib/api-client'
import { apiLogger } from '@/lib/logger'
import type { SearchResponse, SearchParams } from '@/types/search'
import { handleApiError } from './common'

/**
 * 搜尋建議回應
 */
export interface SearchSuggestionsResponse {
  suggestions: string[]
  query: string
}

/**
 * 搜尋統計回應
 */
export interface SearchStatsResponse {
  popularSearches: Array<{
    query: string
    count: number
    avgExecutionTime?: number
    avgResultCount?: number
  }>
  period: {
    daysBack: number
    startDate: string
    endDate: string
  }
  summary: {
    totalSearches: number
    uniqueQueries: number
    averageExecutionTime: number
  }
}

/**
 * 執行搜尋查詢
 * @param query - 搜尋關鍵字
 * @param options - 搜尋選項（篩選、分頁）
 * @returns 搜尋結果
 */
export async function searchContent(
  query: string,
  options?: Omit<SearchParams, 'q'>
): Promise<SearchResponse> {
  try {
    const searchParams = new URLSearchParams({ q: query })

    if (options?.limit) {
      searchParams.append('limit', String(options.limit))
    }
    if (options?.offset) {
      searchParams.append('offset', String(options.offset))
    }
    if (options?.filters) {
      // 將 filters 序列化為查詢參數
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)))
          } else {
            searchParams.append(key, String(value))
          }
        }
      })
    }

    const endpoint = `/api/search?${searchParams}`
    const result = await apiClient.get<SearchResponse>(endpoint)

    if (!result.success || !result.data) {
      throw new Error(result.message || '搜尋失敗')
    }

    apiLogger.info('搜尋查詢成功', {
      metadata: {
        query,
        totalResults: result.data.total,
        processingTime: result.data.processingTime,
      },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'searchContent', 'SearchAPI')
  }
}

/**
 * 取得搜尋建議
 * @param query - 部分搜尋關鍵字
 * @param limit - 建議數量限制
 * @returns 搜尋建議列表
 */
export async function fetchSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
  try {
    const params = new URLSearchParams({ q: query, limit: String(limit) })
    const endpoint = `/api/search/suggestions?${params}`
    const result = await apiClient.get<SearchSuggestionsResponse>(endpoint)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得搜尋建議失敗')
    }

    apiLogger.info('搜尋建議取得成功', {
      metadata: { query, count: result.data.suggestions.length },
    })

    return result.data.suggestions
  } catch (error) {
    // 搜尋建議失敗時返回空陣列，不拋出錯誤
    apiLogger.warn('取得搜尋建議失敗', {
      metadata: {
        query,
        error: error instanceof Error ? error.message : String(error),
      },
    })
    return []
  }
}

/**
 * 取得搜尋統計資料（管理員）
 * @returns 搜尋統計
 */
export async function fetchSearchStats(): Promise<SearchStatsResponse> {
  try {
    const result = await apiClient.get<SearchStatsResponse>('/api/search/stats')

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得搜尋統計失敗')
    }

    apiLogger.info('搜尋統計取得成功', {
      metadata: {
        totalSearches: result.data.summary.totalSearches,
        popularSearchesCount: result.data.popularSearches.length,
      },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchSearchStats', 'SearchAPI')
  }
}
