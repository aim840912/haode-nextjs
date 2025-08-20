import { ScheduleItem, ScheduleService } from '@/types/schedule'
import { supabase, supabaseAdmin } from '@/lib/supabase-auth'

export class SupabaseScheduleService implements ScheduleService {
  async getSchedule(): Promise<ScheduleItem[]> {
    try {
      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching schedule:', error)
        throw new Error('Failed to fetch schedule')
      }

      return data?.map(this.transformToScheduleItem) || []
    } catch (error) {
      console.error('Error in getSchedule:', error)
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

    const { data, error } = await supabaseAdmin!
      .from('schedule')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('Error adding schedule:', error)
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

    const { data, error } = await supabaseAdmin!
      .from('schedule')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating schedule:', error)
      throw new Error('Failed to update schedule')
    }

    return this.transformToScheduleItem(data)
  }

  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabaseAdmin!
      .from('schedule')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting schedule:', error)
      throw new Error('Failed to delete schedule')
    }
  }

  async getScheduleById(id: string): Promise<ScheduleItem | null> {
    const { data, error } = await supabaseAdmin!
      .from('schedule')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching schedule by id:', error)
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