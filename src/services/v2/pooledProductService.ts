/**
 * 池化產品服務 v2
 * 展示連線池整合的新服務實作
 *
 * 特色：
 * - 使用連線池提升併發效能
 * - 智能後備機制確保穩定性
 * - 完整的效能監控和日誌
 * - 事務和批次操作優化
 */

import { AbstractPooledService } from '@/lib/abstract-pooled-service'
import { dbLogger } from '@/lib/logger'
import { Product } from '@/types/product'
import { Database } from '@/types/database'
import { ErrorFactory, NotFoundError, ValidationError } from '@/lib/errors'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * 資料庫記錄類型（從 products 表格）
 */
interface SupabaseProductRecord {
  id: string
  name: string
  description: string | null
  price: number
  price_unit: string | null
  unit_quantity: number | null
  category: string
  image_url: string | null
  stock: number | null
  is_active: boolean | null
  created_at: string
  updated_at: string
}

/**
 * 產品建立資料
 */
interface CreateProductData {
  name: string
  description?: string
  price: number
  priceUnit?: string
  unitQuantity?: number
  category: string
  imageUrl?: string
  stock?: number
  isActive?: boolean
}

/**
 * 產品更新資料
 */
interface UpdateProductData {
  name?: string
  description?: string
  price?: number
  priceUnit?: string
  unitQuantity?: number
  category?: string
  imageUrl?: string
  stock?: number
  isActive?: boolean
}

/**
 * 查詢選項
 */
interface ProductQueryOptions {
  limit?: number
  offset?: number
  category?: string
  isActive?: boolean
  orderBy?: 'name' | 'price' | 'created_at'
  orderDirection?: 'asc' | 'desc'
}

/**
 * 池化產品服務
 * 使用連線池技術提升資料庫操作效能
 */
export class PooledProductService extends AbstractPooledService {
  constructor() {
    super('PooledProductService')
  }

  /**
   * 取得所有產品
   */
  async findAll(options: ProductQueryOptions = {}): Promise<Product[]> {
    return this.executeWithConnection(
      async client => {
        let query = client.from('products').select('*')

        // 應用篩選條件
        if (options.category) {
          query = query.eq('category', options.category)
        }

        if (options.isActive !== undefined) {
          query = query.eq('is_active', options.isActive)
        }

        // 應用排序
        if (options.orderBy) {
          query = query.order(options.orderBy, { ascending: options.orderDirection === 'asc' })
        } else {
          query = query.order('created_at', { ascending: false })
        }

        // 應用分頁
        if (options.limit) {
          query = query.limit(options.limit)
        }

        if (options.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
        }

        const { data, error } = await query

        if (error) {
          throw ErrorFactory.fromSupabaseError(error, {
            module: this.moduleName,
            action: 'findAll',
          })
        }

        return data ? data.map(this.transformFromDB) : []
      },
      {
        action: 'findAll',
        metadata: {
          options,
          queryType: 'list',
        },
      }
    )
  }

