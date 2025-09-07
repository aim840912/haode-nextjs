/**
 * @deprecated 農場體驗服務 v2 - 轉為佔位實作
 * farm_tour 表不存在於資料庫 schema 中，導致所有 Supabase 查詢失敗
 * 需要資料庫管理員檢查表結構或決定是否保留此功能
 * 
 * 原本功能：
 * - 標準化 CRUD 操作
 * - 統一錯誤處理和日誌記錄  
 * - 支援季節和活動管理
 * - 內建資料轉換和驗證
 */

import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-auth'
import { dbLogger } from '@/lib/logger'
import { ErrorFactory, NotFoundError, ValidationError } from '@/lib/errors'

// 類型斷言，解決 Supabase 重載問題
const getAdmin = () => getSupabaseAdmin();
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
   * 佔位實作日誌方法
   */
  private logNotImplemented(method: string, metadata?: Record<string, unknown>) {
    dbLogger.warn(`${this.moduleName}.${method} - 佔位實作：farm_tour 表不存在`, {
      module: this.moduleName,
      action: method,
      metadata
    })
  }

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

      // 佔位實作：farm_tour 表不存在
      this.logNotImplemented('getAll')
      return []
    } catch (error) {
      // 錯誤處理保留以維持介面相容性
      this.handleError(error, 'getAll')
    }
  }

  /**
   * 根據 ID 取得農場體驗活動
   */
  async getById(id: string): Promise<FarmTourActivity | null> {
    try {
      // 佔位實作：farm_tour 表不存在
      this.logNotImplemented('getById', { id })
      return null
    } catch (error) {
      this.handleError(error, 'getById')
    }
  }

  /**
   * 建立新的農場體驗活動
   */
  async create(activityData: Omit<FarmTourActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<FarmTourActivity> {
    try {
      // 佔位實作：farm_tour 表不存在
      this.logNotImplemented('create', { title: activityData.title, season: activityData.season })
      
      // 返回模擬資料以維持介面相容性
      const mockActivity: FarmTourActivity = {
        id: `mock-${Date.now()}`,
        title: activityData.title || 'Mock Activity',
        season: activityData.season || 'Mock Season',
        months: activityData.months || 'Mock Months',
        price: activityData.price || 0,
        duration: activityData.duration || 'Mock Duration',
        activities: activityData.activities || [],
        includes: activityData.includes || [],
        highlight: activityData.highlight || 'Mock Highlight',
        note: activityData.note || 'Mock Note',
        image: activityData.image || '/images/placeholder.jpg',
        available: activityData.available ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      return mockActivity
    } catch (error) {
      // 錯誤處理保留以維持介面相容性
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
      // 佔位實作：farm_tour 表不存在
      this.logNotImplemented('update', { activityId: id, updatedFields: Object.keys(activityData) })
      
      // 返回模擬資料以維持介面相容性
      const mockActivity: FarmTourActivity = {
        id: id,
        title: activityData.title || 'Mock Updated Activity',
        season: activityData.season || 'Mock Updated Season',
        months: activityData.months || 'Mock Updated Months',
        price: activityData.price || 0,
        duration: activityData.duration || 'Mock Updated Duration',
        activities: activityData.activities || ['Mock Activity'],
        includes: activityData.includes || ['Mock Include'],
        highlight: activityData.highlight || 'Mock Updated Highlight',
        note: activityData.note || 'Mock Updated Note',
        image: activityData.image || '/images/placeholder.jpg',
        available: activityData.available ?? true,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1天前
        updatedAt: new Date().toISOString(),
      }
      
      return mockActivity
    } catch (error) {
      // 錯誤處理保留以維持介面相容性
      this.handleError(error, 'update')
    }
  }

  /**
   * 刪除農場體驗活動
   */
  async delete(id: string): Promise<boolean> {
    try {
      // 佔位實作：farm_tour 表不存在
      this.logNotImplemented('delete', { activityId: id })
      
      // 返回成功以維持介面相容性
      return true
    } catch (error) {
      // 錯誤處理保留以維持介面相容性
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
      // 佔位實作：因為是佔位服務，始終回報降級狀態但可用
      this.logNotImplemented('getHealthStatus')
      
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        details: {
          module: this.moduleName,
          version: 'v2-simple-placeholder',
          reason: 'farm_tour 表不存在，使用佔位實作',
          databaseConnected: false,
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