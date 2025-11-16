/**
 * 圖片 Storage 管理模組
 * 負責 Supabase Storage bucket 的初始化和管理
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { dbLogger } from '@/lib/logger'
import { UnifiedImageError } from './image-error'

export class ImageStorageManager {
  private bucketInitialized = new Set<string>()
  readonly MEDIA_BUCKET = 'media' // 統一使用 media bucket

  /**
   * 確保 bucket 存在並初始化
   */
  async ensureBucketExists(bucketName?: string): Promise<void> {
    const bucket = bucketName || this.MEDIA_BUCKET

    if (this.bucketInitialized.has(bucket)) {
      return
    }

    const Admin = getSupabaseAdmin()
    if (!Admin) {
      throw new UnifiedImageError('Supabase admin client 未配置')
    }

    try {
      // 檢查 bucket 是否存在
      const { data: buckets, error: listError } = await Admin.storage.listBuckets()

      // 診斷 bucket 列表資訊
      dbLogger.info('Storage buckets 檢查', {
        module: 'ImageStorageManager',
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
          module: 'ImageStorageManager',
          metadata: {
            targetBucket: bucket,
            existingBuckets: buckets?.map(b => b.name) || [],
            adminClientExists: !!Admin,
          },
        })

        // 建立 bucket
        const { error } = await Admin.storage.createBucket(bucket, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
          fileSizeLimit: 10 * 1024 * 1024, // 10MB
        })

        if (error) {
          dbLogger.error('建立 storage bucket 失敗', error as Error, {
            module: 'ImageStorageManager',
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
          module: 'ImageStorageManager',
          metadata: { bucketName: bucket },
        })
      } else {
        dbLogger.debug('目標 bucket 已存在', {
          module: 'ImageStorageManager',
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
        module: 'ImageStorageManager',
        metadata: {
          bucketName: bucket,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          hasAdminClient: !!Admin,
          operation: 'ensureBucketExists',
        },
      })
      throw error
    }
  }

  /**
   * 從 Storage 刪除單個檔案
   */
  async deleteFromStorage(filePath: string): Promise<void> {
    const Admin = getSupabaseAdmin()
    if (!Admin) {
      throw new UnifiedImageError('Supabase admin client 未配置')
    }

    const { error } = await Admin.storage.from(this.MEDIA_BUCKET).remove([filePath])

    if (error) {
      throw new UnifiedImageError('從 Storage 刪除檔案失敗', error)
    }
  }

  /**
   * 從 Storage 批量刪除檔案
   */
  async deleteBatchFromStorage(filePaths: string[]): Promise<void> {
    const Admin = getSupabaseAdmin()
    if (!Admin) {
      throw new UnifiedImageError('Supabase admin client 未配置')
    }

    const { error } = await Admin.storage.from(this.MEDIA_BUCKET).remove(filePaths)

    if (error) {
      throw new UnifiedImageError('從 Storage 批量刪除檔案失敗', error)
    }
  }

  /**
   * 取得圖片的公開 URL
   */
  getImagePublicUrl(filePath: string): string {
    const Admin = getSupabaseAdmin()
    if (!Admin) {
      throw new UnifiedImageError('Supabase admin client 未配置')
    }

    const { data: _data } = Admin.storage.from(this.MEDIA_BUCKET).getPublicUrl(filePath)

    return _data.publicUrl
  }

  /**
   * 檢查圖片是否存在
   */
  async checkImageExists(filePath: string): Promise<boolean> {
    try {
      const Admin = getSupabaseAdmin()
      if (!Admin) {
        return false
      }

      const { data, error } = await Admin.storage
        .from(this.MEDIA_BUCKET)
        .list(filePath.substring(0, filePath.lastIndexOf('/')))

      if (error) {
        return false
      }

      const fileName = filePath.substring(filePath.lastIndexOf('/') + 1)
      return (data || []).some(file => file.name === fileName)
    } catch (_error) {
      return false
    }
  }
}
