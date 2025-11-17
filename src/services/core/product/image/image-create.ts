/**
 * 圖片建立服務
 *
 * 負責圖片的建立操作:
 * - 單張圖片建立
 * - 批次圖片建立
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { DatabaseError, ValidationError, ErrorFactory } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import type { Database } from '@/types/database'
import type { ProductImage } from '@/types/product'
import { transformFromDB } from './image-transform'

type ImageInsert = Database['public']['Tables']['images']['Insert']

const TABLE_NAME = 'images'
const MODULE_NAME = 'ProductImageService'
const MODULE = 'products'

export interface CreateProductImageData {
  product_id: string
  storage_url: string
  file_path: string
  alt_text?: string
  display_position?: number
  size?: 'thumbnail' | 'medium' | 'large'
  width?: number
  height?: number
  file_size?: number
}

/**
 * 建立單張產品圖片
 */
export async function createProductImage(imageData: CreateProductImageData): Promise<ProductImage> {
  const timer = dbLogger.timer('建立產品圖片')

  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new DatabaseError('Supabase admin client 未初始化')
    }

    if (!imageData.product_id || !imageData.storage_url || !imageData.file_path) {
      throw new ValidationError('product_id, storage_url, file_path 為必填欄位')
    }

    const insertData: ImageInsert = {
      module: MODULE,
      entity_id: imageData.product_id,
      storage_url: imageData.storage_url,
      file_path: imageData.file_path,
      alt_text: imageData.alt_text,
      display_position: imageData.display_position ?? 0,
      size: imageData.size ?? 'medium',
      metadata: {
        width: imageData.width,
        height: imageData.height,
        file_size: imageData.file_size,
      },
    }

    dbLogger.debug('建立產品圖片', {
      module: MODULE_NAME,
      action: 'createProductImage',
      metadata: { productId: imageData.product_id, position: insertData.display_position },
    })

    const { data, error } = await supabase.from(TABLE_NAME).insert(insertData).select().single()

    if (error) throw error

    const image = transformFromDB(data)
    timer.end({ metadata: { imageId: image.id } })

    dbLogger.info('產品圖片建立成功', {
      module: MODULE_NAME,
      action: 'createProductImage',
      metadata: { imageId: image.id, productId: image.entity_id },
    })

    return image
  } catch (error) {
    timer.end()
    dbLogger.error('建立產品圖片失敗', error as Error, {
      module: MODULE_NAME,
      action: 'createProductImage',
      metadata: { productId: imageData.product_id },
    })
    throw ErrorFactory.fromSupabaseError(error, {
      module: MODULE_NAME,
      action: 'createProductImage',
    })
  }
}

/**
 * 批次建立產品圖片
 */
export async function createProductImages(
  imagesData: CreateProductImageData[]
): Promise<ProductImage[]> {
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
      if (!imageData.product_id || !imageData.storage_url || !imageData.file_path) {
        throw new ValidationError('所有圖片都必須包含 product_id, storage_url, file_path')
      }
    }

    const insertData: ImageInsert[] = imagesData.map((imageData, index) => ({
      module: MODULE,
      entity_id: imageData.product_id,
      storage_url: imageData.storage_url,
      file_path: imageData.file_path,
      alt_text: imageData.alt_text,
      display_position: imageData.display_position ?? index,
      size: imageData.size ?? 'medium',
      metadata: {
        width: imageData.width,
        height: imageData.height,
        file_size: imageData.file_size,
      },
    }))

    dbLogger.debug('批次建立產品圖片', {
      module: MODULE_NAME,
      action: 'createProductImages',
      metadata: { count: insertData.length },
    })

    const { data, error } = await supabase.from(TABLE_NAME).insert(insertData).select()

    if (error) {
      dbLogger.error('Supabase 原始錯誤', new Error(JSON.stringify(error, null, 2)), {
        module: MODULE_NAME,
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

    const images = (data || []).map(transformFromDB)
    timer.end({ metadata: { count: images.length } })

    dbLogger.info('批次建立產品圖片成功', {
      module: MODULE_NAME,
      action: 'createProductImages',
      metadata: { count: images.length },
    })

    return images
  } catch (error) {
    timer.end()
    dbLogger.error('批次建立產品圖片失敗', error as Error, {
      module: MODULE_NAME,
      action: 'createProductImages',
      metadata: { count: imagesData.length },
    })
    throw ErrorFactory.fromSupabaseError(error, {
      module: MODULE_NAME,
      action: 'createProductImages',
    })
  }
}
