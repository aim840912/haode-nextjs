/**
 * 快取包裝產品服務
 * 
 * 使用裝飾器模式為 ProductService 加入快取層
 * 支援 Vercel KV 和內存快取
 */

import { Product, ProductService } from '@/types/product'
import { CacheManager } from '@/lib/cache-server'
import { cacheLogger } from '@/lib/logger'

export class CachedProductService implements ProductService {
  private baseService: ProductService
  private cacheStats = {
    hits: 0,
    misses: 0,
    errors: 0
  }

  constructor(baseService: ProductService) {
    this.baseService = baseService
  }

  /**
   * 獲取快取統計
   */
  getCacheStats() {
    const total = this.cacheStats.hits + this.cacheStats.misses
    return {
      ...this.cacheStats,
      hitRate: total > 0 ? (this.cacheStats.hits / total * 100).toFixed(1) : '0.0'
    }
  }

  /**
   * 清除所有產品相關快取
   */
  async clearCache(): Promise<void> {
    try {
      await CacheManager.delete('products:list')
      await CacheManager.delete('products:all')
      await CacheManager.delete('products:search:*')
      cacheLogger.info('產品快取已清除')
    } catch (error) {
      cacheLogger.warn('清除快取失敗', { metadata: { error: (error as Error).message } })
    }
  }

  /**
   * 全域快取清除方法 - 可被外部調用
   * 用於管理員操作後清除所有產品相關快取
   */
  static async clearGlobalCache(): Promise<void> {
    try {
      await CacheManager.delete('products:list')
      await CacheManager.delete('products:all')
      await CacheManager.delete('products:search:*')
      
      // 額外清除可能的個別產品快取模式
      // 注意: 這裡使用通用模式，實際實作取決於 CacheManager 支援
      const patterns = [
        'products:item:*'
      ]
      
      for (const pattern of patterns) {
        try {
          await CacheManager.delete(pattern)
        } catch (patternError) {
          // 單個模式清除失敗不應影響整體
          cacheLogger.warn('清除快取模式失敗', { metadata: { pattern, error: (patternError as Error).message } })
        }
      }
      
      cacheLogger.info('全域產品快取已清除')
    } catch (error) {
      cacheLogger.warn('全域快取清除失敗', { metadata: { error: (error as Error).message } })
      throw error // 拋出錯誤，讓調用方知道清除失敗
    }
  }

  async getProducts(): Promise<Product[]> {
    const cacheKey = 'products:list'
    
    try {
      // 嘗試從快取讀取
      const cached = await CacheManager.get<Product[]>(cacheKey)
      if (cached) {
        this.cacheStats.hits++
        cacheLogger.debug('快取命中', { metadata: { type: 'products_list' } })
        return cached
      }
    } catch (error) {
      this.cacheStats.errors++
      cacheLogger.warn('快取讀取錯誤', { metadata: { error: (error as Error).message } })
    }

    // 快取未命中，查詢資料庫
    this.cacheStats.misses++
    cacheLogger.debug('快取未命中', { metadata: { type: 'products_list', action: 'query_database' } })
    
    const products = await this.baseService.getProducts()
    
    // 寫入快取（5 分鐘）
    try {
      await CacheManager.set(cacheKey, products, { ttl: 300 })
      cacheLogger.debug('產品列表已快取', { metadata: { ttl: 300 } })
    } catch (error) {
      this.cacheStats.errors++
      cacheLogger.warn('快取寫入錯誤', { metadata: { error: (error as Error).message } })
    }
    
    return products
  }

  async getAllProducts(): Promise<Product[]> {
    const cacheKey = 'products:all'
    
    try {
      // 嘗試從快取讀取
      const cached = await CacheManager.get<Product[]>(cacheKey)
      if (cached) {
        this.cacheStats.hits++
        cacheLogger.debug('快取命中', { metadata: { type: 'all_products', scope: 'admin' } })
        return cached
      }
    } catch (error) {
      this.cacheStats.errors++
      cacheLogger.warn('快取讀取錯誤', { metadata: { error: (error as Error).message } })
    }

    // 快取未命中，查詢資料庫
    this.cacheStats.misses++
    cacheLogger.debug('快取未命中', { metadata: { type: 'all_products', scope: 'admin', action: 'query_database' } })
    
    const products = this.baseService.getAllProducts ? 
      await this.baseService.getAllProducts() : 
      await this.baseService.getProducts()
    
    // 寫入快取（5 分鐘）
    try {
      await CacheManager.set(cacheKey, products, { ttl: 300 })
      cacheLogger.debug('所有產品列表已快取', { metadata: { ttl: 300, scope: 'admin' } })
    } catch (error) {
      this.cacheStats.errors++
      cacheLogger.warn('快取寫入錯誤', { metadata: { error: (error as Error).message } })
    }
    
    return products
  }

