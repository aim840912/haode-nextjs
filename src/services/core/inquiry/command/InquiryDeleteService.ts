/**
 * 詢問單刪除服務
 *
 * 負責詢問單的刪除操作
 */

import { InquiryServiceBase } from '../shared/inquiry-base'

/**
 * 詢問單刪除服務
 */
export class InquiryDeleteService extends InquiryServiceBase {
  /**
   * 刪除詢問單
   */
  async deleteInquiry(inquiryId: string): Promise<void> {
    try {
      const client = this.getSupabaseClient()
      const { error } = await client.from('inquiries').delete().eq('id', inquiryId)

      if (error) {
        this.handleError(error, 'deleteInquiry', { inquiryId })
      }

      this.logInfo('詢問單刪除成功', {
        action: 'deleteInquiry',
        metadata: { inquiryId },
      })
    } catch (error) {
      this.handleError(error, 'deleteInquiry', { inquiryId })
    }
  }
}
