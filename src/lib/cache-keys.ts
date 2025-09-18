/**
 * 快取鍵管理中心
 *
 * 集中管理所有模組的快取鍵，提供一致性和可維護性
 * 支援標籤系統以便進行智慧型快取失效
 */

export interface CacheKeyWithTags {
  key: string
  tags: string[]
}

/**
 * 產品相關快取鍵
 */
export const ProductCacheKeys = {
  // 產品列表
  list: (): CacheKeyWithTags => ({
    key: 'products:list',
    tags: ['products', 'product-list'],
  }),

  // 所有產品（管理員用）
  all: (): CacheKeyWithTags => ({
    key: 'products:all',
    tags: ['products', 'product-list', 'admin'],
  }),

  // 單個產品
  item: (id: string): CacheKeyWithTags => ({
    key: `products:item:${id}`,
    tags: ['products', 'product-item', `product-${id}`],
  }),

  // 產品搜尋結果
  search: (query: string): CacheKeyWithTags => {
    const sanitizedQuery = query
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
    return {
      key: `products:search:${sanitizedQuery}`,
      tags: ['products', 'product-search', `search-${sanitizedQuery}`],
    }
  },

  // 產品統計
  stats: (): CacheKeyWithTags => ({
    key: 'products:stats',
    tags: ['products', 'product-stats', 'admin'],
  }),

  // 產品類別
  categories: (): CacheKeyWithTags => ({
    key: 'products:categories',
    tags: ['products', 'product-categories'],
  }),
} as const

/**
 * 新聞相關快取鍵
 */
export const NewsCacheKeys = {
  // 新聞列表
  list: (): CacheKeyWithTags => ({
    key: 'news:list',
    tags: ['news', 'news-list'],
  }),

  // 所有新聞（管理員用）
  all: (): CacheKeyWithTags => ({
    key: 'news:all',
    tags: ['news', 'news-list', 'admin'],
  }),

  // 單篇新聞
  item: (id: string): CacheKeyWithTags => ({
    key: `news:item:${id}`,
    tags: ['news', 'news-item', `news-${id}`],
  }),

  // 最新新聞
  latest: (limit: number = 5): CacheKeyWithTags => ({
    key: `news:latest:${limit}`,
    tags: ['news', 'news-latest'],
  }),

  // 新聞統計
  stats: (): CacheKeyWithTags => ({
    key: 'news:stats',
    tags: ['news', 'news-stats', 'admin'],
  }),
} as const

/**
 * 精彩時刻相關快取鍵
 */
export const MomentsCacheKeys = {
  // 精彩時刻列表
  list: (): CacheKeyWithTags => ({
    key: 'moments:list',
    tags: ['moments', 'moments-list'],
  }),

  // 單個精彩時刻
  item: (id: string): CacheKeyWithTags => ({
    key: `moments:item:${id}`,
    tags: ['moments', 'moments-item', `moments-${id}`],
  }),

  // 推薦時刻
  featured: (): CacheKeyWithTags => ({
    key: 'moments:featured',
    tags: ['moments', 'moments-featured'],
  }),
} as const

/**
 * 農場參觀相關快取鍵
 */
export const FarmTourCacheKeys = {
  // 參觀活動列表
  list: (): CacheKeyWithTags => ({
    key: 'farmtour:list',
    tags: ['farmtour', 'farmtour-list'],
  }),

  // 單個參觀活動
  item: (id: string): CacheKeyWithTags => ({
    key: `farmtour:item:${id}`,
    tags: ['farmtour', 'farmtour-item', `farmtour-${id}`],
  }),

  // 可預約的活動
  available: (date?: string): CacheKeyWithTags => {
    const key = date ? `farmtour:available:${date}` : 'farmtour:available'
    return {
      key,
      tags: ['farmtour', 'farmtour-available'],
    }
  },
} as const

/**
 * 地點相關快取鍵
 */
export const LocationCacheKeys = {
  // 地點列表
  list: (): CacheKeyWithTags => ({
    key: 'locations:list',
    tags: ['locations', 'location-list'],
  }),

  // 單個地點
  item: (id: string): CacheKeyWithTags => ({
    key: `locations:item:${id}`,
    tags: ['locations', 'location-item', `location-${id}`],
  }),
} as const

