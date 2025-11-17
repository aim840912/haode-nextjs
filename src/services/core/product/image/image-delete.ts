/**
 * 圖片刪除服務
 *
 * 負責圖片的刪除操作:
 * - 單張圖片刪除
 * - 產品所有圖片清除
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { DatabaseError, NotFoundError, ErrorFactory } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import { getImageById, getProductImages } from './image-query'

const TABLE_NAME = 'images'
const MODULE_NAME = 'ProductImageService'
const MODULE = 'products'

/**
 * 刪除單張產品圖片
 */
export async function deleteProductImage(imageId: string): Promise<void> {
  const timer = dbLogger.timer('刪除產品圖片')

  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new DatabaseError('Supabase admin client 未初始化')
    }

    const existingImage = await getImageById(imageId)
    if (!existingImage) {
      throw new NotFoundError(`圖片不存在: ${imageId}`)
    }

    dbLogger.debug('刪除產品圖片', {
      module: MODULE_NAME,
      action: 'deleteProductImage',
      metadata: { imageId, productId: existingImage.entity_id },
    })

    const { error } = await supabase.from(TABLE_NAME).delete().eq('id', imageId)

    if (error) throw error

    timer.end({ metadata: { imageId, deleted: true } })

    dbLogger.info('產品圖片刪除成功', {
      module: MODULE_NAME,
      action: 'deleteProductImage',
      metadata: { imageId },
    })
  } catch (error) {
    timer.end()
    dbLogger.error('刪除產品圖片失敗', error as Error, {
      module: MODULE_NAME,
      action: 'deleteProductImage',
      metadata: { imageId },
    })
    throw ErrorFactory.fromSupabaseError(error, {
      module: MODULE_NAME,
      action: 'deleteProductImage',
    })
  }
}

/**
 * 清除產品所有圖片
 */
export async function clearProductImages(productId: string): Promise<void> {
  const timer = dbLogger.timer('清除產品所有圖片')

  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new DatabaseError('Supabase admin client 未初始化')
    }

    const existingImages = await getProductImages(productId)

    dbLogger.debug('清除產品所有圖片', {
      module: MODULE_NAME,
      action: 'clearProductImages',
      metadata: { productId, imageCount: existingImages.length },
    })

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('module', MODULE)
      .eq('entity_id', productId)

    if (error) throw error

    timer.end({ metadata: { productId, deletedCount: existingImages.length } })

    dbLogger.info('產品圖片清除成功', {
      module: MODULE_NAME,
      action: 'clearProductImages',
      metadata: { productId, deletedCount: existingImages.length },
    })
  } catch (error) {
    timer.end()
    dbLogger.error('清除產品圖片失敗', error as Error, {
      module: MODULE_NAME,
      action: 'clearProductImages',
      metadata: { productId },
    })
    throw ErrorFactory.fromSupabaseError(error, {
      module: MODULE_NAME,
      action: 'clearProductImages',
    })
  }
}
