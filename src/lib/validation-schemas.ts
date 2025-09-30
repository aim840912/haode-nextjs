/**
 * Zod 驗證 Schema 庫
 *
 * 提供統一的輸入驗證 schema，用於 API 路由和表單驗證
 * 包含常用的驗證規則和自定義驗證器
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
// 業務邏輯驗證 Schema
// ============================================================================

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

/**
 * 農場導覽相關 Schema
 */
export const FarmTourSchemas = {
  /** 創建農場導覽預約 */
  create: z.object({
    customer_name: StringSchemas.nonEmpty.max(50, '姓名不能超過 50 字元'),
    customer_email: StringSchemas.email,
    customer_phone: z.union([StringSchemas.phone, StringSchemas.mobile]),
    tour_date: DateSchemas.futureDate,
    tour_time: z.enum(['morning', 'afternoon']),
    group_size: NumberSchemas.positiveInt.max(20, '團體人數不能超過 20 人'),
    special_requirements: z.string().max(500, '特殊需求不能超過 500 字元').optional(),
    dietary_restrictions: z.string().max(200, '飲食限制不能超過 200 字元').optional(),
    transportation: z.enum(['self_drive', 'public_transport', 'tour_bus']).optional(),
    contact_preference: z.enum(['phone', 'email', 'both']).default('both'),
  }),

  /** 更新預約狀態 */
  updateStatus: z.object({
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
    admin_notes: z.string().max(1000, '管理員備註不能超過 1000 字元').optional(),
    confirmed_time: DateSchemas.isoDate.optional(),
  }),
}

/**
 * 產品相關 Schema
 */
export const ProductSchemas = {
  /** 創建產品 */
  create: z.object({
    name: StringSchemas.nonEmpty.max(100, '產品名稱不能超過 100 字元'),
    description: z
      .string()
      .max(2000, '產品描述不能超過 2000 字元')
      .transform(str => {
        return str.replace(/<[^>]*>/g, '').trim()
      }),
    price: NumberSchemas.price,
    stock: NumberSchemas.stock,
    category: StringSchemas.nonEmpty.max(50, '分類名稱不能超過 50 字元'),
    unit: StringSchemas.nonEmpty.max(10, '單位不能超過 10 字元'),
    weight: NumberSchemas.price.optional(),
    origin: z.string().max(50, '產地不能超過 50 字元').optional(),
    harvest_season: z.string().max(50, '採收季節不能超過 50 字元').optional(),
    storage_method: z.string().max(200, '保存方式不能超過 200 字元').optional(),
    nutritional_info: z.string().max(1000, '營養資訊不能超過 1000 字元').optional(),
    is_organic: z.boolean().default(false),
    is_featured: z.boolean().default(false),
    is_available: z.boolean().default(true),
    tags: z
      .array(z.string().max(20, '標籤長度不能超過 20 字元'))
      .max(10, '最多只能有 10 個標籤')
      .optional(),
    images: z.array(StringSchemas.url).max(5, '最多只能上傳 5 張圖片').optional(),
  }),

  /** 更新產品 */
  update: z.object({
    name: StringSchemas.nonEmpty.max(100, '產品名稱不能超過 100 字元').optional(),
    description: z
      .string()
      .max(2000, '產品描述不能超過 2000 字元')
      .transform(str => {
        return str.replace(/<[^>]*>/g, '').trim()
      })
      .optional(),
    price: NumberSchemas.price.optional(),
    stock: NumberSchemas.stock.optional(),
    category: StringSchemas.nonEmpty.max(50, '分類名稱不能超過 50 字元').optional(),
    unit: StringSchemas.nonEmpty.max(10, '單位不能超過 10 字元').optional(),
    weight: NumberSchemas.price.optional(),
    origin: z.string().max(50, '產地不能超過 50 字元').optional(),
    harvest_season: z.string().max(50, '採收季節不能超過 50 字元').optional(),
    storage_method: z.string().max(200, '保存方式不能超過 200 字元').optional(),
    nutritional_info: z.string().max(1000, '營養資訊不能超過 1000 字元').optional(),
    is_organic: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    is_available: z.boolean().optional(),
    tags: z
      .array(z.string().max(20, '標籤長度不能超過 20 字元'))
      .max(10, '最多只能有 10 個標籤')
      .optional(),
    images: z.array(StringSchemas.url).max(5, '最多只能上傳 5 張圖片').optional(),
  }),
}

