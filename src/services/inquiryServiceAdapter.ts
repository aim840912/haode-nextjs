/**
 * 詢問服務適配器
 * 提供向後相容性，將舊版 API 橋接到新版服務
 *
 * 此適配器確保現有代碼能夠無縫遷移到 v2 架構
 */

import { InquiryServiceV2Simple, inquiryServiceV2Simple } from './v2/inquiryServiceSimple'
import {
  InquiryService,
  InquiryWithItems,
  CreateInquiryRequest,
  UpdateInquiryRequest,
  InquiryQueryParams,
  InquiryStats,
  InquiryStatus,
} from '@/types/inquiry'
import { dbLogger } from '@/lib/logger'

/**
 * 詢問服務適配器類別
 * 實作舊版 InquiryService 介面，內部使用 v2 服務
 */
export class InquiryServiceAdapter implements InquiryService {
  private readonly serviceV2: InquiryServiceV2Simple

  constructor(serviceV2Instance?: InquiryServiceV2Simple) {
    this.serviceV2 = serviceV2Instance || inquiryServiceV2Simple

    dbLogger.info('詢問服務適配器初始化', {
      module: 'InquiryServiceAdapter',
      action: 'constructor',
    })
  }

  // === 使用者端方法 ===

  async createInquiry(userId: string, data: CreateInquiryRequest): Promise<InquiryWithItems> {
    return this.serviceV2.createInquiry(userId, data)
  }

  async getUserInquiries(userId: string, params?: InquiryQueryParams): Promise<InquiryWithItems[]> {
    return this.serviceV2.getUserInquiries(userId, params)
  }

  async getInquiryById(userId: string, inquiryId: string): Promise<InquiryWithItems | null> {
    return this.serviceV2.getInquiryById(userId, inquiryId)
  }

  async updateInquiry(
    userId: string,
    inquiryId: string,
    data: UpdateInquiryRequest
  ): Promise<InquiryWithItems> {
    return this.serviceV2.updateInquiry(userId, inquiryId, data)
  }

  // === 管理員端方法 ===

  async getAllInquiries(params?: InquiryQueryParams): Promise<InquiryWithItems[]> {
    return this.serviceV2.getAllInquiries(params)
  }

  async updateInquiryStatus(inquiryId: string, status: InquiryStatus): Promise<InquiryWithItems> {
    return this.serviceV2.updateInquiryStatus(inquiryId, status)
  }

  async getInquiryStats(): Promise<InquiryStats[]> {
    return this.serviceV2.getInquiryStats()
  }

  async deleteInquiry(inquiryId: string): Promise<void> {
    return this.serviceV2.deleteInquiry(inquiryId)
  }

  // === 額外的工具方法（保持舊版 API 相容性）===

  /**
   * 管理員取得詢問單詳情
   * @deprecated 使用 getInquiryByIdForAdmin 替代
   */
  async getInquiryByIdForAdmin(inquiryId: string): Promise<InquiryWithItems | null> {
    return this.serviceV2.getInquiryByIdForAdmin(inquiryId)
  }

  /**
   * 更新詢問項目
   * @deprecated 此方法將在未來版本移除
   */
  async updateInquiryItems(inquiryId: string, items: Record<string, unknown>[]): Promise<void> {
    return this.serviceV2.updateInquiryItems(inquiryId, items)
  }
}

// 建立並匯出適配器實例
export const inquiryServiceAdapter = new InquiryServiceAdapter()

// 為了保持完全向後相容，也匯出為原始名稱
export const supabaseServerInquiryService = inquiryServiceAdapter

/**
 * 工廠函數：根據配置決定使用哪個服務實作
 */
export function createInquiryService(useV2: boolean = true): InquiryService {
  if (useV2) {
    return inquiryServiceAdapter
  } else {
    // 如果需要，可以載入舊版服務
    throw new Error('舊版服務已被棄用，請使用 v2 版本')
  }
}

/**
 * 遷移輔助函數：檢查服務健康狀態
 */
export async function checkInquiryServiceHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  details: Record<string, unknown>
}> {
  try {
    // 簡單的健康檢查 - 嘗試查詢服務是否可用
    await inquiryServiceV2Simple.getAllInquiries({ limit: 1 })

    return {
      status: 'healthy',
      version: 'v2-simple',
      details: {
        adapterActive: true,
        serviceType: 'InquiryServiceV2Simple',
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
