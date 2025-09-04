/**
 * 地點服務 v2 簡化實作
 * 基於統一架構的地點管理服務
 *
 * 功能：
 * - 標準化 CRUD 操作
 * - 統一錯誤處理和日誌記錄
 * - 支援地理位置和特色管理
 * - 內建資料轉換和驗證
 */

import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-auth'
import { dbLogger } from '@/lib/logger'
import { ErrorFactory, NotFoundError, ValidationError } from '@/lib/errors'
import { Location, LocationService } from '@/types/location'
import { UpdateDataObject } from '@/types/service.types'

/**
 * 資料庫記錄類型
 */
interface SupabaseLocationRecord {
  id: number
  name: string
  title: string
  address: string
  landmark: string
  phone: string
  line_id: string
  hours: string
  closed_days: string
  parking: string
  public_transport: string
  features: string[]
  specialties: string[]
  coordinates: {
    lat: number
    lng: number
  }
  image: string
  is_main: boolean
  created_at: string
  updated_at: string
}

/**
 * 地點服務 v2 簡化實作類別
 */
export class LocationServiceV2Simple implements LocationService {
  private readonly moduleName = 'LocationServiceV2'

  /**
   * 統一錯誤處理方法
   */
  private handleError(error: unknown, action: string): never {
    dbLogger.error(`地點服務 ${action} 操作失敗`, error as Error, {
      module: this.moduleName,
      action,
      metadata: { timestamp: new Date().toISOString() },
    })
    throw ErrorFactory.fromSupabaseError(error, {
      module: this.moduleName,
      action,
    })
  }

  /**
   * 轉換資料庫記錄為 Location
   */
  private transformFromDB(record: SupabaseLocationRecord): Location {
    return {
      id: record.id,
      name: record.name,
      title: record.title,
      address: record.address,
      landmark: record.landmark,
      phone: record.phone,
      lineId: record.line_id,
      hours: record.hours,
      closedDays: record.closed_days,
      parking: record.parking,
      publicTransport: record.public_transport,
      features: record.features,
      specialties: record.specialties,
      coordinates: record.coordinates,
      image: record.image,
      isMain: record.is_main,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }
  }

  /**
   * 轉換 Location 為資料庫插入格式
   */
  private transformToDB(data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) {
    return {
      name: data.name,
      title: data.title,
      address: data.address,
      landmark: data.landmark,
      phone: data.phone,
      line_id: data.lineId,
      hours: data.hours,
      closed_days: data.closedDays,
      parking: data.parking,
      public_transport: data.publicTransport,
      features: data.features,
      specialties: data.specialties,
      coordinates: data.coordinates,
      image: data.image,
      is_main: data.isMain,
    }
  }

