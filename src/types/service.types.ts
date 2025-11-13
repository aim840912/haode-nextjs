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

// 更新資料物件類型
export interface UpdateDataObject {
  [key: string]: unknown
  updated_at?: string
}
