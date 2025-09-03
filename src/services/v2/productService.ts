/**
 * 產品服務 v2 - 使用統一服務架構
 * 
 * 重構的產品服務，遵循新的服務層標準：
 * - 實作統一的 BaseService 介面
 * - 支援 Supabase 和 JSON 兩種實作
 * - 整合新的錯誤處理系統
 * - 提供向後相容性
 */

import path from 'path'
import { Product, ProductImage } from '@/types/product'
import { AbstractSupabaseService, DataTransformer, SupabaseServiceConfig } from '@/lib/abstract-supabase-service'
import { AbstractJsonService, JsonEntity, JsonServiceConfig, SearchConfig } from '@/lib/abstract-json-service'
import { BaseService, SearchableService, PaginatedService, QueryOptions, PaginatedQueryOptions, PaginatedResult } from '@/lib/base-service'
import { dbLogger } from '@/lib/logger'

/**
 * 產品建立 DTO
 */
export interface CreateProductDTO {
  name: string
  description: string
  category: string
  price: number
  originalPrice?: number
  isOnSale?: boolean
  saleEndDate?: string
  images: string[]
  productImages?: Array<Record<string, unknown>>
  primaryImageUrl?: string
  thumbnailUrl?: string
  galleryImages?: string[]
  inventory: number
  isActive: boolean
  showInCatalog?: boolean
}

/**
 * 產品更新 DTO
 */
export interface UpdateProductDTO {
  name?: string
  description?: string
  category?: string
  price?: number
  originalPrice?: number
  isOnSale?: boolean
  saleEndDate?: string
  images?: string[]
  productImages?: Array<Record<string, unknown>>
  primaryImageUrl?: string
  thumbnailUrl?: string
  galleryImages?: string[]
  inventory?: number
  isActive?: boolean
  showInCatalog?: boolean
}

/**
 * Supabase 資料庫記錄與 Product 實體的轉換器
 */
export class ProductDataTransformer implements DataTransformer<Product> {
  fromDB(record: Record<string, unknown>): Product {
    // Parse images from JSON string if needed
    let images: string[] = []
    if (record.images) {
      try {
        if (typeof record.images === 'string') {
          images = JSON.parse(record.images)
        } else if (Array.isArray(record.images)) {
          images = record.images
        }
      } catch (error) {
        dbLogger.warn('Failed to parse images JSON', {
          module: 'ProductService',
          action: 'transformFromSupabase',
          metadata: {
            error: error instanceof Error ? error.message : String(error)
          }
        })
        images = []
      }
    }

    // Ensure images is always an array with at least a placeholder
    if (!images || images.length === 0) {
      images = ['/images/placeholder.jpg']
    }

    return {
      id: record.id as string,
      name: record.name as string,
      description: record.description as string,
      category: record.category as string,
      price: record.price as number,
      originalPrice: record.original_price as number | undefined,
      isOnSale: (record.is_on_sale as boolean) || false,
      saleEndDate: record.sale_end_date as string | undefined,
      images,
      productImages: record.product_images as ProductImage[] | undefined,
      primaryImageUrl: record.primary_image_url as string | undefined,
      thumbnailUrl: record.thumbnail_url as string | undefined,
      galleryImages: (record.gallery_images as string[]) || [],
      inventory: (record.stock as number) || 0,
      isActive: (record.is_active as boolean) !== false, // 預設為 true
      showInCatalog: (record.show_in_catalog as boolean) !== false, // 預設為 true
      createdAt: record.created_at as string,
      updatedAt: record.updated_at as string
    }
  }

  toDB(entity: Partial<Product>): Record<string, unknown> {
    const record: Record<string, unknown> = {}
    
    if (entity.name !== undefined) record.name = entity.name
    if (entity.description !== undefined) record.description = entity.description
    if (entity.category !== undefined) record.category = entity.category
    if (entity.price !== undefined) record.price = entity.price
    if (entity.originalPrice !== undefined) record.original_price = entity.originalPrice
    if (entity.isOnSale !== undefined) record.is_on_sale = entity.isOnSale
    if (entity.saleEndDate !== undefined) record.sale_end_date = entity.saleEndDate
    if (entity.images !== undefined) record.images = entity.images
    if (entity.productImages !== undefined) record.product_images = entity.productImages
    if (entity.primaryImageUrl !== undefined) record.primary_image_url = entity.primaryImageUrl
    if (entity.thumbnailUrl !== undefined) record.thumbnail_url = entity.thumbnailUrl
    if (entity.galleryImages !== undefined) record.gallery_images = entity.galleryImages
    if (entity.inventory !== undefined) record.stock = entity.inventory
    if (entity.isActive !== undefined) record.is_active = entity.isActive
    if (entity.showInCatalog !== undefined) record.show_in_catalog = entity.showInCatalog
    
    return record
  }
}

/**
 * Supabase 產品服務實作
 */