  /**
   * 取得所有地點
   */
  async getLocations(): Promise<Location[]> {
    try {
      dbLogger.info('取得地點清單', {
        module: this.moduleName,
        action: 'getLocations',
      })

      const supabase = createServiceSupabaseClient()
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        this.handleError(error, 'getLocations')
      }

      const locations = data?.map(this.transformFromDB.bind(this)) || []

      dbLogger.info('地點清單查詢成功', {
        module: this.moduleName,
        action: 'getLocations',
        metadata: { count: locations.length },
      })

      return locations
    } catch (error) {
      this.handleError(error, 'getLocations')
    }
  }

  /**
   * 新增地點
   */
  async addLocation(
    locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Location> {
    try {
      dbLogger.info('新增地點', {
        module: this.moduleName,
        action: 'addLocation',
        metadata: { name: locationData.name, address: locationData.address },
      })

      // 基本驗證
      if (!locationData.name?.trim()) {
        throw new ValidationError('地點名稱不能為空')
      }
      if (!locationData.address?.trim()) {
        throw new ValidationError('地址不能為空')
      }
      if (!locationData.coordinates || !locationData.coordinates.lat || !locationData.coordinates.lng) {
        throw new ValidationError('座標資訊不完整')
      }

      const insertData = this.transformToDB(locationData)

      const { data, error } = await supabaseAdmin!
        .from('locations')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        this.handleError(error, 'addLocation')
      }

      const newLocation = this.transformFromDB(data)

      dbLogger.info('地點新增成功', {
        module: this.moduleName,
        action: 'addLocation',
        metadata: { locationId: newLocation.id, name: newLocation.name },
      })

      return newLocation
    } catch (error) {
      this.handleError(error, 'addLocation')
    }
  }

  /**
   * 更新地點
   */
  async updateLocation(
    id: number,
    locationData: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Location> {
    try {
      dbLogger.info('更新地點', {
        module: this.moduleName,
        action: 'updateLocation',
        metadata: { locationId: id },
      })

      if (!id || id <= 0) {
        throw new ValidationError('地點 ID 必須為正數')
      }

      // 建立更新資料對象
      const updateData: UpdateDataObject = {}
      if (locationData.name !== undefined) updateData.name = locationData.name
      if (locationData.title !== undefined) updateData.title = locationData.title
      if (locationData.address !== undefined) updateData.address = locationData.address
      if (locationData.landmark !== undefined) updateData.landmark = locationData.landmark
      if (locationData.phone !== undefined) updateData.phone = locationData.phone
      if (locationData.lineId !== undefined) updateData.line_id = locationData.lineId
      if (locationData.hours !== undefined) updateData.hours = locationData.hours
      if (locationData.closedDays !== undefined) updateData.closed_days = locationData.closedDays
      if (locationData.parking !== undefined) updateData.parking = locationData.parking
      if (locationData.publicTransport !== undefined) updateData.public_transport = locationData.publicTransport
      if (locationData.features !== undefined) updateData.features = locationData.features
      if (locationData.specialties !== undefined) updateData.specialties = locationData.specialties
      if (locationData.coordinates !== undefined) updateData.coordinates = locationData.coordinates
      if (locationData.image !== undefined) updateData.image = locationData.image
      if (locationData.isMain !== undefined) updateData.is_main = locationData.isMain

      const { data, error } = await supabaseAdmin!
        .from('locations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'updateLocation')
      }

      if (!data) {
        throw new NotFoundError(`地點 ${id} 不存在`)
      }

      const updatedLocation = this.transformFromDB(data)

      dbLogger.info('地點更新成功', {
        module: this.moduleName,
        action: 'updateLocation',
        metadata: { locationId: id, updatedFields: Object.keys(updateData) },
      })

      return updatedLocation
    } catch (error) {
      this.handleError(error, 'updateLocation')
    }
  }

  /**
   * 刪除地點
   */
  async deleteLocation(id: number): Promise<void> {
    try {
      dbLogger.info('刪除地點', {
        module: this.moduleName,
        action: 'deleteLocation',
        metadata: { locationId: id },
      })

      if (!id || id <= 0) {
        throw new ValidationError('地點 ID 必須為正數')
      }

      const { error } = await supabaseAdmin!
        .from('locations')
        .delete()
        .eq('id', id)

      if (error) {
        this.handleError(error, 'deleteLocation')
      }

      dbLogger.info('地點刪除成功', {
        module: this.moduleName,
        action: 'deleteLocation',
        metadata: { locationId: id },
      })
    } catch (error) {
      this.handleError(error, 'deleteLocation')
    }
  }

  /**
   * 根據 ID 取得地點
   */
  async getLocationById(id: number): Promise<Location | null> {
    try {
      dbLogger.info('根據 ID 取得地點', {
        module: this.moduleName,
        action: 'getLocationById',
        metadata: { locationId: id },
      })

      if (!id || id <= 0) {
        throw new ValidationError('地點 ID 必須為正數')
      }

      const supabase = createServiceSupabaseClient()
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 記錄未找到
          dbLogger.info('地點不存在', {
            module: this.moduleName,
            action: 'getLocationById',
            metadata: { locationId: id },
          })
          return null
        }
        this.handleError(error, 'getLocationById')
      }

      const location = this.transformFromDB(data)

      dbLogger.info('地點查詢成功', {
        module: this.moduleName,
        action: 'getLocationById',
        metadata: { locationId: id, name: location.name },
      })

      return location
    } catch (error) {
      this.handleError(error, 'getLocationById')
    }
  }

  /**
   * 取得服務健康狀態
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: string
    details: Record<string, unknown>
  }> {
    try {
      const supabase = createServiceSupabaseClient()
      const { data, error } = await supabase
        .from('locations')
        .select('count')
        .limit(1)

      if (error) {
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          details: {
            error: error.message,
            module: this.moduleName,
          },
        }
      }

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: {
          module: this.moduleName,
          version: 'v2-simple',
          databaseConnected: true,
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          module: this.moduleName,
        },
      }
    }
  }
}

// 建立並匯出服務實例
export const locationServiceV2Simple = new LocationServiceV2Simple()