/**
 * API 回應工具函數
 * 
 * 提供統一的 API 回應格式和處理工具：
 * - 標準化的成功和錯誤回應格式
 * - 分頁回應支援  
 * - 整合新的錯誤處理系統
 */

import { NextResponse } from 'next/server'
import { AppError, ErrorResponse, ErrorFactory } from './errors'
import { apiLogger } from './logger'

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
  meta?: ResponseMeta;
}

/**
 * 回應元資料（分頁、統計等）
 */
export interface ResponseMeta {
  /** 分頁資訊 */
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  /** 統計資訊 */
  stats?: Record<string, any>
  /** 執行時間 */
  executionTime?: number
}

/**
 * 回應選項
 */
export interface ResponseOptions {
  /** 請求追蹤 ID */
  requestId?: string
  /** 自定義標頭 */
  headers?: Record<string, string>
  /** 快取控制 */
  cache?: {
    maxAge?: number
    noCache?: boolean
  }
}

/**
 * 分頁參數介面
 */
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

/**
 * 分頁結果介面
 */
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export class ApiResponseBuilder {
  static success<T>(data: T, message?: string, options: ResponseOptions = {}): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      requestId: options.requestId
    };
    
    const headers = this.buildHeaders(options)
    return NextResponse.json(response, {
      status: 200,
      headers
    });
  }
  
  static created<T>(data: T, message?: string, options: ResponseOptions = {}): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message: message || '資源創建成功',
      timestamp: new Date().toISOString(),
      requestId: options.requestId
    };
    
    const headers = this.buildHeaders(options)
    return NextResponse.json(response, {
      status: 201,
      headers
    });
  }

  /**
   * 建立分頁成功回應
   */
  static successWithPagination<T>(
    result: PaginatedResult<T>,
    message?: string,
    options: ResponseOptions = {}
  ): NextResponse {
    const totalPages = Math.ceil(result.total / result.limit)
    
    const response: ApiResponse<T[]> = {
      success: true,
      data: result.items,
      message,
      timestamp: new Date().toISOString(),
      requestId: options.requestId,
      meta: {
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages,
          hasNext: result.page < totalPages,
          hasPrev: result.page > 1
        }
      }
    };

    const headers = this.buildHeaders(options)
    return NextResponse.json(response, {
      status: 200,
      headers
    });
  }
  
  static error(message: string, status: number = 400, options: ResponseOptions = {}): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      requestId: options.requestId
    };
    
    const headers = this.buildHeaders(options)
    return NextResponse.json(response, {
      status,
      headers
    });
  }

  /**
   * 使用新錯誤系統的錯誤回應
   */
  static errorFromAppError(error: AppError, options: ResponseOptions = {}): NextResponse<ErrorResponse> {
    const response = error.toResponse()
    response.requestId = options.requestId

    const headers = this.buildHeaders(options)
    headers['X-Error-Trace-Id'] = error.traceId

    return NextResponse.json(response, {
      status: error.statusCode,
      headers
    })
  }

  /**
   * 建構回應標頭
   */
  private static buildHeaders(options: ResponseOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Powered-By': 'Haude Farm API',
      ...options.headers
    }

    // 快取控制
    if (options.cache) {
      if (options.cache.noCache) {
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        headers['Pragma'] = 'no-cache'
        headers['Expires'] = '0'
      } else if (options.cache.maxAge) {
        headers['Cache-Control'] = `max-age=${options.cache.maxAge}`
      }
    }

    return headers
  }
  
  // 保持向後相容性的快捷方法
  static badRequest(message: string = '請求格式錯誤', options: ResponseOptions = {}): NextResponse {
    return this.error(message, 400, options);
  }
  
  static unauthorized(message: string = '未授權訪問', options: ResponseOptions = {}): NextResponse {
    return this.error(message, 401, options);
  }
  
  static forbidden(message: string = '禁止訪問', options: ResponseOptions = {}): NextResponse {
    return this.error(message, 403, options);
  }
  
  static notFound(message: string = '資源不存在', options: ResponseOptions = {}): NextResponse {
    return this.error(message, 404, options);
  }
  
  static methodNotAllowed(message: string = '不支援的請求方法', options: ResponseOptions = {}): NextResponse {
    return this.error(message, 405, options);
  }
  
  static conflict(message: string = '資源衝突', options: ResponseOptions = {}): NextResponse {
    return this.error(message, 409, options);
  }
  
  static tooManyRequests(message: string = '請求過於頻繁', options: ResponseOptions = {}): NextResponse {
    return this.error(message, 429, options);
  }
  
  static internalError(message: string = '伺服器內部錯誤', options: ResponseOptions = {}): NextResponse {
    return this.error(message, 500, options);
  }

  /**
   * 建立無內容回應（通常用於 DELETE 操作）
   */
  static noContent(options: ResponseOptions = {}): NextResponse {
    const headers = this.buildHeaders(options)
    return new NextResponse(null, {
      status: 204,
      headers
    })
  }
}

