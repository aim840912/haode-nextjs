/**
 * 排程服務 v2 簡化實作
 * 基於統一架構的排程管理服務
 *
 * 功能：
 * - 標準化 CRUD 操作
 * - 統一錯誤處理和日誌記錄
 * - 支援日期排序和狀態管理
 * - 內建資料轉換和驗證
 */

import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-auth'
import { dbLogger } from '@/lib/logger'
import { ErrorFactory, NotFoundError, ValidationError } from '@/lib/errors'
import { UpdateDataObject } from '@/types/service.types'
import { ScheduleItem, ScheduleService } from '@/types/schedule'

/**
 * 資料庫記錄類型
 */
interface SupabaseScheduleRecord {
  id: string
  title: string
  location: string
  date: string
  time: string
  status: 'upcoming' | 'ongoing' | 'completed'
  products: string[]
  description: string
  contact: string
  special_offer: string | null
  weather_note: string | null
  created_at: string
  updated_at: string
}

/**
 * 排程服務 v2 簡化實作類別
 */
export class ScheduleServiceV2Simple implements ScheduleService {
  private readonly moduleName = 'ScheduleServiceV2'

  /**
   * 統一錯誤處理方法
   */
  private handleError(error: unknown, action: string): never {
    dbLogger.error(`排程服務 ${action} 操作失敗`, error as Error, {
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
   * 轉換資料庫記錄為 ScheduleItem
   */
  private transformToScheduleItem(record: SupabaseScheduleRecord): ScheduleItem {
    return {
      id: record.id,
      title: record.title,
      location: record.location,
      date: record.date,
      time: record.time,
      status: record.status,
      products: record.products,
      description: record.description,
      contact: record.contact,
      specialOffer: record.special_offer || undefined,
      weatherNote: record.weather_note || undefined,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }
  }

  /**
   * 轉換 ScheduleItem 為資料庫插入格式
   */
  private transformToInsertData(
    scheduleData: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>
  ) {
    return {
      title: scheduleData.title,
      location: scheduleData.location,
      date: scheduleData.date,
      time: scheduleData.time,
      status: scheduleData.status,
      products: scheduleData.products,
      description: scheduleData.description,
      contact: scheduleData.contact,
      special_offer: scheduleData.specialOffer || null,
      weather_note: scheduleData.weatherNote || null,
    }
  }

  /**
   * 取得所有排程（按日期排序）
   */
  async getSchedule(): Promise<ScheduleItem[]> {
    try {
      dbLogger.info('取得排程清單', {
        module: this.moduleName,
        action: 'getSchedule',
      })

      const supabase = createServiceSupabaseClient()
      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .order('date', { ascending: true })

      if (error) {
        this.handleError(error, 'getSchedule')
      }

      const schedules = data?.map(this.transformToScheduleItem.bind(this)) || []

      dbLogger.info('排程清單查詢成功', {
        module: this.moduleName,
        action: 'getSchedule',
        metadata: { count: schedules.length },
      })

      return schedules
    } catch (error) {
      this.handleError(error, 'getSchedule')
    }
  }

  /**
   * 新增排程
   */
  async addSchedule(
    scheduleData: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ScheduleItem> {
    try {
      dbLogger.info('新增排程', {
        module: this.moduleName,
        action: 'addSchedule',
        metadata: { title: scheduleData.title, location: scheduleData.location },
      })

      // 基本驗證
      if (!scheduleData.title?.trim()) {
        throw new ValidationError('標題不能為空')
      }
      if (!scheduleData.location?.trim()) {
        throw new ValidationError('地點不能為空')
      }
      if (!scheduleData.date?.trim()) {
        throw new ValidationError('日期不能為空')
      }

      const insertData = this.transformToInsertData(scheduleData)

      const { data, error } = await supabaseAdmin!
        .from('schedule')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        this.handleError(error, 'addSchedule')
      }

      const newSchedule = this.transformToScheduleItem(data)

      dbLogger.info('排程新增成功', {
        module: this.moduleName,
        action: 'addSchedule',
        metadata: { scheduleId: newSchedule.id, title: newSchedule.title },
      })

      return newSchedule
    } catch (error) {
      this.handleError(error, 'addSchedule')
    }
  }

  /**
   * 更新排程
   */
  async updateSchedule(
    id: string,
    scheduleData: Partial<Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<ScheduleItem> {
    try {
      dbLogger.info('更新排程', {
        module: this.moduleName,
        action: 'updateSchedule',
        metadata: { scheduleId: id },
      })

      if (!id?.trim()) {
        throw new ValidationError('排程 ID 不能為空')
      }

      // 建立更新資料對象
      const updateData: UpdateDataObject = {}
      if (scheduleData.title !== undefined) updateData.title = scheduleData.title
      if (scheduleData.location !== undefined) updateData.location = scheduleData.location
      if (scheduleData.date !== undefined) updateData.date = scheduleData.date
      if (scheduleData.time !== undefined) updateData.time = scheduleData.time
      if (scheduleData.status !== undefined) updateData.status = scheduleData.status
      if (scheduleData.products !== undefined) updateData.products = scheduleData.products
      if (scheduleData.description !== undefined) updateData.description = scheduleData.description
      if (scheduleData.contact !== undefined) updateData.contact = scheduleData.contact
      if (scheduleData.specialOffer !== undefined) updateData.special_offer = scheduleData.specialOffer || null
      if (scheduleData.weatherNote !== undefined) updateData.weather_note = scheduleData.weatherNote || null

      const { data, error } = await supabaseAdmin!
        .from('schedule')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'updateSchedule')
      }

      if (!data) {
        throw new NotFoundError(`排程 ${id} 不存在`)
      }

      const updatedSchedule = this.transformToScheduleItem(data)

      dbLogger.info('排程更新成功', {
        module: this.moduleName,
        action: 'updateSchedule',
        metadata: { scheduleId: id, updatedFields: Object.keys(updateData) },
      })

      return updatedSchedule
    } catch (error) {
      this.handleError(error, 'updateSchedule')
    }
  }

  /**
   * 刪除排程
   */
  async deleteSchedule(id: string): Promise<void> {
    try {
      dbLogger.info('刪除排程', {
        module: this.moduleName,
        action: 'deleteSchedule',
        metadata: { scheduleId: id },
      })

      if (!id?.trim()) {
        throw new ValidationError('排程 ID 不能為空')
      }

      const { error } = await supabaseAdmin!
        .from('schedule')
        .delete()
        .eq('id', id)

      if (error) {
        this.handleError(error, 'deleteSchedule')
      }

      dbLogger.info('排程刪除成功', {
        module: this.moduleName,
        action: 'deleteSchedule',
        metadata: { scheduleId: id },
      })
    } catch (error) {
      this.handleError(error, 'deleteSchedule')
    }
  }

  /**
   * 根據 ID 取得排程
   */
  async getScheduleById(id: string): Promise<ScheduleItem | null> {
    try {
      dbLogger.info('根據 ID 取得排程', {
        module: this.moduleName,
        action: 'getScheduleById',
        metadata: { scheduleId: id },
      })

      if (!id?.trim()) {
        throw new ValidationError('排程 ID 不能為空')
      }

      const supabase = createServiceSupabaseClient()
      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 記錄未找到
          dbLogger.info('排程不存在', {
            module: this.moduleName,
            action: 'getScheduleById',
            metadata: { scheduleId: id },
          })
          return null
        }
        this.handleError(error, 'getScheduleById')
      }

      const schedule = this.transformToScheduleItem(data)

      dbLogger.info('排程查詢成功', {
        module: this.moduleName,
        action: 'getScheduleById',
        metadata: { scheduleId: id, title: schedule.title },
      })

      return schedule
    } catch (error) {
      this.handleError(error, 'getScheduleById')
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
        .from('schedule')
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
export const scheduleServiceV2Simple = new ScheduleServiceV2Simple()