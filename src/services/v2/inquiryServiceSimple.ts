/**
 * 詢問服務 v2 簡化實作
 * 直接實作業務邏輯，使用統一的錯誤處理和日誌記錄
 */

import { getSupabaseAdmin } from '@/lib/supabase-auth'
import { dbLogger } from '@/lib/logger'
import { ErrorFactory, NotFoundError, ValidationError } from '@/lib/errors'

// 類型斷言，解決 Supabase 重載問題
const getAdmin = (): any => getSupabaseAdmin();
import { ServiceSupabaseClient, ServiceErrorContext, UpdateDataObject } from '@/types/service.types'
import {
  InquiryService,
  InquiryWithItems,
  CreateInquiryRequest,
  UpdateInquiryRequest,
  InquiryQueryParams,
  InquiryStats,
  InquiryStatus,
  InquiryItem,
  InquiryType,
} from '@/types/inquiry'

/**
 * 資料庫記錄類型
 */
interface SupabaseInquiryRecord {
  id: string
  user_id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  status: InquiryStatus
  inquiry_type: InquiryType
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
 * 詢問服務 v2 簡化實作
 */
export class InquiryServiceV2Simple implements InquiryService {
  private readonly moduleName = 'InquiryServiceV2'

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
    dbLogger.error(`詢問服務 ${operation} 操作失敗`, error as Error, {
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
  private parseFarmTourDataFromNotes(record: any): SupabaseInquiryRecord {
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
  private transformFromDB(record: any): InquiryWithItems {
    const parsedRecord = this.parseFarmTourDataFromNotes(record)

    return {
      id: parsedRecord.id,
      user_id: parsedRecord.user_id,
      customer_name: parsedRecord.customer_name,
      customer_email: parsedRecord.customer_email,
      customer_phone: parsedRecord.customer_phone || undefined,
      status: parsedRecord.status,
      inquiry_type: parsedRecord.inquiry_type,
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
   * 序列化農場參觀資料到 notes
   */
  private serializeFarmTourData(data: CreateInquiryRequest | UpdateInquiryRequest): string | null {
    if ('inquiry_type' in data && data.inquiry_type === 'farm_tour') {
      const farmTourData = {
        activity_title: data.activity_title,
        visit_date: data.visit_date,
        visitor_count: data.visitor_count,
        original_notes: data.notes || '',
      }
      return `FARM_TOUR_DATA:${JSON.stringify(farmTourData)}`
    }
    return data.notes || null
  }

  // === 使用者端方法 ===

  async createInquiry(userId: string, data: CreateInquiryRequest): Promise<InquiryWithItems> {
    try {
      // 驗證資料
      this.validateCreateInquiryRequest(data)

      // 計算總金額
      const totalEstimatedAmount = this.calculateTotalAmount(data)

      // 準備主記錄資料
      const inquiryData = {
        user_id: userId,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone || null,
        inquiry_type: data.inquiry_type,
        notes: this.serializeFarmTourData(data),
        delivery_address: data.delivery_address || null,
        preferred_delivery_date: data.preferred_delivery_date || null,
        total_estimated_amount: totalEstimatedAmount,
        status: 'pending' as InquiryStatus,
        is_read: false,
        is_replied: false,
      }

      const client = this.getSupabaseClient()

      // 建立詢問單主記錄
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inquiry, error: inquiryError } = await (client.from('inquiries'))
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: items, error: itemsError } = await (client.from('inquiry_items'))
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

        inquiryItems = (items as any) || []
      }

      const result = this.transformFromDB({
        ...inquiry,
        inquiry_items: inquiryItems,
      })

      dbLogger.info('詢問單建立成功', {
        module: this.moduleName,
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

      const result = (data || []).map((record: any) =>
        this.transformFromDB(record)
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

      return data ? this.transformFromDB(data as any) : null
    } catch (error) {
      this.handleError(error, 'getInquiryById', { userId, inquiryId })
    }
  }

  async updateInquiry(
    userId: string,
    inquiryId: string,
    data: UpdateInquiryRequest
  ): Promise<InquiryWithItems> {
    try {
      // 檢查所有權
      const existing = await this.getInquiryById(userId, inquiryId)
      if (!existing) {
        throw new NotFoundError('詢問單不存在或無權限修改')
      }

      const client = this.getSupabaseClient()
      const updateData: UpdateDataObject = {
        ...data,
        notes: this.serializeFarmTourData(data),
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updated, error } = await (client.from('inquiries'))
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

      const result = this.transformFromDB(updated)

      dbLogger.info('詢問單更新成功', {
        module: this.moduleName,
        action: 'updateInquiry',
        metadata: { userId, inquiryId },
      })

      return result
    } catch (error) {
      this.handleError(error, 'updateInquiry', { userId, inquiryId, data })
    }
  }

  // === 管理員端方法 ===

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

      return (data || []).map((record: any) => this.transformFromDB(record))
    } catch (error) {
      this.handleError(error, 'getAllInquiries', { params })
    }
  }

  async updateInquiryStatus(inquiryId: string, status: InquiryStatus): Promise<InquiryWithItems> {
    try {
      const client = this.getSupabaseClient()
      const updateData: UpdateDataObject = { status }

      // 如果狀態變更為已回覆，更新相關時間戳
      if (status === 'quoted') {
        updateData.is_replied = true
        updateData.replied_at = new Date().toISOString()
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updated, error } = await (client.from('inquiries'))
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

      return this.transformFromDB(updated)
    } catch (error) {
      this.handleError(error, 'updateInquiryStatus', { inquiryId, status })
    }
  }

  async getInquiryStats(): Promise<InquiryStats[]> {
    try {
      const client = this.getSupabaseClient()
      const { data, error } = await (client as any).from('inquiry_stats').select('*')

      if (error) {
        this.handleError(error, 'getInquiryStats')
      }

      return data as InquiryStats[]
    } catch (error) {
      this.handleError(error, 'getInquiryStats')
    }
  }

  async deleteInquiry(inquiryId: string): Promise<void> {
    try {
      const client = this.getSupabaseClient()
      const { error } = await client.from('inquiries').delete().eq('id', inquiryId)

      if (error) {
        this.handleError(error, 'deleteInquiry', { inquiryId })
      }

      dbLogger.info('詢問單刪除成功', {
        module: this.moduleName,
        action: 'deleteInquiry',
        metadata: { inquiryId },
      })
    } catch (error) {
      this.handleError(error, 'deleteInquiry', { inquiryId })
    }
  }

  // === 額外工具方法 ===

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

      return data ? this.transformFromDB(data as any) : null
    } catch (error) {
      this.handleError(error, 'getInquiryByIdForAdmin', { inquiryId })
    }
  }

  async updateInquiryItems(inquiryId: string, items: InquiryItem[]): Promise<void> {
    try {
      const client = this.getSupabaseClient()

      // 刪除現有項目
      const { error: deleteError } = await client
        .from('inquiry_items')
        .delete()
        .eq('inquiry_id', inquiryId)

      if (deleteError) {
        this.handleError(deleteError, 'updateInquiryItems:delete', { inquiryId })
      }

      // 建立新項目
      if (items.length > 0) {
        const itemsData = items.map((item: InquiryItem) => ({
          ...item,
          inquiry_id: inquiryId,
        }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (client.from('inquiry_items')).insert(itemsData)

        if (insertError) {
          this.handleError(insertError, 'updateInquiryItems:insert', {
            inquiryId,
            items: itemsData,
          })
        }
      }

      dbLogger.info('詢問項目更新成功', {
        module: this.moduleName,
        action: 'updateInquiryItems',
        metadata: { inquiryId, itemCount: items.length },
      })
    } catch (error) {
      this.handleError(error, 'updateInquiryItems', { inquiryId, items })
    }
  }

  // === 私有輔助方法 ===

  private validateCreateInquiryRequest(data: CreateInquiryRequest): void {
    if (!data.customer_name?.trim()) {
      throw new ValidationError('客戶姓名不能為空')
    }

    if (!data.customer_email?.trim()) {
      throw new ValidationError('客戶Email不能為空')
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customer_email)) {
      throw new ValidationError('Email格式不正確')
    }

    if (!data.inquiry_type) {
      throw new ValidationError('詢問類型不能為空')
    }

    // 驗證產品詢價特定欄位
    if (data.inquiry_type === 'product') {
      if (!data.items || data.items.length === 0) {
        throw new ValidationError('產品詢價必須包含至少一個項目')
      }

      data.items.forEach((item, index) => {
        if (!item.product_id?.trim()) {
          throw new ValidationError(`第 ${index + 1} 項產品ID不能為空`)
        }
        if (!item.product_name?.trim()) {
          throw new ValidationError(`第 ${index + 1} 項產品名稱不能為空`)
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new ValidationError(`第 ${index + 1} 項產品數量必須大於0`)
        }
      })
    }

    // 驗證農場參觀特定欄位
    if (data.inquiry_type === 'farm_tour') {
      if (!data.activity_title?.trim()) {
        throw new ValidationError('活動標題不能為空')
      }
      if (!data.visit_date?.trim()) {
        throw new ValidationError('參觀日期不能為空')
      }
      if (!data.visitor_count?.trim()) {
        throw new ValidationError('參觀人數不能為空')
      }
    }
  }

  private calculateTotalAmount(data: CreateInquiryRequest): number | null {
    if (data.inquiry_type !== 'product' || !data.items) {
      return null
    }

    const total = data.items.reduce((sum, item) => {
      return sum + (item.unit_price || 0) * item.quantity
    }, 0)

    return total > 0 ? total : null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyQueryParams(query: any, params?: InquiryQueryParams): any {
    // TODO: 需要 Supabase 查詢類型
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
}

// 建立並匯出服務實例
export const inquiryServiceV2Simple = new InquiryServiceV2Simple()
