/**
 * 地點服務簡化實作
 * 基於統一架構的地點管理服務
 *
 * 功能：
 * - 標準化 CRUD 操作
 * - 統一錯誤處理和日誌記錄
 * - 支援地理位置和特色管理
 * - 內建資料轉換和驗證
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { createServiceSupabaseClient } from '@/lib/database/supabase-server'
import { ErrorFactory, NotFoundError, ValidationError, DatabaseError } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import { UnifiedImageService } from '@/services/infrastructure/unified-image-service'
import { Location, LocationService } from '@/types/location'
import { UpdateDataObject, ServiceSupabaseClient } from '@/types/service.types'
import { withServiceOperation } from '../utils/ServiceDecorators'

/**
 * 資料庫記錄類型
 */
interface SupabaseLocationRecord {
  id: string
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
 * 地點服務簡化實作類別
 */
export class LocationServiceSimple implements LocationService {
  private readonly moduleName = 'LocationService'

  /**
   * 取得 Supabase Admin 客戶端
   */
  private getSupabaseAdminClient(): ServiceSupabaseClient {
    const client = getSupabaseAdmin()
    if (!client) {
      throw new DatabaseError('Supabase admin client not initialized')
    }
    return client
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
  private transformToDB(data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
    const baseData = {
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

    // 如果前端提供了 ID，則包含在插入資料中
    if (data.id) {
      return { id: data.id, ...baseData }
    }

    return baseData
  }

  /**
   * 取得所有地點
   */
  async getLocations(): Promise<Location[]> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '取得地點清單',
      },
      async () => {
        const supabase = createServiceSupabaseClient()
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .order('created_at', { ascending: true })

        if (error) throw ErrorFactory.fromSupabaseError(error)

        return data?.map(record => this.transformFromDB(record as SupabaseLocationRecord)) || []
      }
    )
  }

