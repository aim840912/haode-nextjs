/**
 * 詢價範本服務
 * 負責範本的 CRUD 操作和使用範本邏輯
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { ErrorFactory, NotFoundError, ValidationError } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import {
  InquiryTemplate,
  CreateInquiryTemplateRequest,
  UpdateInquiryTemplateRequest,
  InquiryTemplateQueryParams,
  InquiryFormDataFromTemplate,
  InquiryTemplateStats,
  InquiryTemplateItem,
} from '@/types/inquiry-template'
import { ServiceSupabaseClient, ServiceErrorContext, UpdateDataObject } from '@/types/service.types'
import { Database } from '@/types/database'

const getAdmin = () => getSupabaseAdmin()

/**
 * 資料庫記錄類型 (從 Database schema 自動推導)
 */
type SupabaseTemplateRecord = Database['public']['Tables']['inquiry_templates']['Row']

/**
 * 詢價範本服務
 */
export class InquiryTemplateService {
  private readonly moduleName = 'InquiryTemplateService'

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
    dbLogger.error(`詢價範本服務 ${operation} 操作失敗`, error as Error, {
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
   * 轉換資料庫記錄為實體
   */
  private transformFromDB(record: SupabaseTemplateRecord): InquiryTemplate {
    return {
      id: record.id,
      user_id: record.user_id,
      name: record.name,
      description: record.description || undefined,
      inquiry_type: record.inquiry_type as 'product' | 'farm_tour',
      customer_name: record.customer_name || undefined,
      customer_email: record.customer_email || undefined,
      customer_phone: record.customer_phone || undefined,
      delivery_address: record.delivery_address || undefined,
      preferred_delivery_date_pattern: record.preferred_delivery_date_pattern as any,
      notes: record.notes || undefined,
      items: Array.isArray(record.items) ? (record.items as unknown as InquiryTemplateItem[]) : [],
      activity_title: record.activity_title || undefined,
      visit_date_pattern: record.visit_date_pattern as any,
      visitor_count: record.visitor_count || undefined,
      is_active: record.is_active,
      is_favorite: record.is_favorite,
      usage_count: record.usage_count,
      last_used_at: record.last_used_at || undefined,
      created_at: record.created_at,
      updated_at: record.updated_at,
    }
  }

  /**
   * 建構查詢條件
   */
  private buildQueryConditions(
    userId: string,
    params: InquiryTemplateQueryParams = {}
  ): { query: any; limit: number; offset: number } {
    const client = this.getSupabaseClient()
    let query = client.from('inquiry_templates').select('*').eq('user_id', userId)

    // 篩選條件
    if (params.inquiry_type) {
      query = query.eq('inquiry_type', params.inquiry_type)
    }
    if (params.is_active !== undefined) {
      query = query.eq('is_active', params.is_active)
    }
    if (params.is_favorite !== undefined) {
      query = query.eq('is_favorite', params.is_favorite)
    }

    // 排序
    const sortBy = params.sort_by || 'created_at'
    const sortOrder = params.sort_order || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // 分頁
    const limit = params.limit || 20
    const offset = params.offset || 0

    return { query, limit, offset }
  }

  // === 公開方法 ===

  /**
   * 列出使用者的範本
   */
  async listTemplates(
    userId: string,
    params?: InquiryTemplateQueryParams
  ): Promise<InquiryTemplate[]> {
    try {
      const { query, limit, offset } = this.buildQueryConditions(userId, params)

      const { data, error } = await query.range(offset, offset + limit - 1)

      if (error) {
        this.handleError(error, 'listTemplates', { userId, params })
      }

      const templates = (data || []).map((record: SupabaseTemplateRecord) =>
        this.transformFromDB(record)
      )

      dbLogger.info('範本列表查詢成功', {
        module: this.moduleName,
        action: 'listTemplates',
        metadata: {
          userId,
          count: templates.length,
          params,
        },
      })

      return templates
    } catch (error) {
      this.handleError(error, 'listTemplates', { userId, params })
    }
  }

  /**
   * 取得單一範本
   */
  async getTemplate(templateId: string, userId: string): Promise<InquiryTemplate | null> {
    try {
      const client = this.getSupabaseClient()

      const { data, error } = await client
        .from('inquiry_templates')
        .select('*')
        .eq('id', templateId)
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 沒有找到記錄
          return null
        }
        this.handleError(error, 'getTemplate', { templateId, userId })
      }

      const template = this.transformFromDB(data)

      dbLogger.info('範本查詢成功', {
        module: this.moduleName,
        action: 'getTemplate',
        metadata: { templateId, userId },
      })

      return template
    } catch (error) {
      this.handleError(error, 'getTemplate', { templateId, userId })
    }
  }

  /**
   * 建立範本
   */
  async createTemplate(
    userId: string,
    data: CreateInquiryTemplateRequest
  ): Promise<InquiryTemplate> {
    try {
      // 驗證必填欄位
      if (!data.name?.trim()) {
        throw new ValidationError('範本名稱不能為空')
      }

      if (!data.inquiry_type) {
        throw new ValidationError('詢價類型不能為空')
      }

      const client = this.getSupabaseClient()

      // 準備資料（移除 undefined 欄位）
      const templateData = {
        user_id: userId,
        name: data.name,
        description: data.description || null,
        inquiry_type: data.inquiry_type,
        customer_name: data.customer_name || null,
        customer_email: data.customer_email || null,
        customer_phone: data.customer_phone || null,
        delivery_address: data.delivery_address || null,
        preferred_delivery_date_pattern: data.preferred_delivery_date_pattern || null,
        notes: data.notes || null,
        items: data.items || [],
        activity_title: data.activity_title || null,
        visit_date_pattern: data.visit_date_pattern || null,
        visitor_count: data.visitor_count || null,
        is_active: true,
        is_favorite: false,
        usage_count: 0,
      }

      const { data: created, error } = await client
        .from('inquiry_templates')
        .insert([templateData])
        .select()
        .single()

      if (error) {
        this.handleError(error, 'createTemplate', { userId, data })
      }

      const template = this.transformFromDB(created)

      dbLogger.info('範本建立成功', {
        module: this.moduleName,
        action: 'createTemplate',
        metadata: {
          userId,
          templateId: template.id,
          name: template.name,
        },
      })

      return template
    } catch (error) {
      this.handleError(error, 'createTemplate', { userId, data })
    }
  }

