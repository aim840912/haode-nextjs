/**
 * 地點服務適配器
 * 提供向後相容性，將舊版 LocationService API 橋接到新版服務
 *
 * 此適配器確保現有代碼能夠無縫遷移到 v2 架構
 */

import { LocationServiceV2Simple, locationServiceV2Simple } from './v2/locationServiceSimple'
import { Location, LocationService } from '@/types/location'
import { dbLogger } from '@/lib/logger'

/**
 * 地點服務適配器類別
 * 實作舊版 LocationService 介面，內部使用 v2 服務
 */
export class LocationServiceAdapter implements LocationService {
  private readonly serviceV2: LocationServiceV2Simple

  constructor(serviceV2Instance?: LocationServiceV2Simple) {
    this.serviceV2 = serviceV2Instance || locationServiceV2Simple

    dbLogger.info('地點服務適配器初始化', {
      module: 'LocationServiceAdapter',
      action: 'constructor',
    })
  }

  // === LocationService 介面實作 ===

  async getLocations(): Promise<Location[]> {
    return this.serviceV2.getLocations()
  }

  async addLocation(location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> {
    return this.serviceV2.addLocation(location)
  }

  async updateLocation(
    id: number,
    location: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Location> {
    return this.serviceV2.updateLocation(id, location)
  }

  async deleteLocation(id: number): Promise<void> {
    return this.serviceV2.deleteLocation(id)
  }

  async getLocationById(id: number): Promise<Location | null> {
    return this.serviceV2.getLocationById(id)
  }

  // === 額外的工具方法 ===

  /**
   * 取得服務健康狀態
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    version: string
    details: Record<string, unknown>
  }> {
    try {
      const healthStatus = await this.serviceV2.getHealthStatus()

      return {
        status: healthStatus.status,
        version: 'v2-simple',
        details: {
          ...healthStatus.details,
          adapterActive: true,
          serviceType: 'LocationServiceV2Simple',
          timestamp: healthStatus.timestamp,
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        version: 'v2-simple',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      }
    }
  }

  /**
   * 取得主要地點
   */
  async getMainLocations(): Promise<Location[]> {
    const allLocations = await this.serviceV2.getLocations()
    return allLocations.filter(location => location.isMain)
  }

  /**
   * 根據特色搜尋地點
   */
  async getLocationsByFeature(feature: string): Promise<Location[]> {
    const allLocations = await this.serviceV2.getLocations()
    return allLocations.filter(location => 
      location.features.some(f => f.toLowerCase().includes(feature.toLowerCase()))
    )
  }

  /**
   * 根據專長搜尋地點
   */
  async getLocationsBySpecialty(specialty: string): Promise<Location[]> {
    const allLocations = await this.serviceV2.getLocations()
    return allLocations.filter(location => 
      location.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
    )
  }

  /**
   * 根據距離排序地點
   */
  async getLocationsByDistance(userLat: number, userLng: number): Promise<Location[]> {
    const allLocations = await this.serviceV2.getLocations()
    
    // 計算距離並排序
    const locationsWithDistance = allLocations.map(location => ({
      ...location,
      distance: this.calculateDistance(
        userLat, userLng,
        location.coordinates.lat, location.coordinates.lng
      )
    }))

    return locationsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .map(({ distance, ...location }) => location)
  }

  /**
   * 計算兩點之間的距離（公里）
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // 地球半徑（公里）
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180)
  }
}

// 建立並匯出適配器實例
export const locationServiceAdapter = new LocationServiceAdapter()

// 為了保持完全向後相容，也匯出為原始名稱
export const supabaseLocationService = locationServiceAdapter

/**
 * 工廠函數：根據配置決定使用哪個服務實作
 */
export function createLocationService(useV2: boolean = true): LocationService {
  if (useV2) {
    return locationServiceAdapter
  } else {
    // 如果需要，可以載入舊版服務
    throw new Error('舊版服務已被棄用，請使用 v2 版本')
  }
}

/**
 * 遷移輔助函數：檢查地點服務健康狀態
 */
export async function checkLocationServiceHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  details: Record<string, unknown>
}> {
  try {
    // 簡單的健康檢查 - 嘗試查詢服務是否可用
    await locationServiceV2Simple.getLocations()

    return {
      status: 'healthy',
      version: 'v2-simple',
      details: {
        adapterActive: true,
        serviceType: 'LocationServiceV2Simple',
        timestamp: new Date().toISOString(),
      },
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      version: 'v2-simple',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    }
  }
}