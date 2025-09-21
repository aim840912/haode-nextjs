/**
 * 全文搜尋服務
 *
 * 🎯 功能：
 * - PostgreSQL 全文搜尋整合
 * - 中文搜尋最佳化
 * - 搜尋結果排序和高亮
 * - 搜尋建議和自動完成
 * - 搜尋統計和分析
 */

import { createServiceSupabaseClient } from '@/lib/database/supabase-server'
import { dbLogger } from './logger'
import { ErrorFactory } from './errors'

/**
 * 搜尋配置介面
 */
export interface SearchConfig {
  /** 搜尋語言配置 */
  language?: 'chinese' | 'english' | 'simple'
  /** 最大結果數量 */
  limit?: number
  /** 結果偏移 */
  offset?: number
  /** 是否啟用排序 */
  enableRanking?: boolean
  /** 是否啟用高亮 */
  enableHighlight?: boolean
  /** 搜尋欄位權重 */
  fieldWeights?: Record<string, number>
}

/**
 * 搜尋結果介面
 */
export interface SearchResult<T = any> {
  /** 結果資料 */
  item: T
  /** 搜尋排名分數 */
  rank?: number
  /** 高亮摘要 */
  highlight?: string
  /** 匹配的欄位 */
  matchedFields?: string[]
}

/**
 * 分頁搜尋結果
 */
export interface PaginatedSearchResult<T = any> {
  /** 搜尋結果列表 */
  results: SearchResult<T>[]
  /** 總結果數量 */
  totalCount: number
  /** 當前頁面 */
  page: number
  /** 每頁大小 */
  pageSize: number
  /** 總頁數 */
  totalPages: number
  /** 搜尋執行時間（毫秒） */
  executionTime: number
}

/**
 * 搜尋統計資訊
 */
export interface SearchStats {
  /** 搜尋關鍵字 */
  query: string
  /** 結果數量 */
  resultCount: number
  /** 執行時間 */
  executionTime: number
  /** 搜尋時間戳 */
  timestamp: Date
}

/**
 * 全文搜尋服務類別
 */
export class FullTextSearchService {
  private client = createServiceSupabaseClient()
  private searchHistory: SearchStats[] = []