/**
 * 詢問單相關快取鍵
 */
export const InquiryCacheKeys = {
  // 詢問單統計（管理員用）
  stats: (): CacheKeyWithTags => ({
    key: 'inquiries:stats',
    tags: ['inquiries', 'inquiry-stats', 'admin'],
  }),

  // 最近詢問單（管理員用）
  recent: (limit: number = 10): CacheKeyWithTags => ({
    key: `inquiries:recent:${limit}`,
    tags: ['inquiries', 'inquiry-recent', 'admin'],
  }),

  // 詢問單列表（管理員用）
  list: (page: number = 1): CacheKeyWithTags => ({
    key: `inquiries:list:page:${page}`,
    tags: ['inquiries', 'inquiry-list', 'admin'],
  }),
} as const

/**
 * API 相關快取鍵
 */
export const ApiCacheKeys = {
  // API 回應快取
  response: (endpoint: string, params?: string): CacheKeyWithTags => {
    const key = params ? `api:${endpoint}:${params}` : `api:${endpoint}`
    return {
      key,
      tags: ['api', `api-${endpoint.replace(/\//g, '-')}`],
    }
  },

  // CSRF Token
  csrfToken: (): CacheKeyWithTags => ({
    key: 'api:csrf-token',
    tags: ['api', 'csrf'],
  }),
} as const

/**
 * 使用者相關快取鍵
 */
export const UserCacheKeys = {
  // 使用者設定檔
  profile: (userId: string): CacheKeyWithTags => ({
    key: `user:profile:${userId}`,
    tags: ['user', 'user-profile', `user-${userId}`],
  }),

  // 使用者興趣
  interests: (userId: string): CacheKeyWithTags => ({
    key: `user:interests:${userId}`,
    tags: ['user', 'user-interests', `user-${userId}`],
  }),
} as const

/**
 * 統一的快取鍵管理器
 */
export const CacheKeys = {
  products: ProductCacheKeys,
  news: NewsCacheKeys,
  moments: MomentsCacheKeys,
  farmTour: FarmTourCacheKeys,
  locations: LocationCacheKeys,
  inquiries: InquiryCacheKeys,
  api: ApiCacheKeys,
  user: UserCacheKeys,
} as const

/**
 * 常用的標籤集合，用於批量失效
 */
export const CacheTags = {
  // 按模組分組
  ALL_PRODUCTS: ['products'],
  ALL_NEWS: ['news'],
  ALL_MOMENTS: ['moments'],
  ALL_FARMTOUR: ['farmtour'],
  ALL_LOCATIONS: ['locations'],
  ALL_INQUIRIES: ['inquiries'],
  ALL_API: ['api'],
  ALL_USER: ['user'],

  // 按功能分組
  ALL_LISTS: ['product-list', 'news-list', 'moments-list', 'farmtour-list', 'location-list'],
  ALL_ADMIN: ['admin'],
  ALL_STATS: ['product-stats', 'news-stats', 'inquiry-stats'],

  // 按數據類型分組
  PUBLIC_DATA: ['products', 'news', 'moments', 'farmtour', 'locations'],
  ADMIN_DATA: ['admin'],
  USER_DATA: ['user'],
} as const

/**
 * 輔助函數：從快取鍵提取標籤
 */
export function extractTags(cacheKeyWithTags: CacheKeyWithTags): string[] {
  return cacheKeyWithTags.tags || []
}

/**
 * 輔助函數：檢查快取鍵是否包含特定標籤
 */
export function hasTag(cacheKeyWithTags: CacheKeyWithTags, tag: string): boolean {
  const tags = extractTags(cacheKeyWithTags)
  return tags.includes(tag)
}

/**
 * 輔助函數：取得快取鍵的 TTL 建議值（秒）
 */
export function getRecommendedTTL(cacheKey: string): number {
  if (cacheKey.includes('stats')) return 300 // 統計資料 5 分鐘
  if (cacheKey.includes('search')) return 120 // 搜尋結果 2 分鐘
  if (cacheKey.includes('list')) return 600 // 列表資料 10 分鐘
  if (cacheKey.includes('item')) return 1800 // 單項資料 30 分鐘
  if (cacheKey.includes('api')) return 300 // API 回應 5 分鐘
  return 600 // 預設 10 分鐘
}
