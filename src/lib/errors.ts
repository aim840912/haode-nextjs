/**
 * 統一的錯誤處理系統
 *
 * 提供標準化的錯誤類別和處理機制：
 * - 統一的錯誤格式和分類
 * - HTTP 狀態碼自動對應
 * - 錯誤詳情和上下文記錄
 * - 適當的錯誤碼用於前端處理
 */

/**
 * 錯誤類型枚舉
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  INTERNAL = 'INTERNAL_SERVER_ERROR',
}

/**
 * 錯誤詳情介面
 */
export interface ErrorDetails {
  /** 錯誤發生的模組或功能 */
  module?: string
  /** 相關的動作或操作 */
  action?: string
  /** 附加的上下文資訊 */
  context?: Record<string, unknown>
  /** 原始錯誤（如果有的話） */
  originalError?: Error
  /** 錯誤追蹤 ID */
  traceId?: string
}

/**
 * 錯誤回應介面
 */
export interface ErrorResponse {
  success: false
  error: {
    code: string
    type: ErrorType
    message: string
    details?: unknown
    timestamp: string
    traceId?: string
  }
  requestId?: string
}

/**
 * 應用程式基礎錯誤類別
 */
export abstract class AppError extends Error {
  public readonly statusCode: number
  public readonly errorType: ErrorType
  public readonly errorCode: string
  public readonly details?: ErrorDetails
  public readonly isOperational: boolean = true
  public readonly traceId: string

  constructor(
    message: string,
    statusCode: number,
    errorType: ErrorType,
    errorCode: string,
    details?: ErrorDetails
  ) {
    super(message)

    this.name = this.constructor.name
    this.statusCode = statusCode
    this.errorType = errorType
    this.errorCode = errorCode
    this.details = details
    this.traceId = details?.traceId || this.generateTraceId()

    // 確保正確的原型鏈
    Object.setPrototypeOf(this, new.target.prototype)

    // 捕獲堆疊追蹤
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * 生成錯誤追蹤 ID
   */
  private generateTraceId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 轉換為標準錯誤回應格式
   */
  public toResponse(): ErrorResponse {
    return {
      success: false,
      error: {
        code: this.errorCode,
        type: this.errorType,
        message: this.message,
        details: process.env.NODE_ENV === 'development' ? this.details : undefined,
        timestamp: new Date().toISOString(),
        traceId: this.traceId,
      },
    }
  }

  /**
   * 轉換為 JSON 字串（用於日誌記錄）
   */
  public toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorType: this.errorType,
      errorCode: this.errorCode,
      details: this.details,
      traceId: this.traceId,
      stack: this.stack,
    }
  }
}

/**
 * 驗證錯誤 (400)
 */
export class ValidationError extends AppError {
  constructor(message: string = '資料驗證失敗', details?: ErrorDetails) {
    super(message, 400, ErrorType.VALIDATION, 'VALIDATION_FAILED', details)
  }
}

/**
 * 認證錯誤 (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = '認證失敗，請重新登入', details?: ErrorDetails) {
    super(message, 401, ErrorType.AUTHENTICATION, 'AUTHENTICATION_FAILED', details)
  }
}

/**
 * 授權錯誤 (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = '權限不足，無法執行此操作', details?: ErrorDetails) {
    super(message, 403, ErrorType.AUTHORIZATION, 'INSUFFICIENT_PERMISSIONS', details)
  }
}

/**
 * 資源不存在錯誤 (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = '請求的資源不存在', details?: ErrorDetails) {
    super(message, 404, ErrorType.NOT_FOUND, 'RESOURCE_NOT_FOUND', details)
  }
}

/**
 * 衝突錯誤 (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = '資源衝突，操作無法完成', details?: ErrorDetails) {
    super(message, 409, ErrorType.CONFLICT, 'RESOURCE_CONFLICT', details)
  }
}

/**
 * 資料庫錯誤 (500)
 */
export class DatabaseError extends AppError {
  constructor(message: string = '資料庫操作失敗', details?: ErrorDetails) {
    super(message, 500, ErrorType.DATABASE, 'DATABASE_OPERATION_FAILED', details)
  }
}

/**
 * 外部服務錯誤 (502/503)
 */
export class ExternalServiceError extends AppError {
  constructor(
    message: string = '外部服務暫時無法使用',
    statusCode: number = 503,
    details?: ErrorDetails
  ) {
    super(message, statusCode, ErrorType.EXTERNAL_SERVICE, 'EXTERNAL_SERVICE_UNAVAILABLE', details)
  }
}