  /**
   * 搜尋產品
   */
  async searchProducts(query: string, config: SearchConfig = {}): Promise<PaginatedSearchResult> {
    const timer = dbLogger.timer('全文搜尋產品')
    const startTime = Date.now()

    try {
      const {
        language = 'chinese',
        limit = 20,
        offset = 0,
        enableRanking = true,
        enableHighlight = true,
        fieldWeights = { name: 1.0, description: 0.7, category: 0.5 },
      } = config

      // 建構全文搜尋查詢
      const searchQuery = this.buildSearchQuery('products', query, {
        language,
        enableRanking,
        enableHighlight,
        fieldWeights,
      })

      // 使用新的全文搜尋 RPC 函數
      // 為了避免 Supabase 類型檢查問題，使用 any 類型斷言
      const clientAny = this.client as any
      const { data, error } = (await clientAny.rpc('full_text_search_products', {
        search_query: query,
        search_limit: limit,
        search_offset: offset,
        lang_config: language === 'chinese' ? 'simple' : language,
      })) as { data: any[] | null; error: any }

      const count = data?.length || 0

      if (error) {
        throw new Error(`搜尋產品失敗: ${error.message}`)
      }

      const executionTime = timer.end({
        metadata: {
          query: query.substring(0, 50),
          resultCount: data?.length || 0,
          limit,
          offset,
        },
      })

      // 記錄搜尋統計
      this.recordSearchStats({
        query,
        resultCount: count || 0,
        executionTime,
        timestamp: new Date(),
      })

      // 格式化結果
      const results: SearchResult[] = (data || []).map(item => ({
        item: this.transformProductResult(item),
        rank: item.rank,
        highlight: enableHighlight ? item.highlight : undefined,
        matchedFields: item.matched_fields,
      }))

      const pageSize = limit
      const totalPages = Math.ceil((count || 0) / pageSize)
      const page = Math.floor(offset / pageSize) + 1

      return {
        results,
        totalCount: count || 0,
        page,
        pageSize,
        totalPages,
        executionTime,
      }
    } catch (error) {
      timer.end()
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'FullTextSearch',
        action: 'searchProducts',
      })
    }
  }

  /**
   * 搜尋新聞
   */
  async searchNews(query: string, config: SearchConfig = {}): Promise<PaginatedSearchResult> {
    const timer = dbLogger.timer('全文搜尋新聞')
    const startTime = Date.now()

    try {
      const {
        language = 'chinese',
        limit = 20,
        offset = 0,
        enableRanking = true,
        enableHighlight = true,
      } = config

      // 使用新的新聞全文搜尋 RPC 函數
      // 為了避免 Supabase 類型檢查問題，使用 any 類型斷言
      const clientAny = this.client as any
      const { data, error } = (await clientAny.rpc('full_text_search_news', {
        search_query: query,
        search_limit: limit,
        search_offset: offset,
        lang_config: language === 'chinese' ? 'simple' : language,
      })) as { data: any[] | null; error: any }

      const count = data?.length || 0

      if (error) {
        throw new Error(`搜尋新聞失敗: ${error.message}`)
      }

      const executionTime = timer.end({
        metadata: {
          query: query.substring(0, 50),
          resultCount: data?.length || 0,
        },
      })

      this.recordSearchStats({
        query,
        resultCount: count || 0,
        executionTime,
        timestamp: new Date(),
      })

      const results: SearchResult[] = (data || []).map(item => ({
        item: this.transformNewsResult(item),
        rank: item.rank,
        highlight: enableHighlight ? item.highlight : undefined,
        matchedFields: item.matched_fields,
      }))

      const pageSize = limit
      const totalPages = Math.ceil((count || 0) / pageSize)
      const page = Math.floor(offset / pageSize) + 1

      return {
        results,
        totalCount: count || 0,
        page,
        pageSize,
        totalPages,
        executionTime,
      }
    } catch (error) {
      timer.end()
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'FullTextSearch',
        action: 'searchNews',
      })
    }
  }

  /**
   * 通用全文搜尋
   */
  async searchAll(
    query: string,
    tables: string[] = ['products', 'news'],
    config: SearchConfig = {}
  ): Promise<Record<string, PaginatedSearchResult>> {
    const timer = dbLogger.timer('全文搜尋全部')

    try {
      const results: Record<string, PaginatedSearchResult> = {}

      // 並行搜尋所有指定的表格
      const searchPromises = tables.map(async table => {
        switch (table) {
          case 'products':
            return ['products', await this.searchProducts(query, config)]
          case 'news':
            return ['news', await this.searchNews(query, config)]
          default:
            return [
              table,
              { results: [], totalCount: 0, page: 1, pageSize: 0, totalPages: 0, executionTime: 0 },
            ]
        }
      })

      const searchResults = await Promise.all(searchPromises)

      searchResults.forEach(([table, result]) => {
        results[table as string] = result as PaginatedSearchResult
      })

      timer.end({
        metadata: {
          query: query.substring(0, 50),
          tables: tables.join(','),
          totalResults: Object.values(results).reduce((sum, r) => sum + r.totalCount, 0),
        },
      })

      return results
    } catch (error) {
      timer.end()
      throw new Error(`搜尋全部失敗: ${error}`)
    }
  }

  /**
   * 進階產品搜尋（支援價格和類別篩選）
   */
  async searchProductsAdvanced(
    query: string,
    category?: string,
    minPrice?: number,
    maxPrice?: number,
    limit: number = 20
  ): Promise<PaginatedSearchResult> {
    const timer = dbLogger.timer('進階產品搜尋')
    const startTime = Date.now()

    try {
      // 為了避免 Supabase 類型檢查問題，使用 any 類型斷言
      const clientAny = this.client as any
      const { data, error } = (await clientAny.rpc('search_products_advanced', {
        search_query: query,
        category_filter: category,
        min_price: minPrice,
        max_price: maxPrice,
        result_limit: limit,
      })) as { data: any[] | null; error: any }

      if (error) {
        throw new Error(`進階搜尋產品失敗: ${error.message}`)
      }

      const executionTime = timer.end({
        metadata: {
          query: query.substring(0, 50),
          category,
          minPrice,
          maxPrice,
          resultCount: data?.length || 0,
        },
      })

      // 格式化結果
      const results: SearchResult[] = (data || []).map((item: any) => ({
        item: this.transformProductResult(item),
        rank: item.rank || 1,
        matchedFields: ['name', 'description', 'category'],
      }))

      return {
        results,
        totalCount: data?.length || 0,
        page: 1,
        pageSize: limit,
        totalPages: 1,
        executionTime,
      }
    } catch (error) {
      timer.end()
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'FullTextSearch',
        action: 'searchProductsAdvanced',
      })
    }
  }

  /**
   * 獲取搜尋建議
   */
  async getSearchSuggestions(
    partialQuery: string,
    table: string = 'products',
    limit: number = 5
  ): Promise<string[]> {
    const timer = dbLogger.timer('獲取搜尋建議')

    try {
      // 使用新的搜尋建議 RPC 函數
      // 為了避免 Supabase 類型檢查問題，使用 any 類型斷言
      const clientAny = this.client as any
      const { data, error } = (await clientAny.rpc('get_search_suggestions', {
        partial_query: partialQuery,
        suggestion_limit: limit,
      })) as { data: any[] | null; error: any }

      if (error) {
        throw new Error(`獲取搜尋建議失敗: ${error.message}`)
      }

      timer.end({
        metadata: {
          partialQuery: partialQuery.substring(0, 20),
          table,
          suggestionCount: data?.length || 0,
        },
      })

      return (data || []).map((item: any) => item.suggestion || item.name || '')
    } catch (error) {
      timer.end()
      dbLogger.warn('獲取搜尋建議失敗', {
        module: 'FullTextSearch',
        metadata: { error: String(error), partialQuery },
      })
      return []
    }
  }

  /**
   * 獲取熱門搜尋關鍵字
   */
  async getPopularQueries(limit: number = 10): Promise<{ query: string; count: number }[]> {
    const timer = dbLogger.timer('獲取熱門搜尋')

    try {
      // 從搜尋歷史中統計熱門關鍵字
      const queryStats = new Map<string, number>()

      this.searchHistory.forEach(stat => {
        const query = stat.query.toLowerCase().trim()
        if (query.length > 1) {
          queryStats.set(query, (queryStats.get(query) || 0) + 1)
        }
      })

      const popularQueries = Array.from(queryStats.entries())
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)

      timer.end({
        metadata: {
          totalQueries: this.searchHistory.length,
          uniqueQueries: queryStats.size,
          returnedCount: popularQueries.length,
        },
      })

      return popularQueries
    } catch (error) {
      timer.end()
      dbLogger.warn('獲取熱門搜尋失敗', {
        module: 'FullTextSearch',
        metadata: { error: String(error) },
      })
      return []
    }
  }

  /**
   * 清理搜尋歷史
   */
  clearSearchHistory(): void {
    this.searchHistory = []
    dbLogger.info('搜尋歷史已清理', {
      module: 'FullTextSearch',
      action: 'clearHistory',
    })
  }

  /**
   * 獲取搜尋統計
   */
  getSearchStatistics(): {
    totalSearches: number
    averageExecutionTime: number
    averageResultCount: number
    lastSearchTime?: Date
  } {
    if (this.searchHistory.length === 0) {
      return {
        totalSearches: 0,
        averageExecutionTime: 0,
        averageResultCount: 0,
      }
    }

    const totalExecutionTime = this.searchHistory.reduce((sum, stat) => sum + stat.executionTime, 0)
    const totalResultCount = this.searchHistory.reduce((sum, stat) => sum + stat.resultCount, 0)

    return {
      totalSearches: this.searchHistory.length,
      averageExecutionTime: totalExecutionTime / this.searchHistory.length,
      averageResultCount: totalResultCount / this.searchHistory.length,
      lastSearchTime: this.searchHistory[this.searchHistory.length - 1]?.timestamp,
    }
  }

  /**
   * 建構搜尋查詢
   */
  private buildSearchQuery(
    table: string,
    query: string,
    options: {
      language: string
      enableRanking: boolean
      enableHighlight: boolean
      fieldWeights: Record<string, number>
    }
  ): string {
    const { language, enableRanking, fieldWeights } = options

    // 處理搜尋詞彙
    const searchTerms = query
      .trim()
      .split(/\s+/)
      .filter(term => term.length > 0)
      .map(term => `'${term.replace(/'/g, "''")}'`)
      .join(' & ')

    // 建構加權向量
    const weightedFields = Object.entries(fieldWeights)
      .map(
        ([field, weight]) =>
          `setweight(to_tsvector('${language}', COALESCE(${field}, '')), '${this.getWeightLevel(weight)}')`
      )
      .join(' || ')

    return `
      SELECT *, 
        ${enableRanking ? `ts_rank(${weightedFields}, to_tsquery('${language}', '${searchTerms}')) as rank` : '1 as rank'}
      FROM ${table}
      WHERE ${weightedFields} @@ to_tsquery('${language}', '${searchTerms}')
      ${enableRanking ? 'ORDER BY rank DESC' : ''}
    `
  }

  /**
   * 獲取權重等級
   */
  private getWeightLevel(weight: number): string {
    if (weight >= 0.9) return 'A'
    if (weight >= 0.7) return 'B'
    if (weight >= 0.5) return 'C'
    return 'D'
  }

  /**
   * 轉換產品搜尋結果
   */
  private transformProductResult(item: any): any {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      originalPrice: item.original_price,
      isOnSale: item.is_on_sale,
      images: item.images || [],
      primaryImageUrl: item.primary_image_url,
      thumbnailUrl: item.thumbnail_url,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }
  }

  /**
   * 轉換新聞搜尋結果
   */
  private transformNewsResult(item: any): any {
    return {
      id: item.id,
      title: item.title,
      content: item.content,
      author: item.author,
      publishedAt: item.published_at,
      imageUrl: item.image_url,
      tags: item.tags || [],
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }
  }

  /**
   * 記錄搜尋統計
   */
  private recordSearchStats(stats: SearchStats): void {
    this.searchHistory.push(stats)

    // 保持歷史記錄在合理範圍內（最多 1000 筆）
    if (this.searchHistory.length > 1000) {
      this.searchHistory = this.searchHistory.slice(-500)
    }

    dbLogger.debug('記錄搜尋統計', {
      module: 'FullTextSearch',
      metadata: {
        query: stats.query.substring(0, 30),
        resultCount: stats.resultCount,
        executionTime: stats.executionTime,
      },
    })
  }
}

/**
 * 全域搜尋服務實例
 */
export const fullTextSearchService = new FullTextSearchService()