/**
 * 分頁工具函數
 */
export class PaginationUtils {
  /**
   * 標準化分頁參數
   */
  static normalizePaginationParams(params: PaginationParams): Required<PaginationParams> {
    const page = Math.max(1, params.page || 1)
    const limit = Math.min(100, Math.max(1, params.limit || 20)) // 限制最大 100 筆
    const offset = params.offset !== undefined ? params.offset : (page - 1) * limit

    return { page, limit, offset }
  }

  /**
   * 從 URL 搜尋參數解析分頁參數
   */
  static fromSearchParams(searchParams: URLSearchParams): Required<PaginationParams> {
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    return this.normalizePaginationParams({ page, limit, offset })
  }
}

/**
 * 增強的 API 錯誤處理函數
 */
export function handleApiError(error: any, options: ResponseOptions = {}): NextResponse {
  // 使用新的 logger 系統而非 console.error
  apiLogger.error('API 錯誤處理', error as Error, {
    module: 'API',
    action: 'handleApiError',
    requestId: options.requestId
  });
  
  // 如果已經是 AppError，直接使用
  if (error instanceof AppError) {
    return ApiResponseBuilder.errorFromAppError(error, options)
  }

  // 根據錯誤名稱創建適當的 AppError
  let appError: AppError

  if (error.name === 'ValidationError') {
    appError = ErrorFactory.createValidationError(error.message)
  } else if (error.name === 'UnauthorizedError') {
    appError = new (require('./errors').AuthenticationError)(error.message)
  } else if (error.name === 'NotFoundError') {
    appError = new (require('./errors').NotFoundError)(error.message)
  } else {
    appError = ErrorFactory.fromError(error)
  }
  
  return ApiResponseBuilder.errorFromAppError(appError, options)
}

/**
 * API 錯誤處理助手 - 包裝異步操作
 */
export async function handleApiOperation<T>(
  operation: () => Promise<T>,
  errorContext?: {
    module?: string
    action?: string
    requestId?: string
  }
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    // 使用 logger 記錄錯誤
    apiLogger.error(
      `API 操作失敗: ${errorContext?.action || 'unknown'}`,
      error as Error,
      {
        module: errorContext?.module || 'API',
        action: errorContext?.action,
        requestId: errorContext?.requestId
      }
    )

    // 重新拋出錯誤讓上層處理
    throw error
  }
}

// 快捷方法匯出 - 使用箭頭函數保持正確的 this 上下文
export const success = <T>(data: T, message?: string, options: ResponseOptions = {}) => 
  ApiResponseBuilder.success(data, message, options)

export const created = <T>(data: T, message?: string, options: ResponseOptions = {}) => 
  ApiResponseBuilder.created(data, message, options)

export const successWithPagination = <T>(
  result: PaginatedResult<T>, 
  message?: string, 
  options: ResponseOptions = {}
) => ApiResponseBuilder.successWithPagination(result, message, options)

export const error = (message: string, status: number = 400, options: ResponseOptions = {}) => 
  ApiResponseBuilder.error(message, status, options)

export const errorFromAppError = (error: AppError, options: ResponseOptions = {}) => 
  ApiResponseBuilder.errorFromAppError(error, options)

export const noContent = (options: ResponseOptions = {}) => 
  ApiResponseBuilder.noContent(options)