export class SupabaseProductService 
  extends AbstractSupabaseService<Product, CreateProductDTO, UpdateProductDTO> 
  implements SearchableService<Product> {
  
  protected transformer: ProductDataTransformer

  constructor() {
    const config: SupabaseServiceConfig = {
      tableName: 'products',
      useAdminClient: true, // 需要管理員權限進行 CRUD 操作
      enableCache: true,
      cacheTTL: 300,
      enableAuditLog: true,
      defaultPageSize: 20,
      maxPageSize: 100
    }
    
    const transformer = new ProductDataTransformer()
    super(config, transformer)
    this.transformer = transformer
  }

  /**
   * 搜尋產品（實作 SearchableService）
   */
  async search(query: string): Promise<Product[]> {
    try {
      const { data, error } = await this.createQuery()
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        this.handleError(error, 'search', { query })
      }

      const result = (data || []).map((record: Record<string, unknown>) => this.transformFromDB(record))
      
      return result
    } catch (error) {
      this.handleError(error, 'search', { query })
    }
  }

  /**
   * 取得所有產品（包含下架的，管理員用）
   */
  async findAllAdmin(): Promise<Product[]> {
    try {
      const { data, error } = await this.createQuery(true)
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        this.handleError(error, 'findAllAdmin')
      }

      return (data || []).map((record: Record<string, unknown>) => this.transformFromDB(record))
    } catch (error) {
      this.handleError(error, 'findAllAdmin')
    }
  }

  /**
   * 覆寫 findAll，只回傳上架的產品
   * 直接實作以避免抽象服務的問題
   */
  async findAll(): Promise<Product[]> {
    try {
      const { getSupabaseServer } = await import('@/lib/supabase-auth')
      const client = getSupabaseServer()
      
      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }

      return (data || []).map((record: Record<string, unknown>) => this.transformer.fromDB(record))
    } catch (error) {
      throw error
    }
  }
}

/**
 * JSON 產品實體（加入 JsonEntity 必要欄位）
 */
interface JsonProduct extends Product, JsonEntity {}

/**
 * JSON 檔案產品服務實作
 */
export class JsonProductService 
  extends AbstractJsonService<JsonProduct, CreateProductDTO, UpdateProductDTO>
  implements SearchableService<Product> {
  
  constructor() {
    const config: JsonServiceConfig = {
      filePath: path.join(process.cwd(), 'src/data/products.json'),
      enableBackup: true,
      maxBackupFiles: 5,
      useMemoryCache: true,
      enableCache: true,
      cacheTTL: 300
    }
    
    const searchConfig: SearchConfig = {
      searchableFields: ['name', 'description', 'category'],
      caseSensitive: false,
      exactMatch: false
    }
    
    super(config, searchConfig)
  }

  /**
   * 覆寫 transformCreateDTO 以確保型別正確
   */
  protected transformCreateDTO(data: CreateProductDTO): JsonProduct {
    const baseProduct = super.transformCreateDTO(data)
    
    return {
      ...baseProduct,
      isActive: data.isActive !== false, // 預設為 true
      showInCatalog: data.showInCatalog !== false, // 預設為 true
      inventory: data.inventory || 0,
      images: data.images || [],
      galleryImages: data.galleryImages || []
    } as JsonProduct
  }

  /**
   * 覆寫 findAll，只回傳上架的產品
   */
  async findAll(): Promise<Product[]> {
    const result = await super.findAll({
      filters: { isActive: true },
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    
    // 轉換為 Product 類型（移除 JsonEntity 的額外欄位）
    return result.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      originalPrice: item.originalPrice,
      isOnSale: item.isOnSale,
      saleEndDate: item.saleEndDate,
      images: item.images,
      productImages: item.productImages,
      primaryImageUrl: item.primaryImageUrl,
      thumbnailUrl: item.thumbnailUrl,
      galleryImages: item.galleryImages,
      inventory: item.inventory,
      isActive: item.isActive,
      showInCatalog: item.showInCatalog,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    } as Product))
  }

  /**
   * 取得所有產品（包含下架的，管理員用）
   */
  async findAllAdmin(): Promise<Product[]> {
    const result = await super.findAll({
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    
    return result.map(item => item as Product)
  }
}

/**
 * 產品服務類型定義（統一介面）
 */
export interface IProductService extends BaseService<Product, CreateProductDTO, UpdateProductDTO> {
  // 搜尋功能
  search(query: string, options?: QueryOptions): Promise<Product[]>
  
  // 分頁功能
  findAllPaginated(options?: PaginatedQueryOptions): Promise<PaginatedResult<Product>>
  
  /** 管理員用：取得所有產品（包含下架的） */
  findAllAdmin(): Promise<Product[]>
}

/**
 * 統一的產品服務介面實作
 * 包裝現有服務以提供統一的介面
 */
export class UnifiedProductService implements IProductService {
  constructor(private service: SupabaseProductService | JsonProductService) {}

  // 基礎 CRUD 操作
  async findAll(options?: QueryOptions): Promise<Product[]> {
    return this.service.findAll()
  }

  async findById(id: string): Promise<Product | null> {
    return this.service.findById(id)
  }

  async create(data: CreateProductDTO): Promise<Product> {
    return this.service.create(data)
  }

  async update(id: string, data: UpdateProductDTO): Promise<Product> {
    return this.service.update(id, data)
  }

  async delete(id: string): Promise<void> {
    return this.service.delete(id)
  }

  async exists(id: string): Promise<boolean> {
    return this.service.exists(id)
  }

  // 分頁操作
  async findAllPaginated(options?: PaginatedQueryOptions): Promise<PaginatedResult<Product>> {
    return this.service.findAllPaginated(options)
  }

  // 搜尋操作
  async search(query: string, options?: QueryOptions): Promise<Product[]> {
    return this.service.search(query, options)
  }

  // 擴展操作
  async findAllAdmin(): Promise<Product[]> {
    return this.service.findAllAdmin()
  }
}

/**
 * 向後相容性包裝器
 * 將新的服務介面適配到舊的 ProductService 介面
 */
export class LegacyProductServiceAdapter {
  constructor(private service: IProductService) {}

  async getProducts(): Promise<Product[]> {
    return this.service.findAll()
  }

  async getAllProducts(): Promise<Product[]> {
    return this.service.findAllAdmin()
  }

  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return this.service.create(product as CreateProductDTO)
  }

  async updateProduct(
    id: string, 
    product: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Product> {
    return this.service.update(id, product as UpdateProductDTO)
  }

  async deleteProduct(id: string): Promise<void> {
    return this.service.delete(id)
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.service.findById(id)
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.service.search(query)
  }
}