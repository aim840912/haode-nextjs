/**
 * Zod 驗證 Schema 庫
 * 
 * 提供統一的輸入驗證 schema，用於 API 路由和表單驗證
 * 包含常用的驗證規則和自定義驗證器
 */

import { z } from 'zod';

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
  phone: z.string().regex(
    /^(\+886|886|0)?[2-9]\d{7,8}$/,
    '請輸入有效的台灣電話號碼'
  ),
  
  /** 手機號碼驗證（台灣） */
  mobile: z.string().regex(
    /^(\+886|886|0)?9\d{8}$/,
    '請輸入有效的台灣手機號碼'
  ),
  
  /** URL 驗證 */
  url: z.string().url('請輸入有效的網址'),
  
  /** UUID 驗證 */
  uuid: z.string().uuid('請輸入有效的 UUID'),
  
  /** 價格字串（可包含小數點） */
  price: z.string().regex(
    /^\d+(\.\d{1,2})?$/,
    '請輸入有效的價格格式'
  ),
  
  /** HTML 標籤清理 */
  sanitized: z.string().transform((str) => {
    // 簡單的 HTML 標籤移除（生產環境建議使用 DOMPurify）
    return str.replace(/<[^>]*>/g, '').trim();
  })
};

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
  rating: z.number().min(1, '評分不能小於 1').max(5, '評分不能大於 5')
};

/**
 * 日期驗證
 */
export const DateSchemas = {
  /** ISO 日期字串 */
  isoDate: z.string().datetime('請輸入有效的日期時間格式'),
  
  /** 日期字串 YYYY-MM-DD */
  dateString: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    '請輸入有效的日期格式 (YYYY-MM-DD)'
  ),
  
  /** 未來日期 */
  futureDate: z.string().datetime().refine(
    (date) => new Date(date) > new Date(),
    '日期必須是未來時間'
  ),
  
  /** 過去日期 */
  pastDate: z.string().datetime().refine(
    (date) => new Date(date) < new Date(),
    '日期必須是過去時間'
  )
};

// ============================================================================
// 業務邏輯驗證 Schema
// ============================================================================

/**
 * 詢問單相關 Schema
 */
export const InquirySchemas = {
  /** 創建詢問單 */
  create: z.object({
    customer_name: StringSchemas.nonEmpty.max(50, '姓名不能超過 50 字元'),
    customer_email: StringSchemas.email,
    customer_phone: z.union([StringSchemas.phone, StringSchemas.mobile]),
    message: StringSchemas.sanitized.min(10, '留言至少需要 10 字元').max(1000, '留言不能超過 1000 字元'),
    product_ids: z.array(StringSchemas.uuid).min(1, '至少需要選擇一個產品').max(20, '最多只能選擇 20 個產品'),
    inquiry_type: z.enum(['product_inquiry', 'wholesale_inquiry', 'custom_order'], {
      errorMap: () => ({ message: '請選擇有效的詢問類型' })
    }),
    preferred_contact_time: z.enum(['morning', 'afternoon', 'evening', 'anytime']).optional(),
    budget_range: z.enum(['under_1000', '1000_5000', '5000_10000', 'over_10000']).optional(),
    delivery_address: z.string().max(200, '地址不能超過 200 字元').optional(),
    notes: z.string().max(500, '備註不能超過 500 字元').optional()
  }),

  /** 更新詢問單狀態 */
  updateStatus: z.object({
    status: z.enum(['pending', 'quoted', 'confirmed', 'completed', 'cancelled'], {
      errorMap: () => ({ message: '請選擇有效的狀態' })
    }),
    admin_notes: z.string().max(1000, '管理員備註不能超過 1000 字元').optional(),
    quoted_price: NumberSchemas.price.optional(),
    estimated_delivery: DateSchemas.futureDate.optional()
  }),

  /** 詢問單查詢參數 */
  query: z.object({
    status: z.enum(['pending', 'quoted', 'confirmed', 'completed', 'cancelled']).optional(),
    customer_email: StringSchemas.email.optional(),
    start_date: DateSchemas.dateString.optional(),
    end_date: DateSchemas.dateString.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    sort_by: z.enum(['created_at', 'updated_at', 'customer_name']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
    is_read: z.coerce.boolean().optional(),
    is_replied: z.coerce.boolean().optional(),
    unread_only: z.coerce.boolean().default(false),
    unreplied_only: z.coerce.boolean().default(false)
  })
};

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
    tour_time: z.enum(['morning', 'afternoon'], {
      errorMap: () => ({ message: '請選擇上午或下午時段' })
    }),
    group_size: NumberSchemas.positiveInt.max(20, '團體人數不能超過 20 人'),
    special_requirements: z.string().max(500, '特殊需求不能超過 500 字元').optional(),
    dietary_restrictions: z.string().max(200, '飲食限制不能超過 200 字元').optional(),
    transportation: z.enum(['self_drive', 'public_transport', 'tour_bus']).optional(),
    contact_preference: z.enum(['phone', 'email', 'both']).default('both')
  }),

  /** 更新預約狀態 */
  updateStatus: z.object({
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled'], {
      errorMap: () => ({ message: '請選擇有效的狀態' })
    }),
    admin_notes: z.string().max(1000, '管理員備註不能超過 1000 字元').optional(),
    confirmed_time: DateSchemas.isoDate.optional()
  })
};