/**
 * 使用者相關 Schema
 */
export const UserSchemas = {
  /** 使用者註冊 */
  register: z.object({
    email: StringSchemas.email,
    password: z.string().min(8, '密碼至少需要 8 字元').max(128, '密碼不能超過 128 字元'),
    name: StringSchemas.nonEmpty.max(50, '姓名不能超過 50 字元'),
    phone: z.union([StringSchemas.phone, StringSchemas.mobile]).optional(),
    terms_accepted: z.boolean().refine(val => val === true, '必須同意服務條款'),
  }),

  /** 使用者登入 */
  login: z.object({
    email: StringSchemas.email,
    password: z.string().min(1, '密碼不能為空'),
  }),

  /** 密碼重設 */
  resetPassword: z.object({
    email: StringSchemas.email,
  }),

  /** 更新個人資料 */
  updateProfile: z.object({
    name: StringSchemas.nonEmpty.max(50, '姓名不能超過 50 字元').optional(),
    phone: z.union([StringSchemas.phone, StringSchemas.mobile]).optional(),
    address: z.string().max(200, '地址不能超過 200 字元').optional(),
    birthday: DateSchemas.pastDate.optional(),
    preferences: z
      .object({
        newsletter: z.boolean(),
        sms_notifications: z.boolean(),
        email_notifications: z.boolean(),
      })
      .optional(),
  }),
}

/**
 * 上傳檔案相關 Schema
 */
export const UploadSchemas = {
  /** 圖片上傳 */
  image: z.object({
    file: z.any().refine(file => {
      if (!(file instanceof File)) return false

      // 檢查檔案大小 (5MB)
      if (file.size > 5 * 1024 * 1024) return false

      // 檢查檔案類型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      return allowedTypes.includes(file.type)
    }, '請上傳有效的圖片檔案 (JPG, PNG, WebP, 最大 5MB)'),

    productId: StringSchemas.uuid.optional(),
    generateMultipleSizes: z.boolean().default(false),
    compress: z.boolean().default(true),
  }),

  /** POST 圖片上傳驗證（FormData 格式）*/
  imageUpload: z.object({
    productId: StringSchemas.uuid,
    generateMultipleSizes: z
      .enum(['true', 'false'])
      .optional()
      .transform(val => val === 'true'),
    compress: z
      .enum(['true', 'false'])
      .optional()
      .transform(val => val === 'true'),
    size: z.enum(['thumbnail', 'medium', 'large']).optional().default('medium'),
  }),

  /** GET 列出圖片驗證 */
  listImages: z.object({
    productId: StringSchemas.uuid,
  }),

  /** DELETE 刪除圖片驗證 */
  deleteImage: z.object({
    filePath: z.string().min(1, '檔案路徑不能為空'),
  }),
}

// ============================================================================
// 管理員相關 Schema
// ============================================================================

/**
 * 管理員操作 Schema
 */
