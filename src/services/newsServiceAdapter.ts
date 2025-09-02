/**
 * 新聞服務適配器
 * 提供向後相容性，將舊版 NewsService API 橋接到新版服務
 *
 * 此適配器確保現有代碼能夠無縫遷移到 v2 架構
 */

import { NewsServiceV2Simple, newsServiceV2Simple } from './v2/newsServiceSimple'
import { NewsItem, NewsService } from '@/types/news'
import { dbLogger } from '@/lib/logger'

/**
 * 新聞服務適配器類別
 * 實作舊版 NewsService 介面，內部使用 v2 服務
 */
export class NewsServiceAdapter implements NewsService {
  private readonly serviceV2: NewsServiceV2Simple

  constructor(serviceV2Instance?: NewsServiceV2Simple) {
    this.serviceV2 = serviceV2Instance || newsServiceV2Simple

    dbLogger.info('新聞服務適配器初始化', {
      module: 'NewsServiceAdapter',
      action: 'constructor',
    })
  }

  // === NewsService 介面實作 ===

  async getNews(): Promise<NewsItem[]> {
    return this.serviceV2.getNews()
  }

  async addNews(news: Omit<NewsItem, 'id' | 'publishedAt'>): Promise<NewsItem> {
    return this.serviceV2.addNews(news)
  }

  async updateNews(
    id: string,
    news: Partial<Omit<NewsItem, 'id' | 'publishedAt'>>
  ): Promise<NewsItem> {
    return this.serviceV2.updateNews(id, news)
  }

  async deleteNews(id: string): Promise<void> {
    return this.serviceV2.deleteNews(id)
  }

  async getNewsById(id: string): Promise<NewsItem | null> {
    return this.serviceV2.getNewsById(id)
  }

  async searchNews(query: string): Promise<NewsItem[]> {
    return this.serviceV2.searchNews(query)
  }

  // === 額外的工具方法 ===

  /**
   * 取得服務健康狀態
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    version: string
    details: Record<string, unknown>
  }> {
    try {
      const healthStatus = await this.serviceV2.getHealthStatus()

      return {
        status: healthStatus.status,
        version: 'v2-simple',
        details: {
          ...healthStatus.details,
          adapterActive: true,
          serviceType: 'NewsServiceV2Simple',
          timestamp: healthStatus.timestamp,
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        version: 'v2-simple',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      }
    }
  }
}

// 建立並匯出適配器實例
export const newsServiceAdapter = new NewsServiceAdapter()

// 為了保持完全向後相容，也匯出為原始名稱
export const supabaseNewsService = newsServiceAdapter

/**
 * 工廠函數：根據配置決定使用哪個服務實作
 */
export function createNewsService(useV2: boolean = true): NewsService {
  if (useV2) {
    return newsServiceAdapter
  } else {
    // 如果需要，可以載入舊版服務
    throw new Error('舊版服務已被棄用，請使用 v2 版本')
  }
}

/**
 * 遷移輔助函數：檢查新聞服務健康狀態
 */
export async function checkNewsServiceHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  details: Record<string, unknown>
}> {
  try {
    // 簡單的健康檢查 - 嘗試查詢服務是否可用
    await newsServiceV2Simple.getNews()

    return {
      status: 'healthy',
      version: 'v2-simple',
      details: {
        adapterActive: true,
        serviceType: 'NewsServiceV2Simple',
        timestamp: new Date().toISOString(),
      },
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      version: 'v2-simple',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    }
  }
}