  /**
   * 更新範本
   */
  async updateTemplate(
    templateId: string,
    userId: string,
    data: UpdateInquiryTemplateRequest
  ): Promise<InquiryTemplate> {
    try {
      // 檢查所有權
      const existing = await this.getTemplate(templateId, userId)
      if (!existing) {
        throw new NotFoundError('範本不存在或無權限修改')
      }

      const client = this.getSupabaseClient()

      // 準備更新資料（僅包含提供的欄位）
      const updateData: UpdateDataObject = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description || null
      if (data.customer_name !== undefined) updateData.customer_name = data.customer_name || null
      if (data.customer_email !== undefined) updateData.customer_email = data.customer_email || null
      if (data.customer_phone !== undefined) updateData.customer_phone = data.customer_phone || null
      if (data.delivery_address !== undefined)
        updateData.delivery_address = data.delivery_address || null
      if (data.preferred_delivery_date_pattern !== undefined) {
        updateData.preferred_delivery_date_pattern = data.preferred_delivery_date_pattern || null
      }
      if (data.notes !== undefined) updateData.notes = data.notes || null
      if (data.items !== undefined) updateData.items = data.items || []
      if (data.activity_title !== undefined) updateData.activity_title = data.activity_title || null
      if (data.visit_date_pattern !== undefined)
        updateData.visit_date_pattern = data.visit_date_pattern || null
      if (data.visitor_count !== undefined) updateData.visitor_count = data.visitor_count || null
      if (data.is_active !== undefined) updateData.is_active = data.is_active
      if (data.is_favorite !== undefined) updateData.is_favorite = data.is_favorite

      const { data: updated, error } = await client
        .from('inquiry_templates')
        .update(updateData)
        .eq('id', templateId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'updateTemplate', { templateId, userId, data })
      }

      const template = this.transformFromDB(updated)

      dbLogger.info('範本更新成功', {
        module: this.moduleName,
        action: 'updateTemplate',
        metadata: { templateId, userId },
      })

      return template
    } catch (error) {
      this.handleError(error, 'updateTemplate', { templateId, userId, data })
    }
  }

  /**
   * 刪除範本
   */
  async deleteTemplate(templateId: string, userId: string): Promise<void> {
    try {
      // 檢查所有權
      const existing = await this.getTemplate(templateId, userId)
      if (!existing) {
        throw new NotFoundError('範本不存在或無權限刪除')
      }

      const client = this.getSupabaseClient()

      const { error } = await client
        .from('inquiry_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', userId)

      if (error) {
        this.handleError(error, 'deleteTemplate', { templateId, userId })
      }

      dbLogger.info('範本刪除成功', {
        module: this.moduleName,
        action: 'deleteTemplate',
        metadata: { templateId, userId },
      })
    } catch (error) {
      this.handleError(error, 'deleteTemplate', { templateId, userId })
    }
  }

  /**
   * 使用範本（轉換為表單資料並增加使用次數）
   */
  async useTemplate(templateId: string, userId: string): Promise<InquiryFormDataFromTemplate> {
    try {
      // 取得範本
      const template = await this.getTemplate(templateId, userId)
      if (!template) {
        throw new NotFoundError('範本不存在或無權限使用')
      }

      // 增加使用次數
      const client = this.getSupabaseClient()
      await client
        .from('inquiry_templates')
        .update({
          usage_count: template.usage_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', templateId)
        .eq('user_id', userId)

      // 轉換為表單資料
      const formData: InquiryFormDataFromTemplate = {
        customer_name: template.customer_name || '',
        customer_email: template.customer_email || '',
        customer_phone: template.customer_phone || '',
        inquiry_type: template.inquiry_type,
        notes: template.notes || '',
        delivery_address: template.delivery_address || '',
        preferred_delivery_date: '', // 日期需要使用者手動填入
        items: template.items || [],
      }

      // 農場參觀相關欄位
      if (template.inquiry_type === 'farm_tour') {
        formData.activity_title = template.activity_title
        formData.visit_date = '' // 日期需要使用者手動填入
        formData.visitor_count = template.visitor_count
      }

      dbLogger.info('範本使用成功', {
        module: this.moduleName,
        action: 'useTemplate',
        metadata: {
          templateId,
          userId,
          usageCount: template.usage_count + 1,
        },
      })

      return formData
    } catch (error) {
      this.handleError(error, 'useTemplate', { templateId, userId })
    }
  }

  /**
   * 取得使用者的範本統計資料
   */
  async getTemplateStats(userId: string): Promise<InquiryTemplateStats | null> {
    try {
      const client = this.getSupabaseClient()

      const { data, error } = await client
        .from('inquiry_templates_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 沒有找到記錄（使用者沒有任何範本）
          return null
        }
        this.handleError(error, 'getTemplateStats', { userId })
      }

      dbLogger.info('範本統計查詢成功', {
        module: this.moduleName,
        action: 'getTemplateStats',
        metadata: { userId },
      })

      return data
    } catch (error) {
      this.handleError(error, 'getTemplateStats', { userId })
    }
  }
}

// 建立並匯出服務實例
export const inquiryTemplateService = new InquiryTemplateService()
