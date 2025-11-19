/**
 * 圖片排序服務
 *
 * 負責圖片的排序和主圖設定:
 * - 批次重新排序
 * - 設定主圖(將圖片移到 position 0)
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { DatabaseError, NotFoundError, ValidationError, ErrorFactory } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import { getImageById } from './image-query'

const TABLE_NAME = 'images'
const MODULE_NAME = 'ProductImageService'
const MODULE = 'products'

/**
 * 重新排序產品圖片
 */
export async function reorderImages(
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
      module: MODULE_NAME,
      action: 'reorderImages',
      metadata: { productId, count: imageOrders.length },
    })

    // 使用批次 RPC function 一次更新所有位置 (優化 N+1 查詢)
    // 將 imageOrders 轉換為 JSONB 格式: { "uuid1": position1, "uuid2": position2, ... }
    const updates = imageOrders.reduce(
      (acc, { id, position }) => {
        acc[id] = position
        return acc
      },
      {} as Record<string, number>
    )

    // 使用 as any 繞過型別檢查 (新增的 RPC function 尚未在型別定義中)
    const { error } = await (supabase as any).rpc('batch_update_image_positions', {
      p_product_id: productId,
      p_updates: updates,
    })

    if (error) throw error

    timer.end({ metadata: { productId, count: imageOrders.length } })

    dbLogger.info('產品圖片排序成功', {
      module: MODULE_NAME,
      action: 'reorderImages',
      metadata: { productId, count: imageOrders.length },
    })
  } catch (error) {
    timer.end()
    dbLogger.error('重新排序產品圖片失敗', error as Error, {
      module: MODULE_NAME,
      action: 'reorderImages',
      metadata: { productId },
    })
    throw ErrorFactory.fromSupabaseError(error, {
      module: MODULE_NAME,
      action: 'reorderImages',
    })
  }
}

/**
 * 設定主圖(將指定圖片移到 position 0,原主圖移到目標位置)
 */
export async function setPrimaryImage(productId: string, imageId: string): Promise<void> {
  const timer = dbLogger.timer('設定主圖')

  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new DatabaseError('Supabase admin client 未初始化')
    }

    const targetImage = await getImageById(imageId)
    if (!targetImage) {
      throw new NotFoundError(`圖片不存在: ${imageId}`)
    }

    if (targetImage.entity_id !== productId) {
      throw new ValidationError('圖片不屬於指定產品')
    }

    dbLogger.debug('設定主圖', {
      module: MODULE_NAME,
      action: 'setPrimaryImage',
      metadata: { productId, imageId },
    })

    // 查詢當前主圖
    const currentPrimary = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('module', MODULE)
      .eq('entity_id', productId)
      .eq('display_position', 0)
      .maybeSingle()

    // 交換位置
    if (currentPrimary.data) {
      await supabase
        .from(TABLE_NAME)
        .update({ display_position: targetImage.display_position })
        .eq('id', currentPrimary.data.id)
    }

    await supabase.from(TABLE_NAME).update({ display_position: 0 }).eq('id', imageId)

    timer.end({ metadata: { productId, imageId } })

    dbLogger.info('主圖設定成功', {
      module: MODULE_NAME,
      action: 'setPrimaryImage',
      metadata: { productId, imageId },
    })
  } catch (error) {
    timer.end()
    dbLogger.error('設定主圖失敗', error as Error, {
      module: MODULE_NAME,
      action: 'setPrimaryImage',
      metadata: { productId, imageId },
    })
    throw ErrorFactory.fromSupabaseError(error, {
      module: MODULE_NAME,
      action: 'setPrimaryImage',
    })
  }
}
