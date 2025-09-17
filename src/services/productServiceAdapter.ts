/**
 * 產品服務適配器
 * 提供向後相容性，將舊版 ProductService API 橋接到新版服務
 *
 * 此適配器確保現有代碼能夠無縫遷移到 v2 架構
 */

import {
  LegacyProductServiceAdapter,
  UnifiedProductService,
  SupabaseProductService,
  JsonProductService,
} from './v2/productService'
import { Product, ProductService } from '@/types/product'
import { dbLogger } from '@/lib/logger'

/**
 * 產品服務適配器類別
 * 基於 v2 服務中的 LegacyProductServiceAdapter，提供統一介面
 */
export class ProductServiceAdapter implements ProductService {
  private readonly legacyAdapter: LegacyProductServiceAdapter
  private readonly unifiedService: UnifiedProductService

  constructor() {
    // 建立統一服務實例 (預設使用 Supabase)
    this.unifiedService = new UnifiedProductService(new SupabaseProductService())

    // 建立適配器實例
    this.legacyAdapter = new LegacyProductServiceAdapter(this.unifiedService)

    dbLogger.info('產品服務適配器初始化', {
      module: 'ProductServiceAdapter',
      action: 'constructor',
    })
  }

  // === ProductService 介面實作 ===

  async getProducts(): Promise<Product[]> {
    return this.legacyAdapter.getProducts()
  }

  async getAllProducts(): Promise<Product[]> {
    return this.legacyAdapter.getAllProducts()
  }

  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return this.legacyAdapter.addProduct(product)
  }

  async updateProduct(
    id: string,
    product: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Product> {
    return this.legacyAdapter.updateProduct(id, product)
  }

  async deleteProduct(id: string): Promise<void> {
    return this.legacyAdapter.deleteProduct(id)
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.legacyAdapter.getProductById(id)
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.legacyAdapter.searchProducts(query)
  }

  // === 額外的工具方法 ===

  /**
   * 取得服務健康狀態
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    version: string
    details: Record<string, unknown>
  }> {
    try {
      // 簡單健康檢查：嘗試取得產品列表
      await this.getProducts()

      return {
        status: 'healthy',
        version: 'v2-unified',
        details: {
          adapterActive: true,
          serviceType: 'UnifiedProductService',
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        version: 'v2-unified',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      }
    }
  }

  /**
   * 取得上架中的產品（前台使用）
   */
  async getActiveProducts(): Promise<Product[]> {
    const allProducts = await this.getProducts()
    return allProducts.filter(product => product.isActive)
  }

  /**
   * 取得特定分類的產品
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    const allProducts = await this.getProducts()
    return allProducts.filter(
      product => product.category.toLowerCase() === category.toLowerCase() && product.isActive
    )
  }

  /**
   * 取得促銷中的產品
   */
  async getSaleProducts(): Promise<Product[]> {
    const allProducts = await this.getProducts()
    return allProducts.filter(
      product =>
        product.isOnSale &&
        product.isActive &&
        (!product.saleEndDate || new Date(product.saleEndDate) > new Date())
    )
  }

  /**
   * 取得庫存不足的產品（管理用）
   */
  async getLowInventoryProducts(threshold: number = 10): Promise<Product[]> {
    const allProducts = await this.getAllProducts()
    return allProducts.filter(product => product.inventory <= threshold && product.isActive)
  }

  /**
   * 切換服務實作類型
   */
  switchServiceType(type: 'supabase' | 'json'): void {
    // 重新建立統一服務實例
    const baseService =
      type === 'supabase' ? new SupabaseProductService() : new JsonProductService()
    const newUnifiedService = new UnifiedProductService(baseService)

    // 更新適配器引用
    // @ts-expect-error - Dynamic service switching
    this.legacyAdapter = new LegacyProductServiceAdapter(newUnifiedService)
    // @ts-expect-error - Dynamic service switching
    this.unifiedService = newUnifiedService

    dbLogger.info('產品服務切換實作類型', {
      module: 'ProductServiceAdapter',
      action: 'switchServiceType',
      metadata: { newType: type },
    })
  }
}

// 建立並匯出適配器實例
export const productServiceAdapter = new ProductServiceAdapter()

// 為了保持完全向後相容，也匯出為原始名稱
export const supabaseProductService = productServiceAdapter

/**
 * 工廠函數：根據配置決定使用哪個服務實作
 */
export function createProductService(useV2: boolean = true): ProductService {
  if (useV2) {
    return productServiceAdapter
  } else {
    // 如果需要，可以載入舊版服務
    throw new Error('舊版服務已被棄用，請使用 v2 版本')
  }
}

/**
 * 遷移輔助函數：檢查產品服務健康狀態
 */
export async function checkProductServiceHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  details: Record<string, unknown>
}> {
  try {
    // 簡單的健康檢查 - 嘗試查詢服務是否可用
    await productServiceAdapter.getProducts()

    return {
      status: 'healthy',
      version: 'v2-unified',
      details: {
        adapterActive: true,
        serviceType: 'UnifiedProductService',
        timestamp: new Date().toISOString(),
      },
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      version: 'v2-unified',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    }
  }
}
