/**
 * API 相關統一類型定義
 * 
 * 用於 API 客戶端和中間件的類型安全
 */

import { NextRequest, NextResponse } from 'next/server'

// API 請求選項
export interface ApiRequestOptions {
  timeout?: number
  retries?: number
  headers?: Record<string, string>
  signal?: AbortSignal
  cache?: RequestCache
}

// API 回應包裝
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
  requestId?: string
}

// API 錯誤回應
export interface ApiErrorResponse {
  success: false
  error: string
  message: string
  details?: unknown
  timestamp: string
  requestId: string
}

// HTTP 方法類型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// API 處理器函數類型
export type ApiHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse | Response>

// 驗證結果
export interface ValidationResult {
  body?: unknown
  query?: Record<string, unknown>
  params?: Record<string, string>
}

// 帶驗證的 API 上下文
export interface ValidatedApiContext {
  params?: Record<string, string>
  validated: ValidationResult
  user?: {
    id: string
    email: string
    role?: string
    [key: string]: unknown
  }
}

// 驗證後的 API 處理器
export type ValidatedApiHandler = (
  request: NextRequest,
  context: ValidatedApiContext
) => Promise<NextResponse | Response>

// 錯誤追蹤類型
export interface ErrorContext {
  user?: {
    id: string
    email?: string
    [key: string]: unknown
  }
  request?: {
    method: string
    url: string
    headers?: Record<string, string>
    body?: unknown
  }
  metadata?: Record<string, unknown>
  breadcrumbs?: Array<{
    message: string
    category?: string
    timestamp: string
    data?: Record<string, unknown>
  }>
}

// 交易追蹤類型
export interface Transaction {
  id: string
  name: string
  operation: string
  startTime: number
  status: string
  metadata?: Record<string, unknown>
  setStatus: (status: string) => void
}

// 分頁參數
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

// 排序參數
export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 查詢參數基類
export interface BaseQueryParams extends PaginationParams, SortParams {
  search?: string
  filter?: Record<string, unknown>
}