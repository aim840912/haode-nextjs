/**
 * 新聞服務 v2 簡化實作
 * 基於統一架構的新聞管理服務
 *
 * 功能：
 * - 標準化 CRUD 操作
 * - 統一錯誤處理和日誌記錄
 * - 支援搜尋和圖片清理
 * - 內建資料轉換和驗證
 */

import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-auth'
import { dbLogger } from '@/lib/logger'
import { ErrorFactory, NotFoundError, ValidationError } from '@/lib/errors'
import { NewsItem, NewsService } from '@/types/news'

/**
 * 資料庫記錄類型
 */
interface SupabaseNewsRecord {
  id: string
  title: string
  summary: string
  content: string
  author: string
  publish_date: string
  category: string
  tags: string[]
  image_url: string | null
  featured: boolean
  is_published: boolean
  created_at: string
  updated_at: string
}

/**
 * 新聞服務 v2 簡化實作
 */
export class NewsServiceV2Simple implements NewsService {
  private readonly moduleName = 'NewsServiceV2'

  /**
   * 取得 Supabase 客戶端
   */
  private getSupabaseClient(): ReturnType<typeof createServiceSupabaseClient> {
    return createServiceSupabaseClient()
  }

  /**
   * 取得管理員客戶端
   */
  private getAdminClient(): typeof supabaseAdmin {
    return supabaseAdmin
  }