/**
 * 頻率限制錯誤 (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = '請求頻率過高，請稍後再試', details?: ErrorDetails) {
    super(message, 429, ErrorType.RATE_LIMIT, 'RATE_LIMIT_EXCEEDED', details)
  }
}

/**
 * 方法不允許錯誤 (405)
 */
export class MethodNotAllowedError extends AppError {
  constructor(message: string = '不支援的 HTTP 方法', details?: ErrorDetails) {
    super(message, 405, ErrorType.VALIDATION, 'METHOD_NOT_ALLOWED', details)
  }
}

/**
 * 內部伺服器錯誤 (500)
 */
export class InternalServerError extends AppError {
  constructor(message: string = '內部伺服器錯誤', details?: ErrorDetails) {
    super(message, 500, ErrorType.INTERNAL, 'INTERNAL_SERVER_ERROR', details)
  }
}

/**
 * 錯誤工廠函數 - 根據常見錯誤模式創建適當的錯誤實例
 */
export class ErrorFactory {
  /**
   * 根據 Supabase 錯誤創建適當的應用程式錯誤
   */
  static fromSupabaseError(error: Error | unknown, context?: Partial<ErrorDetails>): AppError {
    const details: ErrorDetails = {
      ...context,
      originalError: error instanceof Error ? error : new Error(String(error)),
      module: context?.module || 'Database',
    }

    const errorMessage = error instanceof Error ? error.message : String(error)

    // RLS 政策錯誤
    if (errorMessage?.includes('row-level security policy') || errorMessage?.includes('policy')) {
      return new AuthorizationError(' 資料庫權限設定問題，請聯繫系統管理員', details)
    }

    // 權限錯誤
    if (errorMessage?.includes('permission') || errorMessage?.includes('violates')) {
      return new AuthorizationError('權限不足，請確認您已正確登入', details)
    }

    // 連接錯誤
    if (errorMessage?.includes('connection') || errorMessage?.includes('timeout')) {
      return new ExternalServiceError('資料庫連線問題，請稍後再試', 503, details)
    }

    // 唯一性約束錯誤
    if (errorMessage?.includes('duplicate') || errorMessage?.includes('unique')) {
      return new ConflictError('資料已存在，請勿重複提交', details)
    }

    // 外鍵約束錯誤
    if (errorMessage?.includes('foreign key') || errorMessage?.includes('constraint')) {
      return new ValidationError('資料關聯錯誤，請檢查相關資料是否存在', details)
    }

    // 一般資料庫錯誤
    return new DatabaseError(`資料庫操作失敗: ${errorMessage}`, details)
  }

  /**
   * 從一般錯誤創建應用程式錯誤
   */
  static fromError(error: Error, context?: Partial<ErrorDetails>): AppError {
    const details: ErrorDetails = {
      ...context,
      originalError: error,
    }

    // 如果已經是 AppError，直接返回
    if (error instanceof AppError) {
      return error
    }

    // 其他一般錯誤
    return new InternalServerError(error.message || '未知錯誤', details)
  }

  /**
   * 創建驗證錯誤（支援多個驗證失敗）
   */
  static createValidationError(
    errors: string[] | string,
    context?: Partial<ErrorDetails>
  ): ValidationError {
    const message = Array.isArray(errors) ? `資料驗證失敗: ${errors.join(', ')}` : errors

    return new ValidationError(message, context)
  }
}

/**
 * 錯誤處理工具函數
 */
export class ErrorUtils {
  /**
   * 判斷是否為可操作的錯誤（預期的業務邏輯錯誤）
   */
  static isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational
    }
    return false
  }

  /**
   * 提取錯誤的簡要資訊用於日誌記錄
   */
  static getErrorSummary(error: Error): object {
    if (error instanceof AppError) {
      return {
        type: error.errorType,
        code: error.errorCode,
        message: error.message,
        statusCode: error.statusCode,
        traceId: error.traceId,
      }
    }

    return {
      type: 'UNKNOWN_ERROR',
      message: error.message,
      name: error.name,
    }
  }

  /**
   * 脫敏錯誤訊息（移除敏感資訊）
   */
  static sanitizeErrorMessage(message: string): string {
    // 移除可能的敏感資訊
    return message
      .replace(/password[^\s]*/gi, 'password=***')
      .replace(/token[^\s]*/gi, 'token=***')
      .replace(/key[^\s]*/gi, 'key=***')
      .replace(/secret[^\s]*/gi, 'secret=***')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***@email.com')
  }
}
