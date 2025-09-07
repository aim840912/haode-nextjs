import { ScheduleItem, ScheduleService } from '@/types/schedule'
import { supabase, getSupabaseAdmin } from '@/lib/supabase-auth'
import { dbLogger } from '@/lib/logger'

// 類型斷言，解決 Supabase 重載問題
const getAdmin = () => getSupabaseAdmin();

/**
 * @deprecated 此服務已被 ScheduleServiceV2Simple 取代
 * 請使用 scheduleServiceAdapter 以獲得更好的錯誤處理和日誌記錄
 * 保留此檔案僅為向後相容性考量
 */
export class SupabaseScheduleService implements ScheduleService {
  async getSchedule(): Promise<ScheduleItem[]> {
    try {
      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .order('date', { ascending: true })

      if (error) {
        dbLogger.error('取得排程清單失敗', error as Error, {
          module: 'SupabaseScheduleService',
          action: 'getSchedule'
        })
        throw new Error('Failed to fetch schedule')
      }

      return data?.map(this.transformToScheduleItem) || []
    } catch (error) {
      dbLogger.error('排程清單查詢例外', error as Error, {
        module: 'SupabaseScheduleService',
        action: 'getSchedule'
      })
      return []
    }
  }

  async addSchedule(scheduleData: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleItem> {
    const insertData = {
      title: scheduleData.title,
      location: scheduleData.location,
      date: scheduleData.date,
      time: scheduleData.time,
      status: scheduleData.status,
      products: scheduleData.products,
      description: scheduleData.description,
      contact: scheduleData.contact,
      special_offer: scheduleData.specialOffer,
      weather_note: scheduleData.weatherNote
    }

    const { data, error } = await getAdmin()
      .from('schedule')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      dbLogger.error('新增排程失敗', error as Error, {
      module: 'SupabaseScheduleService',
      action: 'addSchedule'
    })
      throw new Error('Failed to add schedule')
    }

    return this.transformToScheduleItem(data)
  }

  async updateSchedule(id: string, scheduleData: Partial<Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ScheduleItem> {
    const updateData: Record<string, unknown> = {}

    if (scheduleData.title !== undefined) updateData.title = scheduleData.title
    if (scheduleData.location !== undefined) updateData.location = scheduleData.location
    if (scheduleData.date !== undefined) updateData.date = scheduleData.date
    if (scheduleData.time !== undefined) updateData.time = scheduleData.time
    if (scheduleData.status !== undefined) updateData.status = scheduleData.status
    if (scheduleData.products !== undefined) updateData.products = scheduleData.products
    if (scheduleData.description !== undefined) updateData.description = scheduleData.description
    if (scheduleData.contact !== undefined) updateData.contact = scheduleData.contact
    if (scheduleData.specialOffer !== undefined) updateData.special_offer = scheduleData.specialOffer
    if (scheduleData.weatherNote !== undefined) updateData.weather_note = scheduleData.weatherNote

    const { data, error } = await getAdmin()
      .from('schedule')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      dbLogger.error('更新排程失敗', error as Error, {
      module: 'SupabaseScheduleService',
      action: 'updateSchedule'
    })
      throw new Error('Failed to update schedule')
    }

    return this.transformToScheduleItem(data)
  }

  async deleteSchedule(id: string): Promise<void> {
    const { error } = await getAdmin()
      .from('schedule')
      .delete()
      .eq('id', id)

    if (error) {
      dbLogger.error('刪除排程失敗', error as Error, {
      module: 'SupabaseScheduleService',
      action: 'deleteSchedule'
    })
      throw new Error('Failed to delete schedule')
    }
  }

  async getScheduleById(id: string): Promise<ScheduleItem | null> {
    const { data, error } = await getAdmin()
      .from('schedule')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      dbLogger.error('根據 ID 取得排程失敗', error as Error, {
      module: 'SupabaseScheduleService',
      action: 'getScheduleById'
    })
      throw new Error('Failed to fetch schedule')
    }

    return this.transformToScheduleItem(data)
  }

  private transformToScheduleItem(scheduleRow: Record<string, unknown>): ScheduleItem {
    return {
      id: scheduleRow.id as string,
      title: scheduleRow.title as string,
      location: scheduleRow.location as string,
      date: scheduleRow.date as string,
      time: (scheduleRow.time as string) || '',
      status: (scheduleRow.status as 'upcoming' | 'ongoing' | 'completed') || 'upcoming',
      products: Array.isArray(scheduleRow.products) ? scheduleRow.products as string[] : [],
      description: (scheduleRow.description as string) || '',
      contact: (scheduleRow.contact as string) || '',
      specialOffer: (scheduleRow.special_offer as string) || undefined,
      weatherNote: (scheduleRow.weather_note as string) || undefined,
      createdAt: scheduleRow.created_at as string,
      updatedAt: scheduleRow.updated_at as string
    }
  }
}

// Export the service instance
export const supabaseScheduleService: ScheduleService = new SupabaseScheduleService()