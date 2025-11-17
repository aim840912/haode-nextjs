/**
 * 詢問單查詢服務
 *
 * 負責所有詢問單的查詢操作:
 * - 使用者詢問單查詢
 * - 管理員詢問單查詢
 * - 支援篩選、排序、分頁
 */

import { InquiryWithItems, InquiryQueryParams } from '@/types/inquiry'
import { applyQueryParams, transformFromDB } from '../inquiry-helpers'
import { SupabaseInquiryRecord } from '../types'
import { InquiryServiceBase } from '../shared/inquiry-base'

/**
 * 詢問單查詢服務
 */
export class InquiryQueryService extends InquiryServiceBase {
  /**
   * 取得使用者的詢問單列表
   */
  async getUserInquiries(userId: string, params?: InquiryQueryParams): Promise<InquiryWithItems[]> {
    try {
      const client = this.getSupabaseClient()
      let query = client
        .from('inquiries')
        .select(
          `
          *,
          inquiry_items (*)
        `
        )
        .eq('user_id', userId)

      // 應用查詢參數
      query = applyQueryParams(query, params)

      const { data, error } = await query

      if (error) {
        this.handleError(error, 'getUserInquiries', { userId, params })
      }

      const result = (data || []).map(record =>
        transformFromDB(record as unknown as SupabaseInquiryRecord)
      )

      this.logInfo('取得使用者詢問單列表成功', {
        action: 'getUserInquiries',
        metadata: { userId, count: result.length },
      })

      return result
    } catch (error) {
      this.handleError(error, 'getUserInquiries', { userId, params })
    }
  }

  /**
   * 取得使用者的特定詢問單
   */
  async getInquiryById(userId: string, inquiryId: string): Promise<InquiryWithItems | null> {
    try {
      const client = this.getSupabaseClient()
      const { data, error } = await client
        .from('inquiries')
        .select(
          `
          *,
          inquiry_items (*)
        `
        )
        .eq('id', inquiryId)
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        this.handleError(error, 'getInquiryById', { userId, inquiryId })
      }

      return data ? transformFromDB(data as unknown as SupabaseInquiryRecord) : null
    } catch (error) {
      this.handleError(error, 'getInquiryById', { userId, inquiryId })
    }
  }

  /**
   * 取得所有詢問單（管理員）
   */
  async getAllInquiries(params?: InquiryQueryParams): Promise<InquiryWithItems[]> {
    try {
      const client = this.getSupabaseClient()
      let query = client.from('inquiries').select(`
          *,
          inquiry_items (*)
        `)

      // 應用查詢參數
      query = applyQueryParams(query, params)

      const { data, error } = await query

      if (error) {
        this.handleError(error, 'getAllInquiries', { params })
      }

      return (data || []).map((record: unknown) => transformFromDB(record as SupabaseInquiryRecord))
    } catch (error) {
      this.handleError(error, 'getAllInquiries', { params })
    }
  }

  /**
   * 取得特定詢問單（管理員）
   */
  async getInquiryByIdForAdmin(inquiryId: string): Promise<InquiryWithItems | null> {
    try {
      const client = this.getSupabaseClient()
      const { data, error } = await client
        .from('inquiries')
        .select(
          `
          *,
          inquiry_items (*)
        `
        )
        .eq('id', inquiryId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        this.handleError(error, 'getInquiryByIdForAdmin', { inquiryId })
      }

      return data ? transformFromDB(data as unknown as SupabaseInquiryRecord) : null
    } catch (error) {
      this.handleError(error, 'getInquiryByIdForAdmin', { inquiryId })
    }
  }
}