  /**
   * 處理錯誤
   */
  private handleError(error: unknown, operation: string, context?: Record<string, unknown>): never {
    dbLogger.error(`新聞服務 ${operation} 操作失敗`, error as Error, {
      module: this.moduleName,
      action: operation,
      metadata: context,
    })

    if (error.code) {
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.moduleName,
        action: operation,
        ...context,
      })
    }

    throw error instanceof Error ? error : new Error(`${operation} 操作失敗`)
  }

  /**
   * 轉換資料庫記錄為實體
   */
  private transformFromDB(dbNews: SupabaseNewsRecord): NewsItem {
    return {
      id: dbNews.id,
      title: dbNews.title,
      summary: dbNews.summary,
      content: dbNews.content,
      author: dbNews.author || '豪德農場',
      publishedAt: dbNews.publish_date,
      category: dbNews.category,
      tags: dbNews.tags || [],
      image: '', // 保留相容性
      imageUrl: dbNews.image_url || undefined,
      featured: dbNews.featured || false,
    }
  }

  /**
   * 轉換實體為資料庫記錄
   */
  private transformToDB(newsData: Omit<NewsItem, 'id' | 'publishedAt'>): Record<string, unknown> {
    return {
      title: newsData.title,
      summary: newsData.summary,
      content: newsData.content,
      category: newsData.category,
      tags: newsData.tags,
      image_url: newsData.imageUrl,
      author: newsData.author || '豪德農場',
      featured: newsData.featured || false,
      is_published: true,
      publish_date: new Date().toISOString(),
    }
  }

  // === 公開 API 方法 ===

  /**
   * 取得所有已發布的新聞
   */
  async getNews(): Promise<NewsItem[]> {
    try {
      const client = this.getSupabaseClient()
      const { data, error } = await client
        .from('news')
        .select('*')
        .eq('is_published', true)
        .order('publish_date', { ascending: false })

      if (error) {
        this.handleError(error, 'getNews')
      }

      const result = (data || []).map((record: Record<string, unknown>) =>
        this.transformFromDB(record)
      )

      dbLogger.info('取得新聞列表成功', {
        module: this.moduleName,
        action: 'getNews',
        metadata: { count: result.length },
      })

      return result
    } catch (error) {
      // 對於關鍵的公開 API，我們記錄錯誤但不拋出，而是返回空陣列
      dbLogger.error(
        '取得新聞列表失敗',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          module: this.moduleName,
          action: 'getNews',
        }
      )
      return []
    }
  }

  /**
   * 根據 ID 取得新聞
   */
  async getNewsById(id: string): Promise<NewsItem | null> {
    try {
      const client = this.getSupabaseClient()
      const { data, error } = await client
        .from('news')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // 找不到記錄
        }
        this.handleError(error, 'getNewsById', { id })
      }

      const result = data ? this.transformFromDB(data) : null

      dbLogger.debug('取得新聞詳情', {
        module: this.moduleName,
        action: 'getNewsById',
        metadata: { id, found: !!result },
      })

      return result
    } catch (error) {
      dbLogger.error(
        '取得新聞詳情失敗',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          module: this.moduleName,
          action: 'getNewsById',
          metadata: { id },
        }
      )
      return null
    }
  }

  /**
   * 新增新聞
   */
  async addNews(newsData: Omit<NewsItem, 'id' | 'publishedAt'>): Promise<NewsItem> {
    try {
      // 驗證資料
      this.validateNewsData(newsData)

      const client = this.getAdminClient()
      if (!client) {
        throw new Error('管理員客戶端未初始化')
      }

      const insertData = this.transformToDB(newsData)

      const { data, error } = await client.from('news').insert([insertData]).select().single()

      if (error) {
        this.handleError(error, 'addNews', { newsData })
      }

      const result = this.transformFromDB(data)

      dbLogger.info('新聞建立成功', {
        module: this.moduleName,
        action: 'addNews',
        metadata: {
          id: result.id,
          title: result.title,
          category: result.category,
          author: result.author,
        },
      })

      return result
    } catch (error) {
      this.handleError(error, 'addNews', { newsData })
    }
  }

  /**
   * 更新新聞
   */
  async updateNews(
    id: string,
    newsData: Partial<Omit<NewsItem, 'id' | 'publishedAt'>>
  ): Promise<NewsItem> {
    try {
      const client = this.getAdminClient()
      if (!client) {
        throw new Error('管理員客戶端未初始化')
      }

      // 準備更新資料
      const updateData: Record<string, unknown> = {}
      if (newsData.title !== undefined) updateData.title = newsData.title
      if (newsData.summary !== undefined) updateData.summary = newsData.summary
      if (newsData.content !== undefined) updateData.content = newsData.content
      if (newsData.category !== undefined) updateData.category = newsData.category
      if (newsData.tags !== undefined) updateData.tags = newsData.tags
      if (newsData.imageUrl !== undefined) updateData.image_url = newsData.imageUrl
      if (newsData.author !== undefined) updateData.author = newsData.author
      if (newsData.featured !== undefined) updateData.featured = newsData.featured

      const { data, error } = await client
        .from('news')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'updateNews', { id, newsData })
      }

      if (!data) {
        throw new NotFoundError('新聞不存在')
      }

      const result = this.transformFromDB(data)

      dbLogger.info('新聞更新成功', {
        module: this.moduleName,
        action: 'updateNews',
        metadata: {
          id,
          changes: Object.keys(updateData),
          title: result.title,
        },
      })

      return result
    } catch (error) {
      this.handleError(error, 'updateNews', { id, newsData })
    }
  }

  /**
   * 刪除新聞
   */
  async deleteNews(id: string): Promise<void> {
    try {
      // 先清理 Supabase Storage 中的新聞圖片
      try {
        const { deleteAllNewsImages } = await import('@/lib/news-storage')
        await deleteAllNewsImages(id)
        dbLogger.info(`新聞 ${id} 的圖片已清理`, {
          module: this.moduleName,
          action: 'deleteNewsImages',
          metadata: { newsId: id },
        })
      } catch (storageError) {
        // 圖片刪除失敗不應該阻止新聞刪除，但要記錄錯誤
        dbLogger.error(
          `新聞 ${id} 圖片清理失敗`,
          storageError instanceof Error ? storageError : new Error('Unknown storage error'),
          {
            module: this.moduleName,
            action: 'deleteNewsImages',
            metadata: { newsId: id },
          }
        )
      }

      const client = this.getAdminClient()
      if (!client) {
        throw new Error('管理員客戶端未初始化')
      }

      // 刪除資料庫記錄
      const { error } = await client.from('news').delete().eq('id', id)

      if (error) {
        this.handleError(error, 'deleteNews', { id })
      }

      dbLogger.info('新聞刪除成功', {
        module: this.moduleName,
        action: 'deleteNews',
        metadata: { id },
      })
    } catch (error) {
      this.handleError(error, 'deleteNews', { id })
    }
  }

  /**
   * 搜尋新聞
   */
  async searchNews(query: string): Promise<NewsItem[]> {
    try {
      if (!query.trim()) return []

      const client = this.getSupabaseClient()
      const searchTerm = `%${query.toLowerCase()}%`

      const { data, error } = await client
        .from('news')
        .select('*')
        .eq('is_published', true)
        .or(`title.ilike.${searchTerm},summary.ilike.${searchTerm},content.ilike.${searchTerm}`)
        .order('publish_date', { ascending: false })

      if (error) {
        this.handleError(error, 'searchNews', { query })
      }

      const newsItems = (data || []).map((record: Record<string, unknown>) =>
        this.transformFromDB(record)
      )

      // 按相關性排序
      const sortedResults = newsItems.sort((a: NewsItem, b: NewsItem) => {
        const queryLower = query.toLowerCase()
        const getRelevanceScore = (item: NewsItem) => {
          const title = item.title.toLowerCase()
          const summary = item.summary.toLowerCase()
          const content = item.content.toLowerCase()

          if (title.includes(queryLower)) return 3
          if (summary.includes(queryLower)) return 2
          if (content.includes(queryLower)) return 1
          return 0
        }

        return getRelevanceScore(b) - getRelevanceScore(a)
      })

      dbLogger.info('新聞搜尋完成', {
        module: this.moduleName,
        action: 'searchNews',
        metadata: {
          query,
          totalResults: sortedResults.length,
        },
      })

      return sortedResults
    } catch (error) {
      dbLogger.error('新聞搜尋失敗', error instanceof Error ? error : new Error('Unknown error'), {
        module: this.moduleName,
        action: 'searchNews',
        metadata: { query },
      })
      return []
    }
  }

  // === 私有輔助方法 ===

  /**
   * 驗證新聞資料
   */
  private validateNewsData(newsData: Omit<NewsItem, 'id' | 'publishedAt'>): void {
    if (!newsData.title?.trim()) {
      throw new ValidationError('新聞標題不能為空')
    }

    if (!newsData.summary?.trim()) {
      throw new ValidationError('新聞摘要不能為空')
    }

    if (!newsData.content?.trim()) {
      throw new ValidationError('新聞內容不能為空')
    }

    if (!newsData.category?.trim()) {
      throw new ValidationError('新聞分類不能為空')
    }

    // 驗證標題長度
    if (newsData.title.length > 200) {
      throw new ValidationError('新聞標題不能超過 200 字元')
    }

    // 驗證摘要長度
    if (newsData.summary.length > 500) {
      throw new ValidationError('新聞摘要不能超過 500 字元')
    }

    // 驗證內容長度
    if (newsData.content.length > 50000) {
      throw new ValidationError('新聞內容不能超過 50,000 字元')
    }

    // 驗證標籤
    if (newsData.tags && newsData.tags.length > 10) {
      throw new ValidationError('新聞標籤不能超過 10 個')
    }
  }

  /**
   * 取得服務健康狀態
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: string
    details?: Record<string, unknown>
  }> {
    try {
      // 簡單的連線測試
      const client = this.getSupabaseClient()
      const { error } = await client.from('news').select('id').limit(1)

      const isHealthy = !error || error.code === 'PGRST116' // 表格可能為空

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        details: {
          moduleName: this.moduleName,
          tableName: 'news',
          error: error?.message,
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: {
          moduleName: this.moduleName,
          error: (error as Error).message,
        },
      }
    }
  }
}

// 建立並匯出服務實例
export const newsServiceV2Simple = new NewsServiceV2Simple()
