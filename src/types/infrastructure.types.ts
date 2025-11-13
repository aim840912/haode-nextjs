/**
 * 核心基礎設施類型定義
 *
 * 為 Supabase 服務、API 客戶端和驗證中間件提供類型安全的介面定義
 */

import { z } from 'zod'
import { Database } from './database'

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
