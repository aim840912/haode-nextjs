import { CultureItem, CultureService } from '@/types/culture'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export class SupabaseCultureService implements CultureService {
  async getCultureItems(): Promise<CultureItem[]> {
    try {
      const { data, error } = await supabase
        .from('culture')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching culture items:', error)
        throw new Error('Failed to fetch culture items')
      }
      
      return data?.map(this.transformFromDB) || []
    } catch (error) {
      console.error('Error in getCultureItems:', error)
      return []
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
    const insertData = {
      title: itemData.title,
      description: itemData.description,
      content: itemData.subtitle, // 使用 subtitle 作為 content
      category: 'culture',
      year: new Date().getFullYear(),
      is_featured: true,
      images: []
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
    
    return {
      id: dbItem.id,
      title: dbItem.title,
      subtitle: dbItem.content || dbItem.description,
      description: dbItem.description,
      color: categoryConfig.color,
      height: categoryConfig.height,
      textColor: categoryConfig.textColor,
      emoji: categoryConfig.emoji,
      imageUrl: dbItem.images?.[0] || undefined,
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