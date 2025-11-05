/**
 * 詢問單查詢服務
 * 負責所有讀取操作（CQRS - Query）
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { dbLogger } from '@/lib/logger'
import { ErrorFactory } from '@/lib/errors'
import { ServiceSupabaseClient, ServiceErrorContext } from '@/types/service.types'
import { InquiryWithItems, InquiryQueryParams, InquiryStats, InquiryItem } from '@/types/inquiry'

const getAdmin = () => getSupabaseAdmin()

/**
 * 資料庫記錄類型
 */
interface SupabaseInquiryRecord {
  id: string
  user_id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  status: string
  inquiry_type: string
  notes: string | null
  total_estimated_amount: number | null
  delivery_address: string | null
  preferred_delivery_date: string | null
  activity_title: string | null
  visit_date: string | null
  visitor_count: string | null
  is_read: boolean
  read_at: string | null
  is_replied: boolean
  replied_at: string | null
  replied_by: string | null
  created_at: string
  updated_at: string
  inquiry_items?: InquiryItem[]
}

/**
 * 詢問單查詢服務
 */
export class InquiryQueryService {
  private readonly moduleName = 'InquiryQueryService'

  /**
   * 取得 Supabase 客戶端
   */
  private getSupabaseClient(): ServiceSupabaseClient {
    return getAdmin()!
  }

  /**
   * 處理錯誤
   */
  private handleError(error: unknown, operation: string, context?: ServiceErrorContext): never {
    dbLogger.error(`詢問查詢服務 ${operation} 操作失敗`, error as Error, {
      module: this.moduleName,
      action: operation,
      metadata: context,
    })

    if (error && typeof error === 'object' && 'code' in error) {
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.moduleName,
        action: operation,
        ...context,
      })
    }

    throw error instanceof Error ? error : new Error(`${operation} 操作失敗`)
  }

  /**
   * 解析農場參觀資料
   */
  private parseFarmTourDataFromNotes(record: SupabaseInquiryRecord): SupabaseInquiryRecord {
    if (!record.notes || !record.notes.startsWith('FARM_TOUR_DATA:')) {
      return record
    }

    try {
      const jsonData = record.notes.substring('FARM_TOUR_DATA:'.length)
      const farmTourData = JSON.parse(jsonData)

      return {
        ...record,
        inquiry_type: 'farm_tour',
        activity_title: farmTourData.activity_title,
        visit_date: farmTourData.visit_date,
        visitor_count: farmTourData.visitor_count,
        notes: farmTourData.original_notes,
      }
    } catch (error) {
      dbLogger.warn('無法解析農場參觀資料', {
        module: this.moduleName,
        action: 'parseFarmTourData',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          notes: record.notes,
        },
      })
      return record
    }
  }

  /**
   * 轉換資料庫記錄為實體
   */
  private transformFromDB(record: SupabaseInquiryRecord): InquiryWithItems {
    const parsedRecord = this.parseFarmTourDataFromNotes(record)

    return {
      id: parsedRecord.id,
      user_id: parsedRecord.user_id,
      customer_name: parsedRecord.customer_name,
      customer_email: parsedRecord.customer_email,
      customer_phone: parsedRecord.customer_phone || undefined,
      status: parsedRecord.status as any,
      inquiry_type: parsedRecord.inquiry_type as any,
      notes: parsedRecord.notes || undefined,
      total_estimated_amount: parsedRecord.total_estimated_amount || undefined,
      delivery_address: parsedRecord.delivery_address || undefined,
      preferred_delivery_date: parsedRecord.preferred_delivery_date || undefined,
      activity_title: parsedRecord.activity_title || undefined,
      visit_date: parsedRecord.visit_date || undefined,
      visitor_count: parsedRecord.visitor_count || undefined,
      is_read: parsedRecord.is_read,
      read_at: parsedRecord.read_at || undefined,
      is_replied: parsedRecord.is_replied,
      replied_at: parsedRecord.replied_at || undefined,
      replied_by: parsedRecord.replied_by || undefined,
      created_at: parsedRecord.created_at,
      updated_at: parsedRecord.updated_at,
      inquiry_items: parsedRecord.inquiry_items || [],
    }
  }

  /**
   * 應用查詢參數到 Supabase 查詢構建器
   */
  private applyQueryParams(query: any, params?: InquiryQueryParams): any {
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

    // 特殊篩選
    if (params.unread_only) {
      query = query.eq('is_read', false)
    }
    if (params.unreplied_only) {
      query = query.eq('is_replied', false)
    }

    // 排序
    const sortBy = params.sort_by || 'created_at'
    const sortOrder = params.sort_order || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // 分頁
    if (params.limit) {
      query = query.limit(params.limit)
    }
    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1)
    }

    return query
  }

  // === 使用者端查詢方法 ===

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
      query = this.applyQueryParams(query, params)

      const { data, error } = await query

      if (error) {
        this.handleError(error, 'getUserInquiries', { userId, params })
      }

      const result = (data || []).map(record =>
        this.transformFromDB(record as unknown as SupabaseInquiryRecord)
      )

      dbLogger.info('取得使用者詢問單列表成功', {
        module: this.moduleName,
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

      return data ? this.transformFromDB(data as unknown as SupabaseInquiryRecord) : null
    } catch (error) {
      this.handleError(error, 'getInquiryById', { userId, inquiryId })
    }
  }

  // === 管理員端查詢方法 ===

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
      query = this.applyQueryParams(query, params)

      const { data, error } = await query

      if (error) {
        this.handleError(error, 'getAllInquiries', { params })
      }

      return (data || []).map((record: unknown) =>
        this.transformFromDB(record as SupabaseInquiryRecord)
      )
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

      return data ? this.transformFromDB(data as unknown as SupabaseInquiryRecord) : null
    } catch (error) {
      this.handleError(error, 'getInquiryByIdForAdmin', { inquiryId })
    }
  }

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

// 建立並匯出服務實例
export const inquiryQueryService = new InquiryQueryService()
