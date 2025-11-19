/**
 * 農場體驗服務 v2 - 完整資料庫實作
 * 支援完整的 farm_tour 表 CRUD 操作
 *
 * 功能：
 * - 標準化 CRUD 操作
 * - 統一錯誤處理和日誌記錄
 * - 支援季節和活動管理
 * - 內建資料轉換和驗證
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import {} from '@/lib/database/supabase-server'
import { ErrorFactory, NotFoundError, ValidationError, DatabaseError } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import { UnifiedImageService } from '@/services/infrastructure/unified-image-service'
import { ServiceSupabaseClient } from '@/types/service.types'
import { withServiceOperation } from '../utils/ServiceDecorators'

// 類型斷言，解決 Supabase 重載問題
const _getAdmin = () => getSupabaseAdmin()
import { FarmTourActivity } from '@/types/farmTour'

/**
 * 資料庫記錄類型
 */
interface _SupabaseFarmTourRecord {
  id: string
  title: string
  start_month: number
  end_month: number
  price: number
  activities: string[]
  note: string
  image: string
  available: boolean
  created_at: string
  updated_at: string
}

/**
 * FarmTour 服務介面
 */
interface IFarmTourService {
  getAll(): Promise<FarmTourActivity[]>
  getById(id: string): Promise<FarmTourActivity | null>
  create(
    data: Omit<FarmTourActivity, 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<FarmTourActivity>
  update(
    id: string,
    data: Partial<Omit<FarmTourActivity, 'id' | 'createdAt'>>
  ): Promise<FarmTourActivity | null>
  delete(id: string): Promise<boolean>
}

/**
 * 農場體驗服務 簡化實作類別
 */
export class FarmTourService implements IFarmTourService {
  private readonly moduleName = 'FarmTourService'

  /**
   * 取得 Supabase 管理客戶端
   */
  private getSupabaseClient(): ServiceSupabaseClient {
    const client = getSupabaseAdmin()
    if (!client) {
      throw new DatabaseError('Supabase admin client not initialized')
    }
    return client
  }

  /**
   * 轉換資料庫記錄為 FarmTourActivity
   * Note: 使用 any 以避免 Supabase 查詢結果的複雜類型斷言
   */
  private transformFromDB(record: any): FarmTourActivity {
    return {
      id: record.id,
      title: record.title,
      start_month: record.start_month,
      end_month: record.end_month,
      price: record.price || 0,
      activities: record.activities || [],
      note: record.note || '',
      image: record.image,
      available: record.available,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }
  }

  /**
   * 轉換 FarmTourActivity 為資料庫插入格式
   */
  private transformToDB(data: Omit<FarmTourActivity, 'createdAt' | 'updatedAt'> & { id?: string }) {
    const baseData = {
      title: data.title,
      start_month: data.start_month,
      end_month: data.end_month,
      price: data.price || 0,
      activities: data.activities || [],
      note: data.note || '',
      image: data.image,
      available: data.available,
    }

    // 如果前端提供了 ID，則包含在插入資料中
    if (data.id) {
      return { id: data.id, ...baseData }
    }

    return baseData
  }

