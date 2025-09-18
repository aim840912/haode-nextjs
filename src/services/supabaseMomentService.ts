import { MomentItem, MomentService } from '@/types/moments'
import { supabase, getSupabaseAdmin } from '@/lib/supabase-auth'
import { dbLogger } from '@/lib/logger'
import {
  uploadMomentImageToStorage,
  deleteMomentImages,
  initializeMomentStorageBucket,
  uploadBase64ToMomentStorage,
} from '@/lib/moments-storage'

export class SupabaseMomentService implements MomentService {
  async getMomentItems(): Promise<MomentItem[]> {
    try {
      const { data, error } = await supabase
        .from('moments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        dbLogger.error('精彩時刻項目查詢失敗', new Error(error.message))
        throw new Error(`資料庫查詢失敗: ${error.message}`)
      }

      const result = data?.map((item: Record<string, unknown>) => this.transformFromDB(item)) || []
      dbLogger.info('載入精彩時刻項目', {
        metadata: { count: result.length },
      })
      return result
    } catch (error) {
      dbLogger.error(
        '取得精彩時刻項目失敗',
        error instanceof Error ? error : new Error('Unknown error')
      )
      // 拋出錯誤而不是返回空陣列，這樣前端可以顯示錯誤訊息
      throw error
    }
  }

  async getMomentItemById(id: string): Promise<MomentItem | null> {
    try {
      const { data, error } = await supabase.from('moments').select('*').eq('id', id).single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      return this.transformFromDB(data)
    } catch (error) {
      dbLogger.error(
        '根據ID取得精彩時刻項目失敗',
        error instanceof Error ? error : new Error('Unknown error'),
        { metadata: { id } }
      )
      return null
    }
  }

  async addMomentItem(
    itemData: Omit<MomentItem, 'id' | 'createdAt' | 'updatedAt'> & { imageFile?: File }
  ): Promise<MomentItem> {
    dbLogger.debug('收到建立精彩時刻項目資料', {
      metadata: {
        ...itemData,
        imageFile: itemData.imageFile ? `File: ${itemData.imageFile.name}` : undefined,
        hasImages: Array.isArray(itemData.images),
        imagesCount: Array.isArray(itemData.images) ? itemData.images.length : 0,
      },
    })

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

    // 先插入資料庫記錄以取得 ID
    const insertData = {
      title: itemData.title,
      description: itemData.description,
      content: itemData.subtitle, // 使用 subtitle 作為 content
      category: 'moments',
      year: new Date().getFullYear(),
      is_featured: true,
      images: [], // 先設為空陣列，稍後更新
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }
    const { data, error } = await supabaseAdmin
      .from('moments')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      dbLogger.error(
        'Error adding moment item',
        new Error(error.message || 'Failed to add moment item')
      )
      throw new Error('Failed to add moment item')
    }

    const momentId = data.id
    // 如果 itemData 已有 images 陣列，使用它；否則創建空陣列
    const images: string[] = Array.isArray(itemData.images) ? [...itemData.images] : []

