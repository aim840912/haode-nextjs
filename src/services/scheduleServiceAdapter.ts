/**
 * 排程服務適配器
 * 提供向後相容性，將舊版 ScheduleService API 橋接到新版服務
 *
 * 此適配器確保現有代碼能夠無縫遷移到 v2 架構
 */

import { ScheduleServiceV2Simple, scheduleServiceV2Simple } from './v2/scheduleServiceSimple'
import { ScheduleItem, ScheduleService } from '@/types/schedule'
import { dbLogger } from '@/lib/logger'

/**
 * 排程服務適配器類別
 * 實作舊版 ScheduleService 介面，內部使用 v2 服務
 */
export class ScheduleServiceAdapter implements ScheduleService {
  private readonly serviceV2: ScheduleServiceV2Simple

  constructor(serviceV2Instance?: ScheduleServiceV2Simple) {
    this.serviceV2 = serviceV2Instance || scheduleServiceV2Simple

    dbLogger.info('排程服務適配器初始化', {
      module: 'ScheduleServiceAdapter',
      action: 'constructor',
    })
  }

  // === ScheduleService 介面實作 ===

  async getSchedule(): Promise<ScheduleItem[]> {
    return this.serviceV2.getSchedule()
  }

  async addSchedule(schedule: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleItem> {
    return this.serviceV2.addSchedule(schedule)
  }

  async updateSchedule(
    id: string,
    schedule: Partial<Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<ScheduleItem> {
    return this.serviceV2.updateSchedule(id, schedule)
  }

  async deleteSchedule(id: string): Promise<void> {
    return this.serviceV2.deleteSchedule(id)
  }

  async getScheduleById(id: string): Promise<ScheduleItem | null> {
    return this.serviceV2.getScheduleById(id)
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
          serviceType: 'ScheduleServiceV2Simple',
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
   * 取得特定狀態的排程
   */
  async getSchedulesByStatus(status: 'upcoming' | 'ongoing' | 'completed'): Promise<ScheduleItem[]> {
    const allSchedules = await this.serviceV2.getSchedule()
    return allSchedules.filter(schedule => schedule.status === status)
  }

  /**
   * 取得特定日期範圍的排程
   */
  async getSchedulesByDateRange(startDate: string, endDate: string): Promise<ScheduleItem[]> {
    const allSchedules = await this.serviceV2.getSchedule()
    return allSchedules.filter(schedule => 
      schedule.date >= startDate && schedule.date <= endDate
    )
  }
}

// 建立並匯出適配器實例
export const scheduleServiceAdapter = new ScheduleServiceAdapter()

// 為了保持完全向後相容，也匯出為原始名稱
export const supabaseScheduleService = scheduleServiceAdapter

/**
 * 工廠函數：根據配置決定使用哪個服務實作
 */
export function createScheduleService(useV2: boolean = true): ScheduleService {
  if (useV2) {
    return scheduleServiceAdapter
  } else {
    // 如果需要，可以載入舊版服務
    throw new Error('舊版服務已被棄用，請使用 v2 版本')
  }
}

/**
 * 遷移輔助函數：檢查排程服務健康狀態
 */
export async function checkScheduleServiceHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  details: Record<string, unknown>
}> {
  try {
    // 簡單的健康檢查 - 嘗試查詢服務是否可用
    await scheduleServiceV2Simple.getSchedule()

    return {
      status: 'healthy',
      version: 'v2-simple',
      details: {
        adapterActive: true,
        serviceType: 'ScheduleServiceV2Simple',
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