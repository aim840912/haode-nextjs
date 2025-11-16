/**
 * 統一詢問單服務
 * 整合查詢和命令操作
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { ErrorFactory, NotFoundError, DatabaseError } from '@/lib/errors'
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
import { ServiceSupabaseClient, ServiceErrorContext, UpdateDataObject } from '@/types/service.types'
import { InquiryInventoryService } from './InquiryInventoryService'
import { validateCreateInquiryRequest, calculateTotalAmount } from './inquiry-validation'
import { transformFromDB, serializeFarmTourData, applyQueryParams } from './inquiry-helpers'
import { SupabaseInquiryRecord } from './types'

const getAdmin = () => getSupabaseAdmin()

/**
 * 統一詢問單服務
 */
export class InquiryService {
  private readonly moduleName = 'InquiryService'

  /**
   * 取得 Supabase 客戶端
   */
  private getSupabaseClient(): ServiceSupabaseClient {
    const client = getAdmin()
    if (!client) {
      throw new DatabaseError('Supabase admin client not initialized')
    }
    return client
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

  // =================================================================
  // 查詢方法（Query Operations）
  // =================================================================

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

  // =================================================================
  // 命令方法（Command Operations）
  // =================================================================

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

  /**
   * 更新詢問單
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

  /**
   * 更新詢問單狀態
   */
  async updateInquiryStatus(inquiryId: string, status: InquiryStatus): Promise<InquiryWithItems> {
    try {
      const client = this.getSupabaseClient()

      // 建立 InventoryService
      const inventoryService = new InquiryInventoryService()

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
        // confirmed: 保留庫存
        if (status === 'confirmed' && previousStatus !== 'confirmed') {
          await inventoryService.reserveInventory(inquiryId, inquiry.inquiry_items)
          dbLogger.info('詢問單確認，已保留庫存', {
            module: this.moduleName,
            metadata: { inquiryId, itemsCount: inquiry.inquiry_items.length },
          })
        }

        // completed: 完成保留（實際扣減）
        if (status === 'completed' && previousStatus === 'confirmed') {
          await inventoryService.finalizeInventory(inquiry.inquiry_items)
          dbLogger.info('詢問單完成，已扣減庫存', {
            module: this.moduleName,
            metadata: { inquiryId, itemsCount: inquiry.inquiry_items.length },
          })
        }

        // cancelled: 釋放保留（如果之前已確認）
        if (status === 'cancelled' && previousStatus === 'confirmed') {
          await inventoryService.releaseInventory(inquiry.inquiry_items)
          dbLogger.info('詢問單取消，已釋放保留庫存', {
            module: this.moduleName,
            metadata: { inquiryId, itemsCount: inquiry.inquiry_items.length },
          })
        }
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

      dbLogger.info('詢問單刪除成功', {
        module: this.moduleName,
        action: 'deleteInquiry',
        metadata: { inquiryId },
      })
    } catch (error) {
      this.handleError(error, 'deleteInquiry', { inquiryId })
    }
  }
}

// 建立並匯出服務實例
export const inquiryService = new InquiryService()
