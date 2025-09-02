/**
 * 文化服務適配器
 * 提供向後相容性，將舊版 CultureService API 橋接到新版服務
 *
 * 此適配器確保現有代碼能夠無縫遷移到 v2 架構
 */

import { CultureServiceV2Simple, cultureServiceV2Simple } from './v2/cultureServiceSimple'
import { CultureItem, CultureService } from '@/types/culture'
import { dbLogger } from '@/lib/logger'

/**
 * 文化服務適配器類別
 * 實作舊版 CultureService 介面，內部使用 v2 服務
 */
export class CultureServiceAdapter implements CultureService {
  private readonly serviceV2: CultureServiceV2Simple

  constructor(serviceV2Instance?: CultureServiceV2Simple) {
    this.serviceV2 = serviceV2Instance || cultureServiceV2Simple

    dbLogger.info('文化服務適配器初始化', {
      module: 'CultureServiceAdapter',
      action: 'constructor',
    })
  }

  // === CultureService 介面實作 ===

  async getCultureItems(): Promise<CultureItem[]> {
    return this.serviceV2.getCultureItems()
  }

  async addCultureItem(
    item: Omit<CultureItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CultureItem> {
    // 支援檔案上傳的擴展介面
    return this.serviceV2.addCultureItem(item)
  }

  async updateCultureItem(
    id: string,
    item: Partial<Omit<CultureItem, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<CultureItem> {
    // 支援檔案上傳的擴展介面
    return this.serviceV2.updateCultureItem(id, item as Record<string, unknown>)
  }

  async deleteCultureItem(id: string): Promise<void> {
    return this.serviceV2.deleteCultureItem(id)
  }

  async getCultureItemById(id: string): Promise<CultureItem | null> {
    return this.serviceV2.getCultureItemById(id)
  }

  // === 額外的工具方法 ===

  /**
   * 新增文化項目（支援檔案上傳）
   * @deprecated 建議直接使用 addCultureItem
   */
  async addCultureItemWithFile(
    itemData: Omit<CultureItem, 'id' | 'createdAt' | 'updatedAt'> & { imageFile?: File }
  ): Promise<CultureItem> {
    return this.serviceV2.addCultureItem(itemData)
  }

  /**
   * 更新文化項目（支援檔案上傳）
   * @deprecated 建議直接使用 updateCultureItem
   */
  async updateCultureItemWithFile(
    id: string,
    itemData: Partial<Omit<CultureItem, 'id' | 'createdAt' | 'updatedAt'>> & { imageFile?: File }
  ): Promise<CultureItem> {
    return this.serviceV2.updateCultureItem(id, itemData)
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
          serviceType: 'CultureServiceV2Simple',
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
export const cultureServiceAdapter = new CultureServiceAdapter()

// 為了保持完全向後相容，也匯出為原始名稱
export const supabaseCultureService = cultureServiceAdapter

/**
 * 工廠函數：根據配置決定使用哪個服務實作
 */
export function createCultureService(useV2: boolean = true): CultureService {
  if (useV2) {
    return cultureServiceAdapter
  } else {
    // 如果需要，可以載入舊版服務
    throw new Error('舊版服務已被棄用，請使用 v2 版本')
  }
}

/**
 * 遷移輔助函數：檢查文化服務健康狀態
 */
export async function checkCultureServiceHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  details: Record<string, unknown>
}> {
  try {
    // 簡單的健康檢查 - 嘗試查詢服務是否可用
    await cultureServiceV2Simple.getCultureItems()

    return {
      status: 'healthy',
      version: 'v2-simple',
      details: {
        adapterActive: true,
        serviceType: 'CultureServiceV2Simple',
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
