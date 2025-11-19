/**
 * 圖片更新服務
 *
 * 負責圖片資料的更新操作
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { DatabaseError, NotFoundError, ErrorFactory } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import type { Database } from '@/types/database'
import type { ProductImage } from '@/types/product'
import { getImageById } from './image-query'
import { transformFromDB } from './image-transform'

type ImageUpdate = Database['public']['Tables']['images']['Update']

const TABLE_NAME = 'images'
const MODULE_NAME = 'ProductImageService'

export interface UpdateProductImageData {
  storage_url?: string
  file_path?: string
  alt_text?: string
  display_position?: number
  size?: 'thumbnail' | 'medium' | 'large'
  width?: number
  height?: number
  file_size?: number
}

/**
 * 更新產品圖片
 */
export async function updateProductImage(
  imageId: string,
  updateData: UpdateProductImageData
): Promise<ProductImage> {
  const timer = dbLogger.timer('更新產品圖片')

  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new DatabaseError('Supabase admin client 未初始化')
    }

    const existingImage = await getImageById(imageId)
    if (!existingImage) {
      throw new NotFoundError(`圖片不存在: ${imageId}`)
    }

    const metadata: Partial<{ width: number; height: number; file_size: number }> = {}
    if (updateData.width !== undefined) metadata.width = updateData.width
    if (updateData.height !== undefined) metadata.height = updateData.height
    if (updateData.file_size !== undefined) metadata.file_size = updateData.file_size

    const updatePayload: ImageUpdate = {
      ...(updateData.storage_url && { storage_url: updateData.storage_url }),
      ...(updateData.file_path && { file_path: updateData.file_path }),
      ...(updateData.alt_text !== undefined && { alt_text: updateData.alt_text }),
      ...(updateData.display_position !== undefined && {
        display_position: updateData.display_position,
      }),
      ...(updateData.size && { size: updateData.size }),
      ...(Object.keys(metadata).length > 0 && { metadata }),
    }

    dbLogger.debug('更新產品圖片', {
      module: MODULE_NAME,
      action: 'updateProductImage',
      metadata: { imageId, fields: Object.keys(updatePayload) },
    })

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updatePayload)
      .eq('id', imageId)
      .select()
      .single()

    if (error) throw error

    const image = transformFromDB(data)
    timer.end({ metadata: { imageId } })

    dbLogger.info('產品圖片更新成功', {
      module: MODULE_NAME,
      action: 'updateProductImage',
      metadata: { imageId },
    })

    return image
  } catch (error) {
    timer.end()
    dbLogger.error('更新產品圖片失敗', error as Error, {
      module: MODULE_NAME,
      action: 'updateProductImage',
      metadata: { imageId },
    })
    throw ErrorFactory.fromSupabaseError(error, {
      module: MODULE_NAME,
      action: 'updateProductImage',
    })
  }
}
