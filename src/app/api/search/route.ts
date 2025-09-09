import { NextRequest } from 'next/server'
import { productService } from '@/services/productService'
import { newsService } from '@/services/newsService'
import { SearchResult, SearchResponse } from '@/types/search'
import { Product } from '@/types/product'
import { NewsItem } from '@/types/news'
import { withErrorHandler } from '@/lib/error-handler'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { SearchSchemas } from '@/lib/validation-schemas'
import { apiLogger } from '@/lib/logger'

async function handleGET(request: NextRequest) {
  const startTime = Date.now()

  // 解析並驗證查詢參數
  const { searchParams } = new URL(request.url)
  const params = Object.fromEntries(searchParams.entries())
  const result = SearchSchemas.query.safeParse(params)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`查詢參數驗證失敗: ${errors}`)
  }

  const { q: query, limit, offset } = result.data

  if (!query || query.trim().length === 0) {
    return success(
      {
        results: [],
        total: 0,
        query: '',
        processingTime: Date.now() - startTime,
      } as SearchResponse,
      '搜尋完成'
    )
  }

  // 並行搜尋所有數據源
  const [products, news] = await Promise.all([
    productService.searchProducts(query),
    newsService.searchNews(query),
  ])

  // 轉換為統一的搜尋結果格式
  const productResults: SearchResult[] = products.map(product => ({
    id: product.id,
    title: product.name,
    description: product.description,
    type: 'product' as const,
    url: `/products/${product.id}`,
    category: product.category,
    image: product.images[0],
    price: product.price,
    relevanceScore: calculateProductRelevance(product, query),
  }))

  const newsResults: SearchResult[] = news.map(item => ({
    id: item.id,
    title: item.title,
    description: item.summary,
    type: 'news' as const,
    url: `/news/${item.id}`,
    category: item.category,
    image: item.imageUrl,
    relevanceScore: calculateNewsRelevance(item, query),
  }))

  // 合併結果並按相關性排序
  const allResults = [...productResults, ...newsResults].sort(
    (a, b) => b.relevanceScore - a.relevanceScore
  )

  // 應用分頁
  const paginatedResults = allResults.slice(offset, offset + limit)

  const processingTime = Date.now() - startTime
  const response: SearchResponse = {
    results: paginatedResults,
    total: allResults.length,
    query,
    processingTime,
  }

  apiLogger.info('搜尋查詢完成', {
    metadata: {
      query,
      totalResults: allResults.length,
      returnedResults: paginatedResults.length,
      processingTimeMs: processingTime,
    },
  })

  // 記錄搜尋查詢指標
  const { recordSearchQuery } = await import('@/lib/metrics')
  recordSearchQuery(query)

  return success(response, '搜尋完成')
}

// 計算產品相關性分數
function calculateProductRelevance(product: Product, query: string): number {
  const searchTerm = query.toLowerCase()
  const name = product.name.toLowerCase()
  const description = product.description.toLowerCase()
  const category = product.category.toLowerCase()

  let score = 0

  // 名稱完全匹配
  if (name === searchTerm) score += 10
  // 名稱包含搜尋詞
  else if (name.includes(searchTerm)) score += 7

  // 類別匹配
  if (category === searchTerm) score += 5
  else if (category.includes(searchTerm)) score += 3

  // 描述匹配
  if (description.includes(searchTerm)) score += 2

  // 如果是特價商品，增加分數
  if (product.isOnSale) score += 1

  return score
}

// 計算新聞相關性分數
function calculateNewsRelevance(newsItem: NewsItem, query: string): number {
  const searchTerm = query.toLowerCase()
  const title = newsItem.title.toLowerCase()
  const summary = newsItem.summary.toLowerCase()
  const content = newsItem.content.toLowerCase()
  const tags = newsItem.tags.join(' ').toLowerCase()

  let score = 0

  // 標題完全匹配
  if (title === searchTerm) score += 10
  // 標題包含搜尋詞
  else if (title.includes(searchTerm)) score += 8

  // 標籤匹配
  if (tags.includes(searchTerm)) score += 6

  // 摘要匹配
  if (summary.includes(searchTerm)) score += 4

  // 內容匹配
  if (content.includes(searchTerm)) score += 2

  // 如果是特色新聞，增加分數
  if (newsItem.featured) score += 1

  return score
}

// 導出處理器 - 使用統一的錯誤處理系統
export const GET = withErrorHandler(handleGET, {
  module: 'SearchAPI',
  enableAuditLog: false,
})
