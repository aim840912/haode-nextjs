/**
 * 統一圖片管理服務
 * 整合所有模組的圖片上傳、管理功能
 */

import { supabase, getSupabaseAdmin } from './supabase-auth'
import { validateImageFile, generateFileName } from './image-utils'
import { dbLogger } from '@/lib/logger'
import { getModuleConfig, getModuleStoragePath, isValidModule } from '@/config/image-modules.config'
import type { Database } from '@/types/database'
import type { ImageUploadResult } from '@/types/supabase.types'

type ImageRecord = Database['public']['Tables']['images']['Row']

export class UnifiedImageError extends Error {
  constructor(
    message: string,
    public cause?: unknown
  ) {
    super(message)
    this.name = 'UnifiedImageError'
  }
}

// 介面定義已移至 @/types/supabase.types

/**
 * 統一圖片管理服務類別
 */
export class UnifiedImageService {
  private bucketInitialized = new Set<string>()
  private readonly MEDIA_BUCKET = 'media' // 統一使用 media bucket

  /**
   * 確保 bucket 存在並初始化
   */
  private async ensureBucketExists(bucketName?: string): Promise<void> {
    const bucket = bucketName || this.MEDIA_BUCKET

    if (this.bucketInitialized.has(bucket)) {
      return
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new UnifiedImageError('Supabase admin client 未配置')
    }

    try {
      // 檢查 bucket 是否存在
      const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()

      // 診斷 bucket 列表資訊
      dbLogger.info('Storage buckets 檢查', {
        module: 'UnifiedImageService',
        metadata: {
          targetBucket: bucket,
          listError: listError?.message || null,
          availableBuckets: buckets?.map(b => ({ name: b.name, public: b.public })) || [],
          bucketsCount: buckets?.length || 0,
        },
      })

      if (listError) {
        throw new UnifiedImageError('無法列出 storage buckets', listError)
      }

      const bucketExists = buckets?.some(b => b.name === bucket)

      if (!bucketExists) {
        dbLogger.warn('目標 bucket 不存在，嘗試建立', {
          module: 'UnifiedImageService',
          metadata: {
            targetBucket: bucket,
            existingBuckets: buckets?.map(b => b.name) || [],
            adminClientExists: !!supabaseAdmin,
          },
        })

        // 建立 bucket
        const { error } = await supabaseAdmin.storage.createBucket(bucket, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
          fileSizeLimit: 10 * 1024 * 1024, // 10MB
        })

        if (error) {
          dbLogger.error('建立 storage bucket 失敗', error as Error, {
            module: 'UnifiedImageService',
            metadata: {
              bucketName: bucket,
              errorCode: (error as any).statusCode || 'unknown',
              errorMessage: error.message,
              errorDetails: (error as any).details || 'no details',
            },
          })
          throw new UnifiedImageError('建立 storage bucket 失敗', error)
        }

        dbLogger.info('Storage bucket 建立成功', {
          module: 'UnifiedImageService',
          metadata: { bucketName: bucket },
        })
      } else {
        dbLogger.debug('目標 bucket 已存在', {
          module: 'UnifiedImageService',
          metadata: {
            bucketName: bucket,
            bucketFound: true,
            totalBuckets: buckets?.length || 0,
          },
        })
      }

      this.bucketInitialized.add(bucket)
    } catch (error) {
      dbLogger.error('初始化 storage bucket 失敗', error as Error, {
        module: 'UnifiedImageService',
        metadata: {
          bucketName: bucket,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          hasAdminClient: !!supabaseAdmin,
          operation: 'ensureBucketExists',
        },
      })
      throw error
    }
  }

  /**
   * 驗證模組和實體ID
   */
  private validateParams(module: string, entityId: string): void {
    if (!isValidModule(module)) {
      throw new UnifiedImageError(`不支援的圖片模組: ${module}`)
    }

    if (!entityId || typeof entityId !== 'string') {
      throw new UnifiedImageError('實體ID為必填參數')
    }
  }

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
      this.validateParams(module, entityId)
      await this.ensureBucketExists()

      const config = getModuleConfig(module)
      const supabaseAdmin = getSupabaseAdmin()

      // 診斷 admin client 狀態
      dbLogger.info('Admin client 狀態檢查', {
        module: 'UnifiedImageService',
        metadata: {
          hasAdminClient: !!supabaseAdmin,
          hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
          bucketName: this.MEDIA_BUCKET,
        },
      })

      if (!supabaseAdmin) {
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
        module: 'UnifiedImageService',
        metadata: {
          module,
          entityId,
          size,
          fileName,
          storagePath,
          filePath,
          bucketName: this.MEDIA_BUCKET,
          fileSize: file.size,
          fileType: file.type,
        },
      })

      // 上傳到 Storage（使用 admin client）
      const { data, error } = await supabaseAdmin.storage
        .from(this.MEDIA_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        // 詳細錯誤診斷日誌
        dbLogger.error('Storage 上傳錯誤詳情', error as Error, {
          module: 'UnifiedImageService',
          metadata: {
            errorMessage: error.message,
            errorCode: (error as any).statusCode || 'unknown',
            errorDetails: (error as any).details || 'no details',
            filePath,
            bucketName: this.MEDIA_BUCKET,
            fileSize: file.size,
            fileType: file.type,
            fileName: file.name,
          },
        })
        throw new UnifiedImageError(`圖片上傳失敗: ${error.message}`, error)
      }

      // 取得公開 URL（使用 admin client）
      const { data: urlData } = supabaseAdmin.storage.from(this.MEDIA_BUCKET).getPublicUrl(filePath)

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

      const { data: dbData, error: dbError } = await (supabaseAdmin as any)
        .from('images')
        .insert(imageRecord)
        .select()
        .single()

      if (dbError) {
        // 如果資料庫寫入失敗，嘗試刪除已上傳的檔案
        await this.deleteFromStorage(filePath)
        throw new UnifiedImageError('儲存圖片記錄失敗', dbError)
      }

      dbLogger.info('圖片上傳成功', {
        module: 'UnifiedImageService',
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
          await this.deleteImage(result.id)
        } catch (cleanupError) {
          dbLogger.error('清理失敗上傳檔案時出錯', cleanupError as Error, {
            module: 'UnifiedImageService',
            metadata: { imageId: result.id },
          })
        }
      }
      throw error
    }
  }

  /**
   * 查詢圖片列表
   */
  async getImages(module: string, entityId: string): Promise<ImageRecord[]> {
    try {
      this.validateParams(module, entityId)

      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        throw new UnifiedImageError('Supabase admin client 未配置')
      }

      const { data, error } = await (supabaseAdmin as any)
        .from('images')
        .select('*')
        .eq('module', module)
        .eq('entity_id', entityId)
        .order('display_position', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) {
        throw new UnifiedImageError('查詢圖片列表失敗', error)
      }

      return data || []
    } catch (error) {
      if (error instanceof UnifiedImageError) {
        throw error
      }
      throw new UnifiedImageError('查詢過程發生未知錯誤', error)
    }
  }

  /**
   * 更新圖片排序
   */
  async updateImagePositions(
    imagePositions: Array<{ id: string; display_position: number }>
  ): Promise<void> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        throw new UnifiedImageError('Supabase admin client 未配置')
      }

      for (const { id, display_position } of imagePositions) {
        const { error } = await (supabaseAdmin as any)
          .from('images')
          .update({
            display_position,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)

        if (error) {
          throw new UnifiedImageError(`更新圖片 ${id} 位置失敗`, error)
        }
      }

      dbLogger.info('圖片排序更新成功', {
        module: 'UnifiedImageService',
        metadata: { count: imagePositions.length },
      })
    } catch (error) {
      if (error instanceof UnifiedImageError) {
        throw error
      }
      throw new UnifiedImageError('更新排序過程發生未知錯誤', error)
    }
  }

  /**
   * 更新圖片資訊
   */
  async updateImageInfo(
    imageId: string,
    updates: { alt_text?: string; metadata?: Record<string, any> }
  ): Promise<void> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        throw new UnifiedImageError('Supabase admin client 未配置')
      }

      const { error } = await (supabaseAdmin as any)
        .from('images')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', imageId)

      if (error) {
        throw new UnifiedImageError('更新圖片資訊失敗', error)
      }

      dbLogger.info('圖片資訊更新成功', {
        module: 'UnifiedImageService',
        metadata: { imageId },
      })
    } catch (error) {
      if (error instanceof UnifiedImageError) {
        throw error
      }
      throw new UnifiedImageError('更新資訊過程發生未知錯誤', error)
    }
  }

  /**
   * 刪除圖片
   */
  async deleteImage(imageId: string): Promise<void> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        throw new UnifiedImageError('Supabase admin client 未配置')
      }

      // 先查詢圖片記錄
      const { data: imageData, error: fetchError } = await (supabaseAdmin as any)
        .from('images')
        .select('file_path, module, entity_id')
        .eq('id', imageId)
        .single()

      if (fetchError || !imageData) {
        throw new UnifiedImageError('找不到圖片記錄', fetchError)
      }

      const dbImageData = imageData as ImageRecord
      // 從 Storage 刪除檔案
      await this.deleteFromStorage(dbImageData.file_path)

      // 從資料庫刪除記錄
      const { error: deleteError } = await (supabaseAdmin as any)
        .from('images')
        .delete()
        .eq('id', imageId)

      if (deleteError) {
        throw new UnifiedImageError('刪除圖片記錄失敗', deleteError)
      }

      dbLogger.info('圖片刪除成功', {
        module: 'UnifiedImageService',
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
  async deleteEntityImages(module: string, entityId: string): Promise<number> {
    try {
      this.validateParams(module, entityId)

      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        throw new UnifiedImageError('Supabase admin client 未配置')
      }

      // 查詢所有圖片
      const images = await this.getImages(module, entityId)

      if (images.length === 0) {
        return 0
      }

      // 批量刪除檔案
      const filePaths = images.map(img => img.file_path)
      await this.deleteBatchFromStorage(filePaths)

      // 從資料庫刪除記錄
      const { error } = await (supabaseAdmin as any)
        .from('images')
        .delete()
        .eq('module', module)
        .eq('entity_id', entityId)

      if (error) {
        throw new UnifiedImageError('批量刪除圖片記錄失敗', error)
      }

      dbLogger.info('實體圖片批量刪除成功', {
        module: 'UnifiedImageService',
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

  /**
   * 從 Storage 刪除單個檔案
   */
  private async deleteFromStorage(filePath: string): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new UnifiedImageError('Supabase admin client 未配置')
    }

    const { error } = await supabaseAdmin.storage.from(this.MEDIA_BUCKET).remove([filePath])

    if (error) {
      throw new UnifiedImageError('從 Storage 刪除檔案失敗', error)
    }
  }

  /**
   * 從 Storage 批量刪除檔案
   */
  private async deleteBatchFromStorage(filePaths: string[]): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new UnifiedImageError('Supabase admin client 未配置')
    }

    const { error } = await supabaseAdmin.storage.from(this.MEDIA_BUCKET).remove(filePaths)

    if (error) {
      throw new UnifiedImageError('從 Storage 批量刪除檔案失敗', error)
    }
  }

  /**
   * 取得圖片的公開 URL
   */
  getImagePublicUrl(filePath: string): string {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new UnifiedImageError('Supabase admin client 未配置')
    }

    const { data } = supabaseAdmin.storage.from(this.MEDIA_BUCKET).getPublicUrl(filePath)

    return data.publicUrl
  }

  /**
   * 檢查圖片是否存在
   */
  async checkImageExists(filePath: string): Promise<boolean> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        return false
      }

      const { data, error } = await supabaseAdmin.storage
        .from(this.MEDIA_BUCKET)
        .list(filePath.substring(0, filePath.lastIndexOf('/')))

      if (error) {
        return false
      }

      const fileName = filePath.substring(filePath.lastIndexOf('/') + 1)
      return (data || []).some(file => file.name === fileName)
    } catch (error) {
      return false
    }
  }
}

// 導出單例實例
export const unifiedImageService = new UnifiedImageService()
