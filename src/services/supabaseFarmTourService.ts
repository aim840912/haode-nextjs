import { FarmTourActivity } from '@/types/farmTour'
import { dbLogger } from '@/lib/logger'

/**
 * @deprecated 此服務已被 FarmTourServiceV2Simple 取代
 * 請使用 farmTourServiceAdapter 以獲得更好的錯誤處理和日誌記錄
 *
 * 注意：此服務現為佔位實作，避免 TypeScript 錯誤
 * 實際功能由 FarmTourServiceV2Simple 提供
 */
export class SupabaseFarmTourService {
  private logDeprecatedWarning(method: string) {
    dbLogger.warn(
      `SupabaseFarmTourService.${method} - 此服務已廢棄，請使用 FarmTourServiceV2Simple`,
      {
        module: 'SupabaseFarmTourService',
        action: method,
      }
    )
  }

  async getAll(): Promise<FarmTourActivity[]> {
    this.logDeprecatedWarning('getAll')
    return []
  }

  async getById(id: string): Promise<FarmTourActivity | null> {
    this.logDeprecatedWarning('getById')
    return null
  }

  async create(
    activityData: Omit<FarmTourActivity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<FarmTourActivity> {
    this.logDeprecatedWarning('create')

    // 返回一個符合介面的模擬物件
    const mockActivity: FarmTourActivity = {
      id: `mock-${Date.now()}`,
      title: activityData.title,
      season: activityData.season,
      months: activityData.months,
      price: activityData.price,
      duration: activityData.duration,
      activities: activityData.activities,
      includes: activityData.includes,
      highlight: activityData.highlight,
      note: activityData.note,
      image: activityData.image,
      available: activityData.available,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return mockActivity
  }

  async update(
    id: string,
    updateData: Partial<Omit<FarmTourActivity, 'id' | 'createdAt'>>
  ): Promise<FarmTourActivity | null> {
    this.logDeprecatedWarning('update')
    return null
  }

  async delete(id: string): Promise<boolean> {
    this.logDeprecatedWarning('delete')
    return false
  }

  private transformFromDB(data: Record<string, unknown>): FarmTourActivity {
    // 佔位實作，不應被調用
    this.logDeprecatedWarning('transformFromDB')
    return data as unknown as FarmTourActivity
  }
}
