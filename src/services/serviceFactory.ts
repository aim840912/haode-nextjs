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
import { ServiceConfig } from '@/lib/base-service'
import { shouldUseSupabase, shouldFallbackToJson, shouldUseCache, getStrategyInfo, DataStrategyConfig } from '@/config/data-strategy'
import { dbLogger } from '@/lib/logger'

// 定義服務介面類型
interface FarmTourService {
  getAll(): Promise<FarmTourActivity[]>
  getById(id: string): Promise<FarmTourActivity | null>
  create(data: Omit<FarmTourActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<FarmTourActivity>
  update(id: string, data: Partial<Omit<FarmTourActivity, 'id' | 'createdAt'>>): Promise<FarmTourActivity | null>
  delete(id: string): Promise<boolean>
}

interface UserInterestsService {
  getUserInterests(userId: string): Promise<string[]>
  addInterest(userId: string, productId: string): Promise<boolean>
  removeInterest(userId: string, productId: string): Promise<boolean>
  addMultipleInterests(userId: string, productIds: string[]): Promise<boolean>
  toggleInterest(userId: string, productId: string): Promise<boolean>
  syncLocalInterests(userId: string, localInterests: string[]): Promise<string[]>
  clearLocalInterests(): void
  getLocalInterests(): string[]
  setLocalInterests(interests: string[]): void
}

// 服務實例快取
let productServiceInstance: ProductService | null = null
let scheduleServiceInstance: ScheduleService | null = null
let farmTourServiceInstance: FarmTourService | null = null
let newsServiceInstance: NewsService | null = null
let cultureServiceInstance: CultureService | null = null
let locationServiceInstance: LocationService | null = null
let userInterestsServiceInstance: UserInterestsService | null = null

/**
 * 獲取產品服務實例
 * 使用 v2 架構適配器，提供向後相容性
 */
export async function getProductService(): Promise<ProductService> {
  // 如果已有實例，直接返回
  if (productServiceInstance) {
    return productServiceInstance
  }

  dbLogger.info('初始化產品服務', { 
    module: 'ServiceFactory', 
    action: 'getProductService', 
    metadata: { architecture: 'v2' } 
  })
  
  try {
    const { productServiceAdapter } = await import('./productServiceAdapter')
    
    // 測試連線
    await productServiceAdapter.getProducts()
    
    // 包裝快取層
    productServiceInstance = await createCachedProductService(productServiceAdapter)
    
    dbLogger.info('產品服務初始化成功', { 
      module: 'ServiceFactory', 
      action: 'getProductService', 
      metadata: { architecture: 'v2', cached: true } 
    })
    
    return productServiceInstance
  } catch (error) {
    dbLogger.error('產品服務初始化失敗', error instanceof Error ? error : new Error('Unknown error'), { 
      module: 'ServiceFactory', 
      action: 'getProductService' 
    })
    throw new Error('產品服務初始化失敗，請檢查服務配置')
  }
}

/**
 * 創建 JSON 服務實例
 */
async function createJsonService(): Promise<ProductService> {
  const { JsonProductService } = await import('./productService')
  const service = new JsonProductService()
  dbLogger.info('JSON 服務初始化成功', { 
    module: 'ServiceFactory', 
    action: 'createJsonService' 
  })
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
    dbLogger.debug('快取策略停用，使用基礎服務', { 
      module: 'ServiceFactory', 
      action: 'createCachedProductService' 
    })
    return baseService
  }

  // 動態載入快取服務
  const { CachedProductService } = await import('./cachedProductService')
  
