import { getSupabaseAdmin } from './supabase-auth'
import { validateImageFile, generateFileName } from './image-utils'
import { SupabaseStorageError } from './supabase-storage'
import { dbLogger } from '@/lib/logger'
import { SupabaseStorageBucket, SupabaseStorageFile } from '@/types/supabase.types'

export const LOCATIONS_STORAGE_BUCKET = 'locations'

/**
 * 初始化門市位置 Storage Bucket
 */
export async function initializeLocationsBucket() {
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
      (bucket: SupabaseStorageBucket) => bucket.name === LOCATIONS_STORAGE_BUCKET
    )

    if (!bucketExists) {
      // 建立門市位置專用 bucket
      const { data, error } = await supabaseAdmin.storage.createBucket(LOCATIONS_STORAGE_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      })

      if (error) {
        throw new SupabaseStorageError('建立門市位置 storage bucket 失敗', error)
      }

      dbLogger.info('門市位置 Storage bucket 建立成功', {
        module: 'locations-storage',
        action: 'initializeLocationsBucket',
        metadata: {
          bucket: LOCATIONS_STORAGE_BUCKET,
          bucketData: data,
        },
      })
    } else {
      dbLogger.info('門市位置 Storage bucket 已存在', {
        module: 'locations-storage',
        action: 'initializeLocationsBucket',
        metadata: { bucket: LOCATIONS_STORAGE_BUCKET },
      })
    }

    return true
  } catch (error) {
    dbLogger.error('初始化門市位置 Storage bucket 失敗', error as Error, {
      module: 'locations-storage',
      action: 'initializeLocationsBucket',
    })
    throw error
  }
}

/**
 * 上傳門市位置圖片到 Storage
 */
export async function uploadLocationImage(
  file: File,
  locationId: string
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
  const fileName = generateFileName(file.name, `location-${locationId}`)
  const filePath = `${locationId}/${fileName}`

  dbLogger.info('開始上傳門市位置圖片', {
    module: 'locations-storage',
    action: 'uploadLocationImage',
    metadata: {
      locationId,
      fileName,
      filePath,
      fileSize: file.size,
    },
  })

  try {
    // 上傳檔案
    const { error } = await supabaseAdmin.storage
      .from(LOCATIONS_STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      throw new SupabaseStorageError('門市位置圖片上傳失敗', error)
    }

    // 取得公開 URL
    const { data: urlData } = supabaseAdmin.storage
      .from(LOCATIONS_STORAGE_BUCKET)
      .getPublicUrl(filePath)

    // 修改：返回完整 URL（與產品圖片系統一致）
    const result = {
      url: urlData.publicUrl, // 改為返回完整 URL（像產品一樣）
      path: filePath, // 返回實際路徑 "30/xxx.jpg"
      fileName: fileName,
    }

    dbLogger.info('門市位置圖片上傳成功', {
      module: 'locations-storage',
      action: 'uploadLocationImage',
      metadata: {
        locationId,
        fileName,
        url: result.url,
      },
    })

    return result
  } catch (error) {
    dbLogger.error('門市位置圖片上傳失敗', error as Error, {
      module: 'locations-storage',
      action: 'uploadLocationImage',
      metadata: { locationId, fileName },
    })
    throw error
  }
}

/**
 * 刪除門市位置圖片
 */
export async function deleteLocationImage(filePath: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    throw new SupabaseStorageError('Supabase admin client 未配置')
  }

  dbLogger.info('開始刪除門市位置圖片', {
    module: 'locations-storage',
    action: 'deleteLocationImage',
    metadata: { filePath },
  })

  try {
    const { error } = await supabaseAdmin.storage.from(LOCATIONS_STORAGE_BUCKET).remove([filePath])

    if (error) {
      throw new SupabaseStorageError('門市位置圖片刪除失敗', error)
    }

    dbLogger.info('門市位置圖片刪除成功', {
      module: 'locations-storage',
      action: 'deleteLocationImage',
      metadata: { filePath },
    })
  } catch (error) {
    dbLogger.error('門市位置圖片刪除失敗', error as Error, {
      module: 'locations-storage',
      action: 'deleteLocationImage',
      metadata: { filePath },
    })
    throw error
  }
}

/**
 * 列出門市位置的所有圖片
 */
export async function listLocationImages(locationId: string): Promise<SupabaseStorageFile[]> {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    throw new SupabaseStorageError('Supabase admin client 未配置')
  }

  dbLogger.info('開始列出門市位置圖片', {
    module: 'locations-storage',
    action: 'listLocationImages',
    metadata: { locationId },
  })

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(LOCATIONS_STORAGE_BUCKET)
      .list(locationId)

    if (error) {
      throw new SupabaseStorageError('列出門市位置圖片失敗', error)
    }

    const images = data || []

    dbLogger.info('門市位置圖片列出成功', {
      module: 'locations-storage',
      action: 'listLocationImages',
      metadata: { locationId, imageCount: images.length },
    })

    return images
  } catch (error) {
    dbLogger.error('列出門市位置圖片失敗', error as Error, {
      module: 'locations-storage',
      action: 'listLocationImages',
      metadata: { locationId },
    })
    throw error
  }
}
