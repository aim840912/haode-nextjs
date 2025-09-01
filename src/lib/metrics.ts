/**
 * 業務指標收集系統
 *
 * 功能特色：
 * - 整合現有 logger 系統進行結構化記錄
 * - 支援多種業務指標類型（計數器、計時器、儀表板）
 * - 提供 API 端點用於指標查詢
 * - 支援時間區間統計
 */

import { logger } from '@/lib/logger'

export interface MetricEvent {
  name: string
  value: number
  timestamp: number
  labels?: Record<string, string>
  metadata?: Record<string, unknown>
}

export interface BusinessMetrics {
  // 使用者行為指標
  userActions: {
    pageViews: number
    productViews: number
    inquirySubmissions: number
    searchQueries: number
  }

  // 業務運營指標
  business: {
    newProducts: number
    totalInquiries: number
    farmTourBookings: number
    newsArticles: number
  }

  // 系統效能指標
  performance: {
    apiResponseTime: number[]
    errorRate: number
    activeUsers: number
  }

  // 內容互動指標
  content: {
    popularProducts: Array<{ id: string; views: number }>
    searchTerms: Array<{ term: string; count: number }>
    inquiryCategories: Array<{ category: string; count: number }>
  }
}

export class MetricsCollector {
  private events: MetricEvent[] = []
  private readonly maxEvents = 10000 // 記憶體中保留的最大事件數量

  constructor() {
    // 定期清理舊事件
    setInterval(
      () => {
        this.cleanup()
      },
      5 * 60 * 1000
    ) // 每5分鐘清理一次
  }

