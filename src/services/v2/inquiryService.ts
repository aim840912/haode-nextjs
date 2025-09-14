/**
 * 詢問服務 v2 實作
 * 基於統一服務架構的詢問管理服務
 *
 * 功能：
 * - 標準化 CRUD 操作
 * - 統一錯誤處理和日誌記錄
 * - 支援農場參觀和產品詢價
 * - 內建資料轉換和驗證
 */

import {
  AbstractSupabaseService,
  DataTransformer,
  SupabaseServiceConfig,
} from '@/lib/abstract-supabase-service'
import {
  PaginatedService,
  SearchableService,
  PaginatedQueryOptions,
  QueryOptions,
} from '@/lib/base-service'
import {
  Inquiry,
  InquiryWithItems,
  CreateInquiryRequest,
  CreateInquiryItemRequest,
  UpdateInquiryRequest,
  InquiryQueryParams,
  InquiryStats,
  InquiryStatus,
  InquiryItem,
  InquiryType,
} from '@/types/inquiry'
import { dbLogger } from '@/lib/logger'
import { ValidationError, NotFoundError, ErrorFactory } from '@/lib/errors'

/**
 * 資料庫記錄類型定義
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
 * 詢問服務的資料轉換器
 * 處理農場參觀資料的序列化/反序列化
 */
class InquiryTransformer implements DataTransformer<InquiryWithItems, SupabaseInquiryRecord> {
  /**
   * 從資料庫記錄轉換為實體 (新介面方法)
   */
  transform(record: any): InquiryWithItems {
    return this.fromDB(record)
  }

