/**
 * 統一詢問單服務
 * 整合查詢和命令操作
 *
 * 重構後:
 * - 移除 CQRS 分層，改用單一 Service
 * - 整合 InquiryServiceBase 基礎設施方法
 * - 使用註解區分查詢和命令方法
 * - 符合專案統一服務模式（參考 OrderService）
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { ErrorFactory, DatabaseError, NotFoundError } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import {
  InquiryWithItems,
  CreateInquiryRequest,
  UpdateInquiryRequest,
  InquiryQueryParams,
  InquiryStats,
  InquiryStatus,
  InquiryItem,
} from '@/types/inquiry'
import { ServiceSupabaseClient, UpdateDataObject } from '@/types/service.types'
import { withServiceOperation } from '../utils/ServiceDecorators'
import { transformFromDB, serializeFarmTourData, applyQueryParams } from './inquiry-helpers'
import { validateCreateInquiryRequest, calculateTotalAmount } from './inquiry-validation'
import { handleInventoryForStatusChange } from './shared/inquiry-inventory-integration'
import { SupabaseInquiryRecord } from './types'

/**
 * 統一詢問單服務
 */
export class InquiryService {
  protected readonly moduleName = 'InquiryService'

  // =================================================================
  // 基礎設施方法（從 InquiryServiceBase 遷移）
  // =================================================================

  /**
   * 取得 Supabase 客戶端
   */
  protected getSupabaseClient(): ServiceSupabaseClient {
    const client = getSupabaseAdmin()
    if (!client) {
      throw new DatabaseError('Supabase admin client not initialized')
    }
    return client
  }

  // =================================================================
  // 查詢方法（從 InquiryQueryService 遷移）
  // =================================================================

  /**
   * 取得使用者的詢問單列表
   */
  async getUserInquiries(userId: string, params?: InquiryQueryParams): Promise<InquiryWithItems[]> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '取得使用者詢問單列表',
        context: { userId, params },
      },
      async () => {
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

        if (error) throw ErrorFactory.fromSupabaseError(error)

        return (data || []).map(record =>
          transformFromDB(record as unknown as SupabaseInquiryRecord)
        )
      }
    )
  }

  /**
   * 取得使用者的特定詢問單
   */
  async getInquiryById(userId: string, inquiryId: string): Promise<InquiryWithItems | null> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '取得使用者的特定詢問單',
        context: { userId, inquiryId },
      },
      async () => {
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
          if (error.code === 'PGRST116') return null
          throw ErrorFactory.fromSupabaseError(error)
        }

        return data ? transformFromDB(data as unknown as SupabaseInquiryRecord) : null
      }
    )
  }

  /**
   * 取得所有詢問單（管理員）
   */
  async getAllInquiries(params?: InquiryQueryParams): Promise<InquiryWithItems[]> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '取得所有詢問單（管理員）',
        context: { params },
      },
      async () => {
        const client = this.getSupabaseClient()
        let query = client.from('inquiries').select(`
            *,
            inquiry_items (*)
          `)

        // 應用查詢參數
        query = applyQueryParams(query, params)

        const { data, error } = await query

        if (error) throw ErrorFactory.fromSupabaseError(error)

        return (data || []).map((record: unknown) =>
          transformFromDB(record as SupabaseInquiryRecord)
        )
      }
    )
  }

  /**
   * 取得特定詢問單（管理員）
   */
  async getInquiryByIdForAdmin(inquiryId: string): Promise<InquiryWithItems | null> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '取得特定詢問單（管理員）',
        context: { inquiryId },
      },
      async () => {
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
          if (error.code === 'PGRST116') return null
          throw ErrorFactory.fromSupabaseError(error)
        }

        return data ? transformFromDB(data as unknown as SupabaseInquiryRecord) : null
      }
    )
  }

  /**
   * 取得詢問單統計資料
   */
  async getInquiryStats(): Promise<InquiryStats[]> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '取得詢問單統計資料',
      },
      async () => {
        // inquiry_stats 表不存在，返回空陣列
        dbLogger.warn('getInquiryStats - 佔位實作：inquiry_stats 表不存在', {
          module: this.moduleName,
          action: 'getInquiryStats',
        })

        return [] as InquiryStats[]
      }
    )
  }

  // =================================================================
  // 命令方法（從 InquiryCreateService/UpdateService/DeleteService 遷移）
  // =================================================================

  /**
   * 建立詢問單
   */
  async createInquiry(userId: string, data: CreateInquiryRequest): Promise<InquiryWithItems> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '建立詢問單',
        context: { userId, inquiryType: data.inquiry_type },
      },
      async () => {
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

        if (inquiryError) throw ErrorFactory.fromSupabaseError(inquiryError)

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
            throw ErrorFactory.fromSupabaseError(itemsError)
          }

          inquiryItems = (items as InquiryItem[]) || []
        }

        return transformFromDB({
          ...inquiry,
          inquiry_items: inquiryItems,
        })
      }
    )
  }

  /**
   * 更新詢問單
   */
  async updateInquiry(
    userId: string,
    inquiryId: string,
    data: UpdateInquiryRequest
  ): Promise<InquiryWithItems> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '更新詢問單',
        context: { userId, inquiryId },
      },
      async () => {
        // 檢查所有權
        const existing = await this.getInquiryById(userId, inquiryId)
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

        if (error) throw ErrorFactory.fromSupabaseError(error)

        return transformFromDB(updated as unknown as SupabaseInquiryRecord)
      }
    )
  }

  /**
   * 更新詢問單狀態
   */
  async updateInquiryStatus(inquiryId: string, status: InquiryStatus): Promise<InquiryWithItems> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '更新詢問單狀態',
        context: { inquiryId, status },
      },
      async () => {
        const client: ServiceSupabaseClient = this.getSupabaseClient()

        // 先取得詢問單資訊（含前一個狀態）
        const inquiry = await this.getInquiryByIdForAdmin(inquiryId)
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

        if (error) throw ErrorFactory.fromSupabaseError(error)

        return transformFromDB(updated as unknown as SupabaseInquiryRecord)
      }
    )
  }

  /**
   * 刪除詢問單
   */
  async deleteInquiry(inquiryId: string): Promise<void> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '刪除詢問單',
        context: { inquiryId },
      },
      async () => {
        const client = this.getSupabaseClient()
        const { error } = await client.from('inquiries').delete().eq('id', inquiryId)

        if (error) throw ErrorFactory.fromSupabaseError(error)
      }
    )
  }
}

// 建立並匯出服務實例
export const inquiryService = new InquiryService()
