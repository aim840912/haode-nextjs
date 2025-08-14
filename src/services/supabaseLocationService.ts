import { Location } from '@/types/location'
import { supabaseAdmin } from '@/lib/supabase'

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
      const { data, error } = await supabaseAdmin!
        .from('locations')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      return data?.map(this.transformFromDB) || []
    } catch (error) {
      console.error('Error fetching locations:', error)
      return []
    }
  }

  async addLocation(locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> {
    try {
      const { data, error } = await supabaseAdmin!
        .from('locations')
        .insert([this.transformToDB(locationData)])
        .select()
        .single()
      
      if (error) throw error
      
      return this.transformFromDB(data)
    } catch (error) {
      console.error('Error adding location:', error)
      throw error
    }
  }

  async updateLocation(id: number, locationData: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Location> {
    try {
      const { data, error } = await supabaseAdmin!
        .from('locations')
        .update(this.transformToDB(locationData))
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      if (!data) throw new Error('Location not found')
      
      return this.transformFromDB(data)
    } catch (error) {
      console.error('Error updating location:', error)
      throw error
    }
  }

  async deleteLocation(id: number): Promise<void> {
    try {
      const { error } = await supabaseAdmin!
        .from('locations')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting location:', error)
      throw error
    }
  }

  async getLocationById(id: number): Promise<Location | null> {
    try {
      const { data, error } = await supabaseAdmin!
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
      console.error('Error fetching location by id:', error)
      return null
    }
  }

  private transformFromDB(dbLocation: any): Location {
    return {
      id: dbLocation.id,
      name: dbLocation.name,
      title: dbLocation.title,
      address: dbLocation.address,
      landmark: dbLocation.landmark,
      phone: dbLocation.phone,
      lineId: dbLocation.line_id,
      hours: dbLocation.hours,
      closedDays: dbLocation.closed_days,
      parking: dbLocation.parking,
      publicTransport: dbLocation.public_transport,
      features: dbLocation.features || [],
      specialties: dbLocation.specialties || [],
      coordinates: dbLocation.coordinates,
      image: dbLocation.image,
      isMain: dbLocation.is_main,
      createdAt: dbLocation.created_at,
      updatedAt: dbLocation.updated_at
    }
  }

  private transformToDB(location: any): any {
    const transformed: any = {}
    
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