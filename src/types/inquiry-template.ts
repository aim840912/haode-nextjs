/**
 * 詢價範本系統類型定義
 * 支援使用者儲存常用詢價內容，快速建立詢價單
 */

// 配送日期模式類型
export type DeliveryDatePattern = 'weekly' | 'monthly' | 'specific'

// 參觀日期模式類型
export type VisitDatePattern = 'weekend' | 'weekday' | 'specific'

/**
 * 詢價範本項目
 * 與 CreateInquiryItemRequest 結構一致
 */
export interface InquiryTemplateItem {
  product_id: string
  product_name: string
  product_category?: string
  quantity: number
  unit_price?: number
  notes?: string
}

/**
 * 詢價範本主體
 * 完整的範本資料結構
 */
export interface InquiryTemplate {
  id: string
  user_id: string
  name: string
  description?: string
  inquiry_type: 'product' | 'farm_tour'

  // 客戶資訊（預填值）
  customer_name?: string
  customer_email?: string
  customer_phone?: string

  // 配送資訊
  delivery_address?: string
  preferred_delivery_date_pattern?: DeliveryDatePattern

  // 備註和項目
  notes?: string
  items: InquiryTemplateItem[]

  // 農場參觀相關欄位
  activity_title?: string
  visit_date_pattern?: VisitDatePattern
  visitor_count?: string

  // 狀態
  is_active: boolean
  is_favorite: boolean

  // 使用統計
  usage_count: number
  last_used_at?: string

  // 時間戳
  created_at: string
  updated_at: string
}

/**
 * 建立詢價範本請求
 */
export interface CreateInquiryTemplateRequest {
  name: string
  description?: string
  inquiry_type: 'product' | 'farm_tour'
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  delivery_address?: string
  preferred_delivery_date_pattern?: DeliveryDatePattern
  notes?: string
  items?: InquiryTemplateItem[]
  activity_title?: string
  visit_date_pattern?: VisitDatePattern
  visitor_count?: string
}

/**
 * 更新詢價範本請求
 */
export interface UpdateInquiryTemplateRequest {
  name?: string
  description?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  delivery_address?: string
  preferred_delivery_date_pattern?: DeliveryDatePattern
  notes?: string
  items?: InquiryTemplateItem[]
  activity_title?: string
  visit_date_pattern?: VisitDatePattern
  visitor_count?: string
  is_active?: boolean
  is_favorite?: boolean
}

/**
 * 詢價範本查詢參數
 */
export interface InquiryTemplateQueryParams {
  inquiry_type?: 'product' | 'farm_tour'
  is_active?: boolean
  is_favorite?: boolean
  limit?: number
  offset?: number
  sort_by?: 'created_at' | 'updated_at' | 'usage_count' | 'name'
  sort_order?: 'asc' | 'desc'
}

/**
 * 使用範本返回的表單資料
 * 用於自動填入詢價表單
 */
export interface InquiryFormDataFromTemplate {
  customer_name: string
  customer_email: string
  customer_phone: string
  inquiry_type: 'product' | 'farm_tour'
  notes: string
  delivery_address: string
  preferred_delivery_date: string
  items: InquiryTemplateItem[]
  activity_title?: string
  visit_date?: string
  visitor_count?: string
}

/**
 * 詢價範本統計資料
 */
export interface InquiryTemplateStats {
  user_id: string
  total_templates: number
  active_templates: number
  favorite_templates: number
  total_usage_count: number
  avg_usage_count: number
  last_template_used_at?: string
  newest_template_created_at?: string
}
