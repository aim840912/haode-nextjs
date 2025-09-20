/**
 * Supabase 相關統一類型定義
 *
 * 用於替代 storage 和服務層中的 any 類型
 */

// Supabase Storage 檔案物件
export interface SupabaseStorageFile {
  id: string
  name: string
  bucket_id: string
  owner?: string
  created_at: string
  updated_at: string
  last_accessed_at?: string
  metadata?: Record<string, unknown>
  cache_control?: string
  content_type?: string
}

// Storage Bucket 類型
export interface SupabaseStorageBucket {
  id: string
  name: string
  owner?: string
  public: boolean
  created_at: string
  updated_at: string
  file_size_limit?: number
  allowed_mime_types?: string[]
}

// Supabase 查詢回應
export interface SupabaseResponse<T> {
  data: T | null
  error: SupabaseError | null
  count?: number | null
  status: number
  statusText: string
}

// Supabase 錯誤
export interface SupabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}

// Storage 操作結果
export interface StorageUploadResponse {
  data: {
    id: string
    path: string
    fullPath: string
  } | null
  error: SupabaseError | null
}

export interface StorageDeleteResponse {
  data: Array<{
    id: string
    name: string
  }> | null
  error: SupabaseError | null
}

// 檔案列表回應
export interface StorageFileWithUrl {
  name: string
  id: string
  url: string
  metadata: Record<string, unknown>
  size?: number
  mimeType?: string
  lastModified?: string
}

// 查詢選項
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  ascending?: boolean
  select?: string
}

// 通用 Supabase 實體
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// 分頁選項
export interface PaginationOptions {
  page?: number // 頁碼（1-based）
  limit?: number // 每頁記錄數
  offset?: number // 偏移量（0-based）
  sortBy?: string // 排序欄位
  sortOrder?: 'asc' | 'desc' // 排序方向
}

// 分頁結果
export interface PaginatedResult<T> {
  data: T[]
  total: number // 總記錄數
  count: number // 當前頁記錄數
  page: number // 當前頁碼
  totalPages: number // 總頁數
  hasMore: boolean // 是否有下一頁
  hasPrev: boolean // 是否有上一頁
  nextOffset?: number
  prevOffset?: number
}

// 統一圖片管理表 (images table)
export interface ImageRecord extends BaseEntity {
  module: string
  entity_id: string
  file_path: string
  storage_url: string
  size: string
  display_position: number
  alt_text?: string
  metadata?: Record<string, any>
}

// 圖片上傳結果
export interface ImageUploadResult {
  id: string
  url: string
  path: string
  size: string
  module: string
  entityId: string
}

// Database 類型定義 - 模擬 Supabase 生成的類型
export interface Database {
  public: {
    Tables: {
      images: {
        Row: ImageRecord
        Insert: Omit<ImageRecord, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ImageRecord, 'id' | 'created_at' | 'updated_at'>>
      }
      // 其他表可以在這裡新增
    }
  }
}
