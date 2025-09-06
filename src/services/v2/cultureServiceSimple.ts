/**
 * 文化服務 v2 簡化實作
 * 基於統一架構的文化項目管理服務
 *
 * 功能：
 * - 標準化 CRUD 操作
 * - 統一錯誤處理和日誌記錄
 * - 完整的圖片存儲整合
 * - 分類配置和資料轉換
 * - 事務性操作支援
 */

import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-auth'
import { dbLogger } from '@/lib/logger'
import { ErrorFactory, NotFoundError, ValidationError } from '@/lib/errors'
import { CultureItem, CultureService } from '@/types/culture'
import { ServiceSupabaseClient, ServiceErrorContext } from '@/types/service.types'
import { Database } from '@/types/database'
import {
  uploadCultureImageToStorage,
  deleteCultureImages,
  initializeCultureStorageBucket,
  uploadBase64ToCultureStorage,
} from '@/lib/culture-storage'

/**
 * 資料庫記錄類型
 */
interface SupabaseCultureRecord {
  id: string
  title: string
  description: string
  content: string | null
  category: string
  year: number
  is_featured: boolean
  images: string[]
  created_at: string
  updated_at: string
}

/**
 * 建立文化項目的擴展介面（支援檔案上傳）
 */
export interface CreateCultureItemRequest
  extends Omit<CultureItem, 'id' | 'createdAt' | 'updatedAt'> {
  imageFile?: File
  image?: string // base64 向後相容
}

/**
 * 更新文化項目的擴展介面（支援檔案上傳）
 */
export interface UpdateCultureItemRequest
  extends Partial<Omit<CultureItem, 'id' | 'createdAt' | 'updatedAt'>> {
  imageFile?: File
  image?: string // base64 向後相容
}

/**
 * 分類配置介面
 */
interface CategoryConfig {
  color: string
  height: string
  textColor: string
  emoji: string
}

/**
 * 文化服務 v2 簡化實作
 */
export class CultureServiceV2Simple implements CultureService {
  private readonly moduleName = 'CultureServiceV2'

  /**
   * 取得 Supabase 客戶端
   */
  private getSupabaseClient(): ServiceSupabaseClient {
    return createServiceSupabaseClient()
  }

  /**
   * 取得管理員客戶端
   */
  private getAdminClient(): ServiceSupabaseClient {
    return getSupabaseAdmin() as any
  }

