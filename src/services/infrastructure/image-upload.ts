/**
 * 圖片上傳模組
 * 負責圖片上傳和資料庫記錄建立
 */

import { getModuleConfig, getModuleStoragePath } from '@/config/image-modules.config'
import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { dbLogger } from '@/lib/logger'
import { validateImageFile, generateFileName } from '@/lib/utils/image-utils'
import type { Database } from '@/types/database'
import type { ImageUploadResult } from '@/types/supabase.types'
import { UnifiedImageError } from './image-error'
import { ImageStorageManager } from './image-storage'
import { validateImageParams } from './image-validation'

type ImageRecord = Database['public']['Tables']['images']['Row']

export class ImageUploader {
  constructor(private storageManager: ImageStorageManager) {}

  /**
   * 上傳單張圖片
   */
  async uploadImage(
    file: File,
    module: string,
    entityId: string,
    size: string = 'medium',
    display_position: number = 0
  ): Promise<ImageUploadResult> {
    try {
      validateImageParams(module, entityId)
      await this.storageManager.ensureBucketExists()

      const config = getModuleConfig(module)
      const Admin = getSupabaseAdmin()

      // 診斷 admin client 狀態
      dbLogger.info('Admin client 狀態檢查', {
        module: 'ImageUploader',
        metadata: {
          hasAdminClient: !!Admin,
          hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
          bucketName: this.storageManager.MEDIA_BUCKET,
        },
      })

      if (!Admin) {
        throw new UnifiedImageError('Supabase admin client 未配置')
      }

      // 驗證檔案（使用增強的安全驗證）
      const validation = await validateImageFile(file)
      if (!validation.valid) {
        throw new UnifiedImageError(validation.error || '檔案驗證失敗')
      }

      // 檢查檔案類型
      if (!config.acceptedTypes.includes(file.type)) {
        throw new UnifiedImageError(`不支援的檔案類型: ${file.type}`)
      }

      // 檢查檔案大小
      if (file.size > config.maxFileSize) {
        throw new UnifiedImageError(`檔案過大，最大允許 ${config.maxFileSize / 1024 / 1024}MB`)
      }

      // 生成檔案路徑
      const fileName = generateFileName(file.name, entityId)
      const storagePath = getModuleStoragePath(module, entityId)
      const filePath = `${storagePath}/${size}-${fileName}`

      // 診斷上傳前資訊
      dbLogger.info('開始圖片上傳', {
        module: 'ImageUploader',
        metadata: {
          module,
          entityId,
          size,
          fileName,
          storagePath,
          filePath,
          bucketName: this.storageManager.MEDIA_BUCKET,
          fileSize: file.size,
          fileType: file.type,
        },
      })

      // 上傳到 Storage（使用 admin client）
      const { data: _data, error } = await Admin.storage
        .from(this.storageManager.MEDIA_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        // 詳細錯誤診斷日誌
        dbLogger.error('Storage 上傳錯誤詳情', error as Error, {
          module: 'ImageUploader',
          metadata: {
            errorMessage: error.message,
            errorCode: (error as any).statusCode || 'unknown',
            errorDetails: (error as any).details || 'no details',
            filePath,
            bucketName: this.storageManager.MEDIA_BUCKET,
            fileSize: file.size,
            fileType: file.type,
            fileName: file.name,
          },
        })
        throw new UnifiedImageError(`圖片上傳失敗: ${error.message}`, error)
      }

      // 取得公開 URL（使用 admin client）
      const { data: urlData } = Admin.storage
        .from(this.storageManager.MEDIA_BUCKET)
        .getPublicUrl(filePath)

      // 除錯：記錄 URL 資料
      dbLogger.info('公開 URL 取得結果', {
        module: 'ImageUploader',
        metadata: {
          filePath,
          bucket: this.storageManager.MEDIA_BUCKET,
          urlData,
          publicUrl: urlData?.publicUrl,
          hasPublicUrl: !!urlData?.publicUrl,
        },
      })

      // 儲存到資料庫（使用 admin client 繞過 RLS）
      const imageRecord = {
        module,
        entity_id: entityId,
        file_path: filePath,
        storage_url: urlData.publicUrl,
        size,
        display_position,
        metadata: {
          original_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          uploaded_at: new Date().toISOString(),
        },
      }

      const { data: dbData, error: dbError } = await (Admin as any)
        .from('images')
        .insert(imageRecord)
        .select()
        .single()

      if (dbError) {
        // 如果資料庫寫入失敗，嘗試刪除已上傳的檔案
        await this.storageManager.deleteFromStorage(filePath)
        throw new UnifiedImageError('儲存圖片記錄失敗', dbError)
      }

      dbLogger.info('圖片上傳成功', {
        module: 'ImageUploader',
        metadata: { module, entityId, size, filePath },
      })

      const imageData = dbData as ImageRecord
      return {
        id: imageData.id,
        url: urlData.publicUrl,
        path: filePath,
        size,
        module,
        entityId,
      }
    } catch (error) {
      if (error instanceof UnifiedImageError) {
        throw error
      }
      throw new UnifiedImageError('上傳過程發生未知錯誤', error)
    }
  }

  /**
   * 批量上傳多尺寸圖片
   */
  async uploadMultipleSizes(
    file: File,
    module: string,
    entityId: string,
    display_position: number = 0
  ): Promise<ImageUploadResult[]> {
    const config = getModuleConfig(module)
    const results: ImageUploadResult[] = []

    try {
      for (const size of config.generateSizes) {
        const result = await this.uploadImage(file, module, entityId, size, display_position)
        results.push(result)
      }

      return results
    } catch (error) {
      // 如果部分上傳失敗，清理已上傳的檔案
      for (const result of results) {
        try {
          // 需要從主服務刪除，這裡先記錄
          dbLogger.warn('部分上傳失敗，需要清理', {
            module: 'ImageUploader',
            metadata: { imageId: result.id },
          })
        } catch (cleanupError) {
          dbLogger.error('清理失敗上傳檔案時出錯', cleanupError as Error, {
            module: 'ImageUploader',
            metadata: { imageId: result.id },
          })
        }
      }
      throw error
    }
  }
}
