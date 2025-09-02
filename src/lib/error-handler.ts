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
import { AppError, ErrorFactory, ErrorUtils, ErrorResponse } from './errors'
import { logger, apiLogger } from './logger'
import { LogContext } from './logger'
import { recordApiRequest } from './metrics'
import { captureError, addBreadcrumb, setUser, startTransaction, finishTransaction } from './error-tracking'

/**
 * API 路由處理器類型
 */
export type ApiHandler = (request: NextRequest, params?: unknown) => Promise<NextResponse>

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
 * 錯誤處理統計
 */
interface ErrorStats {
  timestamp: number
  errorType: string
  statusCode: number
  module?: string
  userAgent?: string
  ip?: string
  path?: string
  method?: string
}

/**
 * 增強的錯誤統計收集器
 */
class ErrorStatsCollector {
  private static instance: ErrorStatsCollector
  private stats: ErrorStats[] = []
  private readonly maxStats = 1000 // 最多保留 1000 筆錯誤統計
  private errorPatterns: Map<string, number> = new Map() // 錯誤模式分析
  private alertThresholds = {
    errorRatePerMinute: 10, // 每分鐘錯誤超過 10 次就警告
    criticalErrorsPerHour: 5, // 每小時致命錯誤超過 5 次就警告
    sameErrorPattern: 5 // 相同錯誤模式出現超過 5 次就警告
  }

  private constructor() {
    // 定期清理過期統計資料
    setInterval(() => this.cleanup(), 5 * 60 * 1000) // 每 5 分鐘清理一次
  }

  static getInstance(): ErrorStatsCollector {
    if (!ErrorStatsCollector.instance) {
      ErrorStatsCollector.instance = new ErrorStatsCollector()
    }
    return ErrorStatsCollector.instance
  }

  /**
   * 記錄錯誤統計
   */
  recordError(error: AppError, request: NextRequest): void {
    const stat: ErrorStats = {
      timestamp: Date.now(),
      errorType: error.errorType,
      statusCode: error.statusCode,
      module: error.details?.module,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      path: new URL(request.url).pathname,
      method: request.method,
    }

    this.stats.push(stat)

    // 錯誤模式分析
    const errorPattern = `${error.errorType}:${stat.path}:${stat.method}`
    this.errorPatterns.set(errorPattern, (this.errorPatterns.get(errorPattern) || 0) + 1)

    // 保持統計資料在合理範圍內
    if (this.stats.length > this.maxStats) {
      this.stats = this.stats.slice(-this.maxStats)
    }

    // 檢查是否需要發出警報
    this.checkAlerts()
  }

  /**
   * 獲取錯誤統計摘要
   */
  getErrorSummary(timeWindowMs: number = 60000): object {
    const now = Date.now()
    const recentErrors = this.stats.filter(stat => now - stat.timestamp <= timeWindowMs)

    const summary = {
      total: recentErrors.length,
      errorRate: this.calculateErrorRate(timeWindowMs),
      byType: {} as Record<string, number>,
      byStatus: {} as Record<number, number>,
      byModule: {} as Record<string, number>,
      byPath: {} as Record<string, number>,
      topPatterns: this.getTopErrorPatterns(5),
      trends: this.getErrorTrends(),
      alerts: this.getActiveAlerts()
    }

    recentErrors.forEach(stat => {
      summary.byType[stat.errorType] = (summary.byType[stat.errorType] || 0) + 1
      summary.byStatus[stat.statusCode] = (summary.byStatus[stat.statusCode] || 0) + 1
      if (stat.module) {
        summary.byModule[stat.module] = (summary.byModule[stat.module] || 0) + 1
      }
      if (stat.path) {
        summary.byPath[stat.path] = (summary.byPath[stat.path] || 0) + 1
      }
    })

    return summary
  }

  /**
   * 計算錯誤率
   */
  private calculateErrorRate(timeWindowMs: number): number {
    const now = Date.now()
    const recentErrors = this.stats.filter(stat => now - stat.timestamp <= timeWindowMs)
    const minutesInWindow = timeWindowMs / (60 * 1000)
    return recentErrors.length / minutesInWindow
  }

  /**
   * 取得頂級錯誤模式
   */
  private getTopErrorPatterns(limit: number): Array<{ pattern: string; count: number }> {
    return Array.from(this.errorPatterns.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([pattern, count]) => ({ pattern, count }))
  }

  /**
   * 取得錯誤趨勢
   */
  private getErrorTrends(): object {
    const now = Date.now()
    const hourAgo = now - 60 * 60 * 1000
    const dayAgo = now - 24 * 60 * 60 * 1000

    return {
      lastHour: this.stats.filter(stat => stat.timestamp >= hourAgo).length,
      lastDay: this.stats.filter(stat => stat.timestamp >= dayAgo).length,
      hourlyAverage: this.stats.filter(stat => stat.timestamp >= dayAgo).length / 24
    }
  }

