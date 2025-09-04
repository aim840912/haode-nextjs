/**
 * 農場體驗服務 v2 簡化實作
 * 基於統一架構的農場體驗活動管理服務
 *
 * 功能：
 * - 標準化 CRUD 操作
 * - 統一錯誤處理和日誌記錄
 * - 支援季節和活動管理
 * - 內建資料轉換和驗證
 */

import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-auth'
import { dbLogger } from '@/lib/logger'
import { ErrorFactory, NotFoundError, ValidationError } from '@/lib/errors'
import { UpdateDataObject } from '@/types/service.types'
import { FarmTourActivity } from '@/types/farmTour'

/**
 * 資料庫記錄類型
 */
interface SupabaseFarmTourRecord {
  id: string
  title: string
  season: string
  months: string
  price: number
  duration: string
  activities: string[]
  includes: string[]
  highlight: string
  note: string
  image: string
  available: boolean
  created_at: string
  updated_at: string
}

/**
 * FarmTour 服務介面
 */
interface FarmTourService {
  getAll(): Promise<FarmTourActivity[]>
  getById(id: string): Promise<FarmTourActivity | null>
  create(data: Omit<FarmTourActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<FarmTourActivity>
  update(id: string, data: Partial<Omit<FarmTourActivity, 'id' | 'createdAt'>>): Promise<FarmTourActivity | null>
  delete(id: string): Promise<boolean>
}

/**
 * 農場體驗服務 v2 簡化實作類別
 */
export class FarmTourServiceV2Simple implements FarmTourService {
  private readonly moduleName = 'FarmTourServiceV2'

  /**
   * 統一錯誤處理方法
   */
  private handleError(error: unknown, action: string): never {
    dbLogger.error(`農場體驗服務 ${action} 操作失敗`, error as Error, {
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
   * 轉換資料庫記錄為 FarmTourActivity
   */
  private transformFromDB(record: SupabaseFarmTourRecord): FarmTourActivity {
    return {
      id: record.id,
      title: record.title,
      season: record.season,
      months: record.months,
      price: record.price,
      duration: record.duration,
      activities: record.activities,
      includes: record.includes,
      highlight: record.highlight,
      note: record.note,
      image: record.image,
      available: record.available,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }
  }

  /**
   * 轉換 FarmTourActivity 為資料庫插入格式
   */
  private transformToDB(data: Omit<FarmTourActivity, 'id' | 'createdAt' | 'updatedAt'>) {
    return {
      title: data.title,
      season: data.season,
      months: data.months,
      price: data.price,
      duration: data.duration,
      activities: data.activities,
      includes: data.includes,
      highlight: data.highlight,
      note: data.note,
      image: data.image,
      available: data.available,
    }
  }

  /**
   * 取得所有農場體驗活動
   */
  async getAll(): Promise<FarmTourActivity[]> {
    try {
      dbLogger.info('取得農場體驗活動清單', {
        module: this.moduleName,
        action: 'getAll',
      })

      const supabase = createServiceSupabaseClient()
      const { data, error } = await supabase
        .from('farm_tour')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        this.handleError(error, 'getAll')
      }

      const activities = data?.map(this.transformFromDB.bind(this)) || []

      dbLogger.info('農場體驗活動清單查詢成功', {
        module: this.moduleName,
        action: 'getAll',
        metadata: { count: activities.length },
      })

      return activities
    } catch (error) {
      this.handleError(error, 'getAll')
    }
  }

  /**
   * 根據 ID 取得農場體驗活動
   */
  async getById(id: string): Promise<FarmTourActivity | null> {
    try {
      dbLogger.info('根據 ID 取得農場體驗活動', {
        module: this.moduleName,
        action: 'getById',
        metadata: { activityId: id },
      })

      if (!id?.trim()) {
        throw new ValidationError('活動 ID 不能為空')
      }

      const supabase = createServiceSupabaseClient()
      const { data, error } = await supabase
        .from('farm_tour')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 記錄未找到
          dbLogger.info('農場體驗活動不存在', {
            module: this.moduleName,
            action: 'getById',
            metadata: { activityId: id },
          })
          return null
        }
        this.handleError(error, 'getById')
      }

      const activity = this.transformFromDB(data)

      dbLogger.info('農場體驗活動查詢成功', {
        module: this.moduleName,
        action: 'getById',
        metadata: { activityId: id, title: activity.title },
      })

      return activity
    } catch (error) {
      this.handleError(error, 'getById')
    }
  }

