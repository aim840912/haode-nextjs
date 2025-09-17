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

import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-auth'
import { dbLogger } from '@/lib/logger'
import { ErrorFactory, NotFoundError, ValidationError, DatabaseError } from '@/lib/errors'

// 類型斷言，解決 Supabase 重載問題
const getAdmin = () => getSupabaseAdmin()
import { UpdateDataObject } from '@/types/service.types'
import { FarmTourActivity } from '@/types/farmTour'

/**
 * 資料庫記錄類型
 */
interface SupabaseFarmTourRecord {
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
interface FarmTourService {
  getAll(): Promise<FarmTourActivity[]>
  getById(id: string): Promise<FarmTourActivity | null>
  create(data: Omit<FarmTourActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<FarmTourActivity>
  update(
    id: string,
    data: Partial<Omit<FarmTourActivity, 'id' | 'createdAt'>>
  ): Promise<FarmTourActivity | null>
  delete(id: string): Promise<boolean>
}

/**
 * 農場體驗服務 v2 簡化實作類別
 */
export class FarmTourServiceV2Simple implements FarmTourService {
  private readonly moduleName = 'FarmTourServiceV2'

  /**
   * 取得 Supabase 管理客戶端
   */
  private getSupabaseClient() {
    return getSupabaseAdmin()
  }

  /**
   * 統一錯誤處理方法
   */
  private handleError(error: unknown, action: string): never {
    // 詳細錯誤日誌
    dbLogger.error(`農場體驗服務 ${action} 操作失敗`, error as Error, {
      module: this.moduleName,
      action,
      metadata: {
        timestamp: new Date().toISOString(),
        errorType: typeof error,
        errorDetails: error,
        errorString: String(error),
        errorJson: error ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : 'null',
      },
    })

    // 如果是 Supabase 錯誤物件，提取詳細資訊
    if (error && typeof error === 'object' && 'message' in error) {
      const supabaseError = error as any
      const detailedMessage = [
        `訊息: ${supabaseError.message}`,
        supabaseError.code ? `代碼: ${supabaseError.code}` : '',
        supabaseError.details ? `詳情: ${supabaseError.details}` : '',
        supabaseError.hint ? `提示: ${supabaseError.hint}` : '',
      ]
        .filter(Boolean)
        .join(' | ')

      throw new DatabaseError(`資料庫操作失敗 (${action}): ${detailedMessage}`, {
        module: this.moduleName,
        action,
        originalError: error instanceof Error ? error : new Error(String(error)),
      })
    }

    throw ErrorFactory.fromSupabaseError(error, {
      module: this.moduleName,
      action,
    })
  }

  /**
   * 轉換資料庫記錄為 FarmTourActivity
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
  private transformToDB(data: Omit<FarmTourActivity, 'id' | 'createdAt' | 'updatedAt'>) {
    return {
      title: data.title,
      start_month: data.start_month,
      end_month: data.end_month,
      price: data.price || 0,
      activities: data.activities || [],
      note: data.note || '',
      image: data.image,
      available: data.available,
    }
  }

  /**
   * 取得所有農場體驗活動
   */
  async getAll(): Promise<FarmTourActivity[]> {
    const timer = dbLogger.timer('查詢農場體驗活動清單')

    try {
      dbLogger.info('取得農場體驗活動清單', {
        module: this.moduleName,
        action: 'getAll',
      })

      const supabase = this.getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client 初始化失敗')
      }

      const { data, error } = await supabase
        .from('farm_tour')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      const activities = data?.map(record => this.transformFromDB(record)) || []

      timer.end({
        metadata: {
          count: activities.length,
        },
      })

      dbLogger.info('農場體驗活動清單查詢成功', {
        module: this.moduleName,
        action: 'getAll',
        metadata: { count: activities.length },
      })

      return activities
    } catch (error) {
      timer.end()
      this.handleError(error, 'getAll')
    }
  }