  /**
   * 檢查警報條件
   */
  private checkAlerts(): void {
    const now = Date.now()
    const lastMinute = now - 60 * 1000
    const lastHour = now - 60 * 60 * 1000

    // 檢查每分鐘錯誤率
    const errorsLastMinute = this.stats.filter(stat => stat.timestamp >= lastMinute).length
    if (errorsLastMinute >= this.alertThresholds.errorRatePerMinute) {
      logger.warn('高錯誤率警報', {
        metadata: {
          errorsPerMinute: errorsLastMinute,
          threshold: this.alertThresholds.errorRatePerMinute
        }
      })
    }

    // 檢查致命錯誤
    const criticalErrorsLastHour = this.stats.filter(stat => 
      stat.timestamp >= lastHour && stat.statusCode >= 500
    ).length
    if (criticalErrorsLastHour >= this.alertThresholds.criticalErrorsPerHour) {
      logger.error('致命錯誤過多警報', undefined, {
        metadata: {
          criticalErrorsPerHour: criticalErrorsLastHour,
          threshold: this.alertThresholds.criticalErrorsPerHour
        }
      })
    }

    // 檢查重複錯誤模式
    this.errorPatterns.forEach((count, pattern) => {
      if (count >= this.alertThresholds.sameErrorPattern) {
        logger.warn('重複錯誤模式警報', {
          metadata: {
            pattern,
            occurrences: count,
            threshold: this.alertThresholds.sameErrorPattern
          }
        })
      }
    })
  }

  /**
   * 取得活躍警報
   */
  private getActiveAlerts(): Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> {
    const alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> = []
    
    const now = Date.now()
    const lastMinute = now - 60 * 1000
    const lastHour = now - 60 * 60 * 1000

    const errorsLastMinute = this.stats.filter(stat => stat.timestamp >= lastMinute).length
    if (errorsLastMinute >= this.alertThresholds.errorRatePerMinute) {
      alerts.push({
        type: 'high_error_rate',
        message: `每分鐘錯誤數過高: ${errorsLastMinute}`,
        severity: errorsLastMinute >= 20 ? 'high' : 'medium'
      })
    }

    const criticalErrorsLastHour = this.stats.filter(stat => 
      stat.timestamp >= lastHour && stat.statusCode >= 500
    ).length
    if (criticalErrorsLastHour >= this.alertThresholds.criticalErrorsPerHour) {
      alerts.push({
        type: 'critical_errors',
        message: `每小時致命錯誤過多: ${criticalErrorsLastHour}`,
        severity: 'high'
      })
    }

    return alerts
  }

  /**
   * 清理過期資料
   */
  private cleanup(): void {
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    // 清理超過一天的統計資料
    const initialLength = this.stats.length
    this.stats = this.stats.filter(stat => stat.timestamp >= oneDayAgo)

    // 清理過期的錯誤模式（重置計數器）
    this.errorPatterns.clear()

    if (initialLength > this.stats.length) {
      logger.debug('錯誤統計清理完成', {
        metadata: {
          removed: initialLength - this.stats.length,
          remaining: this.stats.length
        }
      })
    }
  }

  /**
   * 取得詳細統計資料（用於管理界面）
   */
  getDetailedStats(): object {
    return {
      totalStats: this.stats.length,
      oldestEntry: this.stats.length > 0 ? new Date(Math.min(...this.stats.map(s => s.timestamp))) : null,
      newestEntry: this.stats.length > 0 ? new Date(Math.max(...this.stats.map(s => s.timestamp))) : null,
      errorPatterns: Array.from(this.errorPatterns.entries()).length,
      thresholds: this.alertThresholds
    }
  }
}

// ErrorStatsCollector 將在檔案底部一起導出

/**
 * 統一的錯誤處理中間件 - 支持普通路由
 */
export function withErrorHandler(
  handler: ApiHandler,
  options?: ErrorHandlerOptions
): ApiHandler

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
    addBreadcrumb(
      `API 請求: ${request.method} ${new URL(request.url).pathname}`,
      'http',
      {
        method: request.method,
        url: new URL(request.url).pathname,
        userAgent: request.headers.get('user-agent')
      }
    )

    try {
      // 記錄請求開始
      apiLogger.debug(`API 請求開始`, logContext)

      // 執行處理器（可能包含重試邏輯）
      let result: NextResponse

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
          result = await (handler as DynamicRouteHandler<T>)(request, context as { params: Promise<T> })
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

      return result
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

      // 記錄錯誤統計
      ErrorStatsCollector.getInstance().recordError(appError, request)

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
    logger.fatal('未處理的 Promise 拒絕', undefined, {
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
    logger.fatal('未處理的例外', error, {
      module: 'Global',
      action: 'uncaughtException',
    })

    // 優雅地關閉程序
    process.exit(1)
  })
}

/**
 * 健康檢查端點錯誤統計
 */
export function getHealthStatus(): {
  status: 'healthy' | 'degraded'
  timestamp: string
  errors: {
    last5Minutes: object
    criticalErrors: number
  }
} {
  const collector = ErrorStatsCollector.getInstance()
  const errorSummary = collector.getErrorSummary(300000) // 5 分鐘內的錯誤

  const summary = errorSummary as any // 暫時使用 any 類型以避免建置錯誤
  
  return {
    status: summary.total > 50 ? 'degraded' : 'healthy',
    timestamp: new Date().toISOString(),
    errors: {
      last5Minutes: summary,
      criticalErrors: summary.byStatus?.[500] || 0,
    },
  }
}

/**
 * 錯誤處理工具函數匯出
 */
export { ErrorStatsCollector, createErrorResponse }
