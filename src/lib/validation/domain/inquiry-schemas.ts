/**
 * 詢問單驗證 Schema
 * 用於詢問單的建立、更新、查詢驗證
 */

import { z } from 'zod'
import { DateSchemas } from '../base/date-schemas'
import { NumberSchemas } from '../base/number-schemas'
import { StringSchemas } from '../base/string-schemas'

/**
 * 詢問項目 Schema
 */
const InquiryItemSchema = z.object({
  product_id: StringSchemas.uuid,
  product_name: StringSchemas.nonEmpty.max(100, '產品名稱不能超過 100 字元'),
  product_category: z.string().max(50, '產品分類不能超過 50 字元').optional(),
  quantity: NumberSchemas.positiveInt.max(10000, '數量不能超過 10000'),
  unit_price: NumberSchemas.price.optional(),
  notes: z.string().max(200, '備註不能超過 200 字元').optional(),
})

/**
 * 詢問單相關 Schema（重新設計以符合實際業務需求）
 */
export const InquirySchemas = {
  /** 創建詢問單 */
  create: z
    .object({
      customer_name: StringSchemas.nonEmpty.max(50, '客戶姓名不能超過 50 字元'),
      customer_email: StringSchemas.email,
      customer_phone: z.union([StringSchemas.phone, StringSchemas.mobile]).optional(),
      inquiry_type: z.enum(['product', 'farm_tour'], '詢問類型必須是 product 或 farm_tour'),
      notes: z.string().max(1000, '備註不能超過 1000 字元').optional(),
      delivery_address: z.string().max(200, '配送地址不能超過 200 字元').optional(),
      preferred_delivery_date: DateSchemas.dateString.optional(),
      // 產品詢價相關欄位
      items: z
        .array(InquiryItemSchema)
        .min(1, '產品詢價至少需要一個項目')
        .max(20, '最多只能詢價 20 個產品')
        .optional(),
      // 農場參觀相關欄位
      activity_title: StringSchemas.nonEmpty.max(100, '活動標題不能超過 100 字元').optional(),
      visit_date: DateSchemas.dateString.optional(),
      visitor_count: z.string().max(10, '參觀人數不能超過 10 字元').optional(),
    })
    .refine(
      data => {
        // 根據詢問類型驗證必填欄位
        if (data.inquiry_type === 'product') {
          return data.items && data.items.length > 0
        } else if (data.inquiry_type === 'farm_tour') {
          return data.activity_title && data.visit_date && data.visitor_count
        }
        return true
      },
      {
        message: '產品詢價需要提供項目清單，農場參觀需要提供活動標題、參觀日期和人數',
        path: ['inquiry_type'],
      }
    ),

  /** 更新詢問單 */
  update: z.object({
    customer_name: StringSchemas.nonEmpty.max(50, '客戶姓名不能超過 50 字元').optional(),
    customer_email: StringSchemas.email.optional(),
    customer_phone: z.union([StringSchemas.phone, StringSchemas.mobile]).optional(),
    status: z.enum(['pending', 'quoted', 'confirmed', 'completed', 'cancelled']).optional(),
    notes: z.string().max(1000, '備註不能超過 1000 字元').optional(),
    total_estimated_amount: NumberSchemas.price.optional(),
    delivery_address: z.string().max(200, '配送地址不能超過 200 字元').optional(),
    preferred_delivery_date: DateSchemas.dateString.optional(),
    is_read: z.boolean().optional(),
    is_replied: z.boolean().optional(),
  }),

  /** 快速狀態更新 (PATCH) */
  statusUpdate: z
    .object({
      is_read: z.boolean().optional(),
      is_replied: z.boolean().optional(),
      status: z.enum(['pending', 'quoted', 'confirmed', 'completed', 'cancelled']).optional(),
    })
    .refine(
      data => {
        // 至少要有一個欄位
        return (
          data.is_read !== undefined || data.is_replied !== undefined || data.status !== undefined
        )
      },
      {
        message: '至少需要提供一個要更新的欄位',
        path: [],
      }
    ),

  /** 詢問單查詢參數 */
  query: z.object({
    status: z.enum(['pending', 'quoted', 'confirmed', 'completed', 'cancelled']).optional(),
    inquiry_type: z.enum(['product', 'farm_tour']).optional(),
    customer_email: StringSchemas.email.optional(),
    start_date: DateSchemas.dateString.optional(),
    end_date: DateSchemas.dateString.optional(),
    is_read: z.coerce.boolean().optional(),
    is_replied: z.coerce.boolean().optional(),
    unread_only: z.coerce.boolean().optional(),
    unreplied_only: z.coerce.boolean().optional(),
    admin: z.coerce.boolean().optional(), // 管理員查看模式
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().max(100, '搜尋關鍵字不能超過 100 字元').optional(),
    sort_by: z.enum(['created_at', 'updated_at', 'total_estimated_amount']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
  }),
}

/**
 * 詢問單統計相關 Schema
 */
export const InquiryStatsSchemas = {
  /** 統計查詢參數 */
  query: z.object({
    timeframe: z.coerce.number().int().min(1).max(365).default(30), // 天數
  }),
}
