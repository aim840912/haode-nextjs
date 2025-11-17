/**
 * 詢問單更新服務
 *
 * 負責詢問單的更新操作:
 * - 一般資料更新
 * - 狀態更新(含庫存管理)
 */

import { NotFoundError } from '@/lib/errors'
import { InquiryWithItems, UpdateInquiryRequest, InquiryStatus } from '@/types/inquiry'
import { ServiceSupabaseClient, UpdateDataObject } from '@/types/service.types'
import { transformFromDB, serializeFarmTourData } from '../inquiry-helpers'
import { SupabaseInquiryRecord } from '../types'
import { InquiryServiceBase } from '../shared/inquiry-base'
import { handleInventoryForStatusChange } from '../shared/inquiry-inventory-integration'

/**
 * 詢問單更新服務
 */
export class InquiryUpdateService extends InquiryServiceBase {
  /**
   * 更新詢問單
   */
  async updateInquiry(
    userId: string,
    inquiryId: string,
    data: UpdateInquiryRequest,
    getInquiryById: (userId: string, inquiryId: string) => Promise<InquiryWithItems | null>
  ): Promise<InquiryWithItems> {
    try {
      // 檢查所有權
      const existing = await getInquiryById(userId, inquiryId)
      if (!existing) {
        throw new NotFoundError('詢問單不存在或無權限修改')
      }

      const client = this.getSupabaseClient()
      const updateData: UpdateDataObject = {
        ...data,
        notes: serializeFarmTourData(data),
      }

      const { data: updated, error } = await client
        .from('inquiries')
        .update(updateData)
        .eq('id', inquiryId)
        .eq('user_id', userId)
        .select(
          `
          *,
          inquiry_items (*)
        `
        )
        .single()

      if (error) {
        this.handleError(error, 'updateInquiry', { userId, inquiryId, data })
      }

      const result = transformFromDB(updated as unknown as SupabaseInquiryRecord)

      this.logInfo('詢問單更新成功', {
        action: 'updateInquiry',
        metadata: { userId, inquiryId },
      })

      return result
    } catch (error) {
      this.handleError(error, 'updateInquiry', { userId, inquiryId, data })
    }
  }

  /**
   * 更新詢問單狀態
   */
  async updateInquiryStatus(
    inquiryId: string,
    status: InquiryStatus,
    getInquiryByIdForAdmin: (inquiryId: string) => Promise<InquiryWithItems | null>
  ): Promise<InquiryWithItems> {
    try {
      const client: ServiceSupabaseClient = this.getSupabaseClient()

      // 先取得詢問單資訊（含前一個狀態）
      const inquiry = await getInquiryByIdForAdmin(inquiryId)
      if (!inquiry) {
        throw new NotFoundError('詢問單不存在')
      }

      const previousStatus = inquiry.status
      const updateData: UpdateDataObject = { status }

      // 如果狀態變更為已回覆，更新相關時間戳
      if (status === 'quoted') {
        updateData.is_replied = true
        updateData.replied_at = new Date().toISOString()
      }

      // 庫存管理邏輯（僅產品詢價）
      if (inquiry.inquiry_type === 'product' && inquiry.inquiry_items.length > 0) {
        await handleInventoryForStatusChange(
          inquiryId,
          previousStatus,
          status,
          inquiry.inquiry_items
        )
      }

      // 更新狀態
      const { data: updated, error } = await client
        .from('inquiries')
        .update(updateData)
        .eq('id', inquiryId)
        .select(
          `
          *,
          inquiry_items (*)
        `
        )
        .single()

      if (error) {
        this.handleError(error, 'updateInquiryStatus', { inquiryId, status })
      }

      return transformFromDB(updated as unknown as SupabaseInquiryRecord)
    } catch (error) {
      this.handleError(error, 'updateInquiryStatus', { inquiryId, status })
    }
  }
}
