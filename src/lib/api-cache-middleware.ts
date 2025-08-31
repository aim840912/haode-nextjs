import { NextRequest, NextResponse } from 'next/server'
import { UnifiedCacheManager, CacheOptions } from './unified-cache-manager'
import { CacheTags } from './cache-keys'
import { cacheLogger } from '@/lib/logger'

interface CacheMiddlewareOptions extends CacheOptions {
  cacheKeyGenerator?: (req: NextRequest) => string
  skipCache?: (req: NextRequest) => boolean
  revalidateOn?: ('POST' | 'PUT' | 'DELETE')[]
}

/**
 * 根據 API 路徑自動生成標籤
 */
function generateTagsFromPath(pathname: string): string[] {
  const tags: string[] = ['api']

  if (pathname.includes('/api/products')) {
    tags.push('products')
  } else if (pathname.includes('/api/news')) {
    tags.push('news')
  } else if (pathname.includes('/api/culture')) {
    tags.push('culture')
  } else if (pathname.includes('/api/farm-tour')) {
    tags.push('farmtour')
  } else if (pathname.includes('/api/locations')) {
    tags.push('locations')
  } else if (pathname.includes('/api/inquiries')) {
    tags.push('inquiries')
  }

  return tags
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
    cacheKeyGenerator = req => `api:${req.url}:${req.method}`,
    skipCache = req => req.method !== 'GET',
    revalidateOn = ['POST', 'PUT', 'DELETE'],
  } = options

  return async (req: NextRequest): Promise<NextResponse> => {
    const cacheKey = cacheKeyGenerator(req)
    const method = req.method

    // 對於會修改資料的請求，使用智慧型標籤失效
    if (revalidateOn.includes(method as 'POST' | 'PUT' | 'DELETE')) {
      const url = new URL(req.url)
      const pathname = url.pathname

      // 使用標籤系統進行智慧失效
      if (pathname.includes('/api/products')) {
        await UnifiedCacheManager.invalidate([...CacheTags.ALL_PRODUCTS])
      } else if (pathname.includes('/api/news')) {
        await UnifiedCacheManager.invalidate([...CacheTags.ALL_NEWS])
      } else if (pathname.includes('/api/culture')) {
        await UnifiedCacheManager.invalidate([...CacheTags.ALL_CULTURE])
      } else if (pathname.includes('/api/farm-tour')) {
        await UnifiedCacheManager.invalidate([...CacheTags.ALL_FARMTOUR])
      } else if (pathname.includes('/api/locations')) {
        await UnifiedCacheManager.invalidate([...CacheTags.ALL_LOCATIONS])
      } else if (pathname.includes('/api/inquiries')) {
        await UnifiedCacheManager.invalidate([...CacheTags.ALL_INQUIRIES])
      } else {
        // Fallback 到通用 API 標籤
        await UnifiedCacheManager.invalidate([...CacheTags.ALL_API])
      }

      cacheLogger.info('API 快取已失效', {
        metadata: {
          method,
          pathname,
          reason: 'data_modification',
        },
      })
    }

    // 檢查是否跳過快取
    if (skipCache(req)) {
      return await handler(req)
    }

    // 嘗試從快取取得資料
    const cached = await UnifiedCacheManager.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`,
          'X-Cache': 'HIT',
          'X-Cache-Source': 'unified-cache',
        },
      })
    }

    // 執行原始處理器
    const response = await handler(req)

    // 只快取成功的 JSON 回應
    if (
      response.status === 200 &&
      response.headers.get('content-type')?.includes('application/json')
    ) {
      try {
        const responseData = await response.clone().json()

        // 根據路徑自動加入標籤
        const tags = options.tags || generateTagsFromPath(new URL(req.url).pathname)

        await UnifiedCacheManager.set(cacheKey, responseData, { ttl, tags })

        // 添加快取標頭
        response.headers.set(
          'Cache-Control',
          `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`
        )
        response.headers.set('X-Cache', 'MISS')
        response.headers.set('X-Cache-Source', 'unified-cache')
        response.headers.set('X-Cache-Tags', tags.join(','))
      } catch (error) {
        cacheLogger.warn('Failed to cache API response', {
          metadata: { error: (error as Error).message, cacheKey },
        })
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
    cacheKeyGenerator: req => {
      const url = new URL(req.url)
      const searchParams = url.searchParams.toString()
      return `products:${req.method}:${searchParams || 'all'}`
    },
  })

/**
 * 評價 API 專用快取設定
 */
export const withReviewsCache = (handler: (req: NextRequest) => Promise<NextResponse>) =>
  withApiCache(handler, {
    ttl: 300, // 5 分鐘
    cacheKeyGenerator: req => {
      const url = new URL(req.url)
      const searchParams = url.searchParams.toString()
      return `reviews:${req.method}:${searchParams || 'all'}`
    },
  })

/**
 * 新聞 API 專用快取設定
 */
export const withNewsCache = (handler: (req: NextRequest) => Promise<NextResponse>) =>
  withApiCache(handler, {
    ttl: 1800, // 30 分鐘
    cacheKeyGenerator: req => {
      const url = new URL(req.url)
      const searchParams = url.searchParams.toString()
      return `news:${req.method}:${searchParams || 'all'}`
    },
  })

/**
 * 農場活動 API 專用快取設定
 */
export const withFarmTourCache = (handler: (req: NextRequest) => Promise<NextResponse>) =>
  withApiCache(handler, {
    ttl: 900, // 15 分鐘
    cacheKeyGenerator: req => {
      const url = new URL(req.url)
      const searchParams = url.searchParams.toString()
      return `farm-tour:${req.method}:${searchParams || 'all'}`
    },
  })
