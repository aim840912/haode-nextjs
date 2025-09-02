/**
 * 錯誤追蹤整合模組
 * 
 * 功能特色：
 * - 與現有 logger 系統無縫整合
 * - 支援多種錯誤追蹤服務（可擴展）
 * - 自動捕獲和分組錯誤
 * - 使用者上下文追蹤
 * - 效能監控整合
 * 
 * 目前支援：內建錯誤收集系統
 * 未來可擴展：Sentry, LogRocket, Rollbar 等
 */

import { LogEntry, LogContext } from './logger'
import { logger } from './logger'

/**
 * 錯誤追蹤提供者介面
 */
interface ErrorTrackingProvider {
  captureError(error: Error, context?: LogContext): void
  captureWarning(message: string, context?: LogContext): void
  setUser(userId: string, email?: string, username?: string): void
  addBreadcrumb(message: string, category?: string, data?: Record<string, any>): void
  startTransaction(name: string, operation?: string): any
  finishTransaction(transaction: any): void
}

/**
 * 內建錯誤收集器實作
 */
class BuiltInErrorTracker implements ErrorTrackingProvider {
  private breadcrumbs: Array<{
    message: string
    category: string
    data?: Record<string, any>
    timestamp: number
  }> = []
  
  private currentUser: {
    id?: string
    email?: string
    username?: string
  } = {}
  
  private readonly maxBreadcrumbs = 50

  captureError(error: Error, context?: LogContext): void {
    logger.error(error.message, error, {
      ...context,
      metadata: {
        ...(context?.metadata || {}),
        user: this.currentUser,
        breadcrumbs: this.getRecentBreadcrumbs(10)
      }
    })
  }

  captureWarning(message: string, context?: LogContext): void {
    logger.warn(message, {
      ...context,
      metadata: {
        ...(context?.metadata || {}),
        user: this.currentUser,
        breadcrumbs: this.getRecentBreadcrumbs(5)
      }
    })
  }

  setUser(userId: string, email?: string, username?: string): void {
    this.currentUser = { id: userId, email, username }
    logger.info(`使用者上下文已設定: ${userId}`, {
      metadata: {
        userId,
        email,
        username
      }
    })
  }

  addBreadcrumb(message: string, category: string = 'custom', data?: Record<string, any>): void {
    this.breadcrumbs.push({
      message,
      category,
      data,
      timestamp: Date.now()
    })
    
    // 維持麵包屑數量在合理範圍
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs)
    }
  }

  startTransaction(name: string, operation: string = 'custom'): any {
    const transaction = {
      name,
      operation,
      startTime: Date.now(),
      id: Math.random().toString(36).substring(7),
      status: 'ok', // 初始狀態
      
      // 添加 setStatus 方法以相容 Sentry API
      setStatus: function(status: string) {
        this.status = status
        logger.debug(`事務狀態更新: ${name}`, {
          metadata: {
            transaction: this.id,
            status: status
          }
        })
      }
    }
    
    logger.debug(`開始事務追蹤: ${name}`, {
      metadata: {
        transaction: transaction.id,
        operation
      }
    })
    
    return transaction
  }

  finishTransaction(transaction: any): void {
    if (!transaction) return
    
    const duration = Date.now() - transaction.startTime
    logger.info(`事務完成: ${transaction.name}`, {
      metadata: {
        transaction: transaction.id,
        operation: transaction.operation,
        duration: `${duration}ms`,
        status: transaction.status || 'ok'
      }
    })
  }
  
  private getRecentBreadcrumbs(limit: number) {
    return this.breadcrumbs.slice(-limit)
  }
}

// 全域錯誤追蹤提供者實例
let errorTracker: ErrorTrackingProvider = new BuiltInErrorTracker()

/**
 * 檢查錯誤追蹤是否可用
 */
export function isErrorTrackingAvailable(): boolean {
  // 內建錯誤追蹤總是可用
  return true
}

/**
 * 捕獲錯誤
 */
