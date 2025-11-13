/**
 * 統一的日誌管理系統
 *
 * 功能特色：
 * - 環境感知的日誌級別控制
 * - 結構化的日誌格式
 * - 支援多個輸出目標
 * - 效能友善（生產環境最小化日誌）
 * - TypeScript 類型安全
 * - 整合 Sentry 錯誤追蹤
 */

import { captureError, captureFatalError, captureWarning, addBreadcrumb } from './error-tracking'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  userId?: string
  requestId?: string
  module?: string
  action?: string
  metadata?: Record<string, unknown>
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  levelName: string
  message: string
  context?: LogContext
  stack?: string
}

class Logger {
  private readonly isDevelopment: boolean
  private readonly isProduction: boolean
  private readonly minLevel: LogLevel

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.isProduction = process.env.NODE_ENV === 'production'

    // 根據環境設定最低日誌級別
    const configuredLevel = process.env.LOG_LEVEL
    if (configuredLevel) {
      // 使用明確設定的日誌級別
      switch (configuredLevel.toUpperCase()) {
        case 'DEBUG':
          this.minLevel = LogLevel.DEBUG
          break
        case 'INFO':
          this.minLevel = LogLevel.INFO
          break
        case 'WARN':
          this.minLevel = LogLevel.WARN
          break
        case 'ERROR':
          this.minLevel = LogLevel.ERROR
          break
        case 'FATAL':
          this.minLevel = LogLevel.FATAL
          break
        default:
          this.minLevel = LogLevel.INFO
          break
      }
    } else if (this.isProduction) {
      this.minLevel = LogLevel.WARN // 生產環境只記錄警告以上
    } else if (process.env.NODE_ENV === 'test') {
      this.minLevel = LogLevel.INFO // 測試環境記錄資訊以上
    } else {
      this.minLevel = LogLevel.DEBUG // 開發環境記錄所有
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): LogEntry {
    const now = new Date()
    const timestamp = this.isDevelopment
      ? now.toLocaleString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3,
        })
      : now.toISOString()

    return {
      timestamp,
      level,
      levelName: LogLevel[level],
      message,
      context,
    }
  }

  private getConsoleMethod(level: LogLevel): 'log' | 'info' | 'warn' | 'error' {
    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        return this.isDevelopment ? 'log' : 'info'
      case LogLevel.WARN:
        return 'warn'
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return 'error'
      default:
        return 'log'
    }
  }

  private getLevelEmoji(level: LogLevel): string {
    if (!this.isDevelopment) return ''
    const emojis = ['🐛', '📝', '⚠️', '❌', '💀']
    return emojis[level] || '📄'
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return

    const entry = this.formatMessage(level, message, context)

    if (error && error.stack) {
      entry.stack = error.stack
    }

    // Console 輸出
    const consoleMethod = this.getConsoleMethod(level)
    const emoji = this.getLevelEmoji(level)

    if (this.isDevelopment) {
      // 開發環境：彩色格式化輸出
      const prefix = `${emoji} [${entry.levelName}] ${entry.timestamp}`
      const contextStr = context ? ` | ${JSON.stringify(context)}` : ''

      // eslint-disable-next-line no-console
      console[consoleMethod](`${prefix} | ${message}${contextStr}`)

      if (error?.stack && level >= LogLevel.ERROR) {
        console.error(error.stack)
      }
    } else {
      // 生產環境：結構化 JSON 輸出
      // eslint-disable-next-line no-console
      console[consoleMethod](JSON.stringify(entry))

      if (error && level >= LogLevel.ERROR) {
        // 送到錯誤追蹤服務 (Sentry)
        this.sendToErrorTracking(entry, error)
      }
    }
  }

  /**
   * 除錯級別日誌 - 只在開發環境顯示
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  /**
   * 資訊級別日誌 - 一般操作記錄
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * 警告級別日誌 - 需要注意但不影響功能
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context)
  }

  /**
   * 錯誤級別日誌 - 功能性錯誤
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error)
  }

  /**
   * 致命錯誤日誌 - 嚴重系統錯誤
   */
  fatal(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.FATAL, message, context, error)
  }

  /**
   * 建立帶有特定模組上下文的 logger
   */
  child(moduleContext: Partial<LogContext>): ModuleLogger {
    return new ModuleLogger(this, moduleContext)
  }

  /**
   * 計時器 - 用於效能監控
   */
  timer(label: string): LogTimer {
    return new LogTimer(this, label)
  }

  /**
   * 發送錯誤到追蹤服務（Sentry）
   */
  private sendToErrorTracking(entry: LogEntry, error: Error): void {
    try {
      const context: LogContext = {
        module: entry.context?.module,
        action: entry.context?.action,
        requestId: entry.context?.requestId,
        userId: entry.context?.userId,
        metadata: entry.context?.metadata,
      }

      if (entry.level === LogLevel.FATAL) {
        captureFatalError(error, context)
      } else if (entry.level === LogLevel.ERROR) {
        captureError(error, context)
      } else if (entry.level === LogLevel.WARN) {
        captureWarning(entry.message, context)
      }

      // 記錄麵包屑追蹤
      addBreadcrumb(entry.message, entry.context?.module || 'logger', {
        level: entry.levelName.toLowerCase(),
        timestamp: entry.timestamp,
      })
    } catch (sentryError) {
      // 避免 Sentry 錯誤影響主要功能
      console.error('Sentry 整合錯誤:', sentryError)
    }
  }
}

/**
 * 模組專用的 Logger，自動帶入模組上下文
 */
class ModuleLogger {
  constructor(
    private parentLogger: Logger,
    private defaultContext: Partial<LogContext>
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context }
  }

  debug(message: string, context?: LogContext): void {
    this.parentLogger.debug(message, this.mergeContext(context))
  }

  info(message: string, context?: LogContext): void {
    this.parentLogger.info(message, this.mergeContext(context))
  }

  warn(message: string, context?: LogContext): void {
    this.parentLogger.warn(message, this.mergeContext(context))
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.parentLogger.error(message, error as Error, this.mergeContext(context))
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    this.parentLogger.fatal(message, error, this.mergeContext(context))
  }

  timer(label: string): LogTimer {
    return this.parentLogger.timer(`${this.defaultContext.module}:${label}`)
  }
}

/**
 * 效能計時器
 */
class LogTimer {
  private startTime: number

  constructor(
    private logger: Logger,
    private label: string
  ) {
    this.startTime = performance.now()
  }

  end(context?: LogContext): number {
    const duration = performance.now() - this.startTime
    this.logger.info(`⏱️ ${this.label}: ${duration.toFixed(2)}ms`, context)
    return duration
  }
}

// 單例實例
export const logger = new Logger()

// 常用模組 loggers
export const apiLogger = logger.child({ module: 'API' })
export const dbLogger = logger.child({ module: 'Database' })
export const cacheLogger = logger.child({ module: 'Cache' })
export const authLogger = logger.child({ module: 'Auth' })
