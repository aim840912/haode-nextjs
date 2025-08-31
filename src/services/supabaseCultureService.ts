import { CultureItem, CultureService } from '@/types/culture'
import { supabase, supabaseAdmin } from '@/lib/supabase-auth'
import { dbLogger } from '@/lib/logger'
import { 
  uploadCultureImageToStorage, 
  deleteCultureImages,
  initializeCultureStorageBucket,
  uploadBase64ToCultureStorage
} from '@/lib/culture-storage'

export class SupabaseCultureService implements CultureService {
  async getCultureItems(): Promise<CultureItem[]> {
    try {
      const { data, error } = await supabase
        .from('culture')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        dbLogger.error('文化項目查詢失敗', 
          new Error(error.message))
        throw new Error(`資料庫查詢失敗: ${error.message}`)
      }
      
      const result = data?.map((item: any) => this.transformFromDB(item)) || []
      dbLogger.info('載入文化項目', { 
        metadata: { count: result.length } 
      })
      return result
    } catch (error) {
      dbLogger.error('取得文化項目失敗', 
        error instanceof Error ? error : new Error('Unknown error'))
      // 拋出錯誤而不是返回空陣列，這樣前端可以顯示錯誤訊息
      throw error
    }
  }

  async getCultureItemById(id: string): Promise<CultureItem | null> {
    try {
      const { data, error } = await supabase
        .from('culture')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }
      
      return this.transformFromDB(data)
    } catch (error) {
      dbLogger.error('根據ID取得文化項目失敗', 
        error instanceof Error ? error : new Error('Unknown error'), 
        { metadata: { id } })
      return null
    }
  }

  async addCultureItem(itemData: Omit<CultureItem, 'id' | 'createdAt' | 'updatedAt'> & { imageFile?: File }): Promise<CultureItem> {
    dbLogger.debug('收到建立文化項目資料', {
      metadata: {
        ...itemData,
        imageFile: itemData.imageFile ? `File: ${itemData.imageFile.name}` : undefined
      }
    })
    
    // 確保 Storage bucket 存在
    try {
      await initializeCultureStorageBucket();
    } catch (bucketError) {
      dbLogger.info('⚠️ Storage bucket 初始化警告', { 
        metadata: { error: bucketError instanceof Error ? bucketError.message : String(bucketError) } 
      });
    }
    
    // 先插入資料庫記錄以取得 ID
    const insertData = {
      title: itemData.title,
      description: itemData.description,
      content: itemData.subtitle, // 使用 subtitle 作為 content
      category: 'culture',
      year: new Date().getFullYear(),
      is_featured: true,
      images: [] // 先設為空陣列，稍後更新
    }

    const { data, error } = await supabaseAdmin!
      .from('culture')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      dbLogger.info('Error adding culture item:', error)
      throw new Error('Failed to add culture item')
    }

    const cultureId = data.id;
    const images: string[] = [];

    try {
      // 處理圖片上傳
      if (itemData.imageFile) {
        dbLogger.info('📤 上傳檔案到 Storage', { 
          metadata: { fileName: itemData.imageFile.name } 
        });
        const { url } = await uploadCultureImageToStorage(itemData.imageFile, cultureId);
        images.push(url);
        dbLogger.info('✅ Storage 上傳成功', { 
          metadata: { url } 
        });
      } else if (itemData.imageUrl) {
        dbLogger.info('🔗 使用提供的 imageUrl', { 
          metadata: { imageUrl: itemData.imageUrl?.substring(0, 100) + '...' } 
        });
        images.push(itemData.imageUrl);
      } else if ((itemData as any).image && (itemData as any).image.startsWith('data:image/')) {
        // 處理 base64 圖片（向後相容）
        dbLogger.info('📷 轉換 base64 圖片到 Storage');
        const { url } = await uploadBase64ToCultureStorage((itemData as any).image, cultureId);
        images.push(url);
        dbLogger.info('✅ Base64 轉換上傳成功', { 
          metadata: { url } 
        });
      }

      // 更新資料庫中的圖片 URL
      if (images.length > 0) {
        const { error: updateError } = await supabaseAdmin!
          .from('culture')
          .update({ images })
          .eq('id', cultureId);

        if (updateError) {
          dbLogger.info('Error updating images:', updateError);
          // 嘗試清理已上傳的檔案
          await deleteCultureImages(cultureId);
          throw new Error('Failed to update culture item with images');
        }

        dbLogger.info('💾 資料庫圖片 URL 更新成功', { 
          metadata: { images } 
        });
      }

      return this.transformFromDB({ ...data, images });
    } catch (uploadError) {
      dbLogger.info('🚫 圖片處理失敗，刪除資料庫記錄', { 
        metadata: { error: uploadError instanceof Error ? uploadError.message : String(uploadError) } 
      });
      // 如果圖片處理失敗，刪除已建立的資料庫記錄
      await supabaseAdmin!
        .from('culture')
        .delete()
        .eq('id', cultureId);
      
      throw new Error('Failed to process culture item images');
    }
  }

  async updateCultureItem(id: string, itemData: Partial<Omit<CultureItem, 'id' | 'createdAt' | 'updatedAt'>> & { imageFile?: File }): Promise<CultureItem> {
    dbLogger.info('🔄 更新時光典藏', {
      metadata: {
        id,
        ...itemData,
        imageFile: itemData.imageFile ? `File: ${itemData.imageFile.name}` : undefined
      }
    });
    
    const dbUpdateData: Record<string, any> = {}
    
    if (itemData.title !== undefined) dbUpdateData.title = itemData.title
    if (itemData.description !== undefined) dbUpdateData.description = itemData.description
    if (itemData.subtitle !== undefined) dbUpdateData.content = itemData.subtitle
    
    // 處理圖片更新
    const images: string[] = [];
    let shouldUpdateImages = false;

    if (itemData.imageFile) {
      dbLogger.info('📤 上傳新檔案到 Storage', { 
        metadata: { fileName: itemData.imageFile.name } 
      });
      // 先刪除舊圖片
      await deleteCultureImages(id);
      // 上傳新圖片
      const { url } = await uploadCultureImageToStorage(itemData.imageFile, id);
      images.push(url);
      shouldUpdateImages = true;
      dbLogger.info('✅ 新檔案上傳成功', { 
        metadata: { url } 
      });
    } else if (itemData.imageUrl !== undefined) {
      if (itemData.imageUrl) {
        dbLogger.info('🔗 使用新的 imageUrl', { 
          metadata: { imageUrl: itemData.imageUrl?.substring(0, 100) + '...' } 
        });
        images.push(itemData.imageUrl);
      }
      shouldUpdateImages = true;
    } else if ((itemData as any).image && (itemData as any).image.startsWith('data:image/')) {
      // 處理 base64 圖片（向後相容）
      dbLogger.info('📷 轉換新的 base64 圖片到 Storage');
      await deleteCultureImages(id);
      const { url } = await uploadBase64ToCultureStorage((itemData as any).image, id);
      images.push(url);
      shouldUpdateImages = true;
      dbLogger.info('✅ Base64 轉換更新成功', { 
        metadata: { url } 
      });
    }

    if (shouldUpdateImages) {
      dbUpdateData.images = images;
    }

    const { data, error } = await supabaseAdmin!
      .from('culture')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      dbLogger.info('Error updating culture item:', error)
      throw new Error('Failed to update culture item')
    }
    
    if (!data) throw new Error('Culture item not found')
    dbLogger.info('✅ 時光典藏更新成功');
    return this.transformFromDB(data)
  }

  async deleteCultureItem(id: string): Promise<void> {
    try {
      // 先刪除 Storage 中的所有圖片
      dbLogger.info('🗑️ 刪除時光典藏項目', { 
        metadata: { id } 
      });
      const deletionResult = await deleteCultureImages(id);
      
      if (deletionResult.success) {
        dbLogger.info(`✅ 成功刪除 ${deletionResult.deletedCount} 張圖片`);
      } else {
        dbLogger.info('⚠️ 刪除圖片時發生警告', { 
          metadata: { error: deletionResult.error } 
        });
      }
    } catch (storageError) {
      // 圖片刪除失敗不應該阻止項目刪除，但要記錄錯誤
      dbLogger.info('⚠️ 刪除時光典藏圖片時發生警告', { 
        metadata: { error: storageError instanceof Error ? storageError.message : String(storageError) } 
      });
    }

    // 然後刪除資料庫記錄
    const { error } = await supabaseAdmin!
      .from('culture')
      .delete()
      .eq('id', id)

    if (error) {
      dbLogger.info('Error deleting culture item', { 
        metadata: { error: (error as Error).message } 
      })
      throw new Error('Failed to delete culture item')
    }

    dbLogger.info('✅ 時光典藏項目刪除完成', { 
      metadata: { id } 
    });
  }

  private transformFromDB(dbItem: Record<string, any>): CultureItem {
    // 根據分類設定顏色和表情符號
    const categoryConfig = this.getCategoryConfig(dbItem.category)
    
    // 處理圖片 URL，確保有效性
    const imageUrl = dbItem.images?.[0];
    let processedImageUrl = imageUrl;
    
    if (imageUrl) {
      dbLogger.info('🖼️ 原始圖片資料', { 
        metadata: { imageUrl: imageUrl?.substring(0, 100) + '...' } 
      });
      
      // 如果是 base64 圖片，確保格式正確
      if (imageUrl.startsWith('data:image/')) {
        processedImageUrl = imageUrl;
        dbLogger.info('✅ 偵測到 base64 圖片格式');
      } 
      // 如果是 HTTP(S) URL，保持原樣
      else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        processedImageUrl = imageUrl;
        dbLogger.info('✅ 偵測到 HTTP(S) 圖片 URL');
      }
      // 其他格式的處理
      else {
        dbLogger.info('⚠️ 未知圖片格式', { 
          metadata: { imageUrl: imageUrl?.substring(0, 50) + '...' } 
        });
        processedImageUrl = imageUrl;
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
      updatedAt: dbItem.updated_at
    }
  }

  private getCategoryConfig(category: string) {
    const configs = {
      farming: {
        color: 'bg-green-400',
        height: 'h-48',
        textColor: 'text-white',
        emoji: '🌾'
      },
      culture: {
        color: 'bg-orange-400',
        height: 'h-56',
        textColor: 'text-white',
        emoji: '🏮'
      },
      tradition: {
        color: 'bg-blue-400',
        height: 'h-52',
        textColor: 'text-white',
        emoji: '🏡'
      },
      default: {
        color: 'bg-amber-400',
        height: 'h-48',
        textColor: 'text-white',
        emoji: '🎨'
      }
    }
    
    return configs[category as keyof typeof configs] || configs.default
  }
}

export const supabaseCultureService = new SupabaseCultureService()