export function captureError(error: Error, context?: LogContext): void {
  try {
    errorTracker.captureError(error, context)
  } catch (trackingError) {
    logger.error('錯誤追蹤失敗', undefined, {
      metadata: {
        originalError: error.message,
        trackingError: trackingError instanceof Error ? trackingError.message : 'Unknown error'
      }
    })
  }
}

/**
 * 捕獲致命錯誤
 */
export function captureFatalError(error: Error, context?: LogContext): void {
  try {
    // 致命錯誤使用 fatal 級別記錄
    logger.fatal(error.message, error, {
      ...context,
      metadata: {
        ...(context?.metadata || {}),
        fatal: true
      }
    })
    
    // 同時使用一般錯誤追蹤
    errorTracker.captureError(error, { 
      ...context, 
      metadata: { 
        ...(context?.metadata || {}), 
        severity: 'fatal' 
      } 
    })
  } catch (trackingError) {
    logger.error('致命錯誤追蹤失敗', undefined, {
      metadata: {
        originalError: error.message,
        trackingError: trackingError instanceof Error ? trackingError.message : 'Unknown error'
      }
    })
  }
}

/**
 * 捕獲警告訊息
 */
export function captureWarning(message: string, context?: LogContext): void {
  try {
    errorTracker.captureWarning(message, context)
  } catch (trackingError) {
    logger.error('警告追蹤失敗', undefined, {
      metadata: {
        originalMessage: message,
        trackingError: trackingError instanceof Error ? trackingError.message : 'Unknown error'
      }
    })
  }
}

/**
 * 添加使用者操作麵包屑（用於錯誤重現）
 */
export function addBreadcrumb(message: string, category: string = 'custom', data?: Record<string, any>): void {
  try {
    errorTracker.addBreadcrumb(message, category, data)
  } catch (trackingError) {
    logger.debug('麵包屑記錄失敗', {
      metadata: {
        message,
        category,
        trackingError: trackingError instanceof Error ? trackingError.message : 'Unknown error'
      }
    })
  }
}

/**
 * 設定使用者上下文
 */
export function setUser(userId: string, email?: string, username?: string): void {
  try {
    errorTracker.setUser(userId, email, username)
  } catch (trackingError) {
    logger.error('使用者上下文設定失敗', undefined, {
      metadata: {
        userId,
        trackingError: trackingError instanceof Error ? trackingError.message : 'Unknown error'
      }
    })
  }
}

/**
 * 開始效能追蹤事務
 */
export function startTransaction(name: string, operation: string = 'custom'): any {
  try {
    return errorTracker.startTransaction(name, operation)
  } catch (trackingError) {
    logger.debug('事務開始失敗', {
      metadata: {
        name,
        operation,
        trackingError: trackingError instanceof Error ? trackingError.message : 'Unknown error'
      }
    })
    return null
  }
}

/**
 * 完成效能追蹤事務
 */
export function finishTransaction(transaction: any): void {
  if (!transaction) return
  
  try {
    errorTracker.finishTransaction(transaction)
  } catch (trackingError) {
    logger.debug('事務完成失敗', {
      metadata: {
        trackingError: trackingError instanceof Error ? trackingError.message : 'Unknown error'
      }
    })
  }
}

/**
 * 清空錯誤追蹤佇列（在應用關閉前）
 */
export async function flushErrorTracking(timeout: number = 5000): Promise<boolean> {
  try {
    // 內建錯誤追蹤不需要特別的 flush 操作
    // 未來可以在這裡添加其他提供者的 flush 邏輯
    logger.info('錯誤追蹤佇列清空完成')
    return true
  } catch (error) {
    logger.error('錯誤追蹤佇列清空失敗', undefined, {
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
    return false
  }
}

/**
 * 設定錯誤追蹤提供者（用於未來擴展）
 */
export function setErrorTrackingProvider(provider: ErrorTrackingProvider): void {
  errorTracker = provider
  logger.info('錯誤追蹤提供者已更新')
}

/**
 * 取得當前錯誤追蹤提供者類型
 */
export function getErrorTrackingProvider(): string {
  return errorTracker.constructor.name
}

// 相容性別名（保持向後相容）
export const isSentryAvailable = isErrorTrackingAvailable
export const flushSentry = flushErrorTracking