export const AdminSchemas = {
  /** 管理員認證 */
  auth: z.object({
    adminKey: z.string().min(32, '管理員金鑰格式錯誤'),
  }),

  /** 系統重置 */
  systemReset: z.object({
    confirmAction: z.literal('RESET_SYSTEM'),
    adminKey: z.string().min(32, '管理員金鑰格式錯誤'),
  }),

  /** 審計日誌查詢 */
  auditLogQuery: z.object({
    action: z.string().optional(),
    resource_type: z.string().optional(),
    user_id: StringSchemas.uuid.optional(),
    start_date: DateSchemas.dateString.optional(),
    end_date: DateSchemas.dateString.optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  }),
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

// ============================================================================
// 地點管理相關 Schema
// ============================================================================

/**
 * 座標驗證 Schema
 */
const CoordinatesSchema = z.object({
  lat: z.number().min(-90, '緯度必須在 -90 到 90 之間').max(90, '緯度必須在 -90 到 90 之間'),
  lng: z.number().min(-180, '經度必須在 -180 到 180 之間').max(180, '經度必須在 -180 到 180 之間'),
})

/**
 * 地點相關 Schema
 */
export const LocationSchemas = {
  /** 創建地點 */
  create: z.object({
    id: z.string().uuid('ID 必須是有效的 UUID 格式').optional(), // 支援前端提供的 UUID
    name: StringSchemas.nonEmpty.max(50, '地點名稱不能超過 50 字元'),
    title: StringSchemas.nonEmpty.max(100, '地點標題不能超過 100 字元'),
    address: StringSchemas.nonEmpty.max(200, '地址不能超過 200 字元'),
    landmark: z.string().max(100, '地標不能超過 100 字元').default(''),
    phone: StringSchemas.phone,
    lineId: z.string().max(50, 'LINE ID 不能超過 50 字元').default(''),
    hours: StringSchemas.nonEmpty.max(100, '營業時間不能超過 100 字元'),
    closedDays: z.string().max(50, '休息日不能超過 50 字元').default(''),
    parking: z.string().max(200, '停車資訊不能超過 200 字元').default(''),
    publicTransport: z.string().max(200, '大眾運輸資訊不能超過 200 字元').default(''),
    features: z
      .array(z.string().max(30, '特色長度不能超過 30 字元'))
      .max(10, '最多只能有 10 個特色')
      .default([]),
    specialties: z
      .array(z.string().max(30, '特產長度不能超過 30 字元'))
      .max(10, '最多只能有 10 個特產')
      .default([]),
    coordinates: CoordinatesSchema,
    image: z
      .string()
      .optional()
      .default('')
      .refine(
        value => {
          if (!value) return true
          // 允許相對路徑 (以 / 開頭) 或完整 URL
          return value.startsWith('/') || z.string().url().safeParse(value).success
        },
        {
          message: '請輸入有效的圖片網址或相對路徑',
        }
      ),
    isMain: z.boolean().default(false),
  }),

  /** 更新地點 */
  update: z.object({
    name: StringSchemas.nonEmpty.max(50, '地點名稱不能超過 50 字元').optional(),
    title: StringSchemas.nonEmpty.max(100, '地點標題不能超過 100 字元').optional(),
    address: StringSchemas.nonEmpty.max(200, '地址不能超過 200 字元').optional(),
    landmark: z.string().max(100, '地標不能超過 100 字元').optional(),
    phone: StringSchemas.phone.optional(),
    lineId: z.string().max(50, 'LINE ID 不能超過 50 字元').optional(),
    hours: StringSchemas.nonEmpty.max(100, '營業時間不能超過 100 字元').optional(),
    closedDays: z.string().max(50, '休息日不能超過 50 字元').optional(),
    parking: z.string().max(200, '停車資訊不能超過 200 字元').optional(),
    publicTransport: z.string().max(200, '大眾運輸資訊不能超過 200 字元').optional(),
    features: z
      .array(z.string().max(30, '特色長度不能超過 30 字元'))
      .max(10, '最多只能有 10 個特色')
      .optional(),
    specialties: z
      .array(z.string().max(30, '特產長度不能超過 30 字元'))
      .max(10, '最多只能有 10 個特產')
      .optional(),
    coordinates: CoordinatesSchema.optional(),
    image: z
      .string()
      .optional()
      .refine(value => !value || z.string().url().safeParse(value).success, {
        message: '請輸入有效的圖片網址',
      }),
    isMain: z.boolean().optional(),
  }),

  /** 查詢參數 */
  query: z.object({
    search: z.string().max(100, '搜尋關鍵字不能超過 100 字元').optional(),
    isMain: z.coerce.boolean().optional(),
    features: z.string().max(30, '特色篩選不能超過 30 字元').optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    sort_by: z.enum(['name', 'createdAt', 'updatedAt']).default('name'),
    sort_order: z.enum(['asc', 'desc']).default('asc'),
  }),
}

// ============================================================================
// 行程管理相關 Schema
// ============================================================================

/**
 * 行程相關 Schema
 */
export const ScheduleSchemas = {
  /** 創建行程 */
  create: z.object({
    title: StringSchemas.nonEmpty.max(100, '行程標題不能超過 100 字元'),
    location: StringSchemas.nonEmpty.max(100, '地點名稱不能超過 100 字元'),
    date: DateSchemas.dateString,
    time: z
      .string()
      .regex(
        /^([01]?[0-9]|2[0-3]):[0-5][0-9](-([01]?[0-9]|2[0-3]):[0-5][0-9])?$/,
        '時間格式必須為 HH:MM 或 HH:MM-HH:MM'
      ),
    status: z.enum(['upcoming', 'ongoing', 'completed']).default('upcoming'),
    products: z
      .array(StringSchemas.nonEmpty.max(50, '產品名稱不能超過 50 字元'))
      .max(20, '最多只能有 20 個產品')
      .default([]),
    description: z.string().max(500, '描述不能超過 500 字元').optional().default(''),
    contact: StringSchemas.nonEmpty.max(100, '聯絡資訊不能超過 100 字元'),
    specialOffer: z.string().max(200, '特別優惠不能超過 200 字元').optional(),
    weatherNote: z.string().max(200, '天氣備註不能超過 200 字元').optional(),
  }),

  /** 更新行程 */
  update: z.object({
    title: StringSchemas.nonEmpty.max(100, '行程標題不能超過 100 字元').optional(),
    location: StringSchemas.nonEmpty.max(100, '地點名稱不能超過 100 字元').optional(),
    date: DateSchemas.dateString.optional(),
    time: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, '時間格式必須為 HH:MM')
      .optional(),
    status: z.enum(['upcoming', 'ongoing', 'completed']).optional(),
    products: z
      .array(StringSchemas.nonEmpty.max(50, '產品名稱不能超過 50 字元'))
      .max(20, '最多只能有 20 個產品')
      .optional(),
    description: StringSchemas.nonEmpty.max(500, '描述不能超過 500 字元').optional(),
    contact: StringSchemas.nonEmpty.max(100, '聯絡資訊不能超過 100 字元').optional(),
    specialOffer: z.string().max(200, '特別優惠不能超過 200 字元').optional(),
    weatherNote: z.string().max(200, '天氣備註不能超過 200 字元').optional(),
  }),

  /** 查詢參數 */
  query: z.object({
    status: z.enum(['upcoming', 'ongoing', 'completed']).optional(),
    location: z.string().max(100, '地點名稱不能超過 100 字元').optional(),
    date_from: DateSchemas.dateString.optional(),
    date_to: DateSchemas.dateString.optional(),
    search: z.string().max(100, '搜尋關鍵字不能超過 100 字元').optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    sort_by: z.enum(['date', 'title', 'location', 'createdAt']).default('date'),
    sort_order: z.enum(['asc', 'desc']).default('asc'),
  }),
}

