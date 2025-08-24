import { CultureItem, CultureService } from '@/types/culture'
import { supabase, supabaseAdmin } from '@/lib/supabase-auth'

export class SupabaseCultureService implements CultureService {
  async getCultureItems(): Promise<CultureItem[]> {
    try {
      const { data, error } = await supabase
        .from('culture')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase error fetching culture items:', error)
        throw new Error(`資料庫查詢失敗: ${error.message}`)
      }
      
      const result = data?.map((item: any) => this.transformFromDB(item)) || []
      console.log(`✅ 成功載入 ${result.length} 個時光典藏項目`)
      return result
    } catch (error) {
      console.error('Error in getCultureItems:', error)
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
      console.error('Error fetching culture item by id:', error)
      return null
    }
  }

  async addCultureItem(itemData: Omit<CultureItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<CultureItem> {
    console.log('📥 收到的資料:', itemData)
    
    // 處理圖片資料：優先使用 imageUrl，如果沒有則使用其他圖片資料
    const images = []
    if (itemData.imageUrl) {
      console.log('🔗 發現 imageUrl:', itemData.imageUrl?.substring(0, 100) + '...')
      images.push(itemData.imageUrl)
    }
    // 如果有其他 image 屬性（如上傳的 base64 圖片）
    if ((itemData as any).image) {
      console.log('📷 發現上傳圖片:', (itemData as any).image?.substring(0, 100) + '...')
      images.push((itemData as any).image)
    }
    
    console.log('💾 將儲存的圖片數量:', images.length)
    
    const insertData = {
      title: itemData.title,
      description: itemData.description,
      content: itemData.subtitle, // 使用 subtitle 作為 content
      category: 'culture',
      year: new Date().getFullYear(),
      is_featured: true,
      images: images
    }

    const { data, error } = await supabaseAdmin!
      .from('culture')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('Error adding culture item:', error)
      throw new Error('Failed to add culture item')
    }

    return this.transformFromDB(data)
  }

  async updateCultureItem(id: string, itemData: Partial<Omit<CultureItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CultureItem> {
    const dbUpdateData: Record<string, any> = {}
    
    if (itemData.title !== undefined) dbUpdateData.title = itemData.title
    if (itemData.description !== undefined) dbUpdateData.description = itemData.description
    if (itemData.subtitle !== undefined) dbUpdateData.content = itemData.subtitle
    
    // 處理圖片更新
    if (itemData.imageUrl !== undefined) {
      const images = []
      if (itemData.imageUrl) {
        images.push(itemData.imageUrl)
      }
      // 如果有其他 image 屬性（如上傳的 base64 圖片）
      if ((itemData as any).image) {
        images.push((itemData as any).image)
      }
      dbUpdateData.images = images
    }

    const { data, error } = await supabaseAdmin!
      .from('culture')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating culture item:', error)
      throw new Error('Failed to update culture item')
    }
    
    if (!data) throw new Error('Culture item not found')
    return this.transformFromDB(data)
  }

  async deleteCultureItem(id: string): Promise<void> {
    const { error } = await supabaseAdmin!
      .from('culture')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting culture item:', error)
      throw new Error('Failed to delete culture item')
    }
  }

  private transformFromDB(dbItem: Record<string, any>): CultureItem {
    // 根據分類設定顏色和表情符號
    const categoryConfig = this.getCategoryConfig(dbItem.category)
    
    // 處理圖片 URL，確保有效性
    const imageUrl = dbItem.images?.[0];
    let processedImageUrl = imageUrl;
    
    if (imageUrl) {
      console.log('🖼️ 原始圖片資料:', imageUrl?.substring(0, 100) + '...');
      
      // 如果是 base64 圖片，確保格式正確
      if (imageUrl.startsWith('data:image/')) {
        processedImageUrl = imageUrl;
        console.log('✅ 偵測到 base64 圖片格式');
      } 
      // 如果是 HTTP(S) URL，保持原樣
      else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        processedImageUrl = imageUrl;
        console.log('✅ 偵測到 HTTP(S) 圖片 URL');
      }
      // 其他格式的處理
      else {
        console.warn('⚠️ 未知圖片格式:', imageUrl?.substring(0, 50) + '...');
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