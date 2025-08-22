/**
 * 服務工廠
 * 
 * 根據資料策略自動選擇和創建適合的服務實例
 * 支援快取、fallback 和動態切換
 */

import { ProductService } from '@/types/product'
import { ScheduleService } from '@/types/schedule'
import { FarmTourActivity } from '@/types/farmTour'
import { NewsService } from '@/types/news'
import { CultureService } from '@/types/culture'
import { LocationService } from '@/types/location'
import { ReviewService } from '@/types/review'
import { shouldUseSupabase, shouldFallbackToJson, shouldUseCache, getStrategyInfo } from '@/config/data-strategy'

// 定義服務介面類型
interface FarmTourService {
  getAll(): Promise<FarmTourActivity[]>
  getById(id: string): Promise<FarmTourActivity | null>
  create(data: Omit<FarmTourActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<FarmTourActivity>
  update(id: string, data: Partial<Omit<FarmTourActivity, 'id' | 'createdAt'>>): Promise<FarmTourActivity | null>
  delete(id: string): Promise<boolean>
}

// 服務實例快取
let productServiceInstance: ProductService | null = null
let scheduleServiceInstance: ScheduleService | null = null
let farmTourServiceInstance: FarmTourService | null = null
let newsServiceInstance: NewsService | null = null
let cultureServiceInstance: CultureService | null = null
let locationServiceInstance: LocationService | null = null
let reviewServiceInstance: ReviewService | null = null

/**
 * 獲取產品服務實例
 * 根據當前資料策略自動選擇實作
 */
export async function getProductService(): Promise<ProductService> {
  // 如果已有實例且策略未改變，直接返回
  if (productServiceInstance) {
    return productServiceInstance
  }

  const useSupabase = shouldUseSupabase('products')
  const strategy = getStrategyInfo()

  console.log(`🏭 初始化產品服務: ${useSupabase ? 'Supabase' : 'JSON'} 模式`)

  try {
    if (useSupabase) {
      // 動態載入 Supabase 服務
      const { supabaseProductService } = await import('./supabaseProductService')
      
      // 優先使用 Supabase，發生錯誤時才 fallback
      try {
        // 簡單測試連線
        await supabaseProductService.getProducts()
        
        // 包裝快取層
        productServiceInstance = await createCachedProductService(supabaseProductService)
        console.log('✅ Supabase 服務（含快取）初始化成功')
      } catch (error) {
        console.warn('⚠️ Supabase 連線失敗，嘗試 fallback 到 JSON 模式:', error)
        
        if (shouldFallbackToJson()) {
          const jsonService = await createJsonService()
          productServiceInstance = await createCachedProductService(jsonService)
          console.log('🔄 已切換到 JSON fallback 模式（含快取）')
        } else {
          // 不允許 fallback 時，拋出錯誤
          throw error
        }
      }
    } else {
      const jsonService = await createJsonService()
      productServiceInstance = await createCachedProductService(jsonService)
    }
  } catch (error) {
    console.error('❌ 服務初始化失敗:', error)
    
    if (shouldFallbackToJson()) {
      console.log('🔄 嘗試 fallback 到 JSON 服務')
      const jsonService = await createJsonService()
      productServiceInstance = await createCachedProductService(jsonService)
    } else {
      throw error
    }
  }

  return productServiceInstance
}

/**
 * 創建 JSON 服務實例
 */
async function createJsonService(): Promise<ProductService> {
  const { JsonProductService } = await import('./productService')
  const service = new (JsonProductService as any)()
  console.log('✅ JSON 服務初始化成功')
  return service
}

/**
 * 創建快取包裝服務
 * 使用 Vercel KV 或內存快取提升效能
 */
export async function createCachedProductService(baseService: ProductService): Promise<ProductService> {
  // 檢查是否有快取配置或環境
  const hasKV = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)
  const shouldCache = shouldUseCache('products')
  
  if (!shouldCache) {
    console.log('📋 快取策略停用，使用基礎服務')
    return baseService
  }

  // 動態載入快取服務
  const { CachedProductService } = await import('./cachedProductService')
  
  if (hasKV) {
    console.log('🚀 創建 KV 快取包裝服務')
  } else {
    console.log('🚀 創建內存快取包裝服務')
  }
  
  return new CachedProductService(baseService)
}

/**
 * 通用服務工廠函數
 */
async function createService<T>(
  serviceType: keyof Omit<typeof serviceInstances, 'product'>,
  supabaseServiceImport: () => Promise<{ [key: string]: T }>,
  jsonServiceCreator: () => Promise<T>,
  testConnection?: (service: T) => Promise<any>
): Promise<T> {
  const useSupabase = shouldUseSupabase(serviceType as any)
  
  console.log(`🏭 初始化${serviceType}服務: ${useSupabase ? 'Supabase' : 'JSON'} 模式`)

  try {
    if (useSupabase) {
      const supabaseModule = await supabaseServiceImport()
      const supabaseService = Object.values(supabaseModule)[0] as T
      
      // 測試連線（如果提供）
      if (testConnection) {
        try {
          await testConnection(supabaseService)
          console.log(`✅ ${serviceType} Supabase 服務初始化成功`)
          return supabaseService
        } catch (error) {
          console.warn(`⚠️ ${serviceType} Supabase 連線失敗，嘗試 fallback 到 JSON 模式:`, error)
          
          if (shouldFallbackToJson()) {
            const jsonService = await jsonServiceCreator()
            console.log(`🔄 ${serviceType} 已切換到 JSON fallback 模式`)
            return jsonService
          } else {
            throw error
          }
        }
      }
      
      return supabaseService
    } else {
      return await jsonServiceCreator()
    }
  } catch (error) {
    console.error(`❌ ${serviceType} 服務初始化失敗:`, error)
    
    if (shouldFallbackToJson()) {
      console.log(`🔄 ${serviceType} 嘗試 fallback 到 JSON 服務`)
      return await jsonServiceCreator()
    } else {
      throw error
    }
  }
}

