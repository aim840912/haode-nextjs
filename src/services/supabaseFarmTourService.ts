import { FarmTourActivity } from '@/types/farmTour'
import { supabase, getSupabaseAdmin } from '@/lib/supabase-auth'
import { dbLogger } from '@/lib/logger'

// 類型斷言，解決 Supabase 重載問題
const getAdmin = () => getSupabaseAdmin();

/**
 * @deprecated 此服務已被 FarmTourServiceV2Simple 取代
 * 請使用 farmTourServiceAdapter 以獲得更好的錯誤處理和日誌記錄
 * 保留此檔案僅為向後相容性考量
 */

export class SupabaseFarmTourService {
  async getAll(): Promise<FarmTourActivity[]> {
    try {
      const { data, error } = await supabase
        .from('farm_tour')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        dbLogger.error('取得農場體驗活動失敗', error as Error, {
        module: 'SupabaseFarmTourService',
        action: 'getAll'
      })
        throw new Error('Failed to fetch farm tour activities')
      }
      
      return data?.map(this.transformFromDB) || []
    } catch (error) {
      dbLogger.error('農場體驗活動查詢例外', error as Error, {
        module: 'SupabaseFarmTourService',
        action: 'getAll'
      })
      return []
    }
  }

  async getById(id: string): Promise<FarmTourActivity | null> {
    try {
      const { data, error } = await supabase
        .from('farm_tour')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }
      
      return this.transformFromDB(data)
    } catch (error) {
      dbLogger.error('根據 ID 取得農場體驗活動失敗', error as Error, {
      module: 'SupabaseFarmTourService',
      action: 'getById'
    })
      return null
    }
  }

  async create(activityData: Omit<FarmTourActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<FarmTourActivity> {
    const insertData = {
      title: activityData.title,
      season: activityData.season,
      months: activityData.months,
      price: activityData.price,
      duration: activityData.duration,
      activities: activityData.activities,
      includes: activityData.includes,
      highlight: activityData.highlight,
      note: activityData.note,
      image: activityData.image,
      available: activityData.available
    }

    const supabaseAdmin = getAdmin()
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }
    const { data, error } = await supabaseAdmin
      .from('farm_tour')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      dbLogger.error('新增農場體驗活動失敗', error as Error, {
      module: 'SupabaseFarmTourService',
      action: 'create'
    })
      throw new Error('Failed to add farm tour activity')
    }

    return this.transformFromDB(data)
  }

  async update(id: string, updateData: Partial<Omit<FarmTourActivity, 'id' | 'createdAt'>>): Promise<FarmTourActivity | null> {
    const dbUpdateData: Record<string, unknown> = {}
    
    if (updateData.title !== undefined) dbUpdateData.title = updateData.title
    if (updateData.season !== undefined) dbUpdateData.season = updateData.season
    if (updateData.months !== undefined) dbUpdateData.months = updateData.months
    if (updateData.price !== undefined) dbUpdateData.price = updateData.price
    if (updateData.duration !== undefined) dbUpdateData.duration = updateData.duration
    if (updateData.activities !== undefined) dbUpdateData.activities = updateData.activities
    if (updateData.includes !== undefined) dbUpdateData.includes = updateData.includes
    if (updateData.highlight !== undefined) dbUpdateData.highlight = updateData.highlight
    if (updateData.note !== undefined) dbUpdateData.note = updateData.note
    if (updateData.image !== undefined) dbUpdateData.image = updateData.image
    if (updateData.available !== undefined) dbUpdateData.available = updateData.available

    const supabaseAdmin = getAdmin()
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }
    const { data, error } = await supabaseAdmin
      .from('farm_tour')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      dbLogger.error('更新農場體驗活動失敗', error as Error, {
      module: 'SupabaseFarmTourService',
      action: 'update'
    })
      throw new Error('Failed to update farm tour activity')
    }
    
    if (!data) return null
    return this.transformFromDB(data)
  }

  async delete(id: string): Promise<boolean> {
    const supabaseAdmin = getAdmin()
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }
    const { error } = await supabaseAdmin
      .from('farm_tour')
      .delete()
      .eq('id', id)

    if (error) {
      dbLogger.error('刪除農場體驗活動失敗', error as Error, {
      module: 'SupabaseFarmTourService',
      action: 'delete'
    })
      throw new Error('Failed to delete farm tour activity')
    }

    return true
  }

  private transformFromDB(dbActivity: Record<string, unknown>): FarmTourActivity {
    return {
      id: dbActivity.id,
      title: dbActivity.title,
      season: dbActivity.season,
      months: dbActivity.months,
      price: parseFloat(dbActivity.price),
      duration: dbActivity.duration,
      activities: dbActivity.activities || [],
      includes: dbActivity.includes || [],
      highlight: dbActivity.highlight,
      note: dbActivity.note,
      image: dbActivity.image,
      available: dbActivity.available,
      createdAt: dbActivity.created_at,
      updatedAt: dbActivity.updated_at
    }
  }
}

export const supabaseFarmTourService = new SupabaseFarmTourService()