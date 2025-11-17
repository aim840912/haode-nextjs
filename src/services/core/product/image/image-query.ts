/**
 * 圖片查詢服務
 *
 * 負責圖片的查詢操作:
 * - 產品圖片列表查詢
 * - 單張圖片查詢
 * - 主圖查詢
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { DatabaseError, ErrorFactory } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import type { ProductImage } from '@/types/product'
import { transformFromDB } from './image-transform'

const TABLE_NAME = 'images'
const MODULE_NAME = 'ProductImageService'
const MODULE = 'products'

/**
 * 取得產品所有圖片
 */
export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const timer = dbLogger.timer('查詢產品圖片')

  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new DatabaseError('Supabase admin client 未初始化')
    }

    dbLogger.debug('查詢產品圖片', {
      module: MODULE_NAME,
      action: 'getProductImages',
      metadata: { productId },
    })

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('module', MODULE)
      .eq('entity_id', productId)
      .order('display_position', { ascending: true })

    if (error) throw error

    const images = (data || []).map(transformFromDB)
    timer.end({ metadata: { productId, count: images.length } })

    dbLogger.info('產品圖片查詢成功', {
      module: MODULE_NAME,
      action: 'getProductImages',
      metadata: { productId, imageCount: images.length },
    })

    return images
  } catch (error) {
    timer.end()
    dbLogger.error('查詢產品圖片失敗', error as Error, {
      module: MODULE_NAME,
      action: 'getProductImages',
      metadata: { productId },
    })
    throw ErrorFactory.fromSupabaseError(error, {
      module: MODULE_NAME,
      action: 'getProductImages',
    })
  }
}

/**
 * 根據 ID 查詢圖片
 */
export async function getImageById(imageId: string): Promise<ProductImage | null> {
  const timer = dbLogger.timer('查詢圖片')

  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new DatabaseError('Supabase admin client 未初始化')
    }

    const { data, error } = await supabase.from(TABLE_NAME).select('*').eq('id', imageId).single()

    if (error) {
      if (error.code === 'PGRST116') {
        timer.end({ metadata: { found: false } })
        return null
      }
      throw error
    }

    const image = transformFromDB(data)
    timer.end({ metadata: { imageId, found: true } })

    return image
  } catch (error) {
    timer.end()
    dbLogger.error('查詢圖片失敗', error as Error, {
      module: MODULE_NAME,
      action: 'getImageById',
      metadata: { imageId },
    })
    throw ErrorFactory.fromSupabaseError(error, {
      module: MODULE_NAME,
      action: 'getImageById',
    })
  }
}

/**
 * 查詢主圖(display_position = 0)
 */
export async function getMainImage(productId: string): Promise<ProductImage | null> {
  const timer = dbLogger.timer('查詢主圖')

  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new DatabaseError('Supabase admin client 未初始化')
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('module', MODULE)
      .eq('entity_id', productId)
      .eq('display_position', 0)
      .maybeSingle()

    if (error) throw error

    timer.end({ metadata: { productId, found: !!data } })

    return data ? transformFromDB(data) : null
  } catch (error) {
    timer.end()
    dbLogger.error('查詢主圖失敗', error as Error, {
      module: MODULE_NAME,
      action: 'getMainImage',
      metadata: { productId },
    })
    throw ErrorFactory.fromSupabaseError(error, {
      module: MODULE_NAME,
      action: 'getMainImage',
    })
  }
}
