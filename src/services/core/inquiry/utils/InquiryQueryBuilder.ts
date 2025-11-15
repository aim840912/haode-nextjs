/**
 * 詢問單查詢建構器
 * 負責應用查詢參數到 Supabase 查詢
 */

import { InquiryQueryParams } from '@/types/inquiry'

export class InquiryQueryBuilder {
  /**
   * 應用查詢參數到 Supabase 查詢構建器
   */
  static applyQueryParams(query: any, params?: InquiryQueryParams): any {
    if (!params) return query

    // 狀態篩選
    if (params.status) {
      query = query.eq('status', params.status)
    }

    // 類型篩選
    if (params.inquiry_type) {
      query = query.eq('inquiry_type', params.inquiry_type)
    }

    // Email 搜尋
    if (params.customer_email) {
      query = query.ilike('customer_email', `%${params.customer_email}%`)
    }

    // 日期範圍
    if (params.start_date) {
      query = query.gte('created_at', params.start_date)
    }
    if (params.end_date) {
      query = query.lte('created_at', params.end_date)
    }

    // 讀取/回覆狀態
    if (params.is_read !== undefined) {
      query = query.eq('is_read', params.is_read)
    }
    if (params.is_replied !== undefined) {
      query = query.eq('is_replied', params.is_replied)
    }

    // 使用者 ID 篩選
    if (params.user_id) {
      query = query.eq('user_id', params.user_id)
    }

    return query
  }
}