  /**
   * 記錄指標事件
   */
  record(
    name: string,
    value: number,
    labels?: Record<string, string>,
    metadata?: Record<string, unknown>
  ): void {
    const event: MetricEvent = {
      name,
      value,
      timestamp: Date.now(),
      labels,
      metadata,
    }

    this.events.push(event)

    // 記錄到 logger 以供長期存儲和分析
    logger.info(`指標記錄: ${name}`, {
      module: 'Metrics',
      action: 'record',
      metadata: {
        metricName: name,
        value,
        labels,
        ...metadata,
      },
    })

    // 限制記憶體使用
    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }
  }

  /**
   * 記錄計數器指標
   */
  incrementCounter(
    name: string,
    labels?: Record<string, string>,
    metadata?: Record<string, unknown>
  ): void {
    this.record(name, 1, labels, metadata)
  }

  /**
   * 記錄計時器指標
   */
  recordTiming(
    name: string,
    durationMs: number,
    labels?: Record<string, string>,
    metadata?: Record<string, unknown>
  ): void {
    this.record(`${name}_duration`, durationMs, labels, metadata)
  }

  /**
   * 記錄儀表板指標
   */
  recordGauge(
    name: string,
    value: number,
    labels?: Record<string, string>,
    metadata?: Record<string, unknown>
  ): void {
    this.record(`${name}_gauge`, value, labels, metadata)
  }

  /**
   * 獲取指標摘要
   */
  getMetricsSummary(timeRangeMs: number = 24 * 60 * 60 * 1000): BusinessMetrics {
    const now = Date.now()
    const cutoff = now - timeRangeMs
    const recentEvents = this.events.filter(e => e.timestamp >= cutoff)

    // 計算使用者行為指標
    const userActions = {
      pageViews: this.countEvents(recentEvents, 'page_view'),
      productViews: this.countEvents(recentEvents, 'product_view'),
      inquirySubmissions: this.countEvents(recentEvents, 'inquiry_submit'),
      searchQueries: this.countEvents(recentEvents, 'search_query'),
    }

    // 計算業務運營指標
    const business = {
      newProducts: this.countEvents(recentEvents, 'product_created'),
      totalInquiries: this.countEvents(recentEvents, 'inquiry_created'),
      farmTourBookings: this.countEvents(recentEvents, 'farm_tour_booking'),
      newsArticles: this.countEvents(recentEvents, 'news_created'),
    }

    // 計算系統效能指標
    const apiTimings = recentEvents
      .filter(e => e.name.endsWith('_duration') && e.labels?.type === 'api')
      .map(e => e.value)

    const performance = {
      apiResponseTime: apiTimings,
      errorRate: this.calculateErrorRate(recentEvents),
      activeUsers: this.countUniqueUsers(recentEvents),
    }

    // 內容互動指標
    const content = {
      popularProducts: this.getPopularProducts(recentEvents),
      searchTerms: this.getTopSearchTerms(recentEvents),
      inquiryCategories: this.getInquiryCategories(recentEvents),
    }

    return {
      userActions,
      business,
      performance,
      content,
    }
  }

  /**
   * 獲取原始事件數據
   */
  getRawEvents(timeRangeMs?: number): MetricEvent[] {
    if (!timeRangeMs) return [...this.events]

    const cutoff = Date.now() - timeRangeMs
    return this.events.filter(e => e.timestamp >= cutoff)
  }

  private countEvents(events: MetricEvent[], name: string): number {
    return events.filter(e => e.name === name).length
  }

  private calculateErrorRate(events: MetricEvent[]): number {
    const totalRequests = events.filter(e => e.name === 'api_request').length
    const errorRequests = events.filter(e => e.name === 'api_error').length

    if (totalRequests === 0) return 0
    return (errorRequests / totalRequests) * 100
  }

  private countUniqueUsers(events: MetricEvent[]): number {
    const userIds = new Set(events.filter(e => e.labels?.userId).map(e => e.labels!.userId))
    return userIds.size
  }

  private getPopularProducts(events: MetricEvent[]): Array<{ id: string; views: number }> {
    const productViews = new Map<string, number>()

    events
      .filter(e => e.name === 'product_view' && e.labels?.productId)
      .forEach(e => {
        const productId = e.labels!.productId
        productViews.set(productId, (productViews.get(productId) || 0) + 1)
      })

    return Array.from(productViews.entries())
      .map(([id, views]) => ({ id, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
  }

  private getTopSearchTerms(events: MetricEvent[]): Array<{ term: string; count: number }> {
    const searchTerms = new Map<string, number>()

    events
      .filter(e => e.name === 'search_query' && e.labels?.query)
      .forEach(e => {
        const term = e.labels!.query.toLowerCase()
        searchTerms.set(term, (searchTerms.get(term) || 0) + 1)
      })

    return Array.from(searchTerms.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private getInquiryCategories(events: MetricEvent[]): Array<{ category: string; count: number }> {
    const categories = new Map<string, number>()

    events
      .filter(e => e.name === 'inquiry_submit' && e.labels?.category)
      .forEach(e => {
        const category = e.labels!.category
        categories.set(category, (categories.get(category) || 0) + 1)
      })

    return Array.from(categories.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
  }

  private cleanup(): void {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000 // 保留7天的數據
    const beforeCount = this.events.length

    this.events = this.events.filter(e => e.timestamp >= cutoff)

    const removedCount = beforeCount - this.events.length
    if (removedCount > 0) {
      logger.debug(`清理過期指標事件: ${removedCount} 個`, {
        module: 'Metrics',
        action: 'cleanup',
      })
    }
  }
}

// 單例實例
export const metrics = new MetricsCollector()

// 便利的記錄函數
export const recordPageView = (page: string, userId?: string) => {
  const labels: Record<string, string> = { page }
  if (userId) labels.userId = userId
  metrics.incrementCounter('page_view', labels)
}

export const recordProductView = (productId: string, userId?: string) => {
  const labels: Record<string, string> = { productId }
  if (userId) labels.userId = userId
  metrics.incrementCounter('product_view', labels)
}

export const recordInquirySubmit = (category: string, userId?: string) => {
  const labels: Record<string, string> = { category }
  if (userId) labels.userId = userId
  metrics.incrementCounter('inquiry_submit', labels)
}

export const recordSearchQuery = (query: string, userId?: string) => {
  const labels: Record<string, string> = { query }
  if (userId) labels.userId = userId
  metrics.incrementCounter('search_query', labels)
}

export const recordApiRequest = (
  method: string,
  path: string,
  durationMs: number,
  statusCode: number
) => {
  metrics.recordTiming('api_request', durationMs, {
    method,
    path,
    status: statusCode.toString(),
    type: 'api',
  })

  if (statusCode >= 400) {
    metrics.incrementCounter('api_error', { method, path, status: statusCode.toString() })
  }
}

export const recordBusinessAction = (action: string, metadata?: Record<string, unknown>) => {
  const metricName = action.toLowerCase().replace(/\s+/g, '_')
  metrics.incrementCounter(metricName, undefined, metadata)
}