  /**
   * 處理錯誤
   */
  private handleError(error: unknown, operation: string, context?: ServiceErrorContext): never {
    dbLogger.error(`文化服務 ${operation} 操作失敗`, error as Error, {
      module: this.moduleName,
      action: operation,
      metadata: context,
    })

    if (error && typeof error === 'object' && 'code' in error) {
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.moduleName,
        action: operation,
        ...context,
      })
    }

    throw error instanceof Error ? error : new Error(`${operation} 操作失敗`)
  }

  /**
   * 轉換資料庫記錄為實體
   */
  private transformFromDB(dbItem: SupabaseCultureRecord): CultureItem {
    // 根據分類設定顏色和表情符號
    const categoryConfig = this.getCategoryConfig(dbItem.category)

    // 處理圖片 URL
    const imageUrl = dbItem.images?.[0]
    let processedImageUrl = imageUrl

    if (imageUrl) {
      dbLogger.debug('處理圖片 URL', {
        module: this.moduleName,
        action: 'transformFromDB',
        metadata: { imageUrl: imageUrl?.substring(0, 100) + '...' },
      })

      // 如果是 base64 圖片，保持原樣
      if (imageUrl.startsWith('data:image/')) {
        processedImageUrl = imageUrl
        dbLogger.debug('偵測到 base64 圖片格式')
      }
      // 如果是 HTTP(S) URL，保持原樣
      else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        processedImageUrl = imageUrl
        dbLogger.debug('偵測到 HTTP(S) 圖片 URL')
      }
      // 其他格式的處理
      else {
        dbLogger.warn('未知圖片格式', {
          module: this.moduleName,
          action: 'transformFromDB',
          metadata: { imageUrl: imageUrl?.substring(0, 50) + '...' },
        })
        processedImageUrl = imageUrl
      }
    }

    return {
      id: dbItem.id,
      title: dbItem.title,
      subtitle: dbItem.content || dbItem.description,
      description: dbItem.description,
      color: categoryConfig.color,
      height: categoryConfig.height,
      textColor: categoryConfig.textColor,
      emoji: categoryConfig.emoji,
      imageUrl: processedImageUrl,
      createdAt: dbItem.created_at,
      updatedAt: dbItem.updated_at,
    }
  }

  /**
   * 轉換實體為資料庫記錄
   */
  private transformToDB(
    itemData: CreateCultureItemRequest | UpdateCultureItemRequest
  ): Database['public']['Tables']['culture']['Insert'] {
    return {
      title: itemData.title || '',
      description: itemData.description,
      content: itemData.subtitle,
      category: 'culture', // 預設分類
      year: new Date().getFullYear(),
      is_featured: true,
      images: [], // 圖片將在後續處理中更新
    }
  }

  /**
   * 取得分類配置
   */
  private getCategoryConfig(category: string): CategoryConfig {
    const configs = {
      farming: {
        color: 'bg-green-400',
        height: 'h-48',
        textColor: 'text-white',
        emoji: '🌾',
      },
      culture: {
        color: 'bg-orange-400',
        height: 'h-56',
        textColor: 'text-white',
        emoji: '🏮',
      },
      tradition: {
        color: 'bg-blue-400',
        height: 'h-52',
        textColor: 'text-white',
        emoji: '🏡',
      },
      default: {
        color: 'bg-amber-400',
        height: 'h-48',
        textColor: 'text-white',
        emoji: '🎨',
      },
    }

    return configs[category as keyof typeof configs] || configs.default
  }

  // === 公開 API 方法 ===

  /**
   * 取得所有文化項目
   */
  async getCultureItems(): Promise<CultureItem[]> {
    try {
      const client = this.getSupabaseClient()
      const { data, error } = await client
        .from('culture')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        this.handleError(error, 'getCultureItems')
      }

      const result = (data || []).map((item: any) => this.transformFromDB(item))

      dbLogger.info('載入文化項目成功', {
        module: this.moduleName,
        action: 'getCultureItems',
        metadata: { count: result.length },
      })

      return result
    } catch (error) {
      // 對於公開的 API，記錄錯誤但拋出以便前端處理
      dbLogger.error(
        '取得文化項目失敗',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          module: this.moduleName,
          action: 'getCultureItems',
        }
      )
      throw error
    }
  }

  /**
   * 根據 ID 取得文化項目
   */
  async getCultureItemById(id: string): Promise<CultureItem | null> {
    try {
      const client = this.getSupabaseClient()
      const { data, error } = await client.from('culture').select('*').eq('id', id).single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // 找不到記錄
        }
        this.handleError(error, 'getCultureItemById', { id })
      }

      const result = data ? this.transformFromDB(data as any) : null

      dbLogger.debug('取得文化項目詳情', {
        module: this.moduleName,
        action: 'getCultureItemById',
        metadata: { id, found: !!result },
      })

      return result
    } catch (error) {
      dbLogger.error(
        '根據 ID 取得文化項目失敗',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          module: this.moduleName,
          action: 'getCultureItemById',
          metadata: { id },
        }
      )
      return null
    }
  }

  /**
   * 新增文化項目
   */
  async addCultureItem(
    itemData: Omit<CultureItem, 'id' | 'createdAt' | 'updatedAt'> & { imageFile?: File }
  ): Promise<CultureItem> {
    try {
      // 類型轉換以支援檔案上傳
      const extendedData = itemData as CreateCultureItemRequest

      // 驗證資料
      this.validateCultureItemData(extendedData)

      dbLogger.info('建立文化項目開始', {
        module: this.moduleName,
        action: 'addCultureItem',
        metadata: {
          title: extendedData.title,
          imageFile: extendedData.imageFile ? `File: ${extendedData.imageFile.name}` : undefined,
          hasImageUrl: !!extendedData.imageUrl,
          hasBase64: !!extendedData.image,
        },
      })

      // 確保 Storage bucket 存在
      try {
        await initializeCultureStorageBucket()
        dbLogger.debug('Storage bucket 初始化完成')
      } catch (bucketError) {
        dbLogger.warn('Storage bucket 初始化警告', {
          module: this.moduleName,
          action: 'initializeBucket',
          metadata: {
            error: bucketError instanceof Error ? bucketError.message : String(bucketError),
          },
        })
      }

      const client = this.getAdminClient()
      if (!client) {
        throw new Error('管理員客戶端未初始化')
      }

      // 先插入資料庫記錄以取得 ID
      const insertData = this.transformToDB(extendedData)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (client.from('culture'))
        .insert([insertData])
        .select()
        .single()

      if (error) {
        this.handleError(error, 'addCultureItem:insertRecord', { itemData: insertData })
      }

      const cultureId = data?.id as string
      const images: string[] = []

      try {
        // 處理圖片上傳
        if (extendedData.imageFile) {
          dbLogger.info('上傳檔案到 Storage', {
            module: this.moduleName,
            action: 'uploadImageFile',
            metadata: { fileName: extendedData.imageFile.name, cultureId },
          })
          const { url } = await uploadCultureImageToStorage(extendedData.imageFile, cultureId)
          images.push(url)
          dbLogger.info('Storage 上傳成功', {
            module: this.moduleName,
            action: 'uploadImageFile',
            metadata: { url, cultureId },
          })
        } else if (extendedData.imageUrl) {
          dbLogger.info('使用提供的 imageUrl', {
            module: this.moduleName,
            action: 'useImageUrl',
            metadata: { imageUrl: extendedData.imageUrl?.substring(0, 100) + '...', cultureId },
          })
          images.push(extendedData.imageUrl)
        } else if (extendedData.image && extendedData.image.startsWith('data:image/')) {
          // 處理 base64 圖片（向後相容）
          dbLogger.info('轉換 base64 圖片到 Storage', {
            module: this.moduleName,
            action: 'convertBase64',
            metadata: { cultureId },
          })
          const { url } = await uploadBase64ToCultureStorage(extendedData.image, cultureId)
          images.push(url)
          dbLogger.info('Base64 轉換上傳成功', {
            module: this.moduleName,
            action: 'convertBase64',
            metadata: { url, cultureId },
          })
        }

        // 更新資料庫中的圖片 URL
        if (images.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: updateError } = await (client.from('culture'))
            .update({ images })
            .eq('id', cultureId)

          if (updateError) {
            // 嘗試清理已上傳的檔案
            await deleteCultureImages(cultureId).catch(() => {
              dbLogger.warn('清理上傳檔案失敗', {
                module: this.moduleName,
                action: 'cleanup',
                metadata: { cultureId },
              })
            })
            this.handleError(updateError, 'addCultureItem:updateImages', { cultureId, images })
          }

          dbLogger.info('資料庫圖片 URL 更新成功', {
            module: this.moduleName,
            action: 'updateImages',
            metadata: { images, cultureId },
          })
        }

        const result = this.transformFromDB({ ...data, images } as any)

        dbLogger.info('文化項目建立成功', {
          module: this.moduleName,
          action: 'addCultureItem',
          metadata: {
            id: result.id,
            title: result.title,
            hasImage: !!result.imageUrl,
          },
        })

        return result
      } catch (uploadError) {
        dbLogger.error(
          '圖片處理失敗，清理資料庫記錄',
          uploadError instanceof Error ? uploadError : new Error('Unknown upload error'),
          {
            module: this.moduleName,
            action: 'cleanup',
            metadata: { cultureId },
          }
        )

        // 如果圖片處理失敗，刪除已建立的資料庫記錄
        const deleteResult = await client.from('culture').delete().eq('id', cultureId)

        if (deleteResult.error) {
          dbLogger.error('清理資料庫記錄失敗', new Error('Database cleanup failed'), {
            module: this.moduleName,
            action: 'cleanup',
            metadata: { cultureId },
          })
        }

        throw new Error('圖片處理失敗，無法建立文化項目')
      }
    } catch (error) {
      this.handleError(error, 'addCultureItem', { itemData })
    }
  }

  /**
   * 更新文化項目
   */
  async updateCultureItem(
    id: string,
    itemData: Partial<Omit<CultureItem, 'id' | 'createdAt' | 'updatedAt'>> & { imageFile?: File }
  ): Promise<CultureItem> {
    try {
      // 類型轉換以支援檔案上傳
      const extendedData = itemData as UpdateCultureItemRequest

      dbLogger.info('更新文化項目開始', {
        module: this.moduleName,
        action: 'updateCultureItem',
        metadata: {
          id,
          title: extendedData.title,
          imageFile: extendedData.imageFile ? `File: ${extendedData.imageFile.name}` : undefined,
          hasImageUrl: extendedData.imageUrl !== undefined,
          hasBase64: !!extendedData.image,
        },
      })

      const client = this.getAdminClient()
      if (!client) {
        throw new Error('管理員客戶端未初始化')
      }

      const dbUpdateData: Record<string, unknown> = {}

      if (extendedData.title !== undefined) dbUpdateData.title = extendedData.title
      if (extendedData.description !== undefined)
        dbUpdateData.description = extendedData.description
      if (extendedData.subtitle !== undefined) dbUpdateData.content = extendedData.subtitle

      // 處理圖片更新
      const images: string[] = []
      let shouldUpdateImages = false

      if (extendedData.imageFile) {
        dbLogger.info('上傳新檔案到 Storage', {
          module: this.moduleName,
          action: 'updateImageFile',
          metadata: { fileName: extendedData.imageFile.name, cultureId: id },
        })
        // 先刪除舊圖片
        await deleteCultureImages(id)
        // 上傳新圖片
        const { url } = await uploadCultureImageToStorage(extendedData.imageFile, id)
        images.push(url)
        shouldUpdateImages = true
        dbLogger.info('新檔案上傳成功', {
          module: this.moduleName,
          action: 'updateImageFile',
          metadata: { url, cultureId: id },
        })
      } else if (extendedData.imageUrl !== undefined) {
        if (extendedData.imageUrl) {
          dbLogger.info('使用新的 imageUrl', {
            module: this.moduleName,
            action: 'updateImageUrl',
            metadata: { imageUrl: extendedData.imageUrl?.substring(0, 100) + '...', cultureId: id },
          })
          images.push(extendedData.imageUrl)
        }
        shouldUpdateImages = true
      } else if (extendedData.image && extendedData.image.startsWith('data:image/')) {
        // 處理 base64 圖片（向後相容）
        dbLogger.info('轉換新的 base64 圖片到 Storage', {
          module: this.moduleName,
          action: 'updateBase64',
          metadata: { cultureId: id },
        })
        await deleteCultureImages(id)
        const { url } = await uploadBase64ToCultureStorage(extendedData.image, id)
        images.push(url)
        shouldUpdateImages = true
        dbLogger.info('Base64 轉換更新成功', {
          module: this.moduleName,
          action: 'updateBase64',
          metadata: { url, cultureId: id },
        })
      }

      if (shouldUpdateImages) {
        dbUpdateData.images = images
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (client.from('culture'))
        .update(dbUpdateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'updateCultureItem', { id, updateData: dbUpdateData })
      }

      if (!data) {
        throw new NotFoundError('文化項目不存在')
      }

      const result = this.transformFromDB(data as any)

      dbLogger.info('文化項目更新成功', {
        module: this.moduleName,
        action: 'updateCultureItem',
        metadata: {
          id,
          changes: Object.keys(dbUpdateData),
          title: result.title,
        },
      })

      return result
    } catch (error) {
      this.handleError(error, 'updateCultureItem', { id, itemData })
    }
  }

  /**
   * 刪除文化項目
   */
  async deleteCultureItem(id: string): Promise<void> {
    try {
      dbLogger.info('刪除文化項目開始', {
        module: this.moduleName,
        action: 'deleteCultureItem',
        metadata: { id },
      })

      // 先刪除 Storage 中的所有圖片
      try {
        const deletionResult = await deleteCultureImages(id)

        if (deletionResult.success) {
          dbLogger.info(`成功刪除 ${deletionResult.deletedCount} 張圖片`, {
            module: this.moduleName,
            action: 'deleteImages',
            metadata: { id, deletedCount: deletionResult.deletedCount },
          })
        } else {
          dbLogger.warn('刪除圖片時發生警告', {
            module: this.moduleName,
            action: 'deleteImages',
            metadata: { id, error: deletionResult.error },
          })
        }
      } catch (storageError) {
        // 圖片刪除失敗不應該阻止項目刪除，但要記錄錯誤
        dbLogger.warn('刪除圖片時發生警告', {
          module: this.moduleName,
          action: 'deleteImages',
          metadata: {
            id,
            error: storageError instanceof Error ? storageError.message : String(storageError),
          },
        })
      }

      const client = this.getAdminClient()
      if (!client) {
        throw new Error('管理員客戶端未初始化')
      }

      // 刪除資料庫記錄
      const { error } = await client.from('culture').delete().eq('id', id)

      if (error) {
        this.handleError(error, 'deleteCultureItem', { id })
      }

      dbLogger.info('文化項目刪除完成', {
        module: this.moduleName,
        action: 'deleteCultureItem',
        metadata: { id },
      })
    } catch (error) {
      this.handleError(error, 'deleteCultureItem', { id })
    }
  }

  // === 私有輔助方法 ===

  /**
   * 驗證文化項目資料
   */
  private validateCultureItemData(itemData: CreateCultureItemRequest): void {
    if (!itemData.title?.trim()) {
      throw new ValidationError('文化項目標題不能為空')
    }

    if (!itemData.description?.trim()) {
      throw new ValidationError('文化項目描述不能為空')
    }

    // 驗證標題長度
    if (itemData.title.length > 100) {
      throw new ValidationError('文化項目標題不能超過 100 字元')
    }

    // 驗證描述長度
    if (itemData.description.length > 1000) {
      throw new ValidationError('文化項目描述不能超過 1,000 字元')
    }

    // 驗證副標題長度
    if (itemData.subtitle && itemData.subtitle.length > 200) {
      throw new ValidationError('文化項目副標題不能超過 200 字元')
    }
  }

  /**
   * 取得服務健康狀態
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: string
    details?: Record<string, unknown>
  }> {
    try {
      // 簡單的連線測試
      const client = this.getSupabaseClient()
      const { error } = await client.from('culture').select('id').limit(1)

      const isHealthy = !error || error.code === 'PGRST116' // 表格可能為空

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        details: {
          moduleName: this.moduleName,
          tableName: 'culture',
          storageIntegration: 'enabled',
          error: error?.message,
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: {
          moduleName: this.moduleName,
          error: (error as Error).message,
        },
      }
    }
  }
}

// 建立並匯出服務實例
export const cultureServiceV2Simple = new CultureServiceV2Simple()
