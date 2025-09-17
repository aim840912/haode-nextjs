/**
 * 農場體驗服務適配器
 * 提供向後相容性，將舊版 FarmTourService API 橋接到新版服務
 *
 * 此適配器確保現有代碼能夠無縫遷移到 v2 架構
 */

import { FarmTourServiceV2Simple, farmTourServiceV2Simple } from './v2/farmTourServiceSimple'
import { FarmTourActivity } from '@/types/farmTour'
import { dbLogger } from '@/lib/logger'

/**
 * FarmTour 服務介面（與 serviceFactory 中定義一致）
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
 * 農場體驗服務適配器類別
 * 實作舊版 FarmTourService 介面，內部使用 v2 服務
 */
export class FarmTourServiceAdapter implements FarmTourService {
  private readonly serviceV2: FarmTourServiceV2Simple

  constructor(serviceV2Instance?: FarmTourServiceV2Simple) {
    this.serviceV2 = serviceV2Instance || farmTourServiceV2Simple

    dbLogger.info('農場體驗服務適配器初始化', {
      module: 'FarmTourServiceAdapter',
      action: 'constructor',
    })
  }

  // === FarmTourService 介面實作 ===

  async getAll(): Promise<FarmTourActivity[]> {
    return this.serviceV2.getAll()
  }

  async getById(id: string): Promise<FarmTourActivity | null> {
    return this.serviceV2.getById(id)
  }

  async create(
    data: Omit<FarmTourActivity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<FarmTourActivity> {
    return this.serviceV2.create(data)
  }

  async update(
    id: string,
    data: Partial<Omit<FarmTourActivity, 'id' | 'createdAt'>>
  ): Promise<FarmTourActivity | null> {
    return this.serviceV2.update(id, data)
  }

  async delete(id: string): Promise<boolean> {
    return this.serviceV2.delete(id)
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
          serviceType: 'FarmTourServiceV2Simple',
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
   * 根據月份範圍取得農場體驗活動
   */
  async getByMonthRange(startMonth: number, endMonth: number): Promise<FarmTourActivity[]> {
    const allActivities = await this.serviceV2.getAll()
    return allActivities.filter(
      activity => activity.start_month <= endMonth && activity.end_month >= startMonth
    )
  }

  /**
   * 取得可用的農場體驗活動
   */
  async getAvailable(): Promise<FarmTourActivity[]> {
    const allActivities = await this.serviceV2.getAll()
    return allActivities.filter(activity => activity.available)
  }

  /**
   * 根據價格範圍取得農場體驗活動
   */
  async getByPriceRange(minPrice: number, maxPrice: number): Promise<FarmTourActivity[]> {
    const allActivities = await this.serviceV2.getAll()
    return allActivities.filter(
      activity => activity.price >= minPrice && activity.price <= maxPrice
    )
  }
}

// 建立並匯出適配器實例
export const farmTourServiceAdapter = new FarmTourServiceAdapter()

// 為了保持完全向後相容，也匯出為原始名稱
export const supabaseFarmTourService = farmTourServiceAdapter

/**
 * 工廠函數：根據配置決定使用哪個服務實作
 */
export function createFarmTourService(useV2: boolean = true): FarmTourService {
  if (useV2) {
    return farmTourServiceAdapter
  } else {
    // 如果需要，可以載入舊版服務
    throw new Error('舊版服務已被棄用，請使用 v2 版本')
  }
}

/**
 * 遷移輔助函數：檢查農場體驗服務健康狀態
 */
export async function checkFarmTourServiceHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  details: Record<string, unknown>
}> {
  try {
    // 簡單的健康檢查 - 嘗試查詢服務是否可用
    await farmTourServiceV2Simple.getAll()

    return {
      status: 'healthy',
      version: 'v2-simple',
      details: {
        adapterActive: true,
        serviceType: 'FarmTourServiceV2Simple',
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
