/**
 * 精彩時刻服務 v2 簡化實作
 * 基於統一架構的精彩時刻項目管理服務
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
import { MomentItem, MomentService } from '@/types/moments'
import { ServiceSupabaseClient, ServiceErrorContext } from '@/types/service.types'
import { Database } from '@/types/database'
import {
  uploadMomentImageToStorage,
  deleteMomentImages,
  initializeMomentStorageBucket,
  uploadBase64ToMomentStorage,
} from '@/lib/moments-storage'

/**
 * 資料庫記錄類型
 */
interface SupabaseMomentRecord {
  id: string
  title: string
  description: string | null
  content: string | null
  category: string
  year: number
  is_featured: boolean | null
  images: string[]
  created_at: string
  updated_at: string
}

/**
 * 建立精彩時刻項目的擴展介面（支援檔案上傳）
 */
export interface CreateMomentItemRequest
  extends Omit<MomentItem, 'id' | 'createdAt' | 'updatedAt'> {
  imageFile?: File
  image?: string // base64 向後相容
}

/**
 * 更新精彩時刻項目的擴展介面（支援檔案上傳）
 */
export interface UpdateMomentItemRequest
  extends Partial<Omit<MomentItem, 'id' | 'createdAt' | 'updatedAt'>> {
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
 * 精彩時刻服務 v2 簡化實作
 */
export class MomentServiceV2Simple implements MomentService {
  private readonly moduleName = 'MomentServiceV2'

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
    return getSupabaseAdmin()!
  }

  /**
   * 處理錯誤
   */
  private handleError(error: unknown, operation: string, context?: ServiceErrorContext): never {
    dbLogger.error(`精彩時刻服務 ${operation} 操作失敗`, error as Error, {
      module: this.moduleName,
      action: operation,
      metadata: context,
    })

    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error
    }

    throw ErrorFactory.fromSupabaseError(error, {
      module: this.moduleName,
      action: operation,
      ...context,
    })
  }

  /**
   * 取得所有精彩時刻項目
   */
  async getMomentItems(): Promise<MomentItem[]> {
    try {
      const supabase = this.getSupabaseClient()
      const { data, error } = await supabase
        .from('moments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        this.handleError(error, 'getMomentItems')
      }

      const result = (data || []).map(this.transformFromDB.bind(this))

      dbLogger.info('載入精彩時刻項目', {
        module: this.moduleName,
        action: 'getMomentItems',
        metadata: { count: result.length },
      })

      return result
    } catch (error) {
      this.handleError(error, 'getMomentItems')
    }
  }

  /**
   * 根據 ID 取得精彩時刻項目
   */
  async getMomentItemById(id: string): Promise<MomentItem | null> {
    try {
      if (!id) {
        throw new ValidationError('精彩時刻 ID 為必填')
      }

      const supabase = this.getSupabaseClient()
      const { data, error } = await supabase.from('moments').select('*').eq('id', id).single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // 項目不存在
        }
        this.handleError(error, 'getMomentItemById', { momentId: id })
      }

      const result = this.transformFromDB(data)

      dbLogger.info('根據 ID 取得精彩時刻項目', {
        module: this.moduleName,
        action: 'getMomentItemById',
        metadata: { momentId: id },
      })

      return result
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      this.handleError(error, 'getMomentItemById', { momentId: id })
    }
  }

  /**
   * 新增精彩時刻項目
   */
  async addMomentItem(
    itemData: CreateMomentItemRequest | Record<string, unknown>
  ): Promise<MomentItem> {
    try {
      // 類型檢查和驗證必填欄位
      if (!itemData.title || typeof itemData.title !== 'string') {
        throw new ValidationError('標題為必填欄位')
      }

      // 確保 Storage bucket 存在
      try {
        await initializeMomentStorageBucket()
      } catch (bucketError) {
        dbLogger.info('⚠️ Storage bucket 初始化警告', {
          metadata: {
            error: bucketError instanceof Error ? bucketError.message : String(bucketError),
          },
        })
      }

      // 準備資料庫記錄
      const insertData = {
        title: itemData.title as string,
        description: (itemData.description as string) || '',
        content: (itemData.subtitle as string) || (itemData.description as string) || '',
        category: 'moments',
        year: new Date().getFullYear(),
        is_featured: true,
        images: [], // 先設為空陣列，稍後更新
      }

      // 使用管理員客戶端插入記錄
      const adminClient = this.getAdminClient()
      const { data, error } = await adminClient
        .from('moments')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        this.handleError(error, 'addMomentItem')
      }

      const momentId = data.id
      const images: string[] = []

      try {
        // 處理圖片上傳
        if (itemData.imageFile && itemData.imageFile instanceof File) {
          dbLogger.info('📤 上傳檔案到 Storage', {
            metadata: { fileName: itemData.imageFile.name },
          })
          const { url } = await uploadMomentImageToStorage(itemData.imageFile, momentId)
          images.push(url)
        } else if (itemData.imageUrl && typeof itemData.imageUrl === 'string') {
          images.push(itemData.imageUrl)
        } else if (
          itemData.image &&
          typeof itemData.image === 'string' &&
          itemData.image.startsWith('data:image/')
        ) {
          // 處理 base64 圖片（向後相容）
          const { url } = await uploadBase64ToMomentStorage(itemData.image, momentId)
          images.push(url)
        }

        // 更新資料庫中的圖片 URL
        if (images.length > 0) {
          const { error: updateError } = await adminClient
            .from('moments')
            .update({ images })
            .eq('id', momentId)

          if (updateError) {
            // 嘗試清理已上傳的檔案
            await deleteMomentImages(momentId)
            this.handleError(updateError, 'addMomentItem', { momentId })
          }
        }

        const result = this.transformFromDB({ ...data, images })

        dbLogger.info('✅ 精彩時刻項目建立成功', {
          module: this.moduleName,
          action: 'addMomentItem',
          metadata: { momentId },
        })

        return result
      } catch (uploadError) {
        // 如果圖片處理失敗，刪除已建立的資料庫記錄
        await adminClient.from('moments').delete().eq('id', momentId)
        throw uploadError
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      this.handleError(error, 'addMomentItem')
    }
  }

  /**
   * 更新精彩時刻項目
   */
  async updateMomentItem(
    id: string,
    itemData: UpdateMomentItemRequest | Record<string, unknown>
  ): Promise<MomentItem> {
    try {
      if (!id) {
        throw new ValidationError('精彩時刻 ID 為必填')
      }

      // 檢查項目是否存在
      const existingItem = await this.getMomentItemById(id)
      if (!existingItem) {
        throw new NotFoundError('精彩時刻項目不存在')
      }

      const dbUpdateData: Record<string, unknown> = {}

      if (itemData.title !== undefined) dbUpdateData.title = itemData.title
      if (itemData.description !== undefined) dbUpdateData.description = itemData.description
      if (itemData.subtitle !== undefined) dbUpdateData.content = itemData.subtitle

      // 處理圖片更新
      const images: string[] = []
      let shouldUpdateImages = false

      if (itemData.imageFile && itemData.imageFile instanceof File) {
        // 先刪除舊圖片
        await deleteMomentImages(id)
        // 上傳新圖片
        const { url } = await uploadMomentImageToStorage(itemData.imageFile, id)
        images.push(url)
        shouldUpdateImages = true
      } else if (itemData.imageUrl !== undefined) {
        if (itemData.imageUrl && typeof itemData.imageUrl === 'string') {
          images.push(itemData.imageUrl)
        }
        shouldUpdateImages = true
      } else if (
        itemData.image &&
        typeof itemData.image === 'string' &&
        itemData.image.startsWith('data:image/')
      ) {
        // 處理 base64 圖片（向後相容）
        await deleteMomentImages(id)
        const { url } = await uploadBase64ToMomentStorage(itemData.image, id)
        images.push(url)
        shouldUpdateImages = true
      }

      if (shouldUpdateImages) {
        dbUpdateData.images = images
      }

      const adminClient = this.getAdminClient()
      const { data, error } = await adminClient
        .from('moments')
        .update(dbUpdateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'updateMomentItem', { momentId: id })
      }

      const result = this.transformFromDB(data)

      dbLogger.info('✅ 精彩時刻項目更新成功', {
        module: this.moduleName,
        action: 'updateMomentItem',
        metadata: { momentId: id },
      })

      return result
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error
      }
      this.handleError(error, 'updateMomentItem', { momentId: id })
    }
  }

  /**
   * 刪除精彩時刻項目
   */
  async deleteMomentItem(id: string): Promise<void> {
    try {
      if (!id) {
        throw new ValidationError('精彩時刻 ID 為必填')
      }

      // 檢查項目是否存在
      const existingItem = await this.getMomentItemById(id)
      if (!existingItem) {
        throw new NotFoundError('精彩時刻項目不存在')
      }

      // 先刪除 Storage 中的所有圖片
      try {
        const deletionResult = await deleteMomentImages(id)
        if (deletionResult.success) {
          dbLogger.info(`✅ 成功刪除 ${deletionResult.deletedCount} 張圖片`)
        }
      } catch (storageError) {
        // 圖片刪除失敗不應該阻止項目刪除
        dbLogger.info('⚠️ 刪除精彩時刻圖片時發生警告', {
          metadata: {
            error: storageError instanceof Error ? storageError.message : String(storageError),
          },
        })
      }

      // 刪除資料庫記錄
      const adminClient = this.getAdminClient()
      const { error } = await adminClient.from('moments').delete().eq('id', id)

      if (error) {
        this.handleError(error, 'deleteMomentItem', { momentId: id })
      }

      dbLogger.info('✅ 精彩時刻項目刪除完成', {
        module: this.moduleName,
        action: 'deleteMomentItem',
        metadata: { momentId: id },
      })
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error
      }
      this.handleError(error, 'deleteMomentItem', { momentId: id })
    }
  }

  /**
   * 將資料庫記錄轉換為 MomentItem
   */
  private transformFromDB(dbItem: SupabaseMomentRecord): MomentItem {
    const categoryConfig = this.getCategoryConfig(dbItem.category)

    // 處理圖片 URL
    const images = dbItem.images || []
    const imageUrl = images[0]

    return {
      id: dbItem.id,
      title: dbItem.title,
      subtitle: dbItem.content || dbItem.description || '',
      description: dbItem.description || '',
      color: categoryConfig.color,
      height: categoryConfig.height,
      textColor: categoryConfig.textColor,
      emoji: categoryConfig.emoji,
      imageUrl,
      createdAt: dbItem.created_at,
      updatedAt: dbItem.updated_at,
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
      moments: {
        color: 'bg-blue-400',
        height: 'h-56',
        textColor: 'text-white',
        emoji: '📸',
      },
      daily: {
        color: 'bg-amber-400',
        height: 'h-52',
        textColor: 'text-white',
        emoji: '☀️',
      },
      events: {
        color: 'bg-purple-400',
        height: 'h-60',
        textColor: 'text-white',
        emoji: '🎉',
      },
      default: {
        color: 'bg-gray-400',
        height: 'h-48',
        textColor: 'text-white',
        emoji: '📷',
      },
    }

    return configs[category as keyof typeof configs] || configs.default
  }

  /**
   * 取得服務健康狀態
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    version: string
    details: Record<string, unknown>
    timestamp: string
  }> {
    try {
      // 簡單的健康檢查 - 嘗試查詢資料庫
      const supabase = this.getSupabaseClient()
      const { error } = await supabase.from('moments').select('id').limit(1)

      if (error) {
        return {
          status: 'unhealthy',
          version: 'v2-simple',
          details: {
            error: error.message,
            service: this.moduleName,
          },
          timestamp: new Date().toISOString(),
        }
      }

      return {
        status: 'healthy',
        version: 'v2-simple',
        details: {
          service: this.moduleName,
          storageIntegration: 'enabled',
        },
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        version: 'v2-simple',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          service: this.moduleName,
        },
        timestamp: new Date().toISOString(),
      }
    }
  }
}

// 建立並匯出服務實例
export const momentServiceV2Simple = new MomentServiceV2Simple()