  /**
   * 從資料庫記錄轉換為實體
   */
  fromDB(record: any): InquiryWithItems {
    // 解析農場參觀資料
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
   * 從實體轉換為資料庫記錄
   */
  toDB(entity: Partial<InquiryWithItems>): Partial<SupabaseInquiryRecord> {
    const record: Partial<SupabaseInquiryRecord> = {
      user_id: entity.user_id,
      customer_name: entity.customer_name,
      customer_email: entity.customer_email,
      customer_phone: entity.customer_phone || null,
      status: entity.status,
      inquiry_type: entity.inquiry_type,
      delivery_address: entity.delivery_address || null,
      preferred_delivery_date: entity.preferred_delivery_date || null,
      total_estimated_amount: entity.total_estimated_amount || null,
      is_read: entity.is_read,
      is_replied: entity.is_replied,
      replied_by: entity.replied_by || null,
    }

    // 處理農場參觀資料序列化
    if (entity.inquiry_type === 'farm_tour') {
      const farmTourData = {
        activity_title: entity.activity_title,
        visit_date: entity.visit_date,
        visitor_count: entity.visitor_count,
        original_notes: entity.notes || '',
      }
      record.notes = `FARM_TOUR_DATA:${JSON.stringify(farmTourData)}`
    } else {
      record.notes = entity.notes || null
    }

    return record
  }

  /**
   * 解析農場參觀資料從 notes 欄位
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
        module: 'InquiryService',
        action: 'parseFarmTourData',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          notes: record.notes,
        },
      })
      return record
    }
  }
}

/**
 * 擴展的詢問服務介面
 * 包含業務特定方法
 */
export interface ExtendedInquiryService {
  // 基礎 CRUD 方法
  findAll(options?: QueryOptions): Promise<InquiryWithItems[]>
  findById(id: string): Promise<InquiryWithItems | null>
  create(data: CreateInquiryRequest): Promise<InquiryWithItems>
  update(id: string, data: UpdateInquiryRequest): Promise<InquiryWithItems>
  delete(id: string): Promise<void>

  // 分頁方法
  findAllPaginated(options?: PaginatedQueryOptions): Promise<any>

  // 使用者端方法
  createInquiry(userId: string, data: CreateInquiryRequest): Promise<InquiryWithItems>
  getUserInquiries(userId: string, params?: InquiryQueryParams): Promise<InquiryWithItems[]>
  getInquiryById(userId: string, inquiryId: string): Promise<InquiryWithItems | null>
  updateInquiry(
    userId: string,
    inquiryId: string,
    data: UpdateInquiryRequest
  ): Promise<InquiryWithItems>

  // 管理員端方法
  getAllInquiries(params?: InquiryQueryParams): Promise<InquiryWithItems[]>
  getInquiryByIdForAdmin(inquiryId: string): Promise<InquiryWithItems | null>
  updateInquiryStatus(inquiryId: string, status: InquiryStatus): Promise<InquiryWithItems>
  getInquiryStats(): Promise<InquiryStats[]>
  updateInquiryItems(inquiryId: string, items: InquiryItem[]): Promise<void>

  // 搜尋方法
  search(query: string, options?: QueryOptions): Promise<InquiryWithItems[]>
  searchInquiries(query: string, options?: QueryOptions): Promise<InquiryWithItems[]>

  // 健康檢查
  getHealthStatus?(): Promise<any>
}

/**
 * 詢問服務 v2 實作
 * 使用統一服務架構的現代化實作
 */
export class InquiryServiceV2
  extends AbstractSupabaseService<InquiryWithItems, CreateInquiryRequest, UpdateInquiryRequest>
  implements ExtendedInquiryService
{
  protected readonly transformer: InquiryTransformer

  constructor() {
    const config: SupabaseServiceConfig = {
      tableName: 'inquiries',
      useAdminClient: true,
      enableCache: true,
      cacheTTL: 300, // 5分鐘
      enableAuditLog: true,
      defaultPageSize: 20,
      maxPageSize: 100,
      defaultIncludes: ['inquiry_items'],
    }

    const transformer = new InquiryTransformer()
    super(config, transformer)
    this.transformer = transformer
  }

  /**
   * 覆寫查詢以包含關聯資料
   */
  protected createQuery(useAdmin: boolean = false): any {
    const query = super.createQuery(useAdmin)
    return query.select(`
      *,
      inquiry_items (*)
    `)
  }

  /**
   * 使用者建立詢問單
   */
  async createInquiry(userId: string, data: CreateInquiryRequest): Promise<InquiryWithItems> {
    try {
      // 驗證輸入資料
      this.validateCreateInquiryRequest(data)

      // 計算預估總金額
      const totalEstimatedAmount = this.calculateTotalAmount(data)

      // 準備主記錄資料
      const inquiryData: Partial<InquiryWithItems> = {
        user_id: userId,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        inquiry_type: data.inquiry_type,
        notes: data.notes,
        delivery_address: data.delivery_address,
        preferred_delivery_date: data.preferred_delivery_date,
        activity_title: data.activity_title,
        visit_date: data.visit_date,
        visitor_count: data.visitor_count,
        total_estimated_amount: totalEstimatedAmount,
        status: 'pending',
        is_read: false,
        is_replied: false,
      }

      // 建立詢問單主記錄
      const inquiry = await this.create(inquiryData as CreateInquiryRequest)

      // 建立詢問項目（僅產品詢價）
      if (data.inquiry_type === 'product' && data.items && data.items.length > 0) {
        await this.createInquiryItems(inquiry.id, data.items)

        // 重新載入包含項目的完整資料
        const fullInquiry = await this.findById(inquiry.id)
        if (!fullInquiry) {
          throw new NotFoundError('創建後無法找到詢問單')
        }
        return fullInquiry
      }

      dbLogger.info('詢問單建立成功', {
        module: this.metadata.name,
        action: 'createInquiry',
        metadata: {
          userId,
          inquiryId: inquiry.id,
          inquiryType: data.inquiry_type,
        },
      })

      return inquiry
    } catch (error) {
      this.handleError(error, 'createInquiry', { userId, data })
    }
  }

  /**
   * 取得使用者的詢問單列表
   */
  async getUserInquiries(userId: string, params?: InquiryQueryParams): Promise<InquiryWithItems[]> {
    try {
      const queryOptions: QueryOptions = this.buildQueryOptionsFromParams(params)
      queryOptions.filters = { ...queryOptions.filters, user_id: userId }

      const inquiries = await this.findAll(queryOptions)

      dbLogger.info('取得使用者詢問單列表成功', {
        module: this.metadata.name,
        action: 'getUserInquiries',
        metadata: { userId, count: inquiries.length },
      })

      return inquiries
    } catch (error) {
      this.handleError(error, 'getUserInquiries', { userId, params })
    }
  }

  /**
   * 根據 ID 取得使用者的詢問單
   */
  async getInquiryById(userId: string, inquiryId: string): Promise<InquiryWithItems | null> {
    try {
      const inquiry = await this.findById(inquiryId)

      // 檢查所有權
      if (inquiry && inquiry.user_id !== userId) {
        return null // 不直接拋錯，而是返回 null 以保持 API 一致性
      }

      return inquiry
    } catch (error) {
      this.handleError(error, 'getInquiryById', { userId, inquiryId })
    }
  }

  /**
   * 更新使用者的詢問單
   */
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

      const updated = await this.update(inquiryId, data)

      dbLogger.info('詢問單更新成功', {
        module: this.metadata.name,
        action: 'updateInquiry',
        metadata: { userId, inquiryId },
      })

      return updated
    } catch (error) {
      this.handleError(error, 'updateInquiry', { userId, inquiryId, data })
    }
  }

  /**
   * 管理員取得所有詢問單
   */
  async getAllInquiries(params?: InquiryQueryParams): Promise<InquiryWithItems[]> {
    try {
      const queryOptions: QueryOptions = this.buildQueryOptionsFromParams(params)
      return await this.findAll(queryOptions)
    } catch (error) {
      this.handleError(error, 'getAllInquiries', { params })
    }
  }

  /**
   * 管理員根據 ID 取得詢問單
   */
  async getInquiryByIdForAdmin(inquiryId: string): Promise<InquiryWithItems | null> {
    try {
      return await this.findById(inquiryId)
    } catch (error) {
      this.handleError(error, 'getInquiryByIdForAdmin', { inquiryId })
    }
  }

