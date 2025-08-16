import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/productService'
import { newsService } from '@/services/newsService'
import { SearchResult, SearchResponse } from '@/types/search'
import { Product } from '@/types/product'
import { NewsItem } from '@/types/news'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  if (!query || query.trim().length === 0) {
    return NextResponse.json({
      results: [],
      total: 0,
      query: '',
      processingTime: Date.now() - startTime
    } as SearchResponse)
  }

  try {
    // 並行搜尋所有數據源
    const [products, news] = await Promise.all([
      productService.searchProducts(query),
      newsService.searchNews(query)
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
      relevanceScore: calculateProductRelevance(product, query)
    }))

    const newsResults: SearchResult[] = news.map(item => ({
      id: item.id,
      title: item.title,
      description: item.summary,
      type: 'news' as const,
      url: `/news/${item.id}`,
      category: item.category,
      image: item.image || item.imageUrl,
      relevanceScore: calculateNewsRelevance(item, query)
    }))

    // 合併結果並按相關性排序
    const allResults = [...productResults, ...newsResults]
      .sort((a, b) => b.relevanceScore - a.relevanceScore)

    // 應用分頁
    const paginatedResults = allResults.slice(offset, offset + limit)

    const response: SearchResponse = {
      results: paginatedResults,
      total: allResults.length,
      query,
      processingTime: Date.now() - startTime
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
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