  if (hasKV) {
    dbLogger.info('創建 KV 快取包裝服務', { 
      module: 'ServiceFactory', 
      action: 'createCachedProductService', 
      metadata: { cacheType: 'kv' } 
    })
  } else {
    dbLogger.info('創建內存快取包裝服務', { 
      module: 'ServiceFactory', 
      action: 'createCachedProductService', 
      metadata: { cacheType: 'memory' } 
    })
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
  testConnection?: (service: T) => Promise<boolean>
): Promise<T> {
  // 對於不支援的服務類型，默認使用 JSON
  const useSupabase = serviceType !== 'userInterests' ? shouldUseSupabase(serviceType as keyof Omit<DataStrategyConfig, 'useCache' | 'fallbackToJson'>) : false
  
  dbLogger.info(`初始化${serviceType}服務`, { 
    module: 'ServiceFactory', 
    action: 'createService', 
    metadata: { serviceType, mode: useSupabase ? 'Supabase' : 'JSON' } 
  })

  try {
    if (useSupabase) {
      const supabaseModule = await supabaseServiceImport()
      const supabaseService = Object.values(supabaseModule)[0] as T
      
      // 測試連線（如果提供）
      if (testConnection) {
        try {
          await testConnection(supabaseService)
          dbLogger.info(`${serviceType} Supabase 服務初始化成功`, { 
            module: 'ServiceFactory', 
            action: 'createService', 
            metadata: { serviceType } 
          })
          return supabaseService
        } catch (error) {
          dbLogger.warn(`${serviceType} Supabase 連線失敗，嘗試 fallback`, { 
            module: 'ServiceFactory', 
            action: 'createService', 
            metadata: { 
              serviceType,
              error: error instanceof Error ? error.message : 'Unknown error'
            } 
          })
          
          if (shouldFallbackToJson()) {
            const jsonService = await jsonServiceCreator()
            dbLogger.info(`${serviceType} 已切換到 JSON fallback 模式`, { 
              module: 'ServiceFactory', 
              action: 'createService', 
              metadata: { serviceType } 
            })
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
    dbLogger.error(`${serviceType} 服務初始化失敗`, error instanceof Error ? error : new Error('Unknown error'), { 
      module: 'ServiceFactory', 
      action: 'createService', 
      metadata: { serviceType } 
    })
    
    if (shouldFallbackToJson()) {
      dbLogger.info(`${serviceType} 嘗試 fallback 到 JSON 服務`, { 
        module: 'ServiceFactory', 
        action: 'createService', 
        metadata: { serviceType } 
      })
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
  userInterests: userInterestsServiceInstance,
}

/**
 * 獲取排程服務實例
 * 使用 v2 架構適配器，提供向後相容性
 */
export async function getScheduleService(): Promise<ScheduleService> {
  if (scheduleServiceInstance) {
    return scheduleServiceInstance
  }

  dbLogger.info('初始化排程服務', { 
    module: 'ServiceFactory', 
    action: 'getScheduleService', 
    metadata: { architecture: 'v2' } 
  })
  
  try {
    const { scheduleServiceAdapter } = await import('./scheduleServiceAdapter')
    scheduleServiceInstance = scheduleServiceAdapter
    
    // 測試連線
    await scheduleServiceInstance.getSchedule()
    
    dbLogger.info('排程服務初始化成功', { 
      module: 'ServiceFactory', 
      action: 'getScheduleService', 
      metadata: { architecture: 'v2' } 
    })
    
    return scheduleServiceInstance
  } catch (error) {
    dbLogger.error('排程服務初始化失敗', error instanceof Error ? error : new Error('Unknown error'), { 
      module: 'ServiceFactory', 
      action: 'getScheduleService' 
    })
    throw new Error('排程服務初始化失敗，請檢查服務配置')
  }
}

/**
 * 獲取農場體驗服務實例
 * 使用 v2 架構適配器，提供向後相容性
 */
export async function getFarmTourService(): Promise<FarmTourService> {
  if (farmTourServiceInstance) {
    return farmTourServiceInstance
  }

  dbLogger.info('初始化農場體驗服務', { 
    module: 'ServiceFactory', 
    action: 'getFarmTourService', 
    metadata: { architecture: 'v2' } 
  })
  
  try {
    const { farmTourServiceAdapter } = await import('./farmTourServiceAdapter')
    farmTourServiceInstance = farmTourServiceAdapter
    
    // 測試連線
    await farmTourServiceInstance.getAll()
    
    dbLogger.info('農場體驗服務初始化成功', { 
      module: 'ServiceFactory', 
      action: 'getFarmTourService', 
      metadata: { architecture: 'v2' } 
    })
    
    return farmTourServiceInstance
  } catch (error) {
    dbLogger.error('農場體驗服務初始化失敗', error instanceof Error ? error : new Error('Unknown error'), { 
      module: 'ServiceFactory', 
      action: 'getFarmTourService' 
    })
    throw new Error('農場體驗服務初始化失敗，請檢查服務配置')
  }
}

/**
 * 獲取新聞服務實例
 * 使用 v2 架構適配器，提供向後相容性
 */
export async function getNewsService(): Promise<NewsService> {
  if (newsServiceInstance) {
    return newsServiceInstance
  }

  dbLogger.info('初始化新聞服務', { 
    module: 'ServiceFactory', 
    action: 'getNewsService', 
    metadata: { architecture: 'v2' } 
  })
  
  try {
    const { newsServiceAdapter } = await import('./newsServiceAdapter')
    newsServiceInstance = newsServiceAdapter
    
    // 測試連線
    await newsServiceInstance.getNews()
    
    dbLogger.info('新聞服務初始化成功', { 
      module: 'ServiceFactory', 
      action: 'getNewsService', 
      metadata: { architecture: 'v2' } 
    })
    
    return newsServiceInstance
  } catch (error) {
    dbLogger.error('新聞服務初始化失敗', error instanceof Error ? error : new Error('Unknown error'), { 
      module: 'ServiceFactory', 
      action: 'getNewsService' 
    })
    throw new Error('新聞服務初始化失敗，請檢查服務配置')
  }
}

/**
 * 獲取文化服務實例
 * 使用 v2 架構適配器，提供向後相容性
 */
export async function getCultureService(): Promise<CultureService> {
  if (cultureServiceInstance) {
    return cultureServiceInstance
  }

  dbLogger.info('初始化文化服務', { 
    module: 'ServiceFactory', 
    action: 'getCultureService', 
    metadata: { architecture: 'v2' } 
  })
  
  try {
    const { cultureServiceAdapter } = await import('./cultureServiceAdapter')
    cultureServiceInstance = cultureServiceAdapter
    
    // 測試連線
    await cultureServiceInstance.getCultureItems()
    
    dbLogger.info('文化服務初始化成功', { 
      module: 'ServiceFactory', 
      action: 'getCultureService', 
      metadata: { architecture: 'v2' } 
    })
    
    return cultureServiceInstance
  } catch (error) {
    dbLogger.error('文化服務初始化失敗', error instanceof Error ? error : new Error('Unknown error'), { 
      module: 'ServiceFactory', 
      action: 'getCultureService' 
    })
    throw new Error('文化服務初始化失敗，請檢查服務配置')
  }
}

/**
 * 獲取地點服務實例
 * 使用 v2 架構適配器，提供向後相容性
 */
export async function getLocationService(): Promise<LocationService> {
  if (locationServiceInstance) {
    return locationServiceInstance
  }

  dbLogger.info('初始化地點服務', { 
    module: 'ServiceFactory', 
    action: 'getLocationService', 
    metadata: { architecture: 'v2' } 
  })
  
  try {
    const { locationServiceAdapter } = await import('./locationServiceAdapter')
    locationServiceInstance = locationServiceAdapter
    
    // 測試連線
    await locationServiceInstance.getLocations()
    
    dbLogger.info('地點服務初始化成功', { 
      module: 'ServiceFactory', 
      action: 'getLocationService', 
      metadata: { architecture: 'v2' } 
    })
    
    return locationServiceInstance
  } catch (error) {
    dbLogger.error('地點服務初始化失敗', error instanceof Error ? error : new Error('Unknown error'), { 
      module: 'ServiceFactory', 
      action: 'getLocationService' 
    })
    throw new Error('地點服務初始化失敗，請檢查服務配置')
  }
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
  userInterestsServiceInstance = null
  dbLogger.info('所有服務實例已重設', { 
    module: 'ServiceFactory', 
    action: 'resetServiceInstances' 
  })
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

/**
 * 獲取使用者興趣服務實例
 * 使用 v2 架構適配器，提供向後相容性
 */
export async function getUserInterestsService(): Promise<UserInterestsService> {
  if (userInterestsServiceInstance) {
    return userInterestsServiceInstance
  }

  dbLogger.info('初始化使用者興趣服務', { 
    module: 'ServiceFactory', 
    action: 'getUserInterestsService', 
    metadata: { architecture: 'v2' } 
  })
  
  try {
    const { UserInterestsService } = await import('./userInterestsServiceAdapter')
    userInterestsServiceInstance = UserInterestsService
    
    dbLogger.info('使用者興趣服務初始化成功', { 
      module: 'ServiceFactory', 
      action: 'getUserInterestsService', 
      metadata: { architecture: 'v2' } 
    })
    
    return userInterestsServiceInstance
  } catch (error) {
    dbLogger.error('使用者興趣服務初始化失敗', error instanceof Error ? error : new Error('Unknown error'), { 
      module: 'ServiceFactory', 
      action: 'getUserInterestsService' 
    })
    throw new Error('使用者興趣服務初始化失敗，請檢查服務配置')
  }
}