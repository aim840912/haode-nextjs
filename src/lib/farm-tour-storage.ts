import { getSupabaseAdmin } from './supabase-auth'
import { validateImageFile, generateFileName } from './image-utils'
import { SupabaseStorageError } from './supabase-storage'
import { dbLogger } from '@/lib/logger'
import { SupabaseStorageBucket, SupabaseStorageFile } from '@/types/supabase.types'

export const FARM_TOUR_STORAGE_BUCKET = 'farm-tour'

/**
 * 初始化農場體驗活動 Storage Bucket
 */
export async function initializeFarmTourBucket() {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    throw new SupabaseStorageError('Supabase admin client 未配置')
  }

  try {
    // 檢查 bucket 是否存在
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()

    if (listError) {
      throw new SupabaseStorageError('無法列出 storage buckets', listError)
    }

    const bucketExists = buckets?.some(
      (bucket: SupabaseStorageBucket) => bucket.name === FARM_TOUR_STORAGE_BUCKET
    )

    if (!bucketExists) {
      // 建立農場體驗活動專用 bucket
      const { data, error } = await supabaseAdmin.storage.createBucket(FARM_TOUR_STORAGE_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      })

      if (error) {
        throw new SupabaseStorageError('建立農場體驗活動 storage bucket 失敗', error)
      }

      dbLogger.info('農場體驗活動 Storage bucket 建立成功', {
        module: 'farm-tour-storage',
        action: 'initializeFarmTourBucket',
        metadata: {
          bucket: FARM_TOUR_STORAGE_BUCKET,
          bucketData: data,
        },
      })
    } else {
      dbLogger.info('農場體驗活動 Storage bucket 已存在', {
        module: 'farm-tour-storage',
        action: 'initializeFarmTourBucket',
        metadata: { bucket: FARM_TOUR_STORAGE_BUCKET },
      })
    }

    return true
  } catch (error) {
    dbLogger.error('初始化農場體驗活動 Storage bucket 失敗', error as Error, {
      module: 'farm-tour-storage',
      action: 'initializeFarmTourBucket',
    })
    throw error
  }
}

/**
 * 上傳農場體驗活動圖片到 Storage
 */
export async function uploadFarmTourImage(
  file: File,
  activityId: string
): Promise<{
  url: string
  path: string
  fileName: string
}> {
  // 驗證檔案
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new SupabaseStorageError(validation.error || '檔案驗證失敗')
  }

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    throw new SupabaseStorageError('Supabase admin client 未配置')
  }

  // 生成檔案名稱
  const fileName = generateFileName(file.name, `farm-tour-${activityId}`)
  const filePath = `${activityId}/${fileName}`

  dbLogger.info('開始上傳農場體驗活動圖片', {
    module: 'farm-tour-storage',
    action: 'uploadFarmTourImage',
    metadata: {
      activityId,
      fileName,
      filePath,
      fileSize: file.size,
    },
  })

  try {
    // 上傳檔案
    const { error } = await supabaseAdmin.storage
      .from(FARM_TOUR_STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      throw new SupabaseStorageError('農場體驗活動圖片上傳失敗', error)
    }

    // 取得公開 URL
    const { data: urlData } = supabaseAdmin.storage
      .from(FARM_TOUR_STORAGE_BUCKET)
      .getPublicUrl(filePath)

    const result = {
      url: urlData.publicUrl,
      path: filePath,
      fileName: fileName,
    }

    dbLogger.info('農場體驗活動圖片上傳成功', {
      module: 'farm-tour-storage',
      action: 'uploadFarmTourImage',
      metadata: {
        activityId,
        fileName,
        url: result.url,
      },
    })

    return result
  } catch (error) {
    dbLogger.error('農場體驗活動圖片上傳失敗', error as Error, {
      module: 'farm-tour-storage',
      action: 'uploadFarmTourImage',
      metadata: { activityId, fileName },
    })
    throw error
  }
}

/**
 * 刪除農場體驗活動圖片
 */
export async function deleteFarmTourImage(filePath: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    throw new SupabaseStorageError('Supabase admin client 未配置')
  }

  dbLogger.info('開始刪除農場體驗活動圖片', {
    module: 'farm-tour-storage',
    action: 'deleteFarmTourImage',
    metadata: { filePath },
  })

  try {
    const { error } = await supabaseAdmin.storage.from(FARM_TOUR_STORAGE_BUCKET).remove([filePath])

    if (error) {
      throw new SupabaseStorageError('農場體驗活動圖片刪除失敗', error)
    }

    dbLogger.info('農場體驗活動圖片刪除成功', {
      module: 'farm-tour-storage',
      action: 'deleteFarmTourImage',
      metadata: { filePath },
    })
  } catch (error) {
    dbLogger.error('農場體驗活動圖片刪除失敗', error as Error, {
      module: 'farm-tour-storage',
      action: 'deleteFarmTourImage',
      metadata: { filePath },
    })
    throw error
  }
}

/**
 * 列出農場體驗活動的所有圖片
 */
export async function listFarmTourImages(activityId: string): Promise<SupabaseStorageFile[]> {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    throw new SupabaseStorageError('Supabase admin client 未配置')
  }

  dbLogger.info('開始列出農場體驗活動圖片', {
    module: 'farm-tour-storage',
    action: 'listFarmTourImages',
    metadata: { activityId },
  })

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(FARM_TOUR_STORAGE_BUCKET)
      .list(activityId)

    if (error) {
      throw new SupabaseStorageError('列出農場體驗活動圖片失敗', error)
    }

    const images = data || []

    dbLogger.info('農場體驗活動圖片列出成功', {
      module: 'farm-tour-storage',
      action: 'listFarmTourImages',
      metadata: { activityId, imageCount: images.length },
    })

    return images
  } catch (error) {
    dbLogger.error('列出農場體驗活動圖片失敗', error as Error, {
      module: 'farm-tour-storage',
      action: 'listFarmTourImages',
      metadata: { activityId },
    })
    throw error
  }
}
