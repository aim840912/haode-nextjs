import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { dbLogger } from '@/lib/logger'
import { DatabaseError, NotFoundError, ValidationError, ErrorFactory } from '@/lib/errors'
import type { Database } from '@/types/database'
import type { ProductImage } from '@/types/product'

type ProductImageRow = Database['public']['Tables']['product_images']['Row']
type ProductImageInsert = Database['public']['Tables']['product_images']['Insert']
type ProductImageUpdate = Database['public']['Tables']['product_images']['Update']

export interface CreateProductImageData {
  product_id: string
  url: string
  path: string
  alt?: string
  position?: number
  size?: 'thumbnail' | 'medium' | 'large'
  width?: number
  height?: number
  file_size?: number
}

export interface UpdateProductImageData {
  url?: string
  path?: string
  alt?: string
  position?: number
  size?: 'thumbnail' | 'medium' | 'large'
  width?: number
  height?: number
  file_size?: number
}

export class ProductImageService {
  private static readonly TABLE_NAME = 'product_images'
  private static readonly MODULE_NAME = 'ProductImageService'

  private static transformFromDB(row: ProductImageRow): ProductImage {
    return {
      id: row.id,
      product_id: row.product_id,
      url: row.url,
      path: row.path,
      alt: row.alt || undefined,
      position: row.position,
      size: row.size as 'thumbnail' | 'medium' | 'large',
      width: row.width || undefined,
      height: row.height || undefined,
      file_size: row.file_size || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }
  }