  /**
   * 根據 ID 取得產品
   */
  async findById(id: string): Promise<Product> {
    if (!id || id.trim() === '') {
      throw new ValidationError('產品 ID 不能為空')
    }

    return this.executeWithConnection(
      async client => {
        const { data, error } = await client.from('products').select('*').eq('id', id).single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new NotFoundError(`產品不存在: ${id}`)
          }
          throw ErrorFactory.fromSupabaseError(error, {
            module: this.moduleName,
            action: 'findById',
            context: { productId: id },
          })
        }

        return this.transformFromDB(data)
      },
      {
        action: 'findById',
        metadata: {
          productId: id,
          queryType: 'single',
        },
      }
    )
  }

  /**
   * 建立新產品
   */
  async create(data: CreateProductData): Promise<Product> {
    this.validateCreateData(data)

    return this.executeWithConnection(
      async client => {
        const insertData = {
          name: data.name,
          description: data.description || null,
          price: data.price,
          price_unit: data.priceUnit || null,
          unit_quantity: data.unitQuantity || null,
          category: data.category,
          image_url: data.imageUrl || null,
          stock: data.stock || 0,
          is_active: data.isActive !== false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { data: result, error } = await client
          .from('products')
          .insert(insertData)
          .select()
          .single()

        if (error) {
          throw ErrorFactory.fromSupabaseError(error, {
            module: this.moduleName,
            action: 'create',
            context: { productName: data.name },
          })
        }

        dbLogger.info('產品建立成功', {
          module: this.moduleName,
          action: 'create',
          metadata: {
            productId: result.id,
            productName: data.name,
          },
        })

        return this.transformFromDB(result)
      },
      {
        action: 'create',
        metadata: {
          productName: data.name,
          queryType: 'insert',
        },
      }
    )
  }

  /**
   * 更新產品
   */
  async update(id: string, data: UpdateProductData): Promise<Product> {
    if (!id || id.trim() === '') {
      throw new ValidationError('產品 ID 不能為空')
    }

    return this.executeWithConnection(
      async client => {
        const updateData: any = {
          updated_at: new Date().toISOString(),
        }

        // 只更新提供的欄位
        if (data.name !== undefined) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description
        if (data.price !== undefined) updateData.price = data.price
        if (data.priceUnit !== undefined) updateData.price_unit = data.priceUnit
        if (data.unitQuantity !== undefined) updateData.unit_quantity = data.unitQuantity
        if (data.category !== undefined) updateData.category = data.category
        if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl
        if (data.stock !== undefined) updateData.stock = data.stock
        if (data.isActive !== undefined) updateData.is_active = data.isActive

        const { data: result, error } = await client
          .from('products')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new NotFoundError(`產品不存在: ${id}`)
          }
          throw ErrorFactory.fromSupabaseError(error, {
            module: this.moduleName,
            action: 'update',
            context: { productId: id },
          })
        }

        dbLogger.info('產品更新成功', {
          module: this.moduleName,
          action: 'update',
          metadata: {
            productId: id,
            updatedFields: Object.keys(updateData),
          },
        })

        return this.transformFromDB(result)
      },
      {
        action: 'update',
        metadata: {
          productId: id,
          queryType: 'update',
        },
      }
    )
  }

  /**
   * 刪除產品
   */
  async delete(id: string): Promise<void> {
    if (!id || id.trim() === '') {
      throw new ValidationError('產品 ID 不能為空')
    }

    return this.executeWithConnection(
      async client => {
        const { error } = await client.from('products').delete().eq('id', id)

        if (error) {
          throw ErrorFactory.fromSupabaseError(error, {
            module: this.moduleName,
            action: 'delete',
            context: { productId: id },
          })
        }

        dbLogger.info('產品刪除成功', {
          module: this.moduleName,
          action: 'delete',
          metadata: { productId: id },
        })
      },
      {
        action: 'delete',
        metadata: {
          productId: id,
          queryType: 'delete',
        },
      }
    )
  }

  /**
   * 批次更新產品狀態（展示批次操作）
   */
  async updateBatchStatus(ids: string[], isActive: boolean): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new ValidationError('產品 ID 列表不能為空')
    }

    const operations = ids.map(id => ({
      operation: async (client: SupabaseClient<Database>) => {
        const { error } = await client
          .from('products')
          .update({
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)

        if (error) {
          throw ErrorFactory.fromSupabaseError(error, {
            module: this.moduleName,
            action: 'updateBatchStatus',
            context: { productId: id },
          })
        }

        return id
      },
      context: {
        action: 'updateBatchStatus',
        metadata: { productId: id, isActive },
      },
    }))

    await this.executeBatch(operations)

    dbLogger.info('批次狀態更新成功', {
      module: this.moduleName,
      action: 'updateBatchStatus',
      metadata: {
        productIds: ids,
        isActive,
        count: ids.length,
      },
    })
  }

  /**
   * 搜尋產品（展示搜尋功能）
   */
  async search(query: string, options: ProductQueryOptions = {}): Promise<Product[]> {
    if (!query || query.trim() === '') {
      throw new ValidationError('搜尋關鍵字不能為空')
    }

    return this.executeWithConnection(
      async client => {
        let dbQuery = client
          .from('products')
          .select('*')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)

        // 應用篩選條件
        if (options.category) {
          dbQuery = dbQuery.eq('category', options.category)
        }

        if (options.isActive !== undefined) {
          dbQuery = dbQuery.eq('is_active', options.isActive)
        }

        // 應用排序和分頁
        dbQuery = dbQuery.order('name', { ascending: true })

        if (options.limit) {
          dbQuery = dbQuery.limit(options.limit)
        }

        const { data, error } = await dbQuery

        if (error) {
          throw ErrorFactory.fromSupabaseError(error, {
            module: this.moduleName,
            action: 'search',
            context: { query },
          })
        }

        return data ? data.map(this.transformFromDB) : []
      },
      {
        action: 'search',
        metadata: {
          query,
          options,
          queryType: 'search',
        },
      }
    )
  }

  /**
   * 取得產品統計資訊（展示聚合查詢）
   */
  async getStats(): Promise<{
    total: number
    active: number
    categories: Record<string, number>
    averagePrice: number
  }> {
    return this.executeWithConnection(
      async client => {
        // 執行多個統計查詢
        const [totalResult, activeResult, categoriesResult, priceResult] = await Promise.all([
          client.from('products').select('id', { count: 'exact' }),
          client.from('products').select('id', { count: 'exact' }).eq('is_active', true),
          client.from('products').select('category'),
          client.from('products').select('price').eq('is_active', true),
        ])

        if (totalResult.error) throw totalResult.error
        if (activeResult.error) throw activeResult.error
        if (categoriesResult.error) throw categoriesResult.error
        if (priceResult.error) throw priceResult.error

        // 計算類別統計
        const categories: Record<string, number> = {}
        categoriesResult.data?.forEach(item => {
          const category = item.category || '未分類'
          categories[category] = (categories[category] || 0) + 1
        })

        // 計算平均價格
        const prices = priceResult.data?.map(item => item.price) || []
        const averagePrice =
          prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0

        return {
          total: totalResult.count || 0,
          active: activeResult.count || 0,
          categories,
          averagePrice: Math.round(averagePrice * 100) / 100, // 保留兩位小數
        }
      },
      {
        action: 'getStats',
        metadata: {
          queryType: 'aggregate',
        },
      }
    )
  }

  /**
   * 驗證建立資料
   */
  private validateCreateData(data: CreateProductData): void {
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('產品名稱不能為空')
    }

    if (data.price < 0) {
      throw new ValidationError('產品價格不能為負數')
    }

    if (data.stock !== undefined && data.stock < 0) {
      throw new ValidationError('庫存數量不能為負數')
    }
  }

  /**
   * 轉換資料庫記錄為業務物件
   */
  private transformFromDB(record: SupabaseProductRecord): Product {
    return {
      id: record.id,
      name: record.name,
      description: record.description || '',
      category: record.category || '',
      price: record.price,
      priceUnit: record.price_unit || undefined,
      unitQuantity: record.unit_quantity || undefined,
      images: record.image_url ? [record.image_url] : ['/images/placeholder.jpg'],
      inventory: record.stock || 0,
      isActive: record.is_active !== false,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }
  }

  /**
   * 取得連線池統計資訊
   */
  async getPoolStats() {
    const poolStatus = await this.checkPoolStatus()
    return poolStatus.stats
  }

  /**
   * 檢查是否使用連線池
   */
  async isPoolEnabled(): Promise<boolean> {
    const poolStatus = await this.checkPoolStatus()
    return poolStatus.enabled
  }

  // === ProductService 介面適配器方法 ===

  /**
   * 取得產品列表（ProductService 介面）
   */
  async getProducts(): Promise<Product[]> {
    return this.findAll({ isActive: true })
  }

  /**
   * 取得所有產品，包含非活躍產品（管理員用）
   */
  async getAllProducts(): Promise<Product[]> {
    return this.findAll()
  }

  /**
   * 新增產品（ProductService 介面）
   */
  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return this.create(product)
  }

  /**
   * 更新產品（ProductService 介面）
   */
  async updateProduct(
    id: string,
    updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Product> {
    const result = await this.update(id, updates)
    if (!result) {
      throw new NotFoundError(`產品 ${id} 不存在`)
    }
    return result
  }

  /**
   * 刪除產品（ProductService 介面）
   */
  async deleteProduct(id: string): Promise<void> {
    await this.delete(id)
  }

  /**
   * 根據 ID 取得產品（ProductService 介面）
   */
  async getProductById(id: string): Promise<Product | null> {
    return this.findById(id)
  }

  /**
   * 搜尋產品（ProductService 介面）
   */
  async searchProducts(query: string): Promise<Product[]> {
    return this.executeWithConnection(
      async client => {
        const { data, error } = await client
          .from('products')
          .select('*')
          .eq('is_active', true)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
          .order('created_at', { ascending: false })

        if (error) {
          throw ErrorFactory.fromSupabaseError(error, {
            module: this.moduleName,
            action: 'searchProducts',
          })
        }

        return (data || []).map(this.transformFromDB)
      },
      { action: 'searchProducts' }
    )
  }
}

// 匯出單例實例
export const pooledProductService = new PooledProductService()
