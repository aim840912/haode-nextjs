import { getSupabaseAdmin } from './supabase-auth'
import { validateImageFile, generateFileName } from './image-utils'
import { dbLogger } from './logger'
import { SupabaseStorageBucket, SupabaseStorageFile } from '@/types/supabase.types'

export class MomentStorageError extends Error {
  constructor(
    message: string,
    public cause?: unknown
  ) {
    super(message)
    this.name = 'MomentStorageError'
  }
}

export const MOMENT_STORAGE_BUCKET = 'moments'

/**
 * 初始化 Moment Storage Bucket
 */
export async function initializeMomentStorageBucket() {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    throw new MomentStorageError('Supabase admin client 未配置')
  }

  try {
    // 檢查 bucket 是否存在
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()

    if (listError) {
      throw new MomentStorageError('無法列出 storage buckets', listError)
    }

    const bucketExists = buckets?.some(
      (bucket: SupabaseStorageBucket) => bucket.name === MOMENT_STORAGE_BUCKET
    )

    if (!bucketExists) {
      // 建立 bucket
      const { data, error } = await supabaseAdmin.storage.createBucket(MOMENT_STORAGE_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      })

      if (error) {
        throw new MomentStorageError('建立 moment storage bucket 失敗', error)
      }

      dbLogger.info('Moment Storage bucket 建立成功', {
        module: 'MomentStorage',
        action: 'createBucket',
        metadata: { bucketName: data.name },
      })
    }

    return true
  } catch (error) {
    dbLogger.error(
      '初始化 moment storage bucket 失敗',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        metadata: { context: 'initializeMomentStorageBucket' },
      }
    )
    throw error
  }
}

/**
 * 上傳精彩時刻圖片到 Supabase Storage
 */
export async function uploadMomentImageToStorage(
  file: File,
  momentId: string
): Promise<{ url: string; path: string }> {
  try {
    // 檢查 admin client 是否配置
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new MomentStorageError('Supabase admin client 未配置')
    }

    // 驗證檔案
    const validation = validateImageFile(file)
    if (!validation.valid) {
      throw new MomentStorageError(validation.error || '檔案驗證失敗')
    }

    // 生成檔案名稱
    const fileName = generateFileName(file.name, momentId)
    const filePath = `${momentId}/${fileName}`

    // 使用 admin 客戶端上傳檔案（繞過 RLS）
    const { error } = await supabaseAdmin.storage
      .from(MOMENT_STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      throw new MomentStorageError('精彩時刻圖片上傳失敗', error)
    }

    // 取得公開 URL（也使用 admin 客戶端）
    const { data: urlData } = supabaseAdmin.storage
      .from(MOMENT_STORAGE_BUCKET)
      .getPublicUrl(filePath)

    dbLogger.info('✅ 精彩時刻圖片上傳成功', {
      metadata: {
        filePath,
        url: urlData.publicUrl,
      },
    })

    return {
      url: urlData.publicUrl,
      path: filePath,
    }
  } catch (error) {
    if (error instanceof MomentStorageError) {
      throw error
    }
    throw new MomentStorageError('上傳過程發生未知錯誤', error)
  }
}

/**
 * 刪除精彩時刻圖片
 */
export async function deleteMomentImageFromStorage(filePath: string): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new MomentStorageError('Supabase admin client 未配置')
    }

    const { error } = await supabaseAdmin.storage.from(MOMENT_STORAGE_BUCKET).remove([filePath])

    if (error) {
      throw new MomentStorageError('刪除精彩時刻圖片失敗', error)
    }

    dbLogger.info('✅ 精彩時刻圖片刪除成功', {
      metadata: { filePath },
    })
  } catch (error) {
    if (error instanceof MomentStorageError) {
      throw error
    }
    throw new MomentStorageError('刪除過程發生未知錯誤', error)
  }
}

/**
 * 刪除精彩時刻項目的所有圖片
 */
