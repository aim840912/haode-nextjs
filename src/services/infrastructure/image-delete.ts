/**
 * 圖片刪除模組
 * 負責圖片的刪除操作（單張和批量）
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { dbLogger } from '@/lib/logger'
import type { Database } from '@/types/database'
import { UnifiedImageError } from './image-error'
import { ImageStorageManager } from './image-storage'
import { validateImageParams } from './image-validation'

type ImageRecord = Database['public']['Tables']['images']['Row']

export class ImageDeleter {
  constructor(private storageManager: ImageStorageManager) {}

  /**
   * 刪除圖片
   */
  async deleteImage(imageId: string): Promise<void> {
    try {
      const Admin = getSupabaseAdmin()
      if (!Admin) {
        throw new UnifiedImageError('Supabase admin client 未配置')
      }

      // 先查詢圖片記錄
      const { data: imageData, error: fetchError } = await (Admin as any)
        .from('images')
        .select('file_path, module, entity_id')
        .eq('id', imageId)
        .single()

      if (fetchError || !imageData) {
        throw new UnifiedImageError('找不到圖片記錄', fetchError)
      }

      const dbImageData = imageData as ImageRecord
      // 從 Storage 刪除檔案
      await this.storageManager.deleteFromStorage(dbImageData.file_path)

      // 從資料庫刪除記錄
      const { error: deleteError } = await (Admin as any).from('images').delete().eq('id', imageId)

      if (deleteError) {
        throw new UnifiedImageError('刪除圖片記錄失敗', deleteError)
      }

      dbLogger.info('圖片刪除成功', {
        module: 'ImageDeleter',
        metadata: {
          imageId,
          module: dbImageData.module,
          entityId: dbImageData.entity_id,
        },
      })
    } catch (error) {
      if (error instanceof UnifiedImageError) {
        throw error
      }
      throw new UnifiedImageError('刪除過程發生未知錯誤', error)
    }
  }

  /**
   * 刪除實體的所有圖片
   */
  async deleteEntityImages(
    module: string,
    entityId: string,
    getImagesFn: (module: string, entityId: string) => Promise<ImageRecord[]>
  ): Promise<number> {
    try {
      validateImageParams(module, entityId)

      const Admin = getSupabaseAdmin()
      if (!Admin) {
        throw new UnifiedImageError('Supabase admin client 未配置')
      }

      // 查詢所有圖片
      const images = await getImagesFn(module, entityId)

      if (images.length === 0) {
        return 0
      }

      // 批量刪除檔案
      const filePaths = images.map(img => img.file_path)
      await this.storageManager.deleteBatchFromStorage(filePaths)

      // 從資料庫刪除記錄
      const { error } = await (Admin as any)
        .from('images')
        .delete()
        .eq('module', module)
        .eq('entity_id', entityId)

      if (error) {
        throw new UnifiedImageError('批量刪除圖片記錄失敗', error)
      }

      dbLogger.info('實體圖片批量刪除成功', {
        module: 'ImageDeleter',
        metadata: { module, entityId, count: images.length },
      })

      return images.length
    } catch (error) {
      if (error instanceof UnifiedImageError) {
        throw error
      }
      throw new UnifiedImageError('批量刪除過程發生未知錯誤', error)
    }
  }
}
