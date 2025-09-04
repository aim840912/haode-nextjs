/**
 * 服務層統一類型定義
 *
 * 用於替代服務層中的 any 類型使用
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database'

// Supabase 客戶端類型 (使用完整的 Database 類型定義)
export type ServiceSupabaseClient = SupabaseClient<Database>

// 錯誤處理上下文
export interface ServiceErrorContext {
  operation?: string
  service?: string
  params?: unknown // 更靈活的參數類型
  userId?: string
  [key: string]: unknown // 允許任意額外屬性
}

// 服務層基礎錯誤類型
export interface ServiceError extends Error {
  code?: string
  details?: unknown
  context?: ServiceErrorContext
}

// 查詢參數基類
export interface BaseQueryParams {
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  filter?: Record<string, unknown>
  [key: string]: unknown // 允許任意額外屬性
}

// 數據庫記錄基類
export interface BaseDbRecord {
  id: string
  created_at: string
  updated_at: string
  [key: string]: unknown
}

// 更新資料物件類型
export interface UpdateDataObject {
  [key: string]: unknown
  updated_at?: string
}

// 資料轉換介面
export interface DataTransformer<T, R = BaseDbRecord> {
  fromDB(record: R): T
  toDB(entity: Partial<T>): UpdateDataObject
}

// 詢問相關查詢參數
export interface InquiryQueryParams extends BaseQueryParams {
  status?: string
  priority?: string
  type?: string
  assignedTo?: string
  dateFrom?: string
  dateTo?: string
  [key: string]: unknown // 允許任意額外屬性
}

// 文化項目查詢參數
export interface CultureQueryParams extends BaseQueryParams {
  category?: string
  featured?: boolean
  published?: boolean
}

// 地點查詢參數
export interface LocationQueryParams extends BaseQueryParams {
  type?: string
  active?: boolean
  region?: string
}

// 農場體驗查詢參數
export interface FarmTourQueryParams extends BaseQueryParams {
  category?: string
  available?: boolean
  difficulty?: string
  duration?: string
}

// 排程查詢參數
export interface ScheduleQueryParams extends BaseQueryParams {
  dateFrom?: string
  dateTo?: string
  status?: string
  type?: string
}

// 服務操作結果
export interface ServiceOperationResult<T = unknown> {
  success: boolean
  data?: T
  error?: ServiceError
  message?: string
}

// 分頁結果
export interface PaginatedServiceResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