// ============================================================================
// 常用驗證組合
// ============================================================================

/**
 * 基礎 CRUD 驗證配置
 */
/**
 * 管理員產品相關 Schema（對應現有 API 格式）
 */
/**
 * 公開產品 API 相關 Schema
 */
export const PublicProductSchemas = {
  /** GET 查詢參數驗證 */
  query: z.object({
    // 安全修復：移除 admin 參數，公開 API 不應該允許獲取所有產品
    // 管理員應使用 /api/admin/products
    nocache: z
      .enum(['true', 'false'])
      .optional()
      .transform(val => val === 'true'),
    t: z.string().optional(), // timestamp 參數，用於快取破壞
    category: z.string().max(50, '分類名稱不能超過 50 字元').optional(),
    search: z.string().max(100, '搜尋關鍵字不能超過 100 字元').optional(),
    featured: z
      .enum(['true', 'false'])
      .optional()
      .transform(val => val === 'true'),
    available: z
      .enum(['true', 'false'])
      .optional()
      .transform(val => val === 'true'),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  }),

  /** POST 產品建立驗證（公開 API 用）*/
  create: z.object({
    name: StringSchemas.nonEmpty.max(100, '產品名稱不能超過 100 字元'),
    description: z
      .string()
      .max(2000, '產品描述不能超過 2000 字元')
      .transform(str => {
        return str.replace(/<[^>]*>/g, '').trim()
      }),
    price: NumberSchemas.price,
    category: StringSchemas.nonEmpty.max(50, '分類名稱不能超過 50 字元'),
    inventory: NumberSchemas.stock,
    isActive: z.boolean().default(true),
    images: z
      .array(z.string().url('圖片必須是有效的 URL'))
      .max(5, '最多只能上傳 5 張圖片')
      .optional(),
  }),
}