  /**
   * 建立新的農場體驗活動
   */
  async create(activityData: Omit<FarmTourActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<FarmTourActivity> {
    try {
      dbLogger.info('建立農場體驗活動', {
        module: this.moduleName,
        action: 'create',
        metadata: { title: activityData.title, season: activityData.season },
      })

      // 基本驗證
      if (!activityData.title?.trim()) {
        throw new ValidationError('標題不能為空')
      }
      if (!activityData.season?.trim()) {
        throw new ValidationError('季節不能為空')
      }
      if (!activityData.price || activityData.price < 0) {
        throw new ValidationError('價格必須為正數')
      }

      const insertData = this.transformToDB(activityData)

      const { data, error } = await supabaseAdmin!
        .from('farm_tour')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        this.handleError(error, 'create')
      }

      const newActivity = this.transformFromDB(data)

      dbLogger.info('農場體驗活動建立成功', {
        module: this.moduleName,
        action: 'create',
        metadata: { activityId: newActivity.id, title: newActivity.title },
      })

      return newActivity
    } catch (error) {
      this.handleError(error, 'create')
    }
  }

  /**
   * 更新農場體驗活動
   */
  async update(
    id: string,
    activityData: Partial<Omit<FarmTourActivity, 'id' | 'createdAt'>>
  ): Promise<FarmTourActivity | null> {
    try {
      dbLogger.info('更新農場體驗活動', {
        module: this.moduleName,
        action: 'update',
        metadata: { activityId: id },
      })

      if (!id?.trim()) {
        throw new ValidationError('活動 ID 不能為空')
      }

      // 建立更新資料對象
      const updateData: UpdateDataObject = {}
      if (activityData.title !== undefined) updateData.title = activityData.title
      if (activityData.season !== undefined) updateData.season = activityData.season
      if (activityData.months !== undefined) updateData.months = activityData.months
      if (activityData.price !== undefined) updateData.price = activityData.price
      if (activityData.duration !== undefined) updateData.duration = activityData.duration
      if (activityData.activities !== undefined) updateData.activities = activityData.activities
      if (activityData.includes !== undefined) updateData.includes = activityData.includes
      if (activityData.highlight !== undefined) updateData.highlight = activityData.highlight
      if (activityData.note !== undefined) updateData.note = activityData.note
      if (activityData.image !== undefined) updateData.image = activityData.image
      if (activityData.available !== undefined) updateData.available = activityData.available

      const { data, error } = await supabaseAdmin!
        .from('farm_tour')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'update')
      }

      if (!data) {
        throw new NotFoundError(`農場體驗活動 ${id} 不存在`)
      }

      const updatedActivity = this.transformFromDB(data)

      dbLogger.info('農場體驗活動更新成功', {
        module: this.moduleName,
        action: 'update',
        metadata: { activityId: id, updatedFields: Object.keys(updateData) },
      })

      return updatedActivity
    } catch (error) {
      this.handleError(error, 'update')
    }
  }

  /**
   * 刪除農場體驗活動
   */
  async delete(id: string): Promise<boolean> {
    try {
      dbLogger.info('刪除農場體驗活動', {
        module: this.moduleName,
        action: 'delete',
        metadata: { activityId: id },
      })

      if (!id?.trim()) {
        throw new ValidationError('活動 ID 不能為空')
      }

      const { error } = await supabaseAdmin!
        .from('farm_tour')
        .delete()
        .eq('id', id)

      if (error) {
        this.handleError(error, 'delete')
      }

      dbLogger.info('農場體驗活動刪除成功', {
        module: this.moduleName,
        action: 'delete',
        metadata: { activityId: id },
      })

      return true
    } catch (error) {
      this.handleError(error, 'delete')
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
        .from('farm_tour')
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
export const farmTourServiceV2Simple = new FarmTourServiceV2Simple()