    try {
      // 處理圖片上傳
      if (itemData.imageFile) {
        dbLogger.info('📤 上傳檔案到 Storage', {
          metadata: { fileName: itemData.imageFile.name },
        })
        const { url } = await uploadMomentImageToStorage(itemData.imageFile, momentId)
        images.push(url)
        dbLogger.info('✅ Storage 上傳成功', {
          metadata: { url },
        })
      } else if (itemData.imageUrl) {
        dbLogger.info('🔗 使用提供的 imageUrl', {
          metadata: { imageUrl: itemData.imageUrl?.substring(0, 100) + '...' },
        })
        images.push(itemData.imageUrl)
      } else if (
        'image' in itemData &&
        typeof itemData.image === 'string' &&
        itemData.image.startsWith('data:image/')
      ) {
        // 處理 base64 圖片（向後相容）
        dbLogger.info('📷 轉換 base64 圖片到 Storage')
        const { url } = await uploadBase64ToMomentStorage(itemData.image as string, momentId)
        images.push(url)
        dbLogger.info('✅ Base64 轉換上傳成功', {
          metadata: { url },
        })
      }

      // 更新資料庫中的圖片 URL
      dbLogger.info('準備更新資料庫 images 欄位', {
        metadata: { momentId, imagesCount: images.length, images: images.slice(0, 3) },
      })

      if (images.length > 0) {
        const supabaseAdmin = getSupabaseAdmin()
        if (!supabaseAdmin) {
          throw new Error('Supabase admin client not available')
        }
        const { error: updateError } = await supabaseAdmin
          .from('moments')
          .update({ images })
          .eq('id', momentId)

        if (updateError) {
          dbLogger.error(
            'Error updating images',
            new Error(updateError.message || 'Failed to update images')
          )
          // 嘗試清理已上傳的檔案
          await deleteMomentImages(momentId)
          throw new Error('Failed to update moment item with images')
        }

        dbLogger.info('💾 資料庫圖片 URL 更新成功', {
          metadata: { images },
        })
      }

      return this.transformFromDB({ ...data, images })
    } catch (uploadError) {
      dbLogger.info('🚫 圖片處理失敗，刪除資料庫記錄', {
        metadata: {
          error: uploadError instanceof Error ? uploadError.message : String(uploadError),
        },
      })
      // 如果圖片處理失敗，刪除已建立的資料庫記錄
      const supabaseAdmin = getSupabaseAdmin()
      if (supabaseAdmin) {
        await supabaseAdmin.from('moments').delete().eq('id', momentId)
      }

      throw new Error('Failed to process moment item images')
    }
  }

  async updateMomentItem(
    id: string,
    itemData: Partial<Omit<MomentItem, 'id' | 'createdAt' | 'updatedAt'>> & { imageFile?: File }
  ): Promise<MomentItem> {
    dbLogger.info('🔄 更新精彩時刻', {
      metadata: {
        id,
        ...itemData,
        imageFile: itemData.imageFile ? `File: ${itemData.imageFile.name}` : undefined,
      },
    })

    const dbUpdateData: Record<string, unknown> = {}

    if (itemData.title !== undefined) dbUpdateData.title = itemData.title
    if (itemData.description !== undefined) dbUpdateData.description = itemData.description
    if (itemData.subtitle !== undefined) dbUpdateData.content = itemData.subtitle

    // 處理圖片更新
    const images: string[] = []
    let shouldUpdateImages = false

    if (itemData.imageFile) {
      dbLogger.info('📤 上傳新檔案到 Storage', {
        metadata: { fileName: itemData.imageFile.name },
      })
      // 先刪除舊圖片
      await deleteMomentImages(id)
      // 上傳新圖片
      const { url } = await uploadMomentImageToStorage(itemData.imageFile, id)
      images.push(url)
      shouldUpdateImages = true
      dbLogger.info('✅ 新檔案上傳成功', {
        metadata: { url },
      })
    } else if (itemData.imageUrl !== undefined) {
      if (itemData.imageUrl) {
        dbLogger.info('🔗 使用新的 imageUrl', {
          metadata: { imageUrl: itemData.imageUrl?.substring(0, 100) + '...' },
        })
        images.push(itemData.imageUrl)
      }
      shouldUpdateImages = true
    } else if (
      'image' in itemData &&
      typeof itemData.image === 'string' &&
      itemData.image.startsWith('data:image/')
    ) {
      // 處理 base64 圖片（向後相容）
      dbLogger.info('📷 轉換新的 base64 圖片到 Storage')
      await deleteMomentImages(id)
      const { url } = await uploadBase64ToMomentStorage(itemData.image as string, id)
      images.push(url)
      shouldUpdateImages = true
      dbLogger.info('✅ Base64 轉換更新成功', {
        metadata: { url },
      })
    }

    if (shouldUpdateImages) {
      dbUpdateData.images = images
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }
    const { data, error } = await supabaseAdmin
      .from('moments')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      dbLogger.error(
        'Error updating moment item',
        new Error(error.message || 'Failed to update moment item')
      )
      throw new Error('Failed to update moment item')
    }

    if (!data) throw new Error('Moment item not found')
    dbLogger.info('✅ 精彩時刻更新成功')
    return this.transformFromDB(data)
  }

  async deleteMomentItem(id: string): Promise<void> {
    try {
      // 先刪除 Storage 中的所有圖片
      dbLogger.info('🗑️ 刪除精彩時刻項目', {
        metadata: { id },
      })
      const deletionResult = await deleteMomentImages(id)

      if (deletionResult.success) {
        dbLogger.info(`✅ 成功刪除 ${deletionResult.deletedCount} 張圖片`)
      } else {
        dbLogger.info('⚠️ 刪除圖片時發生警告', {
          metadata: { error: deletionResult.error },
        })
      }
    } catch (storageError) {
      // 圖片刪除失敗不應該阻止項目刪除，但要記錄錯誤
      dbLogger.info('⚠️ 刪除精彩時刻圖片時發生警告', {
        metadata: {
          error: storageError instanceof Error ? storageError.message : String(storageError),
        },
      })
    }

    // 然後刪除資料庫記錄
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }
    const { error } = await supabaseAdmin.from('moments').delete().eq('id', id)

    if (error) {
      dbLogger.error(
        'Error deleting moment item',
        new Error(error.message || 'Failed to delete moment item'),
        {
          metadata: { errorCode: error.code },
        }
      )
      throw new Error('Failed to delete moment item')
    }

    dbLogger.info('✅ 精彩時刻項目刪除完成', {
      metadata: { id },
    })
  }

  private transformFromDB(dbItem: Record<string, unknown>): MomentItem {
    // 根據分類設定顏色和表情符號
    const categoryConfig = this.getCategoryConfig(dbItem.category as string)

    // 處理圖片 URL，確保有效性
    const images = dbItem.images as string[] | undefined
    const imageUrl = images?.[0]
    let processedImageUrl = imageUrl

    if (imageUrl) {
      dbLogger.info('🖼️ 原始圖片資料', {
        metadata: { imageUrl: imageUrl?.substring(0, 100) + '...' },
      })

      // 如果是 base64 圖片，確保格式正確
      if (imageUrl.startsWith('data:image/')) {
        processedImageUrl = imageUrl
        dbLogger.info('✅ 偵測到 base64 圖片格式')
      }
      // 如果是 HTTP(S) URL，保持原樣
      else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        processedImageUrl = imageUrl
        dbLogger.info('✅ 偵測到 HTTP(S) 圖片 URL')
      }
      // 其他格式的處理
      else {
        dbLogger.info('⚠️ 未知圖片格式', {
          metadata: { imageUrl: imageUrl?.substring(0, 50) + '...' },
        })
        processedImageUrl = imageUrl
      }
    }

    return {
      id: dbItem.id as string,
      title: dbItem.title as string,
      subtitle: (dbItem.content || dbItem.description) as string,
      description: dbItem.description as string,
      color: categoryConfig.color,
      height: categoryConfig.height,
      textColor: categoryConfig.textColor,
      emoji: categoryConfig.emoji,
      imageUrl: processedImageUrl as string | undefined,
      images: images || [], // 返回完整圖片陣列
      createdAt: dbItem.created_at as string,
      updatedAt: dbItem.updated_at as string,
    }
  }

  private getCategoryConfig(category: string) {
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
}

export const supabaseMomentService = new SupabaseMomentService()