/**
 * 管理員產品相關 Schema（對應現有 API 格式）
 */
export const AdminProductSchemas = {
  /** 創建產品（管理員用）*/
  create: z.object({
    name: StringSchemas.nonEmpty.max(100, '產品名稱不能超過 100 字元'),
    description: z
      .string()
      .max(2000, '產品描述不能超過 2000 字元')
      .transform(str => {
        return str.replace(/<[^>]*>/g, '').trim()
      }),
    price: NumberSchemas.price,
    priceUnit: z.string().max(20, '價格單位不能超過 20 字元').optional(), // 新增：價格單位
    unitQuantity: z.number().min(0.01, '單位數量必須大於 0').optional(), // 新增：單位數量
    category: StringSchemas.nonEmpty.max(50, '分類名稱不能超過 50 字元'),
    inventory: NumberSchemas.stock, // 前端使用 inventory，對應資料庫 stock
    images: z
      .array(z.string().url('圖片必須是有效的 URL'))
      .max(5, '最多只能上傳 5 張圖片')
      .optional(),
    isActive: z.boolean().default(true), // 前端使用 isActive，對應資料庫 is_active
    id: StringSchemas.uuid.optional(), // 允許指定 ID
  }),

  /** 更新產品（管理員用）*/
  update: z.object({
    id: StringSchemas.uuid,
    name: StringSchemas.nonEmpty.max(100, '產品名稱不能超過 100 字元').optional(),
    description: z
      .string()
      .max(2000, '產品描述不能超過 2000 字元')
      .transform(str => {
        return str.replace(/<[^>]*>/g, '').trim()
      })
      .optional(),
    price: NumberSchemas.price.optional(),
    priceUnit: z.string().max(20, '價格單位不能超過 20 字元').optional(), // 新增：價格單位
    unitQuantity: z.number().min(0.01, '單位數量必須大於 0').optional(), // 新增：單位數量
    category: StringSchemas.nonEmpty.max(50, '分類名稱不能超過 50 字元').optional(),
    inventory: NumberSchemas.stock.optional(),
    images: z
      .array(z.string().url('圖片必須是有效的 URL'))
      .max(5, '最多只能上傳 5 張圖片')
      .optional(),
    isActive: z.boolean().optional(),
  }),

  /** 刪除產品 ID 驗證 */
  deleteParams: z.object({
    id: StringSchemas.uuid,
  }),
}

/**
 * 圖片上傳 API 相關 Schema
 */
export const ImageUploadSchemas = {
  /** POST 上傳表單驗證 */
  uploadForm: z
    .object({
      productId: StringSchemas.uuid.optional(),
      momentId: StringSchemas.uuid.optional(),
      generateMultipleSizes: z
        .enum(['true', 'false'])
        .optional()
        .transform(val => val === 'true'),
      compress: z
        .enum(['true', 'false'])
        .optional()
        .transform(val => val === 'true'),
      size: z.enum(['thumbnail', 'medium', 'large']).optional().default('medium'),
    })
    .refine(data => data.productId || data.momentId, {
      message: '必須提供 productId 或 momentId',
    }),

  /** GET 查詢參數驗證 */
  query: z
    .object({
      productId: StringSchemas.uuid.optional(),
      momentId: StringSchemas.uuid.optional(),
    })
    .refine(data => data.productId || data.momentId, {
      message: '必須提供 productId 或 momentId',
    }),

  /** DELETE 刪除參數驗證 */
  deleteParams: z.object({
    filePath: z.string().min(1, '檔案路徑不能為空').max(500, '檔案路徑過長'),
  }),
}