  static async getProductImages(productId: string): Promise<ProductImage[]> {
    const timer = dbLogger.timer('查詢產品圖片')

    try {
      const supabase = getSupabaseAdmin()
      if (!supabase) {
        throw new DatabaseError('Supabase admin client 未初始化')
      }

      dbLogger.debug('查詢產品圖片', {
        module: this.MODULE_NAME,
        action: 'getProductImages',
        metadata: { productId },
      })

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('product_id', productId)
        .order('position', { ascending: true })

      if (error) throw error

      const images = (data || []).map(this.transformFromDB)
      timer.end({ metadata: { productId, count: images.length } })

      dbLogger.info('產品圖片查詢成功', {
        module: this.MODULE_NAME,
        action: 'getProductImages',
        metadata: { productId, imageCount: images.length },
      })

      return images
    } catch (error) {
      timer.end()
      dbLogger.error('查詢產品圖片失敗', error as Error, {
        module: this.MODULE_NAME,
        action: 'getProductImages',
        metadata: { productId },
      })
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.MODULE_NAME,
        action: 'getProductImages',
      })
    }
  }

  static async getImageById(imageId: string): Promise<ProductImage | null> {
    const timer = dbLogger.timer('查詢圖片')

    try {
      const supabase = getSupabaseAdmin()
      if (!supabase) {
        throw new DatabaseError('Supabase admin client 未初始化')
      }

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', imageId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          timer.end({ metadata: { found: false } })
          return null
        }
        throw error
      }

      const image = this.transformFromDB(data)
      timer.end({ metadata: { imageId, found: true } })

      return image
    } catch (error) {
      timer.end()
      dbLogger.error('查詢圖片失敗', error as Error, {
        module: this.MODULE_NAME,
        action: 'getImageById',
        metadata: { imageId },
      })
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.MODULE_NAME,
        action: 'getImageById',
      })
    }
  }

  static async createProductImage(imageData: CreateProductImageData): Promise<ProductImage> {
    const timer = dbLogger.timer('建立產品圖片')

    try {
      const supabase = getSupabaseAdmin()
      if (!supabase) {
        throw new DatabaseError('Supabase admin client 未初始化')
      }

      if (!imageData.product_id || !imageData.url || !imageData.path) {
        throw new ValidationError('product_id, url, path 為必填欄位')
      }

      const insertData: ProductImageInsert = {
        product_id: imageData.product_id,
        url: imageData.url,
        path: imageData.path,
        alt: imageData.alt,
        position: imageData.position ?? 0,
        size: imageData.size ?? 'medium',
        width: imageData.width,
        height: imageData.height,
        file_size: imageData.file_size,
      }

      dbLogger.debug('建立產品圖片', {
        module: this.MODULE_NAME,
        action: 'createProductImage',
        metadata: { productId: imageData.product_id, position: insertData.position },
      })

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      const image = this.transformFromDB(data)
      timer.end({ metadata: { imageId: image.id } })

      dbLogger.info('產品圖片建立成功', {
        module: this.MODULE_NAME,
        action: 'createProductImage',
        metadata: { imageId: image.id, productId: image.product_id },
      })

      return image
    } catch (error) {
      timer.end()
      dbLogger.error('建立產品圖片失敗', error as Error, {
        module: this.MODULE_NAME,
        action: 'createProductImage',
        metadata: { productId: imageData.product_id },
      })
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.MODULE_NAME,
        action: 'createProductImage',
      })
    }
  }

  static async createProductImages(imagesData: CreateProductImageData[]): Promise<ProductImage[]> {
    const timer = dbLogger.timer('批次建立產品圖片')

    try {
      const supabase = getSupabaseAdmin()
      if (!supabase) {
        throw new DatabaseError('Supabase admin client 未初始化')
      }

      if (imagesData.length === 0) {
        return []
      }

      for (const imageData of imagesData) {
        if (!imageData.product_id || !imageData.url || !imageData.path) {
          throw new ValidationError('所有圖片都必須包含 product_id, url, path')
        }
      }

      const insertData: ProductImageInsert[] = imagesData.map((imageData, index) => ({
        product_id: imageData.product_id,
        url: imageData.url,
        path: imageData.path,
        alt: imageData.alt,
        position: imageData.position ?? index,
        size: imageData.size ?? 'medium',
        width: imageData.width,
        height: imageData.height,
        file_size: imageData.file_size,
      }))

      dbLogger.debug('批次建立產品圖片', {
        module: this.MODULE_NAME,
        action: 'createProductImages',
        metadata: { count: insertData.length },
      })

      const { data, error } = await supabase.from(this.TABLE_NAME).insert(insertData).select()

      if (error) {
        dbLogger.error('Supabase 原始錯誤', new Error(JSON.stringify(error, null, 2)), {
          module: this.MODULE_NAME,
          action: 'createProductImages',
          metadata: {
            errorCode: error.code,
            errorMessage: error.message,
            errorDetails: error.details,
            errorHint: error.hint,
          },
        })
        throw error
      }

      const images = (data || []).map(this.transformFromDB)
      timer.end({ metadata: { count: images.length } })

      dbLogger.info('批次建立產品圖片成功', {
        module: this.MODULE_NAME,
        action: 'createProductImages',
        metadata: { count: images.length },
      })

      return images
    } catch (error) {
      timer.end()
      dbLogger.error('批次建立產品圖片失敗', error as Error, {
        module: this.MODULE_NAME,
        action: 'createProductImages',
        metadata: { count: imagesData.length },
      })
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.MODULE_NAME,
        action: 'createProductImages',
      })
    }
  }

  static async updateProductImage(
    imageId: string,
    updateData: UpdateProductImageData
  ): Promise<ProductImage> {
    const timer = dbLogger.timer('更新產品圖片')

    try {
      const supabase = getSupabaseAdmin()
      if (!supabase) {
        throw new DatabaseError('Supabase admin client 未初始化')
      }

      const existingImage = await this.getImageById(imageId)
      if (!existingImage) {
        throw new NotFoundError(`圖片不存在: ${imageId}`)
      }

      const updatePayload: ProductImageUpdate = {
        ...(updateData.url && { url: updateData.url }),
        ...(updateData.path && { path: updateData.path }),
        ...(updateData.alt !== undefined && { alt: updateData.alt }),
        ...(updateData.position !== undefined && { position: updateData.position }),
        ...(updateData.size && { size: updateData.size }),
        ...(updateData.width !== undefined && { width: updateData.width }),
        ...(updateData.height !== undefined && { height: updateData.height }),
        ...(updateData.file_size !== undefined && { file_size: updateData.file_size }),
      }

      dbLogger.debug('更新產品圖片', {
        module: this.MODULE_NAME,
        action: 'updateProductImage',
        metadata: { imageId, fields: Object.keys(updatePayload) },
      })

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .update(updatePayload)
        .eq('id', imageId)
        .select()
        .single()

      if (error) throw error

      const image = this.transformFromDB(data)
      timer.end({ metadata: { imageId } })

      dbLogger.info('產品圖片更新成功', {
        module: this.MODULE_NAME,
        action: 'updateProductImage',
        metadata: { imageId },
      })

      return image
    } catch (error) {
      timer.end()
      dbLogger.error('更新產品圖片失敗', error as Error, {
        module: this.MODULE_NAME,
        action: 'updateProductImage',
        metadata: { imageId },
      })
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.MODULE_NAME,
        action: 'updateProductImage',
      })
    }
  }

  static async deleteProductImage(imageId: string): Promise<void> {
    const timer = dbLogger.timer('刪除產品圖片')

    try {
      const supabase = getSupabaseAdmin()
      if (!supabase) {
        throw new DatabaseError('Supabase admin client 未初始化')
      }

      const existingImage = await this.getImageById(imageId)
      if (!existingImage) {
        throw new NotFoundError(`圖片不存在: ${imageId}`)
      }

      dbLogger.debug('刪除產品圖片', {
        module: this.MODULE_NAME,
        action: 'deleteProductImage',
        metadata: { imageId, productId: existingImage.product_id },
      })

      const { error } = await supabase.from(this.TABLE_NAME).delete().eq('id', imageId)

      if (error) throw error

      timer.end({ metadata: { imageId, deleted: true } })

      dbLogger.info('產品圖片刪除成功', {
        module: this.MODULE_NAME,
        action: 'deleteProductImage',
        metadata: { imageId },
      })
    } catch (error) {
      timer.end()
      dbLogger.error('刪除產品圖片失敗', error as Error, {
        module: this.MODULE_NAME,
        action: 'deleteProductImage',
        metadata: { imageId },
      })
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.MODULE_NAME,
        action: 'deleteProductImage',
      })
    }
  }

  static async clearProductImages(productId: string): Promise<void> {
    const timer = dbLogger.timer('清除產品所有圖片')

    try {
      const supabase = getSupabaseAdmin()
      if (!supabase) {
        throw new DatabaseError('Supabase admin client 未初始化')
      }

      const existingImages = await this.getProductImages(productId)

      dbLogger.debug('清除產品所有圖片', {
        module: this.MODULE_NAME,
        action: 'clearProductImages',
        metadata: { productId, imageCount: existingImages.length },
      })

      const { error } = await supabase.from(this.TABLE_NAME).delete().eq('product_id', productId)

      if (error) throw error

      timer.end({ metadata: { productId, deletedCount: existingImages.length } })

      dbLogger.info('產品圖片清除成功', {
        module: this.MODULE_NAME,
        action: 'clearProductImages',
        metadata: { productId, deletedCount: existingImages.length },
      })
    } catch (error) {
      timer.end()
      dbLogger.error('清除產品圖片失敗', error as Error, {
        module: this.MODULE_NAME,
        action: 'clearProductImages',
        metadata: { productId },
      })
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.MODULE_NAME,
        action: 'clearProductImages',
      })
    }
  }

  static async reorderImages(
    productId: string,
    imageOrders: { id: string; position: number }[]
  ): Promise<void> {
    const timer = dbLogger.timer('重新排序產品圖片')

    try {
      const supabase = getSupabaseAdmin()
      if (!supabase) {
        throw new DatabaseError('Supabase admin client 未初始化')
      }

      dbLogger.debug('重新排序產品圖片', {
        module: this.MODULE_NAME,
        action: 'reorderImages',
        metadata: { productId, count: imageOrders.length },
      })

      for (const { id, position } of imageOrders) {
        const { error } = await supabase
          .from(this.TABLE_NAME)
          .update({ position })
          .eq('id', id)
          .eq('product_id', productId)

        if (error) throw error
      }

      timer.end({ metadata: { productId, count: imageOrders.length } })

      dbLogger.info('產品圖片排序成功', {
        module: this.MODULE_NAME,
        action: 'reorderImages',
        metadata: { productId, count: imageOrders.length },
      })
    } catch (error) {
      timer.end()
      dbLogger.error('重新排序產品圖片失敗', error as Error, {
        module: this.MODULE_NAME,
        action: 'reorderImages',
        metadata: { productId },
      })
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.MODULE_NAME,
        action: 'reorderImages',
      })
    }
  }

  static async setPrimaryImage(productId: string, imageId: string): Promise<void> {
    const timer = dbLogger.timer('設定主圖')

    try {
      const supabase = getSupabaseAdmin()
      if (!supabase) {
        throw new DatabaseError('Supabase admin client 未初始化')
      }

      const targetImage = await this.getImageById(imageId)
      if (!targetImage) {
        throw new NotFoundError(`圖片不存在: ${imageId}`)
      }

      if (targetImage.product_id !== productId) {
        throw new ValidationError('圖片不屬於指定產品')
      }

      dbLogger.debug('設定主圖', {
        module: this.MODULE_NAME,
        action: 'setPrimaryImage',
        metadata: { productId, imageId },
      })

      const currentPrimary = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('product_id', productId)
        .eq('position', 0)
        .maybeSingle()

      if (currentPrimary.data) {
        await supabase
          .from(this.TABLE_NAME)
          .update({ position: targetImage.position })
          .eq('id', currentPrimary.data.id)
      }

      await supabase.from(this.TABLE_NAME).update({ position: 0 }).eq('id', imageId)

      timer.end({ metadata: { productId, imageId } })

      dbLogger.info('主圖設定成功', {
        module: this.MODULE_NAME,
        action: 'setPrimaryImage',
        metadata: { productId, imageId },
      })
    } catch (error) {
      timer.end()
      dbLogger.error('設定主圖失敗', error as Error, {
        module: this.MODULE_NAME,
        action: 'setPrimaryImage',
        metadata: { productId, imageId },
      })
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.MODULE_NAME,
        action: 'setPrimaryImage',
      })
    }
  }

  static async getMainImage(productId: string): Promise<ProductImage | null> {
    const timer = dbLogger.timer('查詢主圖')

    try {
      const supabase = getSupabaseAdmin()
      if (!supabase) {
        throw new DatabaseError('Supabase admin client 未初始化')
      }

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('product_id', productId)
        .eq('position', 0)
        .maybeSingle()

      if (error) throw error

      timer.end({ metadata: { productId, found: !!data } })

      return data ? this.transformFromDB(data) : null
    } catch (error) {
      timer.end()
      dbLogger.error('查詢主圖失敗', error as Error, {
        module: this.MODULE_NAME,
        action: 'getMainImage',
        metadata: { productId },
      })
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.MODULE_NAME,
        action: 'getMainImage',
      })
    }
  }
}

export const productImageService = ProductImageService
