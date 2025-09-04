/**
 * 核心基礎設施類型定義
 *
 * 為 Supabase 服務、API 客戶端和驗證中間件提供類型安全的介面定義
 */

import { Database } from './database'
import { z } from 'zod'

// ============================================================================
// Supabase 查詢建構器類型
// ============================================================================

/**
 * Supabase 查詢建構器介面
 * 提供類型安全的查詢操作
 */
export interface SupabaseQueryBuilder<T = Record<string, unknown>> {
  select(columns?: string): SupabaseQueryBuilder<T>
  insert(data: Partial<T> | Partial<T>[]): SupabaseQueryBuilder<T>
  update(data: Partial<T>): SupabaseQueryBuilder<T>
  delete(): SupabaseQueryBuilder<T>
  eq(column: keyof T, value: unknown): SupabaseQueryBuilder<T>
  neq(column: keyof T, value: unknown): SupabaseQueryBuilder<T>
  gt(column: keyof T, value: unknown): SupabaseQueryBuilder<T>
  gte(column: keyof T, value: unknown): SupabaseQueryBuilder<T>
  lt(column: keyof T, value: unknown): SupabaseQueryBuilder<T>
  lte(column: keyof T, value: unknown): SupabaseQueryBuilder<T>
  like(column: keyof T, pattern: string): SupabaseQueryBuilder<T>
  ilike(column: keyof T, pattern: string): SupabaseQueryBuilder<T>
  in(column: keyof T, values: unknown[]): SupabaseQueryBuilder<T>
  is(column: keyof T, value: null | boolean): SupabaseQueryBuilder<T>
  order(column: keyof T, options?: { ascending?: boolean }): SupabaseQueryBuilder<T>
  limit(count: number): SupabaseQueryBuilder<T>
  range(from: number, to: number): SupabaseQueryBuilder<T>
  single(): Promise<{ data: T | null; error: Error | null }>
  maybeSingle(): Promise<{ data: T | null; error: Error | null }>
  then(
    onfulfilled?: (value: { data: T[] | null; error: Error | null }) => unknown
  ): Promise<unknown>
}

/**
 * Supabase 資料庫客戶端類型
 */
export interface SupabaseClient {
  from<T extends keyof Database['public']['Tables']>(
    table: T
  ): SupabaseQueryBuilder<Database['public']['Tables'][T]['Row']>

  rpc<T = unknown>(
    functionName: string,
    params?: Record<string, unknown>
  ): Promise<{ data: T | null; error: Error | null }>
}

/**
 * 資料轉換器泛型介面
 */
export interface DataTransformer<TEntity, TDbRecord = Record<string, unknown>> {
  /** 從資料庫記錄轉換為實體 */
  fromDB(record: TDbRecord): TEntity
  /** 從實體轉換為資料庫記錄 */
  toDB(entity: Partial<TEntity>): Partial<TDbRecord>
}

// ============================================================================
// API 客戶端類型
// ============================================================================

/**
 * API 請求資料類型
 * 支援各種常見的請求資料格式
 */
export type ApiRequestData =
  | Record<string, unknown>
  | string
  | number
  | boolean
  | null
  | FormData
  | Blob

/**
 * API 回應類型
 */
export interface ApiResponse<TData = unknown> {
  success: boolean
  data?: TData
  error?: string
  message?: string
  details?: string
  code?: string
}

/**
 * 分頁 API 回應類型
 */
export interface PaginatedApiResponse<TData = unknown> extends ApiResponse<TData[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * API 請求選項
 */
export interface ApiRequestOptions extends RequestInit {
  skipCSRF?: boolean
  retries?: number
  retryDelay?: number
  timeout?: number
  rateLimitRetry?: boolean
  maxRetryWait?: number
}

/**
 * HTTP 方法類型
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// ============================================================================
// 驗證中間件類型
// ============================================================================

/**
 * Zod 推導類型輔助工具
 */
export type InferZodSchema<T> = T extends z.ZodSchema<infer U> ? U : never

/**
 * 驗證結果泛型類型
 */
export interface ValidationResult<TBody = unknown, TQuery = unknown, TParams = unknown> {
  body?: TBody
  query?: TQuery
  params?: TParams
}

/**
 * 驗證配置泛型選項
 */
export interface ValidationConfig<TBody = unknown, TQuery = unknown, TParams = unknown> {
  body?: z.ZodSchema<TBody>
  query?: z.ZodSchema<TQuery>
  params?: z.ZodSchema<TParams>
  skipBodyValidation?: boolean
  logValidationErrors?: boolean
  errorPrefix?: string
}

/**
 * 驗證後的 API 處理器類型
 */
export type ValidatedApiHandler<
  TResponse = unknown,
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
> = (
  request: Request,
  context: {
    validated: ValidationResult<TBody, TQuery, TParams>
    params?: TParams
  }
) => Promise<Response | TResponse>

// ============================================================================
// 事件處理器類型
// ============================================================================

/**
 * 非同步操作泛型類型
 */
export type AsyncOperation<TResult = unknown> = () => Promise<TResult>

/**
 * 錯誤重試操作類型
 */
export interface RetryOperation<TResult = unknown> {
  operation: AsyncOperation<TResult>
  maxRetries?: number
  retryDelay?: number
  onRetry?: (attempt: number, error: Error) => void
}

/**
 * React 事件處理器類型
 */
export interface ReactEventHandlers {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void | Promise<void>
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>
}

// ============================================================================
// 錯誤處理類型
// ============================================================================

/**
 * 錯誤上下文資訊
 */
export interface ErrorContext {
  module: string
  action: string
  metadata?: Record<string, unknown>
  traceId?: string
}

/**
 * 可重試的錯誤類型
 */
export interface RetryableError extends Error {
  retryable: boolean
  retryAfter?: number
  retryCount?: number
}

// ============================================================================
// 工具類型
// ============================================================================

/**
 * 深度部分類型 - 讓物件的所有屬性都變成可選的
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * 嚴格物件類型 - 不允許額外屬性
 */
export type Strict<T> = T & Record<never, never>

/**
 * 非空值類型
 */
export type NonNullable<T> = T extends null | undefined ? never : T