// 服務實例集合
const serviceInstances = {
  product: productServiceInstance,
  schedule: scheduleServiceInstance,
  farmTour: farmTourServiceInstance,
  news: newsServiceInstance,
  culture: cultureServiceInstance,
  locations: locationServiceInstance,
  reviews: reviewServiceInstance
}

/**
 * 獲取排程服務實例
 */
export async function getScheduleService(): Promise<ScheduleService> {
  if (scheduleServiceInstance) {
    return scheduleServiceInstance
  }

  scheduleServiceInstance = await createService(
    'schedule',
    async () => {
      const { supabaseScheduleService } = await import('./supabaseScheduleService')
      return { supabaseScheduleService }
    },
    async () => {
      const { JsonScheduleService } = await import('./scheduleService')
      return new (JsonScheduleService as any)()
    },
    (service) => (service as any).getSchedule()
  )

  return scheduleServiceInstance!
}

/**
 * 獲取農場體驗服務實例
 */
export async function getFarmTourService(): Promise<FarmTourService> {
  if (farmTourServiceInstance) {
    return farmTourServiceInstance
  }

  farmTourServiceInstance = await createService(
    'farmTour',
    async () => {
      const { supabaseFarmTourService } = await import('./supabaseFarmTourService')
      return { supabaseFarmTourService }
    },
    async () => {
      const farmTourService = await import('./farmTourService')
      return farmTourService.farmTourService
    },
    (service) => service.getAll()
  )

  return farmTourServiceInstance!
}

/**
 * 獲取新聞服務實例
 */
export async function getNewsService(): Promise<NewsService> {
  if (newsServiceInstance) {
    return newsServiceInstance
  }

  newsServiceInstance = await createService(
    'news',
    async () => {
      const { supabaseNewsService } = await import('./supabaseNewsService')
      return { supabaseNewsService }
    },
    async () => {
      const { JsonNewsService } = await import('./newsService')
      return new (JsonNewsService as any)()
    },
    (service) => service.getNews()
  )

  return newsServiceInstance!
}

/**
 * 獲取文化服務實例
 * 直接使用 Supabase 實作，不再支援 JSON fallback
 */
export async function getCultureService(): Promise<CultureService> {
  if (cultureServiceInstance) {
    return cultureServiceInstance
  }

  console.log('🏭 初始化文化服務: Supabase 模式')
  
  try {
    const { SupabaseCultureService } = await import('./supabaseCultureService')
    cultureServiceInstance = new SupabaseCultureService()
    
    // 測試連線
    await cultureServiceInstance.getCultureItems()
    console.log('✅ 文化 Supabase 服務初始化成功')
    
    return cultureServiceInstance
  } catch (error) {
    console.error('❌ 文化 Supabase 服務初始化失敗:', error)
    throw new Error('文化服務初始化失敗，請檢查 Supabase 連線設定')
  }
}

/**
 * 獲取地點服務實例
 */
export async function getLocationService(): Promise<LocationService> {
  if (locationServiceInstance) {
    return locationServiceInstance
  }

  locationServiceInstance = await createService(
    'locations',
    async () => {
      const { supabaseLocationService } = await import('./supabaseLocationService')
      return { supabaseLocationService }
    },
    async () => {
      const { JsonLocationService } = await import('./locationService')
      return new (JsonLocationService as any)()
    },
    (service) => service.getLocations()
  )

  return locationServiceInstance!
}

/**
 * 獲取評價服務實例
 */
export async function getReviewService(): Promise<ReviewService> {
  if (reviewServiceInstance) {
    return reviewServiceInstance
  }

  reviewServiceInstance = await createService(
    'reviews',
    async () => {
      const { supabaseReviewService } = await import('./supabaseReviewService')
      return { supabaseReviewService }
    },
    async () => {
      const reviewService = await import('./reviewService')
      return reviewService.reviewService
    },
    (service) => service.getReviews({ limit: 1 })
  )

  return reviewServiceInstance!
}

/**
 * 重設服務實例（用於測試或環境變更）
 */
export function resetServiceInstances() {
  productServiceInstance = null
  scheduleServiceInstance = null
  farmTourServiceInstance = null
  newsServiceInstance = null
  cultureServiceInstance = null
  locationServiceInstance = null
  reviewServiceInstance = null
  console.log('🔄 所有服務實例已重設')
}

/**
 * 獲取當前使用的服務類型（用於調試）
 */
export function getCurrentServiceType(): 'supabase' | 'json' | 'unknown' {
  if (!productServiceInstance) return 'unknown'
  
  // 檢查服務類型
  const serviceName = productServiceInstance.constructor.name
  if (serviceName.includes('Supabase')) return 'supabase'
  if (serviceName.includes('Json')) return 'json'
  
  return 'unknown'
}

/**
 * 服務健康檢查
 */
export async function healthCheck(): Promise<{
  service: string
  status: 'healthy' | 'error'
  responseTime: number
  error?: string
}> {
  const start = Date.now()
  const serviceType = getCurrentServiceType()
  
  try {
    const service = await getProductService()
    await service.getProducts()
    
    return {
      service: serviceType,
      status: 'healthy',
      responseTime: Date.now() - start
    }
  } catch (error) {
    return {
      service: serviceType,
      status: 'error',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}