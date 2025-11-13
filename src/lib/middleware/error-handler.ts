/**
 * 錯誤處理中間件和工具函數
 *
 * 提供統一的錯誤處理機制：
 * - API 錯誤處理包裝器
 * - 錯誤日誌記錄整合
 * - 錯誤回應格式化
 * - 錯誤恢復和重試邏輯
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  captureError,
  addBreadcrumb,
  setUser,
  startTransaction,
  finishTransaction,
} from '@/lib/error-tracking'
import { AppError, ErrorFactory, ErrorUtils, ErrorResponse } from '@/lib/errors'
import { apiLogger, LogContext } from '@/lib/logger'
import { recordApiRequest } from '@/lib/metrics'

/**
 * API 路由處理器類型
 */
export type ApiHandler = (
  request: NextRequest,
  params?: unknown
) => Promise<Response | NextResponse>

/**
 * 動態路由處理器類型
 */
export type DynamicRouteHandler<T = Record<string, string>> = (
  request: NextRequest,
  context: { params: Promise<T> }
) => Promise<NextResponse>

/**
 * 錯誤處理選項
 */
export interface ErrorHandlerOptions {
  /** 模組名稱（用於日誌記錄） */
  module?: string
  /** 是否記錄錯誤到審計日誌 */
  enableAuditLog?: boolean
  /** 是否啟用錯誤重試 */
  enableRetry?: boolean
  /** 重試次數 */
  retryAttempts?: number
  /** 重試延遲（毫秒） */
  retryDelay?: number
  /** 自定義錯誤轉換函數 */
  errorTransformer?: (error: Error) => AppError
}

/**
 * 統一的錯誤處理中間件 - 支持普通路由
 */
export function withErrorHandler(handler: ApiHandler, options?: ErrorHandlerOptions): ApiHandler

/**
 * 統一的錯誤處理中間件 - 支持動態路由
 */
export function withErrorHandler<T = Record<string, string>>(
  handler: DynamicRouteHandler<T>,
  options?: ErrorHandlerOptions
): DynamicRouteHandler<T>

/**
 * 統一的錯誤處理中間件實作
 */
export function withErrorHandler<T = Record<string, string>>(
  handler: ApiHandler | DynamicRouteHandler<T>,
  options: ErrorHandlerOptions = {}
): ApiHandler | DynamicRouteHandler<T> {
  return async (request: NextRequest, context?: unknown): Promise<NextResponse> => {
    const startTime = performance.now()
    const traceId = generateTraceId()

    // 設定日誌上下文
    const logContext: LogContext = {
      module: options.module || 'API',
      action: `${request.method} ${new URL(request.url).pathname}`,
      requestId: traceId,
      metadata: {
        method: request.method,
        path: new URL(request.url).pathname,
        userAgent: request.headers.get('user-agent'),
      },
    }

    // 開始 Sentry 效能追蹤
    const sentryTransaction = startTransaction(
      `${request.method} ${new URL(request.url).pathname}`,
      'http.server'
    )

    // 設定使用者上下文（如果有）
    const userId = request.headers.get('x-user-id') || logContext.userId
    if (userId) {
      setUser(userId)
    }

    // 記錄 API 請求麵包屑
    addBreadcrumb(`API 請求: ${request.method} ${new URL(request.url).pathname}`, 'http', {
      method: request.method,
      url: new URL(request.url).pathname,
      userAgent: request.headers.get('user-agent'),
    })

    try {
      // 記錄請求開始
      apiLogger.debug(`API 請求開始`, logContext)

      // 執行處理器（可能包含重試邏輯）
      let result: Response | NextResponse

      if (options.enableRetry) {
        result = await withRetry(
          () => {
            // 檢查是否為動態路由處理器
            if (context && typeof context === 'object' && 'params' in context) {
              return (handler as DynamicRouteHandler<T>)(request, context as { params: Promise<T> })
            } else {
              return (handler as ApiHandler)(request, context)
            }
          },
          options.retryAttempts || 3,
          options.retryDelay || 1000,
          logContext
        )
      } else {
        // 檢查是否為動態路由處理器
        if (context && typeof context === 'object' && 'params' in context) {
          result = await (handler as DynamicRouteHandler<T>)(
            request,
            context as { params: Promise<T> }
          )
        } else {
          result = await (handler as ApiHandler)(request, context)
        }
      }

      // 記錄成功請求
      const duration = performance.now() - startTime
      const durationMs = Math.round(duration)

      apiLogger.info(`API 請求成功`, {
        ...logContext,
        metadata: {
          ...logContext.metadata,
          statusCode: result.status,
          duration: durationMs,
        },
      })

      // 記錄 API 指標
      recordApiRequest(request.method, new URL(request.url).pathname, durationMs, result.status)

      // 完成 Sentry 效能追蹤
      finishTransaction(sentryTransaction)

      // 確保返回正確的類型
      if (result instanceof NextResponse) {
        return result
      }
      // 如果是 Response,轉換為 NextResponse
      const body = await result.text()
      return new NextResponse(body, {
        status: result.status,
        statusText: result.statusText,
        headers: result.headers,
      })
    } catch (error) {
      // 轉換為標準錯誤格式
      let appError: AppError

      if (error instanceof AppError) {
        appError = error
      } else if (options.errorTransformer) {
        appError = options.errorTransformer(error as Error)
      } else {
        appError = ErrorFactory.fromError(error as Error, {
          module: options.module,
          action: logContext.action,
          traceId,
        })
      }

      // 記錄錯誤日誌
      const duration = performance.now() - startTime
      const errorLogContext: LogContext = {
        ...logContext,
        metadata: {
          ...logContext.metadata,
          statusCode: appError.statusCode,
          errorType: appError.errorType,
          errorCode: appError.errorCode,
          duration: Math.round(duration),
          traceId: appError.traceId,
        },
      }

      // 根據錯誤嚴重性選擇日誌級別
      if (appError.statusCode >= 500) {
        apiLogger.error(`API 伺服器錯誤`, error as Error, errorLogContext)
      } else if (appError.statusCode >= 400) {
        apiLogger.warn(`API 客戶端錯誤`, errorLogContext)
      } else {
        apiLogger.info(`API 處理訊息`, errorLogContext)
      }

      // 記錄 API 錯誤指標
      recordApiRequest(
        request.method,
        new URL(request.url).pathname,
        Math.round(duration),
        appError.statusCode
      )

      // 發送錯誤到 Sentry（除了已在 logger 中處理的之外）
      if (appError.statusCode >= 500) {
        captureError(error as Error, logContext)
      }

      // 完成 Sentry 效能追蹤（標記為失敗）
      if (sentryTransaction) {
        sentryTransaction.setStatus('internal_error')
        finishTransaction(sentryTransaction)
      }

      // 建立錯誤回應
      const errorResponse = createErrorResponse(appError)

      return NextResponse.json(errorResponse, {
        status: appError.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'X-Error-Trace-Id': appError.traceId,
        },
      })
    }
  }
}

