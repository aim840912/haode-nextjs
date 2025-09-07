import { Location } from '@/types/location'
import { dbLogger } from '@/lib/logger'

/**
 * @deprecated 此服務已被 LocationServiceV2Simple 取代
 * 請使用 locationServiceAdapter 以獲得更好的錯誤處理和日誌記錄
 * 
 * 注意：此服務現為佔位實作，避免 TypeScript 錯誤
 * 實際功能由 LocationServiceV2Simple 提供
 */

interface LocationService {
  getLocations(): Promise<Location[]>
  addLocation(locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location>
  updateLocation(id: number, locationData: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Location>
  deleteLocation(id: number): Promise<void>
  getLocationById(id: number): Promise<Location | null>
}

export class SupabaseLocationService implements LocationService {
  private logDeprecatedWarning(method: string) {
    dbLogger.warn(`SupabaseLocationService.${method} - 此服務已廢棄，請使用 LocationServiceV2Simple`, {
      module: 'SupabaseLocationService',
      action: method
    })
  }

  async getLocations(): Promise<Location[]> {
    this.logDeprecatedWarning('getLocations')
    return []
  }

  async addLocation(locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> {
    this.logDeprecatedWarning('addLocation')
    
    // 返回一個符合介面的模擬物件
    const mockLocation: Location = {
      id: Date.now(),
      name: locationData.name || 'mock-name',
      title: locationData.title || 'Mock Title',
      address: locationData.address || 'Mock Address',
      landmark: locationData.landmark || 'Mock Landmark',
      phone: locationData.phone || 'Mock Phone',
      lineId: locationData.lineId || 'Mock LineId',
      hours: locationData.hours || 'Mock Hours',
      closedDays: locationData.closedDays || 'Mock Closed Days',
      parking: locationData.parking || 'Mock Parking',
      publicTransport: 'Mock Public Transport',
      features: [],
      specialties: [],
      coordinates: locationData.coordinates || { lat: 0, lng: 0 },
      image: locationData.image || '/images/placeholder.jpg',
      isMain: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return mockLocation
  }

  async updateLocation(id: number, locationData: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Location> {
    this.logDeprecatedWarning('updateLocation')
    
    // 返回一個符合介面的模擬物件
    const mockLocation: Location = {
      id: id,
      name: locationData.name || 'mock-location',
      title: locationData.title || 'Mock Location',
      address: locationData.address || 'Mock Address',
      landmark: locationData.landmark || 'Mock Landmark',
      phone: locationData.phone || 'Mock Phone',
      lineId: locationData.lineId || 'Mock LineId',
      hours: locationData.hours || 'Mock Hours',
      closedDays: locationData.closedDays || 'Mock Closed Days',
      parking: locationData.parking || 'Mock Parking',
      publicTransport: 'Mock Public Transport',
      features: [],
      specialties: [],
      coordinates: locationData.coordinates || { lat: 0, lng: 0 },
      image: locationData.image || '/images/placeholder.jpg',
      isMain: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return mockLocation
  }

  async deleteLocation(id: number): Promise<void> {
    this.logDeprecatedWarning('deleteLocation')
    // 佔位實作：什麼都不做
  }

  async getLocationById(id: number): Promise<Location | null> {
    this.logDeprecatedWarning('getLocationById')
    return null
  }
}