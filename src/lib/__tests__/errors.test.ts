/**
 * errors.ts 測試
 *
 * 測試統一錯誤處理系統的所有功能:
 * - 所有錯誤類別的建立和屬性
 * - ErrorFactory 工廠方法
 * - ErrorUtils 工具函數
 * - 錯誤轉換和序列化
 */

import { describe, it, expect, vi } from 'vitest'
import {
  ErrorType,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  MethodNotAllowedError,
  InternalServerError,
  ErrorFactory,
  ErrorUtils,
  type ErrorDetails,
} from '../errors'

describe('Error System', () => {
  // ==========================================================================
  // ValidationError
  // ==========================================================================
  describe('ValidationError', () => {
    it('應該建立驗證錯誤實例', () => {
      // Act
      const error = new ValidationError('測試驗證錯誤')

      // Assert
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe('測試驗證錯誤')
      expect(error.statusCode).toBe(400)
      expect(error.errorType).toBe(ErrorType.VALIDATION)
      expect(error.errorCode).toBe('VALIDATION_FAILED')
      expect(error.isOperational).toBe(true)
      expect(error.traceId).toBeDefined()
    })

    it('應該使用預設訊息', () => {
      // Act
      const error = new ValidationError()

      // Assert
      expect(error.message).toBe('資料驗證失敗')
    })

    it('應該包含詳細資訊', () => {
      // Arrange
      const details: ErrorDetails = {
        module: 'TestModule',
        action: 'testAction',
        context: { field: 'email' },
      }

      // Act
      const error = new ValidationError('測試錯誤', details)

      // Assert
      expect(error.details).toEqual(details)
      expect(error.details?.module).toBe('TestModule')
    })
  })

  // ==========================================================================
  // AuthenticationError
  // ==========================================================================
  describe('AuthenticationError', () => {
    it('應該建立認證錯誤實例', () => {
      // Act
      const error = new AuthenticationError('無效的認證憑證')

      // Assert
      expect(error.message).toBe('無效的認證憑證')
      expect(error.statusCode).toBe(401)
      expect(error.errorType).toBe(ErrorType.AUTHENTICATION)
      expect(error.errorCode).toBe('AUTHENTICATION_FAILED')
    })

    it('應該使用預設訊息', () => {
      // Act
      const error = new AuthenticationError()

      // Assert
      expect(error.message).toBe('認證失敗，請重新登入')
    })
  })

  // ==========================================================================
  // AuthorizationError
  // ==========================================================================
  describe('AuthorizationError', () => {
    it('應該建立授權錯誤實例', () => {
      // Act
      const error = new AuthorizationError('權限不足')

      // Assert
      expect(error.statusCode).toBe(403)
      expect(error.errorType).toBe(ErrorType.AUTHORIZATION)
      expect(error.errorCode).toBe('INSUFFICIENT_PERMISSIONS')
    })
  })

  // ==========================================================================
  // NotFoundError
  // ==========================================================================
  describe('NotFoundError', () => {
    it('應該建立資源不存在錯誤實例', () => {
      // Act
      const error = new NotFoundError('找不到產品')

      // Assert
      expect(error.statusCode).toBe(404)
      expect(error.errorType).toBe(ErrorType.NOT_FOUND)
      expect(error.errorCode).toBe('RESOURCE_NOT_FOUND')
    })
  })

  // ==========================================================================
  // ConflictError
  // ==========================================================================
  describe('ConflictError', () => {
    it('應該建立衝突錯誤實例', () => {
      // Act
      const error = new ConflictError('資源已存在')

      // Assert
      expect(error.statusCode).toBe(409)
      expect(error.errorType).toBe(ErrorType.CONFLICT)
      expect(error.errorCode).toBe('RESOURCE_CONFLICT')
    })
  })

  // ==========================================================================
  // DatabaseError
  // ==========================================================================
  describe('DatabaseError', () => {
    it('應該建立資料庫錯誤實例', () => {
      // Act
      const error = new DatabaseError('查詢失敗')

      // Assert
      expect(error.statusCode).toBe(500)
      expect(error.errorType).toBe(ErrorType.DATABASE)
      expect(error.errorCode).toBe('DATABASE_OPERATION_FAILED')
    })
  })

  // ==========================================================================
  // ExternalServiceError
  // ==========================================================================
  describe('ExternalServiceError', () => {
    it('應該建立外部服務錯誤實例', () => {
      // Act
      const error = new ExternalServiceError('API 服務無法使用', 502)

      // Assert
      expect(error.statusCode).toBe(502)
      expect(error.errorType).toBe(ErrorType.EXTERNAL_SERVICE)
      expect(error.errorCode).toBe('EXTERNAL_SERVICE_UNAVAILABLE')
    })

    it('應該使用預設狀態碼 503', () => {
      // Act
      const error = new ExternalServiceError()

      // Assert
      expect(error.statusCode).toBe(503)
    })
  })

  // ==========================================================================
  // RateLimitError
  // ==========================================================================
  describe('RateLimitError', () => {
    it('應該建立頻率限制錯誤實例', () => {
      // Act
      const error = new RateLimitError('請求過於頻繁')

      // Assert
      expect(error.statusCode).toBe(429)
      expect(error.errorType).toBe(ErrorType.RATE_LIMIT)
      expect(error.errorCode).toBe('RATE_LIMIT_EXCEEDED')
    })
  })

  // ==========================================================================
  // MethodNotAllowedError
  // ==========================================================================
  describe('MethodNotAllowedError', () => {
    it('應該建立方法不允許錯誤實例', () => {
      // Act
      const error = new MethodNotAllowedError('不支援 POST')

      // Assert
      expect(error.statusCode).toBe(405)
      expect(error.errorType).toBe(ErrorType.VALIDATION)
      expect(error.errorCode).toBe('METHOD_NOT_ALLOWED')
    })
  })

  // ==========================================================================
  // InternalServerError
  // ==========================================================================
  describe('InternalServerError', () => {
    it('應該建立內部伺服器錯誤實例', () => {
      // Act
      const error = new InternalServerError('未預期的錯誤')

      // Assert
      expect(error.statusCode).toBe(500)
      expect(error.errorType).toBe(ErrorType.INTERNAL)
      expect(error.errorCode).toBe('INTERNAL_SERVER_ERROR')
    })
  })

  // ==========================================================================
  // AppError - toResponse()
  // ==========================================================================
  describe('AppError.toResponse()', () => {
    it('應該轉換為標準錯誤回應格式', () => {
      // Arrange
      const error = new ValidationError('測試錯誤')

      // Act
      const response = error.toResponse()

      // Assert
      expect(response.success).toBe(false)
      expect(response.error.code).toBe('VALIDATION_FAILED')
      expect(response.error.type).toBe(ErrorType.VALIDATION)
      expect(response.error.message).toBe('測試錯誤')
      expect(response.error.timestamp).toBeDefined()
      expect(response.error.traceId).toBe(error.traceId)
    })

    it('應該在開發環境包含詳細資訊', () => {
      // Arrange
      vi.stubEnv('NODE_ENV', 'development')

      const details: ErrorDetails = { module: 'Test', action: 'test' }
      const error = new ValidationError('測試', details)

      // Act
      const response = error.toResponse()

      // Assert
      expect(response.error.details).toEqual(details)

      // Cleanup
      vi.unstubAllEnvs()
    })

    it('應該在生產環境隱藏詳細資訊', () => {
      // Arrange
      vi.stubEnv('NODE_ENV', 'production')

      const details: ErrorDetails = { module: 'Test', action: 'test' }
      const error = new ValidationError('測試', details)

      // Act
      const response = error.toResponse()

      // Assert
      expect(response.error.details).toBeUndefined()

      // Cleanup
      vi.unstubAllEnvs()
    })
  })

  // ==========================================================================
  // AppError - toJSON()
  // ==========================================================================
  describe('AppError.toJSON()', () => {
    it('應該轉換為 JSON 對象', () => {
      // Arrange
      const error = new DatabaseError('測試錯誤')

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).toHaveProperty('name', 'DatabaseError')
      expect(json).toHaveProperty('message', '測試錯誤')
      expect(json).toHaveProperty('statusCode', 500)
      expect(json).toHaveProperty('errorType', ErrorType.DATABASE)
      expect(json).toHaveProperty('errorCode', 'DATABASE_OPERATION_FAILED')
      expect(json).toHaveProperty('traceId')
      expect(json).toHaveProperty('stack')
    })
  })

  // ==========================================================================
  // ErrorFactory.fromSupabaseError()
  // ==========================================================================
  describe('ErrorFactory.fromSupabaseError()', () => {
    it('應該處理外鍵違反錯誤 (23503)', () => {
      // Arrange
      const supabaseError = {
        code: '23503',
        message: 'foreign key violation',
      }

      // Act
      const error = ErrorFactory.fromSupabaseError(supabaseError)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe('資料關聯錯誤，相關資料不存在')
    })

    it('應該處理唯一性約束違反錯誤 (23505)', () => {
      // Arrange
      const supabaseError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint',
      }

      // Act
      const error = ErrorFactory.fromSupabaseError(supabaseError)

      // Assert
      expect(error).toBeInstanceOf(ConflictError)
      expect(error.message).toBe('資料已存在，請勿重複提交')
    })

    it('應該處理權限不足錯誤 (42501)', () => {
      // Arrange
      const supabaseError = {
        code: '42501',
        message: 'permission denied',
      }

      // Act
      const error = ErrorFactory.fromSupabaseError(supabaseError)

      // Assert
      expect(error).toBeInstanceOf(AuthorizationError)
      expect(error.message).toBe('權限不足，請確認您已正確登入')
    })

    it('應該處理 RLS 政策錯誤', () => {
      // Arrange
      const supabaseError = {
        message: 'row-level security policy violation',
      }

      // Act
      const error = ErrorFactory.fromSupabaseError(supabaseError)

      // Assert
      expect(error).toBeInstanceOf(AuthorizationError)
      expect(error.message).toContain('資料庫權限設定問題')
    })

    it('應該處理連接錯誤', () => {
      // Arrange
      const supabaseError = {
        message: 'connection timeout',
      }

      // Act
      const error = ErrorFactory.fromSupabaseError(supabaseError)

      // Assert
      expect(error).toBeInstanceOf(ExternalServiceError)
      expect(error.statusCode).toBe(503)
    })

    it('應該處理一般資料庫錯誤', () => {
      // Arrange
      const supabaseError = new Error('Unknown database error')

      // Act
      const error = ErrorFactory.fromSupabaseError(supabaseError)

      // Assert
      expect(error).toBeInstanceOf(DatabaseError)
      expect(error.message).toContain('Unknown database error')
    })

    it('應該包含上下文資訊', () => {
      // Arrange
      const supabaseError = new Error('Test error')
      const context = { module: 'TestModule', action: 'testAction' }

      // Act
      const error = ErrorFactory.fromSupabaseError(supabaseError, context)

      // Assert
      expect(error.details?.module).toBe('TestModule')
      expect(error.details?.action).toBe('testAction')
    })
  })

  // ==========================================================================
  // ErrorFactory.fromError()
  // ==========================================================================
  describe('ErrorFactory.fromError()', () => {
    it('應該返回 AppError 實例不變', () => {
      // Arrange
      const appError = new ValidationError('測試錯誤')

      // Act
      const result = ErrorFactory.fromError(appError)

      // Assert
      expect(result).toBe(appError)
    })

    it('應該轉換一般 Error 為 InternalServerError', () => {
      // Arrange
      const error = new Error('一般錯誤')

      // Act
      const result = ErrorFactory.fromError(error)

      // Assert
      expect(result).toBeInstanceOf(InternalServerError)
      expect(result.message).toBe('一般錯誤')
    })

    it('應該包含原始錯誤', () => {
      // Arrange
      const originalError = new Error('原始錯誤')

      // Act
      const result = ErrorFactory.fromError(originalError)

      // Assert
      expect(result.details?.originalError).toBe(originalError)
    })
  })

  // ==========================================================================
  // ErrorFactory.createValidationError()
  // ==========================================================================
  describe('ErrorFactory.createValidationError()', () => {
    it('應該從單一錯誤訊息建立驗證錯誤', () => {
      // Act
      const error = ErrorFactory.createValidationError('Email格式不正確')

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe('Email格式不正確')
    })

    it('應該從多個錯誤訊息建立驗證錯誤', () => {
      // Arrange
      const errors = ['Email格式不正確', '密碼長度不足', '姓名不能為空']

      // Act
      const error = ErrorFactory.createValidationError(errors)

      // Assert
      expect(error.message).toBe('資料驗證失敗: Email格式不正確, 密碼長度不足, 姓名不能為空')
    })
  })

  // ==========================================================================
  // ErrorUtils.isOperationalError()
  // ==========================================================================
  describe('ErrorUtils.isOperationalError()', () => {
    it('應該識別 AppError 為可操作錯誤', () => {
      // Arrange
      const error = new ValidationError('測試')

      // Act
      const result = ErrorUtils.isOperationalError(error)

      // Assert
      expect(result).toBe(true)
    })

    it('應該識別一般 Error 為不可操作錯誤', () => {
      // Arrange
      const error = new Error('測試')

      // Act
      const result = ErrorUtils.isOperationalError(error)

      // Assert
      expect(result).toBe(false)
    })
  })

  // ==========================================================================
  // ErrorUtils.getErrorSummary()
  // ==========================================================================
  describe('ErrorUtils.getErrorSummary()', () => {
    it('應該提取 AppError 的摘要', () => {
      // Arrange
      const error = new ValidationError('測試錯誤')

      // Act
      const summary = ErrorUtils.getErrorSummary(error)

      // Assert
      expect(summary).toHaveProperty('type', ErrorType.VALIDATION)
      expect(summary).toHaveProperty('code', 'VALIDATION_FAILED')
      expect(summary).toHaveProperty('message', '測試錯誤')
      expect(summary).toHaveProperty('statusCode', 400)
      expect(summary).toHaveProperty('traceId')
    })

    it('應該提取一般 Error 的摘要', () => {
      // Arrange
      const error = new Error('一般錯誤')

      // Act
      const summary = ErrorUtils.getErrorSummary(error)

      // Assert
      expect(summary).toHaveProperty('type', 'UNKNOWN_ERROR')
      expect(summary).toHaveProperty('message', '一般錯誤')
      expect(summary).toHaveProperty('name', 'Error')
    })
  })

  // ==========================================================================
  // ErrorUtils.sanitizeErrorMessage()
  // ==========================================================================
  describe('ErrorUtils.sanitizeErrorMessage()', () => {
    it('應該脫敏密碼資訊', () => {
      // Arrange
      const message = 'Error with password=secret123'

      // Act
      const sanitized = ErrorUtils.sanitizeErrorMessage(message)

      // Assert
      expect(sanitized).toBe('Error with password=***')
    })

    it('應該脫敏 Token 資訊', () => {
      // Arrange
      const message = 'Failed: token=abc123xyz'

      // Act
      const sanitized = ErrorUtils.sanitizeErrorMessage(message)

      // Assert
      expect(sanitized).toBe('Failed: token=***')
    })

    it('應該脫敏 Email 地址', () => {
      // Arrange
      const message = 'User test@example.com not found'

      // Act
      const sanitized = ErrorUtils.sanitizeErrorMessage(message)

      // Assert
      expect(sanitized).toBe('User ***@email.com not found')
    })

    it('應該脫敏多種敏感資訊', () => {
      // Arrange
      const message = 'Auth failed: user@test.com, password=123, key=secret'

      // Act
      const sanitized = ErrorUtils.sanitizeErrorMessage(message)

      // Assert
      expect(sanitized).toContain('***@email.com')
      expect(sanitized).toContain('password=***')
      expect(sanitized).toContain('key=***')
    })
  })

  // ==========================================================================
  // Trace ID Generation
  // ==========================================================================
  describe('Trace ID', () => {
    it('應該為每個錯誤生成唯一的 Trace ID', () => {
      // Arrange
      const error1 = new ValidationError('錯誤1')
      const error2 = new ValidationError('錯誤2')

      // Assert
      expect(error1.traceId).toBeDefined()
      expect(error2.traceId).toBeDefined()
      expect(error1.traceId).not.toBe(error2.traceId)
    })

    it('應該使用提供的 Trace ID', () => {
      // Arrange
      const customTraceId = 'custom_trace_123'
      const details: ErrorDetails = { traceId: customTraceId }

      // Act
      const error = new ValidationError('測試', details)

      // Assert
      expect(error.traceId).toBe(customTraceId)
    })
  })
})
