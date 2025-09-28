import { Product, CreateProductData, UpdateProductData, ProductImage } from '@/types/product'
import { createServiceSupabaseClient } from '@/lib/database/supabase-server'
import { dbLogger } from '@/lib/logger'
import { ErrorFactory } from '@/lib/errors'

export class ProductService {
  private supabase = createServiceSupabaseClient()

  private transformFromDB(record: Record<string, unknown>, images?: ProductImage[]): Product {
    return {
      id: record.id as string,
      name: record.name as string,
      description: record.description as string,
      category: record.category as string,
      price: record.price as number,
      priceUnit: record.price_unit as string | undefined,
      unitQuantity: record.unit_quantity as number | undefined,
      originalPrice: record.original_price as number | undefined,
      isOnSale: (record.is_on_sale as boolean) || false,
      saleEndDate: record.sale_end_date as string | undefined,
      productImages: images || [],
      inventory: (record.stock as number) || 0,
      isActive: (record.is_active as boolean) !== false,
      createdAt: record.created_at as string,
      updatedAt: record.updated_at as string,
    }
  }

  private transformToDB(entity: Partial<Product>): Record<string, unknown> {
    const record: Record<string, unknown> = {}

    if (entity.name !== undefined) record.name = entity.name
    if (entity.description !== undefined) record.description = entity.description
    if (entity.category !== undefined) record.category = entity.category
    if (entity.price !== undefined) record.price = entity.price
    if (entity.priceUnit !== undefined) record.price_unit = entity.priceUnit
    if (entity.unitQuantity !== undefined) record.unit_quantity = entity.unitQuantity
    if (entity.originalPrice !== undefined) record.original_price = entity.originalPrice
    if (entity.isOnSale !== undefined) record.is_on_sale = entity.isOnSale
    if (entity.saleEndDate !== undefined) record.sale_end_date = entity.saleEndDate
    if (entity.inventory !== undefined) record.stock = entity.inventory
    if (entity.isActive !== undefined) record.is_active = entity.isActive

    return record
  }

  private async loadProductImages(productId: string): Promise<ProductImage[]> {
    const { data, error } = await this.supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('position', { ascending: true })

    if (error) {
      dbLogger.warn('載入產品圖片失敗', {
        module: 'ProductService',
        metadata: { productId, error: error.message },
      })
      return []
    }

    return (data || []).map(img => ({
      id: img.id,
      product_id: img.product_id,
      url: img.url,
      path: img.path,
      alt: img.alt,
      position: img.position,
      size: img.size,
      width: img.width,
      height: img.height,
      file_size: img.file_size,
      created_at: img.created_at,
      updated_at: img.updated_at,
    }))
  }

  async getProducts(): Promise<Product[]> {
    const timer = dbLogger.timer('取得產品列表')

    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        throw ErrorFactory.fromSupabaseError(error, {
          module: 'ProductService',
          action: 'getProducts',
        })
      }

      const products = await Promise.all(
        (data || []).map(async record => {
          const images = await this.loadProductImages(record.id)
          return this.transformFromDB(record, images)
        })
      )

      timer.end({ metadata: { count: products.length } })
      return products
    } catch (error) {
      timer.end()
      throw error
    }
  }

  async getAllProducts(): Promise<Product[]> {
    const timer = dbLogger.timer('取得所有產品（含下架）')

    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw ErrorFactory.fromSupabaseError(error, {
          module: 'ProductService',
          action: 'getAllProducts',
        })
      }

      const products = await Promise.all(
        (data || []).map(async record => {
          const images = await this.loadProductImages(record.id)
          return this.transformFromDB(record, images)
        })
      )

      timer.end({ metadata: { count: products.length } })
      return products
    } catch (error) {
      timer.end()
      throw error
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    const timer = dbLogger.timer('取得產品詳情')

    try {
      const { data, error } = await this.supabase.from('products').select('*').eq('id', id).single()

      if (error) {
        if (error.code === 'PGRST116') {
          timer.end({ metadata: { found: false } })
          return null
        }
        throw ErrorFactory.fromSupabaseError(error, {
          module: 'ProductService',
          action: 'getProductById',
          context: { productId: id },
        })
      }

      const images = await this.loadProductImages(id)
      const product = this.transformFromDB(data, images)

      timer.end({ metadata: { found: true, productId: id } })
      return product
    } catch (error) {
      timer.end()
      throw error
    }
  }

  async addProduct(productData: CreateProductData): Promise<Product> {
    const timer = dbLogger.timer('新增產品')

    try {
      const dbData = this.transformToDB(productData as Partial<Product>)

      const { data, error } = await this.supabase
        .from('products')
        .insert(dbData as any) // 使用 any 繞過 Supabase 的嚴格類型檢查
        .select()
        .single()

      if (error) {
        throw ErrorFactory.fromSupabaseError(error, {
          module: 'ProductService',
          action: 'addProduct',
          context: { productName: productData.name },
        })
      }

      const product = this.transformFromDB(data, [])

      timer.end({ metadata: { productId: product.id } })
      dbLogger.info('產品新增成功', {
        module: 'ProductService',
        metadata: { productId: product.id, productName: product.name },
      })

      return product
    } catch (error) {
      timer.end()
      throw error
    }
  }

  async updateProduct(id: string, productData: UpdateProductData): Promise<Product> {
    const timer = dbLogger.timer('更新產品')

    try {
      const dbData = this.transformToDB(productData as Partial<Product>)

      const { data, error } = await this.supabase
        .from('products')
        .update(dbData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw ErrorFactory.fromSupabaseError(error, {
          module: 'ProductService',
          action: 'updateProduct',
          context: { productId: id },
        })
      }

      const images = await this.loadProductImages(id)
      const product = this.transformFromDB(data, images)

      timer.end({ metadata: { productId: id } })
      dbLogger.info('產品更新成功', {
        module: 'ProductService',
        metadata: { productId: id, productName: product.name },
      })

      return product
    } catch (error) {
      timer.end()
      throw error
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const timer = dbLogger.timer('刪除產品')

    try {
      const { error } = await this.supabase.from('products').delete().eq('id', id)

      if (error) {
        throw ErrorFactory.fromSupabaseError(error, {
          module: 'ProductService',
          action: 'deleteProduct',
          context: { productId: id },
        })
      }

      timer.end({ metadata: { productId: id } })
      dbLogger.info('產品刪除成功', {
        module: 'ProductService',
        metadata: { productId: id },
      })
    } catch (error) {
      timer.end()
      throw error
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    const timer = dbLogger.timer('搜尋產品')

    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        throw ErrorFactory.fromSupabaseError(error, {
          module: 'ProductService',
          action: 'searchProducts',
          context: { query },
        })
      }

      const products = await Promise.all(
        (data || []).map(async record => {
          const images = await this.loadProductImages(record.id)
          return this.transformFromDB(record, images)
        })
      )

      timer.end({ metadata: { query, count: products.length } })
      return products
    } catch (error) {
      timer.end()
      throw error
    }
  }
}

export const productService = new ProductService()
export const adminProductService = productService