/**
 * 重試機制包裝器
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number,
  delayMs: number,
  logContext: LogContext
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      // 如果是客戶端錯誤（4xx），不重試
      if (error instanceof AppError && error.statusCode < 500) {
        throw error
      }

      // 如果是最後一次嘗試，拋出錯誤
      if (attempt === maxAttempts) {
        apiLogger.error(`重試失敗，已達最大嘗試次數`, lastError, {
          ...logContext,
          metadata: {
            ...logContext.metadata,
            attempts: attempt,
            maxAttempts,
          },
        })
        break
      }

      // 記錄重試日誌
      apiLogger.warn(`操作失敗，準備重試`, {
        ...logContext,
        metadata: {
          ...logContext.metadata,
          attempt,
          maxAttempts,
          delayMs,
          error: ErrorUtils.getErrorSummary(lastError),
        },
      })

      // 延遲後重試
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  throw lastError || new Error('Unknown error occurred during retry')
}

/**
 * 建立標準錯誤回應
 */
function createErrorResponse(error: AppError): ErrorResponse {
  const response = error.toResponse()

  // 在開發環境下提供更詳細的錯誤資訊
  if (process.env.NODE_ENV === 'development') {
    response.error.details = {
      ...error.details,
      stack: error.stack?.split('\n').slice(0, 10), // 只顯示前 10 行堆疊
    }
  }

  return response
}

/**
 * 生成追蹤 ID
 */
function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 全域未處理錯誤捕獲器（用於 Node.js 環境）
 */
export function setupGlobalErrorHandlers(): void {
  // 捕獲未處理的 Promise 拒絕
  process.on('unhandledRejection', (reason, promise) => {
    apiLogger.error('未處理的 Promise 拒絕', reason as Error, {
      module: 'Global',
      action: 'unhandledRejection',
      metadata: {
        reason: reason instanceof Error ? ErrorUtils.getErrorSummary(reason) : reason,
        promise: promise.toString(),
      },
    })

    // 在生產環境中可能需要終止程序
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  })

  // 捕獲未處理的例外
  process.on('uncaughtException', error => {
    apiLogger.error('未處理的例外', error, {
      module: 'Global',
      action: 'uncaughtException',
    })

    // 優雅地關閉程序
    process.exit(1)
  })
}

/**
 * 錯誤處理工具函數匯出
 */
export { createErrorResponse }
