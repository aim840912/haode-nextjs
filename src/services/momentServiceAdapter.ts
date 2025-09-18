/**
 * 精彩時刻服務適配器
 * 提供向後相容性，將舊版 Culture API 橋接到新版 Moment 服務
 *
 * 此適配器確保現有代碼能夠無縫遷移到 moments 架構
 */

import { MomentServiceV2Simple, momentServiceV2Simple } from './v2/momentServiceSimple'
import { MomentItem, MomentService } from '@/types/moments'
import { dbLogger } from '@/lib/logger'

/**
 * 精彩時刻服務適配器類別
 * 實作新版 MomentService 介面，內部使用 v2 服務
 */
export class MomentServiceAdapter implements MomentService {
  private readonly serviceV2: MomentServiceV2Simple

  constructor(serviceV2Instance?: MomentServiceV2Simple) {
    this.serviceV2 = serviceV2Instance || momentServiceV2Simple

    dbLogger.info('精彩時刻服務適配器初始化', {
      module: 'MomentServiceAdapter',
      action: 'constructor',
    })
  }

  // === MomentService 介面實作 ===

  async getMomentItems(): Promise<MomentItem[]> {
    return this.serviceV2.getMomentItems()
  }

  async addMomentItem(
    item: Omit<MomentItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MomentItem> {
    // 支援檔案上傳的擴展介面
    return this.serviceV2.addMomentItem(item)
  }

  async updateMomentItem(
    id: string,
    item: Partial<Omit<MomentItem, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<MomentItem> {
    // 支援檔案上傳的擴展介面
    return this.serviceV2.updateMomentItem(id, item as Record<string, unknown>)
  }

  async deleteMomentItem(id: string): Promise<void> {
    return this.serviceV2.deleteMomentItem(id)
  }

  async getMomentItemById(id: string): Promise<MomentItem | null> {
    return this.serviceV2.getMomentItemById(id)
  }

  // === 額外的工具方法 ===

  /**
   * 新增精彩時刻項目（支援檔案上傳）
   * @deprecated 建議直接使用 addMomentItem
   */
  async addMomentItemWithFile(
    itemData: Omit<MomentItem, 'id' | 'createdAt' | 'updatedAt'> & { imageFile?: File }
  ): Promise<MomentItem> {
    return this.serviceV2.addMomentItem(itemData)
  }

  /**
   * 更新精彩時刻項目（支援檔案上傳）
   * @deprecated 建議直接使用 updateMomentItem
   */
  async updateMomentItemWithFile(
    id: string,
    itemData: Partial<Omit<MomentItem, 'id' | 'createdAt' | 'updatedAt'>> & { imageFile?: File }
  ): Promise<MomentItem> {
    return this.serviceV2.updateMomentItem(id, itemData)
  }

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
          serviceType: 'MomentServiceV2Simple',
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
}

// 建立並匯出適配器實例
export const momentServiceAdapter = new MomentServiceAdapter()

// 為了保持完全向後相容，也匯出為原始名稱
export const supabaseMomentService = momentServiceAdapter

/**
 * 工廠函數：根據配置決定使用哪個服務實作
 */
export function createMomentService(useV2: boolean = true): MomentService {
  if (useV2) {
    return momentServiceAdapter
  } else {
    // 如果需要，可以載入舊版服務
    throw new Error('舊版服務已被棄用，請使用 v2 版本')
  }
}

/**
 * 遷移輔助函數：檢查精彩時刻服務健康狀態
 */
export async function checkMomentServiceHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  details: Record<string, unknown>
}> {
  try {
    // 簡單的健康檢查 - 嘗試查詢服務是否可用
    await momentServiceV2Simple.getMomentItems()

    return {
      status: 'healthy',
      version: 'v2-simple',
      details: {
        adapterActive: true,
        serviceType: 'MomentServiceV2Simple',
        storageIntegration: 'enabled',
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