export const CommonValidations = {
  /** UUID 參數驗證 */
  uuidParam: z.object({
    id: StringSchemas.uuid,
  }),

  /** 分頁查詢驗證 */
  pagination: PaginationSchema,

  /** 排序參數驗證 */
  sorting: SortingSchema,

  /** 管理員金鑰驗證 */
  adminKey: z
    .object({
      'x-admin-key': z.string().min(32, '無效的管理員金鑰'),
    })
    .or(
      z.object({
        adminKey: z.string().min(32, '無效的管理員金鑰'),
      })
    ),
}

// ============================================================================
// 第三階段 API Schema - 剩餘整合
// ============================================================================

/**
 * 文化典藏相關 Schema
 */
export const CultureSchemas = {
  /** 建立文化項目 */
  create: z.object({
    title: StringSchemas.nonEmpty.max(100, '標題不能超過 100 字元'),
    subtitle: z.string().max(200, '副標題不能超過 200 字元').optional().default(''),
    description: StringSchemas.nonEmpty.max(2000, '描述不能超過 2000 字元'),
    height: z
      .string()
      .regex(
        /^h-(4[8-9]|[5-9]\d|1[0-9]\d)$/,
        '高度必須是有效的 Tailwind CSS 類別，如 h-48, h-64 等'
      )
      .optional()
      .default('h-64'),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, '顏色必須是有效的十六進制格式，如 #FF0000')
      .optional()
      .default('#4A90E2'),
    textColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, '文字顏色必須是有效的十六進制格式，如 #FFFFFF')
      .optional()
      .default('#FFFFFF'),
    emoji: z
      .string()
      .min(1, 'Emoji 不能為空')
      .max(4, 'Emoji 不能超過 4 個字符')
      .optional()
      .default('🏺'),
    imageUrl: z.string().url('圖片 URL 格式不正確').optional().or(z.literal('')),
    imageFile: z.any().optional(), // File 物件會在服務層處理
  }),

  /** 更新文化項目 */
  update: z.object({
    title: StringSchemas.nonEmpty.max(100, '標題不能超過 100 字元').optional(),
    subtitle: z.string().max(200, '副標題不能超過 200 字元').optional(),
    description: StringSchemas.nonEmpty.max(2000, '描述不能超過 2000 字元').optional(),
    height: z
      .string()
      .regex(
        /^h-(4[8-9]|[5-9]\d|1[0-9]\d)$/,
        '高度必須是有效的 Tailwind CSS 類別，如 h-48, h-64 等'
      )
      .optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, '顏色必須是有效的十六進制格式，如 #FF0000')
      .optional(),
    textColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, '文字顏色必須是有效的十六進制格式，如 #FFFFFF')
      .optional(),
    emoji: z.string().min(1, 'Emoji 不能為空').max(4, 'Emoji 不能超過 4 個字符').optional(),
    imageUrl: z.string().url('圖片 URL 格式不正確').optional().or(z.literal('')),
  }),
}

/**
 * 精彩時刻相關 Schema
 */
