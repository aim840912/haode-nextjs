/**
 * 詢問服務 - 重構版本
 * 使用 CQRS 模式，將查詢、命令和庫存管理職責分離
 * 主服務負責協調各子服務
 */

import { InquiryService as IInquiryService } from '@/types/inquiry'
import type {
  InquiryWithItems,
  CreateInquiryRequest,
  UpdateInquiryRequest,
  InquiryQueryParams,
  InquiryStats,
  InquiryStatus,
} from '@/types/inquiry'

import { InquiryQueryService } from './InquiryQueryService'
import { InquiryCommandService } from './InquiryCommandService'
import { InquiryInventoryService } from './InquiryInventoryService'

/**
 * 詢問服務（協調器）
 * 組合查詢、命令和庫存服務，提供統一介面
 */
export class InquiryService implements IInquiryService {
  constructor(
    private queryService: InquiryQueryService,
    private commandService: InquiryCommandService,
    private inventoryService: InquiryInventoryService
  ) {}

  // === 使用者端方法 ===

  /**
   * 建立詢問單
   */
  async createInquiry(userId: string, data: CreateInquiryRequest): Promise<InquiryWithItems> {
    return this.commandService.createInquiry(userId, data)
  }

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
   * 更新詢問單
   */
  async updateInquiry(
    userId: string,
    inquiryId: string,
    data: UpdateInquiryRequest
  ): Promise<InquiryWithItems> {
    return this.commandService.updateInquiry(
      userId,
      inquiryId,
      data,
      this.queryService.getInquiryById.bind(this.queryService)
    )
  }

  // === 管理員端方法 ===

  /**
   * 取得所有詢問單（管理員）
   */
  async getAllInquiries(params?: InquiryQueryParams): Promise<InquiryWithItems[]> {
    return this.queryService.getAllInquiries(params)
  }

  /**
   * 更新詢問單狀態
   */
  async updateInquiryStatus(inquiryId: string, status: InquiryStatus): Promise<InquiryWithItems> {
    return this.commandService.updateInquiryStatus(
      inquiryId,
      status,
      this.queryService.getInquiryByIdForAdmin.bind(this.queryService),
      {
        reserveInventory: this.inventoryService.reserveInventory.bind(this.inventoryService),
        releaseInventory: this.inventoryService.releaseInventory.bind(this.inventoryService),
        finalizeInventory: this.inventoryService.finalizeInventory.bind(this.inventoryService),
      }
    )
  }

  /**
   * 取得詢問單統計資料
   */
  async getInquiryStats(): Promise<InquiryStats[]> {
    return this.queryService.getInquiryStats()
  }

  /**
   * 刪除詢問單
   */
  async deleteInquiry(inquiryId: string): Promise<void> {
    return this.commandService.deleteInquiry(inquiryId)
  }

  // === 額外工具方法 ===

  /**
   * 取得特定詢問單（管理員）
   */
  async getInquiryByIdForAdmin(inquiryId: string): Promise<InquiryWithItems | null> {
    return this.queryService.getInquiryByIdForAdmin(inquiryId)
  }
}

// 建立並匯出服務實例
const queryService = new InquiryQueryService()
const commandService = new InquiryCommandService()
const inventoryService = new InquiryInventoryService()

export const inquiryService = new InquiryService(queryService, commandService, inventoryService)