  /**
   * 驗證電話號碼格式
   */
  private validatePhoneNumber(phone: string): void {
    if (!phone?.trim()) {
      throw new ValidationError('電話號碼不能為空')
    }

    const trimmedPhone = phone.trim()

    // 長度檢查（最多 20 字元）
    if (trimmedPhone.length > 20) {
      throw new ValidationError('電話號碼過長，最多支援 20 個字元')
    }

    // 長度檢查（最少 8 字元，台灣最短市話）
    if (trimmedPhone.length < 8) {
      throw new ValidationError('電話號碼過短，至少需要 8 個字元')
    }

    // 格式檢查：只允許數字、連字號、括號、空格、井號、加號
    const phoneRegex = /^[0-9\-+()# ]+$/
    if (!phoneRegex.test(trimmedPhone)) {
      throw new ValidationError('電話號碼格式不正確，只能包含數字、連字號、括號、空格等')
    }

    // 台灣電話號碼基本格式檢查
    const taiwanPhoneRegex = /^(0[2-9][\d\-]{6,15}|09[\d\-]{8,10})$/
    if (!taiwanPhoneRegex.test(trimmedPhone.replace(/[\s\-()]/g, ''))) {
      throw new ValidationError('請輸入有效的台灣電話號碼格式（如：02-12345678 或 0912-345678）')
    }
  }

  /**
   * 新增地點
   */
  async addLocation(
    locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<Location> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '新增地點',
        context: { name: locationData.name, address: locationData.address },
      },
      async () => {
        // 基本驗證
        if (!locationData.name?.trim()) {
          throw new ValidationError('地點名稱不能為空')
        }
        if (!locationData.address?.trim()) {
          throw new ValidationError('地址不能為空')
        }
        if (
          !locationData.coordinates ||
          !locationData.coordinates.lat ||
          !locationData.coordinates.lng
        ) {
          throw new ValidationError('座標資訊不完整')
        }

        // 電話號碼驗證
        this.validatePhoneNumber(locationData.phone)

        const insertData = this.transformToDB(locationData)
        const supabaseAdmin = this.getSupabaseAdminClient()

        const { data, error } = await supabaseAdmin
          .from('locations')
          .insert([insertData])
          .select()
          .single()

        if (error) throw ErrorFactory.fromSupabaseError(error)

        return this.transformFromDB(data as SupabaseLocationRecord)
      }
    )
  }

  /**
   * 更新地點
   */
  async updateLocation(
    id: string,
    locationData: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Location> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '更新地點',
        context: { locationId: id },
      },
      async () => {
        if (!id || typeof id !== 'string' || id.trim() === '') {
          throw new ValidationError('地點 ID 必須為非空字串')
        }

        // 驗證更新資料
        if (locationData.phone !== undefined) {
          this.validatePhoneNumber(locationData.phone)
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
        if (locationData.publicTransport !== undefined)
          updateData.public_transport = locationData.publicTransport
        if (locationData.features !== undefined) updateData.features = locationData.features
        if (locationData.specialties !== undefined)
          updateData.specialties = locationData.specialties
        if (locationData.coordinates !== undefined)
          updateData.coordinates = locationData.coordinates
        if (locationData.image !== undefined) updateData.image = locationData.image
        if (locationData.isMain !== undefined) updateData.is_main = locationData.isMain

        const supabaseAdmin = this.getSupabaseAdminClient()
        const { data, error } = await supabaseAdmin
          .from('locations')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw ErrorFactory.fromSupabaseError(error)
        if (!data) throw new NotFoundError(`地點 ${id} 不存在`)

        return this.transformFromDB(data as SupabaseLocationRecord)
      }
    )
  }

  /**
   * 刪除地點
   */
  async deleteLocation(id: string): Promise<void> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '刪除地點',
        context: { locationId: id },
      },
      async () => {
        if (!id || typeof id !== 'string' || id.trim() === '') {
          throw new ValidationError('地點 ID 必須為非空字串')
        }

        // 先檢查地點是否存在
        const existing = await this.getLocationById(id)
        if (!existing) {
          throw new NotFoundError(`找不到 ID 為 ${id} 的地點`)
        }

        // 刪除相關圖片（使用統一圖片服務）
        try {
          const unifiedImageService = new UnifiedImageService()
          const deletedImagesCount = await unifiedImageService.deleteEntityImages('locations', id)

          if (deletedImagesCount > 0) {
            dbLogger.info('地點相關圖片刪除成功', {
              module: this.moduleName,
              action: 'deleteEntityImages',
              metadata: { locationId: id, deletedImagesCount },
            })
          }
        } catch (imageError) {
          // 圖片刪除失敗不應阻止地點刪除，只記錄警告
          dbLogger.warn('地點圖片刪除失敗，但繼續進行地點刪除', {
            module: this.moduleName,
            action: 'deleteEntityImages',
            metadata: {
              locationId: id,
              error: imageError instanceof Error ? imageError.message : String(imageError),
            },
          })
        }

        const supabaseAdmin = this.getSupabaseAdminClient()
        const { error } = await supabaseAdmin.from('locations').delete().eq('id', id)

        if (error) throw ErrorFactory.fromSupabaseError(error)
      }
    )
  }

  /**
   * 根據 ID 取得地點
   */
  async getLocationById(id: string): Promise<Location | null> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '根據 ID 取得地點',
        context: { locationId: id },
      },
      async () => {
        if (!id || typeof id !== 'string' || id.trim() === '') {
          throw new ValidationError('地點 ID 必須為非空字串')
        }

        const supabase = createServiceSupabaseClient()
        const { data, error } = await supabase.from('locations').select('*').eq('id', id).single()

        if (error) {
          if (error.code === 'PGRST116') return null
          throw ErrorFactory.fromSupabaseError(error)
        }

        return this.transformFromDB(data as SupabaseLocationRecord)
      }
    )
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
      const { data: _data, error } = await supabase.from('locations').select('count').limit(1)

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
export const locationServiceSimple = new LocationServiceSimple()
