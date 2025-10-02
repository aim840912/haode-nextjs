/**
 * 基礎驗證 Schema 和通用工具
 *
 * 提供統一的基礎驗證規則和工具函數
 */

import { z } from 'zod'

// ============================================================================
// 基礎驗證 Schema
// ============================================================================

/**
 * 常用的字串驗證
 */
export const StringSchemas = {
  /** 非空字串 */
  nonEmpty: z.string().min(1, '此欄位不能為空'),

  /** Email 驗證 */
  email: z.string().email('請輸入有效的電子郵件地址'),

  /** 電話號碼驗證（台灣） */
  phone: z
    .string()
    .regex(
      /^(0[2-9][\d\-]{6,15}|09[\d\-]{8,10})$/,
      '請輸入有效的台灣電話號碼格式（如：02-12345678 或 0912-345678）'
    ),

  /** 手機號碼驗證（台灣） */
  mobile: z.string().regex(/^(\+886|886|0)?9\d{8}$/, '請輸入有效的台灣手機號碼'),

  /** URL 驗證 */
  url: z.string().url('請輸入有效的網址'),

  /** UUID 驗證 */
  uuid: z.string().uuid('請輸入有效的 UUID'),

  /** 價格字串（可包含小數點） */
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, '請輸入有效的價格格式'),

  /** HTML 標籤清理 */
  sanitized: z.string().transform(str => {
    // 簡單的 HTML 標籤移除（生產環境建議使用 DOMPurify）
    return str.replace(/<[^>]*>/g, '').trim()
  }),
}

/**
 * 數字驗證
 */
export const NumberSchemas = {
  /** 正整數 */
  positiveInt: z.number().int().positive('必須是正整數'),

  /** 非負整數 */
  nonNegativeInt: z.number().int().min(0, '必須是非負整數'),

  /** 價格（最多兩位小數） */
  price: z.number().min(0, '價格不能為負數').multipleOf(0.01),

  /** 百分比 */
  percentage: z.number().min(0, '百分比不能小於 0').max(100, '百分比不能大於 100'),

  /** 庫存數量 */
  stock: z.number().int().min(0, '庫存不能為負數'),

  /** 評分 */
  rating: z.number().min(1, '評分不能小於 1').max(5, '評分不能大於 5'),
}

/**
 * 日期驗證
 */
export const DateSchemas = {
  /** ISO 日期字串 */
  isoDate: z.string().datetime('請輸入有效的日期時間格式'),

  /** 日期字串 YYYY-MM-DD */
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入有效的日期格式 (YYYY-MM-DD)'),

  /** 未來日期 */
  futureDate: z
    .string()
    .datetime()
    .refine(date => new Date(date) > new Date(), '日期必須是未來時間'),

  /** 過去日期 */
  pastDate: z
    .string()
    .datetime()
    .refine(date => new Date(date) < new Date(), '日期必須是過去時間'),
}

// ============================================================================
// 分頁和排序相關 Schema
// ============================================================================

/**
 * 通用分頁參數 Schema
 */
export const PaginationSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    page: z.coerce.number().int().min(1).optional(),
    per_page: z.coerce.number().int().min(1).max(100).optional(),
  })
  .transform(data => {
    // 如果有 page 和 per_page，轉換為 limit 和 offset
    if (data.page && data.per_page) {
      return {
        limit: data.per_page,
        offset: (data.page - 1) * data.per_page,
      }
    }
    return {
      limit: data.limit,
      offset: data.offset,
    }
  })

/**
 * 通用排序參數 Schema
 */
export const SortingSchema = z
  .object({
    sort_by: z.string().optional(),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
    order_by: z.string().optional(), // 別名支援
  })
  .transform(data => ({
    sort_by: data.sort_by || data.order_by,
    sort_order: data.sort_order,
  }))

// ============================================================================
// 組合 Schema（常用組合）
// ============================================================================

/**
 * 帶分頁的查詢 Schema
 * 簡化版本，避免複雜的 TypeScript 類型推斷問題
 */
export function createPaginatedQuerySchema(baseSchema: z.ZodObject<z.ZodRawShape>) {
  return baseSchema.merge(
    z.object({
      limit: z.coerce.number().int().min(1).max(100).default(20),
      offset: z.coerce.number().int().min(0).default(0),
      sort_by: z.string().optional(),
      sort_order: z.enum(['asc', 'desc']).default('desc'),
    })
  )
}

/**
 * API 回應驗證 Schema
 */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  details: z.unknown().optional(),
  pagination: z
    .object({
      total: NumberSchemas.nonNegativeInt,
      page: NumberSchemas.positiveInt,
      per_page: NumberSchemas.positiveInt,
      total_pages: NumberSchemas.positiveInt,
    })
    .optional(),
})

// ============================================================================
// 工具函數
// ============================================================================

/**
 * 驗證函數：安全地驗證資料並返回結果
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('; ')
      return { success: false, error: errorMessage }
    }
    return { success: false, error: '資料驗證失敗' }
  }
}

/**
 * 中間件用的驗證函數：從 Request 物件驗證 JSON 資料
 */
export async function validateRequestData<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json()
    return validateData(schema, body)
  } catch {
    return { success: false, error: '無效的 JSON 格式' }
  }
}

/**
 * 驗證查詢參數
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const params: Record<string, string> = {}
    for (const [key, value] of searchParams.entries()) {
      params[key] = value
    }
    return validateData(schema, params)
  } catch {
    return { success: false, error: '查詢參數格式錯誤' }
  }
}

/**
 * 清理和驗證 HTML 內容（基礎版本）
 */
export function sanitizeHtml(html: string): string {
  // 移除所有 HTML 標籤和潛在的危險字符
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除 script 標籤
    .replace(/<[^>]*>/g, '') // 移除所有 HTML 標籤
    .replace(/javascript:/gi, '') // 移除 javascript: 協議
    .replace(/on\w+\s*=/gi, '') // 移除事件處理器
    .trim()
}
