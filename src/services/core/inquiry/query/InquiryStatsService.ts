/**
 * 詢問單統計服務
 *
 * 負責詢問單的統計資料查詢
 */

import { dbLogger } from '@/lib/logger'
import { InquiryStats } from '@/types/inquiry'
import { InquiryServiceBase } from '../shared/inquiry-base'

/**
 * 詢問單統計服務
 */
export class InquiryStatsService extends InquiryServiceBase {
  /**
   * 取得詢問單統計資料
   */
  async getInquiryStats(): Promise<InquiryStats[]> {
    try {
      // inquiry_stats 表不存在，返回空陣列
      dbLogger.warn('getInquiryStats - 佔位實作：inquiry_stats 表不存在', {
        module: this.moduleName,
        action: 'getInquiryStats',
      })

      return [] as InquiryStats[]
    } catch (error) {
      this.handleError(error, 'getInquiryStats')
    }
  }
}
