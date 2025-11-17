/**
 * 詢問單建立服務
 *
 * 負責詢問單的建立操作:
 * - 資料驗證
 * - 主記錄建立
 * - 詢問項目建立
 * - 金額計算
 */

import { InquiryWithItems, CreateInquiryRequest, InquiryStatus, InquiryItem } from '@/types/inquiry'
import { validateCreateInquiryRequest, calculateTotalAmount } from '../inquiry-validation'
import { transformFromDB, serializeFarmTourData } from '../inquiry-helpers'
import { InquiryServiceBase } from '../shared/inquiry-base'

/**
 * 詢問單建立服務
 */
export class InquiryCreateService extends InquiryServiceBase {
  /**
   * 建立詢問單
   */
  async createInquiry(userId: string, data: CreateInquiryRequest): Promise<InquiryWithItems> {
    try {
      // 驗證資料
      validateCreateInquiryRequest(data)

      // 計算總金額
      const totalEstimatedAmount = calculateTotalAmount(data)

      // 準備主記錄資料
      const inquiryData = {
        user_id: userId,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone || null,
        inquiry_type: data.inquiry_type,
        notes: serializeFarmTourData(data),
        delivery_address: data.delivery_address || null,
        preferred_delivery_date: data.preferred_delivery_date || null,
        total_estimated_amount: totalEstimatedAmount,
        status: 'pending' as InquiryStatus,
        is_read: false,
        is_replied: false,
      }

      const client = this.getSupabaseClient()

      // 建立詢問單主記錄
      const { data: inquiry, error: inquiryError } = await client
        .from('inquiries')
        .insert([inquiryData])
        .select()
        .single()

      if (inquiryError) {
        this.handleError(inquiryError, 'createInquiry', { userId, data })
      }

      // 建立詢問項目（僅產品詢價）
      let inquiryItems: InquiryItem[] = []
      if (data.inquiry_type === 'product' && data.items && data.items.length > 0) {
        const itemsData = data.items.map(item => ({
          inquiry_id: inquiry.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_category: item.product_category,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price ? item.unit_price * item.quantity : null,
          notes: item.notes,
        }))

        const { data: items, error: itemsError } = await client
          .from('inquiry_items')
          .insert(itemsData)
          .select()

        if (itemsError) {
          // 清除已建立的詢問單
          await client.from('inquiries').delete().eq('id', inquiry.id)
          this.handleError(itemsError, 'createInquiryItems', {
            inquiryId: inquiry.id,
            items: itemsData,
          })
        }

        inquiryItems = (items as InquiryItem[]) || []
      }

      const result = transformFromDB({
        ...inquiry,
        inquiry_items: inquiryItems,
      })

      this.logInfo('詢問單建立成功', {
        action: 'createInquiry',
        metadata: {
          userId,
          inquiryId: result.id,
          inquiryType: data.inquiry_type,
          itemsCount: inquiryItems.length,
        },
      })

      return result
    } catch (error) {
      this.handleError(error, 'createInquiry', { userId, data })
    }
  }
}
