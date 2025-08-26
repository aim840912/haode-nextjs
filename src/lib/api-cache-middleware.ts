import { NextRequest, NextResponse } from 'next/server'
import { CacheManager, CacheOptions } from './cache-server'

interface CacheMiddlewareOptions extends CacheOptions {
  cacheKeyGenerator?: (req: NextRequest) => string
  skipCache?: (req: NextRequest) => boolean
  revalidateOn?: ('POST' | 'PUT' | 'DELETE')[]
}

/**
 * API 路由快取中間件
 * 為 API 回應提供自動快取功能
 */
export function withApiCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: CacheMiddlewareOptions = {}
) {
  const {
    ttl = 300, // 預設 5 分鐘
    cacheKeyGenerator = (req) => `api:${req.url}:${req.method}`,
    skipCache = (req) => req.method !== 'GET',
    revalidateOn = ['POST', 'PUT', 'DELETE']
  } = options

  return async (req: NextRequest): Promise<NextResponse> => {
    const cacheKey = cacheKeyGenerator(req)
    const method = req.method

    // 對於會修改資料的請求，清除相關快取
    if (revalidateOn.includes(method as 'POST' | 'PUT' | 'DELETE')) {
      // 根據 URL 判斷要清除哪個快取模式
      const url = new URL(req.url)
      const pathname = url.pathname
      
      if (pathname.includes('/api/products')) {
        await CacheManager.deletePattern(`products:*`)
      } else if (pathname.includes('/api/news')) {
        await CacheManager.deletePattern(`news:*`)
      } else if (pathname.includes('/api/farm-tour')) {
        await CacheManager.deletePattern(`farm-tour:*`)
      } else {
        // Fallback 到原本的邏輯
        const baseUrl = req.url.split('?')[0]
        await CacheManager.deletePattern(`api:${baseUrl}*`)
      }
    }

    // 檢查是否跳過快取
    if (skipCache(req)) {
      return await handler(req)
    }

    // 嘗試從快取取得資料
    const cached = await CacheManager.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`,
          'X-Cache': 'HIT'
        }
      })
    }

    // 執行原始處理器
    const response = await handler(req)
    
    // 只快取成功的 JSON 回應
    if (response.status === 200 && response.headers.get('content-type')?.includes('application/json')) {
      try {
        const responseData = await response.clone().json()
        await CacheManager.set(cacheKey, responseData, { ttl })
        
        // 添加快取標頭
        response.headers.set('Cache-Control', `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`)
        response.headers.set('X-Cache', 'MISS')
      } catch (error) {
        console.warn('Failed to cache API response:', error)
      }
    }

    return response
  }
}

/**
 * 產品 API 專用快取設定
 */
export const withProductsCache = (handler: (req: NextRequest) => Promise<NextResponse>) =>
  withApiCache(handler, {
    ttl: 600, // 10 分鐘
    cacheKeyGenerator: (req) => {
      const url = new URL(req.url)
      const searchParams = url.searchParams.toString()
      return `products:${req.method}:${searchParams || 'all'}`
    }
  })

/**
 * 評價 API 專用快取設定
 */
export const withReviewsCache = (handler: (req: NextRequest) => Promise<NextResponse>) =>
  withApiCache(handler, {
    ttl: 300, // 5 分鐘
    cacheKeyGenerator: (req) => {
      const url = new URL(req.url)
      const searchParams = url.searchParams.toString()
      return `reviews:${req.method}:${searchParams || 'all'}`
    }
  })

/**
 * 新聞 API 專用快取設定
 */
export const withNewsCache = (handler: (req: NextRequest) => Promise<NextResponse>) =>
  withApiCache(handler, {
    ttl: 1800, // 30 分鐘
    cacheKeyGenerator: (req) => {
      const url = new URL(req.url)
      const searchParams = url.searchParams.toString()
      return `news:${req.method}:${searchParams || 'all'}`
    }
  })

/**
 * 農場活動 API 專用快取設定
 */
export const withFarmTourCache = (handler: (req: NextRequest) => Promise<NextResponse>) =>
  withApiCache(handler, {
    ttl: 900, // 15 分鐘
    cacheKeyGenerator: (req) => {
      const url = new URL(req.url)
      const searchParams = url.searchParams.toString()
      return `farm-tour:${req.method}:${searchParams || 'all'}`
    }
  })