export async function deleteMomentImages(momentId: string): Promise<{
  success: boolean
  deletedCount: number
  deletedFiles: string[]
  error?: string
}> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new MomentStorageError('Supabase admin client 未配置')
    }

    dbLogger.info(`🗑️ 開始刪除精彩時刻 ${momentId} 的圖片...`)

    // 列出該項目的所有圖片
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(MOMENT_STORAGE_BUCKET)
      .list(momentId)

    if (listError || !files || files.length === 0) {
      dbLogger.info(`ℹ️ 精彩時刻 ${momentId} 沒有找到圖片需要刪除`)
      return {
        success: true,
        deletedCount: 0,
        deletedFiles: [],
      }
    }

    dbLogger.info(`📁 在資料夾 ${momentId} 發現 ${files.length} 個檔案`, {
      module: 'MomentStorage',
      action: 'deleteAllFiles',
      metadata: {
        momentId,
        fileCount: files.length,
        files: files.map((f: SupabaseStorageFile) => f.name),
      },
    })

    // 建立要刪除的檔案路徑列表
    const filePaths = files.map((file: SupabaseStorageFile) => `${momentId}/${file.name}`)

    // 批量刪除所有圖片
    const { error: deleteError } = await supabaseAdmin.storage
      .from(MOMENT_STORAGE_BUCKET)
      .remove(filePaths)

    if (deleteError) {
      throw new MomentStorageError('批量刪除精彩時刻圖片失敗', deleteError)
    }

    dbLogger.info(`✅ 成功刪除精彩時刻 ${momentId} 的 ${filePaths.length} 張圖片`)

    return {
      success: true,
      deletedCount: filePaths.length,
      deletedFiles: files.map((f: SupabaseStorageFile) => f.name),
    }
  } catch (error) {
    const errorMessage =
      error instanceof MomentStorageError ? error.message : '刪除精彩時刻圖片過程發生未知錯誤'

    dbLogger.error(
      `💥 刪除精彩時刻 ${momentId} 圖片過程發生錯誤`,
      error instanceof Error ? error : new Error('Unknown error'),
      {
        metadata: { context: 'deleteAllMomentImages', momentId },
      }
    )

    return {
      success: false,
      deletedCount: 0,
      deletedFiles: [],
      error: errorMessage,
    }
  }
}

/**
 * 列出精彩時刻項目的所有圖片
 */
export async function listMomentImages(momentId: string): Promise<
  Array<{
    name: string
    url: string
    metadata: Record<string, unknown>
  }>
> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new MomentStorageError('Supabase admin client 未配置')
    }

    const { data, error } = await supabaseAdmin.storage.from(MOMENT_STORAGE_BUCKET).list(momentId)

    if (error) {
      throw new MomentStorageError('列出精彩時刻圖片失敗', error)
    }

    return (data || []).map((file: SupabaseStorageFile) => {
      const { data: urlData } = supabaseAdmin.storage
        .from(MOMENT_STORAGE_BUCKET)
        .getPublicUrl(`${momentId}/${file.name}`)

      return {
        name: file.name,
        url: urlData.publicUrl,
        metadata: file.metadata || {},
      }
    })
  } catch (error) {
    if (error instanceof MomentStorageError) {
      throw error
    }
    throw new MomentStorageError('列出圖片過程發生未知錯誤', error)
  }
}

/**
 * 檢查精彩時刻圖片是否存在
 */
export async function checkMomentImageExists(filePath: string): Promise<boolean> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return false
    }

    const pathParts = filePath.split('/')
    if (pathParts.length < 2) return false

    const momentId = pathParts[0]
    const fileName = pathParts[1]

    const { data, error } = await supabaseAdmin.storage.from(MOMENT_STORAGE_BUCKET).list(momentId)

    if (error) {
      return false
    }

    return (data || []).some((file: SupabaseStorageFile) => file.name === fileName)
  } catch {
    return false
  }
}

/**
 * 取得精彩時刻圖片的公開 URL
 */
export function getMomentImagePublicUrl(filePath: string): string {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    throw new MomentStorageError('Supabase admin client 未配置')
  }

  const { data } = supabaseAdmin.storage.from(MOMENT_STORAGE_BUCKET).getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * 生成精彩時刻圖片的簽名 URL（適用於私有圖片）
 */
export async function getMomentImageSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new MomentStorageError('Supabase admin client 未配置')
    }

    const { data, error } = await supabaseAdmin.storage
      .from(MOMENT_STORAGE_BUCKET)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      throw new MomentStorageError('生成精彩時刻圖片簽名 URL 失敗', error)
    }

    return data.signedUrl
  } catch (error) {
    if (error instanceof MomentStorageError) {
      throw error
    }
    throw new MomentStorageError('生成簽名 URL 過程發生未知錯誤', error)
  }
}

/**
 * 從 base64 資料上傳圖片（用於資料遷移）
 */
export async function uploadBase64ToMomentStorage(
  base64Data: string,
  momentId: string,
  filename: string = 'moment-image.jpg'
): Promise<{ url: string; path: string }> {
  try {
    // 將 base64 轉換為 File 物件
    const response = await fetch(base64Data)
    const blob = await response.blob()
    const file = new File([blob], filename, { type: blob.type })

    // 使用現有的上傳函數
    return await uploadMomentImageToStorage(file, momentId)
  } catch (error) {
    throw new MomentStorageError('從 base64 上傳精彩時刻圖片失敗', error)
  }
}
