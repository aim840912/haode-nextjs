import { Location } from '@/types/location'
import { supabase, getSupabaseAdmin } from '@/lib/supabase-auth'
import { dbLogger } from '@/lib/logger'

// 類型斷言，解決 Supabase 重載問題
const getAdmin = () => getSupabaseAdmin();

/**
 * @deprecated 此服務已被 LocationServiceV2Simple 取代
 * 請使用 locationServiceAdapter 以獲得更好的錯誤處理和日誌記錄
 * 保留此檔案僅為向後相容性考量
 */

interface LocationService {
  getLocations(): Promise<Location[]>
  addLocation(locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location>
  updateLocation(id: number, locationData: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Location>
  deleteLocation(id: number): Promise<void>
  getLocationById(id: number): Promise<Location | null>
}

class SupabaseLocationService implements LocationService {
  async getLocations(): Promise<Location[]> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      return data?.map(this.transformFromDB) || []
    } catch (error) {
      dbLogger.error('取得地點清單失敗', error as Error, {
        module: 'SupabaseLocationService',
        action: 'getLocations'
      })
      return []
    }
  }

  async addLocation(locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> {
    try {
      const supabaseAdmin = getAdmin()
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not available')
      }
      const { data, error } = await supabaseAdmin
        .from('locations')
        .insert([this.transformToDB(locationData)])
        .select()
        .single()
      
      if (error) throw error
      
      return this.transformFromDB(data)
    } catch (error) {
      dbLogger.error('新增地點失敗', error as Error, {
        module: 'SupabaseLocationService',
        action: 'addLocation'
      })
      throw error
    }
  }

  async updateLocation(id: number, locationData: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Location> {
    try {
      const supabaseAdmin = getAdmin()
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not available')
      }
      const { data, error } = await supabaseAdmin
        .from('locations')
        .update(this.transformToDB(locationData))
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      if (!data) throw new Error('Location not found')
      
      return this.transformFromDB(data)
    } catch (error) {
      dbLogger.error('更新地點失敗', error as Error, {
        module: 'SupabaseLocationService',
        action: 'updateLocation'
      })
      throw error
    }
  }

  async deleteLocation(id: number): Promise<void> {
    try {
      const supabaseAdmin = getAdmin()
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not available')
      }
      const { error } = await supabaseAdmin
        .from('locations')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      dbLogger.error('刪除地點失敗', error as Error, {
        module: 'SupabaseLocationService',
        action: 'deleteLocation'
      })
      throw error
    }
  }

  async getLocationById(id: number): Promise<Location | null> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }
      
      return this.transformFromDB(data)
    } catch (error) {
      dbLogger.error('根據 ID 取得地點失敗', error as Error, {
        module: 'SupabaseLocationService',
        action: 'getLocationById'
      })
      return null
    }
  }

  private transformFromDB(dbLocation: Record<string, unknown>): Location {
    return {
      id: dbLocation.id as number,
      name: dbLocation.name as string,
      title: dbLocation.title as string,
      address: dbLocation.address as string,
      landmark: dbLocation.landmark as string,
      phone: dbLocation.phone as string,
      lineId: dbLocation.line_id as string,
      hours: dbLocation.hours as string,
      closedDays: dbLocation.closed_days as string,
      parking: dbLocation.parking as string,
      publicTransport: dbLocation.public_transport as string,
      features: (dbLocation.features as string[]) || [],
      specialties: (dbLocation.specialties as string[]) || [],
      coordinates: dbLocation.coordinates as { lat: number; lng: number },
      image: dbLocation.image as string,
      isMain: dbLocation.is_main as boolean,
      createdAt: dbLocation.created_at as string,
      updatedAt: dbLocation.updated_at as string
    }
  }

  private transformToDB(location: Partial<Location>): Record<string, unknown> {
    const transformed: Record<string, unknown> = {}
    
    if (location.name !== undefined) transformed.name = location.name
    if (location.title !== undefined) transformed.title = location.title
    if (location.address !== undefined) transformed.address = location.address
    if (location.landmark !== undefined) transformed.landmark = location.landmark
    if (location.phone !== undefined) transformed.phone = location.phone
    if (location.lineId !== undefined) transformed.line_id = location.lineId
    if (location.hours !== undefined) transformed.hours = location.hours
    if (location.closedDays !== undefined) transformed.closed_days = location.closedDays
    if (location.parking !== undefined) transformed.parking = location.parking
    if (location.publicTransport !== undefined) transformed.public_transport = location.publicTransport
    if (location.features !== undefined) transformed.features = location.features
    if (location.specialties !== undefined) transformed.specialties = location.specialties
    if (location.coordinates !== undefined) transformed.coordinates = location.coordinates
    if (location.image !== undefined) transformed.image = location.image
    if (location.isMain !== undefined) transformed.is_main = location.isMain
    
    return transformed
  }
}

// Export the service instance
export const supabaseLocationService: LocationService = new SupabaseLocationService()