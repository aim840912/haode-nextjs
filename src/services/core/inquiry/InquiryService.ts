/**
 * 統一詢問單服務
 * 整合查詢和命令操作
 */

import {
  InquiryWithItems,
  CreateInquiryRequest,
  UpdateInquiryRequest,
  InquiryQueryParams,
  InquiryStats,
  InquiryStatus,
} from '@/types/inquiry'
import { InquiryQueryService } from './query/InquiryQueryService'
import { InquiryStatsService } from './query/InquiryStatsService'
import { InquiryCreateService } from './command/InquiryCreateService'
import { InquiryUpdateService } from './command/InquiryUpdateService'
import { InquiryDeleteService } from './command/InquiryDeleteService'

/**
 * 統一詢問單服務
 */
export class InquiryService {
  private readonly queryService = new InquiryQueryService()
  private readonly statsService = new InquiryStatsService()
  private readonly createService = new InquiryCreateService()
  private readonly updateService = new InquiryUpdateService()
  private readonly deleteService = new InquiryDeleteService()

  // =================================================================
  // 查詢方法（Query Operations）
  // =================================================================

  /**
   * 取得使用者的詢問單列表
   */
  async getUserInquiries(userId: string, params?: InquiryQueryParams): Promise<InquiryWithItems[]> {
    return this.queryService.getUserInquiries(userId, params)
  }

  /**
   * 取得使用者的特定詢問單
   */
  async getInquiryById(userId: string, inquiryId: string): Promise<InquiryWithItems | null> {
    return this.queryService.getInquiryById(userId, inquiryId)
  }

  /**
   * 取得所有詢問單（管理員）
   */
  async getAllInquiries(params?: InquiryQueryParams): Promise<InquiryWithItems[]> {
    return this.queryService.getAllInquiries(params)
  }

  /**
   * 取得特定詢問單（管理員）
   */
  async getInquiryByIdForAdmin(inquiryId: string): Promise<InquiryWithItems | null> {
    return this.queryService.getInquiryByIdForAdmin(inquiryId)
  }

  /**
   * 取得詢問單統計資料
   */
  async getInquiryStats(): Promise<InquiryStats[]> {
    return this.statsService.getInquiryStats()
  }

  // =================================================================
  // 命令方法（Command Operations）
  // =================================================================

  /**
   * 建立詢問單
   */
  async createInquiry(userId: string, data: CreateInquiryRequest): Promise<InquiryWithItems> {
    return this.createService.createInquiry(userId, data)
  }

  /**
   * 更新詢問單
   */
  async updateInquiry(
    userId: string,
    inquiryId: string,
    data: UpdateInquiryRequest
  ): Promise<InquiryWithItems> {
    return this.updateService.updateInquiry(userId, inquiryId, data, this.getInquiryById.bind(this))
  }

  /**
   * 更新詢問單狀態
   */
  async updateInquiryStatus(inquiryId: string, status: InquiryStatus): Promise<InquiryWithItems> {
    return this.updateService.updateInquiryStatus(
      inquiryId,
      status,
      this.getInquiryByIdForAdmin.bind(this)
    )
  }

  /**
   * 刪除詢問單
   */
  async deleteInquiry(inquiryId: string): Promise<void> {
    return this.deleteService.deleteInquiry(inquiryId)
  }
}

// 建立並匯出服務實例
export const inquiryService = new InquiryService()