  /**
   * 根據 ID 取得農場體驗活動
   */
  async getById(id: string): Promise<FarmTourActivity | null> {
    const timer = dbLogger.timer('查詢單一農場體驗活動')

    try {
      dbLogger.info('根據 ID 取得農場體驗活動', {
        module: this.moduleName,
        action: 'getById',
        metadata: { id },
      })

      const supabase = this.getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client 初始化失敗')
      }

      const { data, error } = await supabase.from('farm_tour').select('*').eq('id', id).single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 找不到資料
          timer.end({ metadata: { found: false } })
          return null
        }
        throw error
      }

      const activity = data ? this.transformFromDB(data) : null

      timer.end({ metadata: { found: !!activity } })

      return activity
    } catch (error) {
      timer.end()
      this.handleError(error, 'getById')
    }
  }

  /**
   * 建立新的農場體驗活動
   */
  async create(
    activityData: Omit<FarmTourActivity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<FarmTourActivity> {
    const timer = dbLogger.timer('建立農場體驗活動')

    try {
      dbLogger.info('建立新的農場體驗活動', {
        module: this.moduleName,
        action: 'create',
        metadata: {
          title: activityData.title,
          start_month: activityData.start_month,
          end_month: activityData.end_month,
        },
      })

      // 驗證必填欄位
      if (!activityData.title?.trim()) {
        throw new ValidationError('活動標題不能為空')
      }

      const supabase = this.getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client 初始化失敗')
      }

      const insertData = this.transformToDB(activityData)

      const { data, error } = await supabase
        .from('farm_tour')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        throw error
      }

      const newActivity = this.transformFromDB(data)

      timer.end({ metadata: { id: newActivity.id } })

      dbLogger.info('農場體驗活動建立成功', {
        module: this.moduleName,
        action: 'create',
        metadata: { id: newActivity.id, title: newActivity.title },
      })

      return newActivity
    } catch (error) {
      timer.end()
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
    const timer = dbLogger.timer('更新農場體驗活動')

    try {
      dbLogger.info('更新農場體驗活動', {
        module: this.moduleName,
        action: 'update',
        metadata: { activityId: id, updatedFields: Object.keys(activityData) },
      })

      // 先檢查記錄是否存在
      const existing = await this.getById(id)
      if (!existing) {
        throw new NotFoundError(`找不到 ID 為 ${id} 的農場體驗活動`)
      }

      const supabase = this.getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client 初始化失敗')
      }

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

      if (error) {
        throw error
      }

      const updatedActivity = this.transformFromDB(data)

      timer.end({ metadata: { id: updatedActivity.id } })

      dbLogger.info('農場體驗活動更新成功', {
        module: this.moduleName,
        action: 'update',
        metadata: { id: updatedActivity.id, title: updatedActivity.title },
      })

      return updatedActivity
    } catch (error) {
      timer.end()
      this.handleError(error, 'update')
    }
  }

  /**
   * 刪除農場體驗活動
   */
  async delete(id: string): Promise<boolean> {
    const timer = dbLogger.timer('刪除農場體驗活動')

    try {
      dbLogger.info('刪除農場體驗活動', {
        module: this.moduleName,
        action: 'delete',
        metadata: { activityId: id },
      })

      // 先檢查記錄是否存在
      const existing = await this.getById(id)
      if (!existing) {
        throw new NotFoundError(`找不到 ID 為 ${id} 的農場體驗活動`)
      }

      const supabase = this.getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client 初始化失敗')
      }

      const { error } = await supabase.from('farm_tour').delete().eq('id', id)

      if (error) {
        throw error
      }

      timer.end({ metadata: { deleted: true } })

      dbLogger.info('農場體驗活動刪除成功', {
        module: this.moduleName,
        action: 'delete',
        metadata: { activityId: id, title: existing.title },
      })

      return true
    } catch (error) {
      timer.end()
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
      dbLogger.info('檢查服務健康狀態', {
        module: this.moduleName,
        action: 'getHealthStatus',
      })

      // 測試資料庫連接
      const supabase = this.getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client 初始化失敗')
      }

      const { error } = await supabase.from('farm_tour').select('count').limit(1)

      if (error) {
        throw error
      }

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
export const farmTourServiceV2Simple = new FarmTourServiceV2Simple()