/**
 * 產品相關 Schema
 */
export const ProductSchemas = {
  /** 創建產品 */
  create: z.object({
    name: StringSchemas.nonEmpty.max(100, '產品名稱不能超過 100 字元'),
    description: StringSchemas.sanitized.max(2000, '產品描述不能超過 2000 字元'),
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
    tags: z.array(z.string().max(20, '標籤長度不能超過 20 字元')).max(10, '最多只能有 10 個標籤').optional(),
    images: z.array(StringSchemas.url).max(5, '最多只能上傳 5 張圖片').optional()
  }),

  /** 更新產品 */
  update: z.object({
    name: StringSchemas.nonEmpty.max(100, '產品名稱不能超過 100 字元').optional(),
    description: StringSchemas.sanitized.max(2000, '產品描述不能超過 2000 字元').optional(),
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
    tags: z.array(z.string().max(20, '標籤長度不能超過 20 字元')).max(10, '最多只能有 10 個標籤').optional(),
    images: z.array(StringSchemas.url).max(5, '最多只能上傳 5 張圖片').optional()
  })
};

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
    terms_accepted: z.boolean().refine((val) => val === true, '必須同意服務條款')
  }),

  /** 使用者登入 */
  login: z.object({
    email: StringSchemas.email,
    password: z.string().min(1, '密碼不能為空')
  }),

  /** 密碼重設 */
  resetPassword: z.object({
    email: StringSchemas.email
  }),

  /** 更新個人資料 */
  updateProfile: z.object({
    name: StringSchemas.nonEmpty.max(50, '姓名不能超過 50 字元').optional(),
    phone: z.union([StringSchemas.phone, StringSchemas.mobile]).optional(),
    address: z.string().max(200, '地址不能超過 200 字元').optional(),
    birthday: DateSchemas.pastDate.optional(),
    preferences: z.object({
      newsletter: z.boolean(),
      sms_notifications: z.boolean(),
      email_notifications: z.boolean()
    }).optional()
  })
};

/**
 * 上傳檔案相關 Schema
 */
export const UploadSchemas = {
  /** 圖片上傳 */
  image: z.object({
    file: z.any().refine((file) => {
      if (!(file instanceof File)) return false;
      
      // 檢查檔案大小 (5MB)
      if (file.size > 5 * 1024 * 1024) return false;
      
      // 檢查檔案類型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      return allowedTypes.includes(file.type);
    }, '請上傳有效的圖片檔案 (JPG, PNG, WebP, 最大 5MB)'),
    
    productId: StringSchemas.uuid.optional(),
    generateMultipleSizes: z.boolean().default(false),
    compress: z.boolean().default(true)
  })
};

// ============================================================================
// 管理員相關 Schema
// ============================================================================

/**
 * 管理員操作 Schema
 */
export const AdminSchemas = {
  /** 管理員認證 */
  auth: z.object({
    adminKey: z.string().min(32, '管理員金鑰格式錯誤')
  }),

  /** 系統重置 */
  systemReset: z.object({
    confirmAction: z.literal('RESET_SYSTEM', {
      errorMap: () => ({ message: '請確認重置操作' })
    }),
    adminKey: z.string().min(32, '管理員金鑰格式錯誤')
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
    offset: z.coerce.number().int().min(0).default(0)
  })
};

// ============================================================================
// 分頁和排序相關 Schema
// ============================================================================

/**
 * 通用分頁參數 Schema
 */
export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  page: z.coerce.number().int().min(1).optional(),
  per_page: z.coerce.number().int().min(1).max(100).optional()
}).transform((data) => {
  // 如果有 page 和 per_page，轉換為 limit 和 offset
  if (data.page && data.per_page) {
    return {
      limit: data.per_page,
      offset: (data.page - 1) * data.per_page
    };
  }
  return {
    limit: data.limit,
    offset: data.offset
  };
});

/**
 * 通用排序參數 Schema
 */
export const SortingSchema = z.object({
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  order_by: z.string().optional() // 別名支援
}).transform((data) => ({
  sort_by: data.sort_by || data.order_by,
  sort_order: data.sort_order
}));

// ============================================================================
// 組合 Schema（常用組合）
// ============================================================================

/**
 * 帶分頁的查詢 Schema
 */
export function createPaginatedQuerySchema<T extends z.ZodTypeAny>(baseSchema: T) {
  return baseSchema.merge(PaginationSchema).merge(SortingSchema);
}

/**
 * API 回應驗證 Schema
 */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  details: z.any().optional(),
  pagination: z.object({
    total: NumberSchemas.nonNegativeInt,
    page: NumberSchemas.positiveInt,
    per_page: NumberSchemas.positiveInt,
    total_pages: NumberSchemas.positiveInt
  }).optional()
});

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
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('; ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: '資料驗證失敗' };
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
    const body = await request.json();
    return validateData(schema, body);
  } catch (error) {
    return { success: false, error: '無效的 JSON 格式' };
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
    const params: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    return validateData(schema, params);
  } catch (error) {
    return { success: false, error: '查詢參數格式錯誤' };
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
    .trim();
}