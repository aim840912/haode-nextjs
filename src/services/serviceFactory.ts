/**
 * 服務工廠
 * 
 * 根據資料策略自動選擇和創建適合的服務實例
 * 支援快取、fallback 和動態切換
 */

import { ProductService } from '@/types/product'
import { shouldUseSupabase, shouldFallbackToJson, shouldUseCache, getStrategyInfo } from '@/config/data-strategy'

// 服務實例快取
let productServiceInstance: ProductService | null = null

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
 * 重設服務實例（用於測試或環境變更）
 */
export function resetServiceInstances() {
  productServiceInstance = null
  console.log('🔄 服務實例已重設')
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