  /**
   * 更新詢問單狀態
   */
  async updateInquiryStatus(inquiryId: string, status: InquiryStatus): Promise<InquiryWithItems> {
    try {
      const updateData: UpdateInquiryRequest = { status }

      // 如果狀態變更為已讀或已回覆，更新相關時間戳
      if (status === 'quoted') {
        ;(updateData as any).is_replied = true
        ;(updateData as any).replied_at = new Date().toISOString()
      }

      return await this.update(inquiryId, updateData)
    } catch (error) {
      this.handleError(error, 'updateInquiryStatus', { inquiryId, status })
    }
  }

  /**
   * 取得詢問單統計
   */
  async getInquiryStats(): Promise<InquiryStats[]> {
    try {
      const client = this.getClient(true)
      const { data, error } = await client.from('inquiry_stats').select('*')

      if (error) {
        throw ErrorFactory.fromSupabaseError(error)
      }

      return data as InquiryStats[]
    } catch (error) {
      this.handleError(error, 'getInquiryStats')
    }
  }

  /**
   * 更新詢問項目
   */
  async updateInquiryItems(inquiryId: string, items: InquiryItem[]): Promise<void> {
    try {
      const client = this.getClient(true)

      // 刪除現有項目
      const { error: deleteError } = await client
        .from('inquiry_items')
        .delete()
        .eq('inquiry_id', inquiryId)

      if (deleteError) {
        throw ErrorFactory.fromSupabaseError(deleteError)
      }

      // 建立新項目
      if (items.length > 0) {
        const itemsData = items.map(item => ({
          ...item,
          inquiry_id: inquiryId,
        }))

        const { error: insertError } = await client.from('inquiry_items').insert(itemsData)

        if (insertError) {
          throw ErrorFactory.fromSupabaseError(insertError)
        }
      }

      dbLogger.info('詢問項目更新成功', {
        module: this.metadata.name,
        action: 'updateInquiryItems',
        metadata: { inquiryId, itemCount: items.length },
      })
    } catch (error) {
      this.handleError(error, 'updateInquiryItems', { inquiryId, items })
    }
  }

  /**
   * 實作 SearchableService.search
   */
  async search(query: string, options?: QueryOptions): Promise<InquiryWithItems[]> {
    return this.searchInquiries(query, options)
  }

  /**
   * 搜尋詢問單
   */
  async searchInquiries(query: string, options?: QueryOptions): Promise<InquiryWithItems[]> {
    try {
      let dbQuery = this.createQuery(true)

      // 實作全文搜尋邏輯
      dbQuery = dbQuery.or(
        `customer_name.ilike.%${query}%,customer_email.ilike.%${query}%,notes.ilike.%${query}%`
      )

      // 套用其他查詢選項
      dbQuery = this.applyQueryOptions(dbQuery, options)

      const { data, error } = await dbQuery

      if (error) {
        this.handleError(error, 'searchInquiries', { query, options })
      }

      return (data || []).map((record: Record<string, unknown>) => this.transformFromDB(record))
    } catch (error) {
      this.handleError(error, 'searchInquiries', { query, options })
    }
  }

  // === 私有輔助方法 ===

  /**
   * 驗證建立詢問單的請求資料
   */
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

  /**
   * 計算詢問單總金額
   */
  private calculateTotalAmount(data: CreateInquiryRequest): number | undefined {
    if (data.inquiry_type !== 'product' || !data.items) {
      return undefined
    }

    const total = data.items.reduce((sum, item) => {
      return sum + (item.unit_price || 0) * item.quantity
    }, 0)

    return total > 0 ? total : undefined
  }

  /**
   * 建立詢問項目
   */
  private async createInquiryItems(
    inquiryId: string,
    items: CreateInquiryItemRequest[]
  ): Promise<void> {
    const client = this.getClient(true)

    const itemsData = items.map(item => ({
      inquiry_id: inquiryId,
      product_id: item.product_id,
      product_name: item.product_name,
      product_category: item.product_category,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price ? item.unit_price * item.quantity : null,
      notes: item.notes,
    }))

    const { error } = await client.from('inquiry_items').insert(itemsData)

    if (error) {
      throw ErrorFactory.fromSupabaseError(error)
    }
  }

  /**
   * 從查詢參數建立查詢選項
   */
  private buildQueryOptionsFromParams(params?: InquiryQueryParams): QueryOptions {
    if (!params) return {}

    const filters: Record<string, any> = {}

    if (params.status) filters.status = params.status
    if (params.inquiry_type) filters.inquiry_type = params.inquiry_type
    if (params.is_read !== undefined) filters.is_read = params.is_read
    if (params.is_replied !== undefined) filters.is_replied = params.is_replied

    // 處理特殊篩選邏輯
    if (params.unread_only) filters.is_read = false
    if (params.unreplied_only) filters.is_replied = false

    return {
      filters,
      sortBy: params.sort_by || 'created_at',
      sortOrder: params.sort_order || 'desc',
    }
  }
}

// 建立並匯出服務實例
export const inquiryServiceV2 = new InquiryServiceV2()

// 匯出類型以供其他模組使用
export type { InquiryTransformer }