  /**
   * 取得所有農場體驗活動
   */
  async getAll(): Promise<FarmTourActivity[]> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '取得農場體驗活動清單',
      },
      async () => {
        const supabase = this.getSupabaseClient()

        const { data, error } = await supabase
          .from('farm_tour')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw ErrorFactory.fromSupabaseError(error)

        return data?.map(record => this.transformFromDB(record)) || []
      }
    )
  }

  /**
   * 根據 ID 取得農場體驗活動
   */
  async getById(id: string): Promise<FarmTourActivity | null> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '根據 ID 取得農場體驗活動',
        context: { id },
      },
      async () => {
        const supabase = this.getSupabaseClient()

        const { data, error } = await supabase.from('farm_tour').select('*').eq('id', id).single()

        if (error) {
          if (error.code === 'PGRST116') return null
          throw ErrorFactory.fromSupabaseError(error)
        }

        return data ? this.transformFromDB(data) : null
      }
    )
  }

  /**
   * 建立新的農場體驗活動
   */
  async create(
    activityData: Omit<FarmTourActivity, 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<FarmTourActivity> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '建立農場體驗活動',
        context: {
          title: activityData.title,
          start_month: activityData.start_month,
          end_month: activityData.end_month,
        },
      },
      async () => {
        if (!activityData.title?.trim()) {
          throw new ValidationError('活動標題不能為空')
        }

        const supabase = this.getSupabaseClient()
        const insertData = this.transformToDB(activityData)

        const { data, error } = await supabase
          .from('farm_tour')
          .insert([insertData])
          .select()
          .single()

        if (error) throw ErrorFactory.fromSupabaseError(error)

        return this.transformFromDB(data)
      }
    )
  }

  /**
   * 更新農場體驗活動
   */
  async update(
    id: string,
    activityData: Partial<Omit<FarmTourActivity, 'id' | 'createdAt'>>
  ): Promise<FarmTourActivity | null> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '更新農場體驗活動',
        context: { activityId: id, updatedFields: Object.keys(activityData) },
      },
      async () => {
        const existing = await this.getById(id)
        if (!existing) {
          throw new NotFoundError(`找不到 ID 為 ${id} 的農場體驗活動`)
        }

        const supabase = this.getSupabaseClient()

        // 準備更新資料，移除不應更新的欄位
        const updateData = { ...activityData }
        delete (updateData as any).createdAt
        delete (updateData as any).id

        const { data, error } = await supabase
          .from('farm_tour')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single()

        if (error) throw ErrorFactory.fromSupabaseError(error)

        return this.transformFromDB(data)
      }
    )
  }

  /**
   * 刪除農場體驗活動
   */
  async delete(id: string): Promise<boolean> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '刪除農場體驗活動',
        context: { activityId: id },
      },
      async () => {
        const existing = await this.getById(id)
        if (!existing) {
          throw new NotFoundError(`找不到 ID 為 ${id} 的農場體驗活動`)
        }

        // 刪除相關圖片（使用統一圖片服務）
        try {
          const unifiedImageService = new UnifiedImageService()
          const deletedImagesCount = await unifiedImageService.deleteEntityImages('farm-tour', id)

          if (deletedImagesCount > 0) {
            dbLogger.info('農場體驗活動相關圖片刪除成功', {
              module: this.moduleName,
              action: 'deleteEntityImages',
              metadata: { activityId: id, deletedImagesCount },
            })
          }
        } catch (imageError) {
          // 圖片刪除失敗不應阻止活動刪除，只記錄警告
          dbLogger.warn('農場體驗活動圖片刪除失敗，但繼續進行活動刪除', {
            module: this.moduleName,
            action: 'deleteEntityImages',
            metadata: {
              activityId: id,
              error: imageError instanceof Error ? imageError.message : String(imageError),
            },
          })
        }

        const supabase = this.getSupabaseClient()

        const { error } = await supabase.from('farm_tour').delete().eq('id', id)

        if (error) throw ErrorFactory.fromSupabaseError(error)

        return true
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
      const supabase = this.getSupabaseClient()
      const { error } = await supabase.from('farm_tour').select('count').limit(1)

      if (error) throw error

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: {
          module: this.moduleName,
          version: 'v2-database-connected',
          databaseConnected: true,
          tableName: 'farm_tour',
        },
      }
    } catch (error) {
      dbLogger.error('服務健康檢查失敗', error as Error, {
        module: this.moduleName,
        action: 'getHealthStatus',
      })

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          module: this.moduleName,
          databaseConnected: false,
        },
      }
    }
  }
}

// 建立並匯出服務實例
export const farmTourService = new FarmTourService()