  async getProductById(id: string): Promise<Product | null> {
    const cacheKey = `products:item:${id}`
    
    try {
      // 嘗試從快取讀取
      const cached = await CacheManager.get<Product>(cacheKey)
      if (cached) {
        this.cacheStats.hits++
        cacheLogger.debug('快取命中', { metadata: { type: 'product', productId: id } })
        return cached
      }
    } catch (error) {
      this.cacheStats.errors++
      cacheLogger.warn('快取讀取錯誤', { metadata: { error: (error as Error).message } })
    }

    // 快取未命中，查詢資料庫
    this.cacheStats.misses++
    cacheLogger.debug('快取未命中', { metadata: { type: 'product', productId: id, action: 'query_database' } })
    
    const product = await this.baseService.getProductById(id)
    
    // 只有當產品存在時才快取（10 分鐘）
    if (product) {
      try {
        await CacheManager.set(cacheKey, product, { ttl: 600 })
        cacheLogger.debug('產品已快取', { metadata: { productId: id, ttl: 600 } })
      } catch (error) {
        this.cacheStats.errors++
        cacheLogger.warn('快取寫入錯誤', { metadata: { error: (error as Error).message } })
      }
    }
    
    return product
  }

  async searchProducts(query: string): Promise<Product[]> {
    // 搜索結果快取時間較短（2 分鐘）
    const cacheKey = `products:search:${query.toLowerCase().trim()}`
    
    try {
      // 嘗試從快取讀取
      const cached = await CacheManager.get<Product[]>(cacheKey)
      if (cached) {
        this.cacheStats.hits++
        cacheLogger.debug('快取命中', { metadata: { type: 'search', query } })
        return cached
      }
    } catch (error) {
      this.cacheStats.errors++
      cacheLogger.warn('快取讀取錯誤', { metadata: { error: (error as Error).message } })
    }

    // 快取未命中，查詢資料庫
    this.cacheStats.misses++
    cacheLogger.debug('快取未命中', { metadata: { type: 'search', query, action: 'query_database' } })
    
    const results = await this.baseService.searchProducts(query)
    
    // 寫入快取（2 分鐘）
    try {
      await CacheManager.set(cacheKey, results, { ttl: 120 })
      cacheLogger.debug('搜索結果已快取', { metadata: { query, ttl: 120 } })
    } catch (error) {
      this.cacheStats.errors++
      cacheLogger.warn('快取寫入錯誤', { metadata: { error: (error as Error).message } })
    }
    
    return results
  }

  async addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    // 新增產品，直接調用基礎服務
    const newProduct = await this.baseService.addProduct(productData)
    
    // 清除相關快取
    await this.invalidateProductCaches()
    cacheLogger.info('新增產品後清除快取')
    
    return newProduct
  }

  async updateProduct(id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
    // 更新產品，直接調用基礎服務
    const updatedProduct = await this.baseService.updateProduct(id, productData)
    
    // 清除相關快取
    await this.invalidateProductCaches(id)
    cacheLogger.info('更新產品後清除快取', { metadata: { productId: id } })
    
    return updatedProduct
  }

  async deleteProduct(id: string): Promise<void> {
    // 刪除產品，直接調用基礎服務
    await this.baseService.deleteProduct(id)
    
    // 清除相關快取
    await this.invalidateProductCaches(id)
    cacheLogger.info('刪除產品後清除快取', { metadata: { productId: id } })
  }

  /**
   * 失效產品相關快取
   */
  private async invalidateProductCaches(productId?: string): Promise<void> {
    try {
      // 清除產品列表快取
      await CacheManager.delete('products:list')
      
      // 清除管理員產品列表快取
      await CacheManager.delete('products:all')
      
      // 如果有特定產品 ID，清除該產品快取
      if (productId) {
        await CacheManager.delete(`products:item:${productId}`)
      }
      
      // 清除所有搜索快取（簡化版，實際可以更精細）
      // 注意：這裡需要 CacheManager 支援 pattern delete
      // await CacheManager.deletePattern('products:search:*')
      
    } catch (error) {
      cacheLogger.warn('清除快取失敗', { metadata: { error: (error as Error).message } })
    }
  }
}