export const MomentSchemas = {
  /** 建立精彩時刻項目 */
  create: z.object({
    id: z.string().uuid('ID 必須是有效的 UUID 格式').optional(), // 支援前端提供的 UUID
    title: StringSchemas.nonEmpty.max(100, '標題不能超過 100 字元'),
    subtitle: z.string().max(200, '副標題不能超過 200 字元').optional().default(''),
    description: StringSchemas.nonEmpty.max(2000, '描述不能超過 2000 字元'),
    height: z
      .string()
      .regex(
        /^h-(4[8-9]|[5-9]\d|1[0-9]\d)$/,
        '高度必須是有效的 Tailwind CSS 類別，如 h-48, h-64 等'
      )
      .optional()
      .default('h-56'),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, '顏色必須是有效的十六進制格式，如 #FF0000')
      .optional()
      .default('#3B82F6'),
    textColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, '文字顏色必須是有效的十六進制格式，如 #FFFFFF')
      .optional()
      .default('#FFFFFF'),
    emoji: z
      .string()
      .min(1, 'Emoji 不能為空')
      .max(4, 'Emoji 不能超過 4 個字符')
      .optional()
      .default('📸'),
    imageUrl: z.string().url('圖片 URL 格式不正確').optional().or(z.literal('')),
    imageFile: z.any().optional(), // File 物件會在服務層處理
  }),
  /** 更新精彩時刻項目 */
  update: z.object({
    title: StringSchemas.nonEmpty.max(100, '標題不能超過 100 字元').optional(),
    subtitle: z.string().max(200, '副標題不能超過 200 字元').optional(),
    description: StringSchemas.nonEmpty.max(2000, '描述不能超過 2000 字元').optional(),
    height: z
      .string()
      .regex(
        /^h-(4[8-9]|[5-9]\d|1[0-9]\d)$/,
        '高度必須是有效的 Tailwind CSS 類別，如 h-48, h-64 等'
      )
      .optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, '顏色必須是有效的十六進制格式，如 #FF0000')
      .optional(),
    textColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, '文字顏色必須是有效的十六進制格式，如 #FFFFFF')
      .optional(),
    emoji: z.string().min(1, 'Emoji 不能為空').max(4, 'Emoji 不能超過 4 個字符').optional(),
    imageUrl: z.string().url('圖片 URL 格式不正確').optional().or(z.literal('')),
    imageFile: z.any().optional(), // File 物件會在服務層處理
  }),
}

/**
 * 農場體驗活動相關 Schema（對應 FarmTourActivity 類型）
 */
export const FarmTourActivitySchemas = {
  /** 建立農場體驗活動 */
  create: z.object({
    id: z.string().uuid('ID 必須是有效的 UUID 格式').optional(), // 支援前端提供的 UUID
    start_month: z.number().int().min(1, '開始月份必須是 1-12').max(12, '開始月份必須是 1-12'),
    end_month: z.number().int().min(1, '結束月份必須是 1-12').max(12, '結束月份必須是 1-12'),
    title: StringSchemas.nonEmpty.max(100, '活動標題不能超過 100 字元'),
    activities: z
      .array(z.string().max(50, '活動項目不能超過 50 字元'))
      .min(1, '至少要有一個活動項目'),
    price: z.number().min(0, '價格不能為負數').default(0),
    image: z.string().url('圖片 URL 格式不正確'),
    available: z.boolean().default(true),
    note: z.string().max(500, '備註不能超過 500 字元').default(''),
  }),

  /** 更新農場體驗活動 */
  update: z.object({
    start_month: z
      .number()
      .int()
      .min(1, '開始月份必須是 1-12')
      .max(12, '開始月份必須是 1-12')
      .optional(),
    end_month: z
      .number()
      .int()
      .min(1, '結束月份必須是 1-12')
      .max(12, '結束月份必須是 1-12')
      .optional(),
    title: StringSchemas.nonEmpty.max(100, '活動標題不能超過 100 字元').optional(),
    activities: z
      .array(z.string().max(50, '活動項目不能超過 50 字元'))
      .min(1, '至少要有一個活動項目')
      .optional(),
    price: z.number().min(0, '價格不能為負數').optional(),
    image: z.string().url('圖片 URL 格式不正確').optional(),
    available: z.boolean().optional(),
    note: z.string().max(500, '備註不能超過 500 字元').optional(),
  }),
}

/**
 * 搜尋相關 Schema
 */
export const SearchSchemas = {
  /** 搜尋查詢 */
  query: z.object({
    q: StringSchemas.nonEmpty.max(100, '搜尋關鍵字不能超過 100 字元'),
    limit: z.coerce
      .number()
      .int('limit 必須是整數')
      .min(1, 'limit 至少為 1')
      .max(100, 'limit 不能超過 100')
      .default(20),
    offset: z.coerce.number().int('offset 必須是整數').min(0, 'offset 不能小於 0').default(0),
  }),
}
