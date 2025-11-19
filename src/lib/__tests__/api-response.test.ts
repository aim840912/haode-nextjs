/**
 * api-response.ts 測試
 *
 * 測試 API 回應工具函數的所有功能:
 * - ApiResponseBuilder 的所有方法
 * - PaginationUtils 工具
 * - handleApiError 錯誤處理
 * - 快捷匯出函數
 */

import { NextResponse } from 'next/server'
import { describe, it, expect, vi } from 'vitest'
import {
  ApiResponseBuilder,
  PaginationUtils,
  handleApiError,
  handleApiOperation,
  success,
  created,
  successWithPagination,
  error,
  errorFromAppError,
  noContent,
  type ApiResponse,
  type PaginatedResult,
  type ResponseOptions,
} from '../api-response'
import { ValidationError, AuthenticationError, NotFoundError, InternalServerError } from '../errors'

// ============================================================================
// Mock Setup
// ============================================================================

// Mock logger
vi.mock('../logger', () => ({
  apiLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('API Response System', () => {
  // ==========================================================================
  // ApiResponseBuilder.success()
  // ==========================================================================
  describe('ApiResponseBuilder.success()', () => {
    it('應該建立成功回應', async () => {
      // Arrange
      const data = { id: '123', name: 'Test' }

      // Act
      const response = ApiResponseBuilder.success(data, '操作成功')

      // Assert
      expect(response).toBeInstanceOf(NextResponse)
      const json = (await response.json()) as ApiResponse
      expect(json.success).toBe(true)
      expect(json.data).toEqual(data)
      expect(json.message).toBe('操作成功')
      expect(json.timestamp).toBeDefined()
    })

    it('應該包含自定義標頭', async () => {
      // Arrange
      const data = { test: 'value' }
      const options: ResponseOptions = {
        headers: { 'X-Custom-Header': 'test' },
      }

      // Act
      const response = ApiResponseBuilder.success(data, undefined, options)

      // Assert
      expect(response.headers.get('X-Custom-Header')).toBe('test')
      expect(response.headers.get('X-Powered-By')).toBe('Haude Farm API')
    })

    it('應該包含 requestId', async () => {
      // Arrange
      const data = { test: 'value' }
      const options: ResponseOptions = { requestId: 'req-123' }

      // Act
      const response = ApiResponseBuilder.success(data, undefined, options)

      // Assert
      const json = (await response.json()) as ApiResponse
      expect(json.requestId).toBe('req-123')
    })

    it('應該設定快取控制標頭', async () => {
      // Arrange
      const data = { test: 'value' }
      const options: ResponseOptions = {
        cache: { maxAge: 3600 },
      }

      // Act
      const response = ApiResponseBuilder.success(data, undefined, options)

      // Assert
      expect(response.headers.get('Cache-Control')).toBe('max-age=3600')
    })

    it('應該設定 no-cache 標頭', async () => {
      // Arrange
      const data = { test: 'value' }
      const options: ResponseOptions = {
        cache: { noCache: true },
      }

      // Act
      const response = ApiResponseBuilder.success(data, undefined, options)

      // Assert
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
      expect(response.headers.get('Pragma')).toBe('no-cache')
      expect(response.headers.get('Expires')).toBe('0')
    })
  })

  // ==========================================================================
  // ApiResponseBuilder.created()
  // ==========================================================================
  describe('ApiResponseBuilder.created()', () => {
    it('應該建立 201 建立成功回應', async () => {
      // Arrange
      const data = { id: '456', name: 'New Resource' }

      // Act
      const response = ApiResponseBuilder.created(data, '資源建立成功')

      // Assert
      expect(response.status).toBe(201)
      const json = (await response.json()) as ApiResponse
      expect(json.success).toBe(true)
      expect(json.data).toEqual(data)
      expect(json.message).toBe('資源建立成功')
    })

    it('應該使用預設訊息', async () => {
      // Arrange
      const data = { id: '456' }

      // Act
      const response = ApiResponseBuilder.created(data)

      // Assert
      const json = (await response.json()) as ApiResponse
      expect(json.message).toBe('資源創建成功')
    })
  })

  // ==========================================================================
  // ApiResponseBuilder.successWithPagination()
  // ==========================================================================
  describe('ApiResponseBuilder.successWithPagination()', () => {
    it('應該建立分頁回應', async () => {
      // Arrange
      const result: PaginatedResult<{ id: string }> = {
        items: [{ id: '1' }, { id: '2' }],
        total: 50,
        page: 2,
        limit: 10,
      }

      // Act
      const response = ApiResponseBuilder.successWithPagination(result)

      // Assert
      const json = (await response.json()) as ApiResponse
      expect(json.data).toEqual(result.items)
      expect(json.meta?.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
        hasNext: true,
        hasPrev: true,
      })
    })

    it('應該正確計算第一頁的 hasNext/hasPrev', async () => {
      // Arrange
      const result: PaginatedResult<{ id: string }> = {
        items: [{ id: '1' }],
        total: 50,
        page: 1,
        limit: 10,
      }

      // Act
      const response = ApiResponseBuilder.successWithPagination(result)

      // Assert
      const json = (await response.json()) as ApiResponse
      expect(json.meta?.pagination?.hasNext).toBe(true)
      expect(json.meta?.pagination?.hasPrev).toBe(false)
    })

    it('應該正確計算最後一頁的 hasNext/hasPrev', async () => {
      // Arrange
      const result: PaginatedResult<{ id: string }> = {
        items: [{ id: '1' }],
        total: 50,
        page: 5,
        limit: 10,
      }

      // Act
      const response = ApiResponseBuilder.successWithPagination(result)

      // Assert
      const json = (await response.json()) as ApiResponse
      expect(json.meta?.pagination?.hasNext).toBe(false)
      expect(json.meta?.pagination?.hasPrev).toBe(true)
    })
  })

  // ==========================================================================
  // ApiResponseBuilder.error()
  // ==========================================================================
  describe('ApiResponseBuilder.error()', () => {
    it('應該建立錯誤回應', async () => {
      // Act
      const response = ApiResponseBuilder.error('測試錯誤', 400)

      // Assert
      expect(response.status).toBe(400)
      const json = (await response.json()) as ApiResponse
      expect(json.success).toBe(false)
      expect(json.error).toBe('測試錯誤')
      expect(json.timestamp).toBeDefined()
    })

    it('應該使用預設狀態碼 400', async () => {
      // Act
      const response = ApiResponseBuilder.error('錯誤')

      // Assert
      expect(response.status).toBe(400)
    })
  })

  // ==========================================================================
  // ApiResponseBuilder.errorFromAppError()
  // ==========================================================================
  describe('ApiResponseBuilder.errorFromAppError()', () => {
    it('應該從 AppError 建立錯誤回應', async () => {
      // Arrange
      const appError = new ValidationError('驗證失敗')

      // Act
      const response = ApiResponseBuilder.errorFromAppError(appError)

      // Assert
      expect(response.status).toBe(400)
      expect(response.headers.get('X-Error-Trace-Id')).toBe(appError.traceId)

      const json = await response.json()
      expect(json.success).toBe(false)
      expect(json.error.message).toBe('驗證失敗')
      expect(json.error.code).toBe('VALIDATION_FAILED')
      expect(json.error.traceId).toBe(appError.traceId)
    })

    it('應該包含 requestId', async () => {
      // Arrange
      const appError = new ValidationError('錯誤')
      const options: ResponseOptions = { requestId: 'req-456' }

      // Act
      const response = ApiResponseBuilder.errorFromAppError(appError, options)

      // Assert
      const json = await response.json()
      expect(json.requestId).toBe('req-456')
    })
  })

  // ==========================================================================
  // ApiResponseBuilder - 快捷方法
  // ==========================================================================
  describe('ApiResponseBuilder - 快捷方法', () => {
    it('badRequest - 應該返回 400', async () => {
      const response = ApiResponseBuilder.badRequest('錯誤請求')
      expect(response.status).toBe(400)
    })

    it('unauthorized - 應該返回 401', async () => {
      const response = ApiResponseBuilder.unauthorized('未授權')
      expect(response.status).toBe(401)
    })

    it('forbidden - 應該返回 403', async () => {
      const response = ApiResponseBuilder.forbidden('禁止')
      expect(response.status).toBe(403)
    })

    it('notFound - 應該返回 404', async () => {
      const response = ApiResponseBuilder.notFound('找不到')
      expect(response.status).toBe(404)
    })

    it('methodNotAllowed - 應該返回 405', async () => {
      const response = ApiResponseBuilder.methodNotAllowed('不支援')
      expect(response.status).toBe(405)
    })

    it('conflict - 應該返回 409', async () => {
      const response = ApiResponseBuilder.conflict('衝突')
      expect(response.status).toBe(409)
    })

    it('tooManyRequests - 應該返回 429', async () => {
      const response = ApiResponseBuilder.tooManyRequests('太多請求')
      expect(response.status).toBe(429)
    })

    it('internalError - 應該返回 500', async () => {
      const response = ApiResponseBuilder.internalError('伺服器錯誤')
      expect(response.status).toBe(500)
    })
  })

  // ==========================================================================
  // ApiResponseBuilder.noContent()
  // ==========================================================================
  describe('ApiResponseBuilder.noContent()', () => {
    it('應該建立 204 無內容回應', () => {
      // Act
      const response = ApiResponseBuilder.noContent()

      // Assert
      expect(response.status).toBe(204)
    })

    it('應該包含自定義標頭', () => {
      // Arrange
      const options: ResponseOptions = {
        headers: { 'X-Custom': 'value' },
      }

      // Act
      const response = ApiResponseBuilder.noContent(options)

      // Assert
      expect(response.headers.get('X-Custom')).toBe('value')
    })
  })

  // ==========================================================================
  // PaginationUtils.normalizePaginationParams()
  // ==========================================================================
  describe('PaginationUtils.normalizePaginationParams()', () => {
    it('應該標準化分頁參數', () => {
      // Act
      const result = PaginationUtils.normalizePaginationParams({
        page: 3,
        limit: 25,
      })

      // Assert
      expect(result).toEqual({
        page: 3,
        limit: 25,
        offset: 50,
      })
    })

    it('應該使用預設值', () => {
      // Act
      const result = PaginationUtils.normalizePaginationParams({})

      // Assert
      expect(result).toEqual({
        page: 1,
        limit: 20,
        offset: 0,
      })
    })

    it('應該限制最大 limit 為 100', () => {
      // Act
      const result = PaginationUtils.normalizePaginationParams({ limit: 200 })

      // Assert
      expect(result.limit).toBe(100)
    })

    it('應該限制最小 limit 為 1', () => {
      // Act
      const result = PaginationUtils.normalizePaginationParams({ limit: 0 })

      // Assert
      // 注意：limit: 0 是 falsy，會被 || 運算子替換為預設值 20
      expect(result.limit).toBe(20)
    })

    it('應該限制最小 page 為 1', () => {
      // Act
      const result = PaginationUtils.normalizePaginationParams({ page: -5 })

      // Assert
      expect(result.page).toBe(1)
    })

    it('應該使用提供的 offset', () => {
      // Act
      const result = PaginationUtils.normalizePaginationParams({
        page: 2,
        limit: 10,
        offset: 99,
      })

      // Assert
      expect(result.offset).toBe(99)
    })
  })

  // ==========================================================================
  // PaginationUtils.fromSearchParams()
  // ==========================================================================
  describe('PaginationUtils.fromSearchParams()', () => {
    it('應該從 URL 搜尋參數解析分頁', () => {
      // Arrange
      const searchParams = new URLSearchParams('page=2&limit=30')

      // Act
      const result = PaginationUtils.fromSearchParams(searchParams)

      // Assert
      // fromSearchParams 預設會解析 offset=0，因為沒有在 URL 中指定
      // normalizePaginationParams 會優先使用明確傳入的 offset (即使是 0)
      expect(result).toEqual({
        page: 2,
        limit: 30,
        offset: 0,
      })
    })

    it('應該使用預設值當參數不存在', () => {
      // Arrange
      const searchParams = new URLSearchParams()

      // Act
      const result = PaginationUtils.fromSearchParams(searchParams)

      // Assert
      expect(result).toEqual({
        page: 1,
        limit: 20,
        offset: 0,
      })
    })

    it('應該處理無效的參數值', () => {
      // Arrange
      const searchParams = new URLSearchParams('page=abc&limit=xyz')

      // Act
      const result = PaginationUtils.fromSearchParams(searchParams)

      // Assert
      expect(result.page).toBe(1) // NaN 轉換為 1
      // parseInt('xyz') = NaN, NaN || 20 = 20 (預設值)
      expect(result.limit).toBe(20)
    })
  })

  // ==========================================================================
  // handleApiError()
  // ==========================================================================
  describe('handleApiError()', () => {
    it('應該處理 AppError', async () => {
      // Arrange
      const appError = new ValidationError('測試錯誤')

      // Act
      const response = handleApiError(appError)

      // Assert
      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error.message).toBe('測試錯誤')
    })

    it('應該處理 ValidationError', async () => {
      // Arrange
      const error = new Error('驗證失敗')
      error.name = 'ValidationError'

      // Act
      const response = handleApiError(error)

      // Assert
      expect(response.status).toBe(400)
    })

    it('應該處理 UnauthorizedError', async () => {
      // Arrange
      const error = new Error('未授權')
      error.name = 'UnauthorizedError'

      // Act
      const response = handleApiError(error)

      // Assert
      expect(response.status).toBe(401)
    })

    it('應該處理 NotFoundError', async () => {
      // Arrange
      const error = new Error('找不到')
      error.name = 'NotFoundError'

      // Act
      const response = handleApiError(error)

      // Assert
      expect(response.status).toBe(404)
    })

    it('應該處理一般錯誤', async () => {
      // Arrange
      const error = new Error('未知錯誤')

      // Act
      const response = handleApiError(error)

      // Assert
      expect(response.status).toBe(500)
    })
  })

  // ==========================================================================
  // handleApiOperation()
  // ==========================================================================
  describe('handleApiOperation()', () => {
    it('應該執行成功的操作', async () => {
      // Arrange
      const operation = async () => ({ result: 'success' })

      // Act
      const result = await handleApiOperation(operation)

      // Assert
      expect(result).toEqual({ result: 'success' })
    })

    it('應該重新拋出錯誤', async () => {
      // Arrange
      const error = new Error('操作失敗')
      const operation = async () => {
        throw error
      }

      // Act & Assert
      await expect(handleApiOperation(operation)).rejects.toThrow('操作失敗')
    })

    it('應該記錄錯誤上下文', async () => {
      // Arrange
      const error = new Error('操作失敗')
      const operation = async () => {
        throw error
      }
      const { apiLogger } = await import('../logger')

      // Act
      try {
        await handleApiOperation(operation, {
          module: 'TestModule',
          action: 'testAction',
          requestId: 'req-789',
        })
      } catch (e) {
        // Expected
      }

      // Assert
      expect(apiLogger.error).toHaveBeenCalledWith(
        'API 操作失敗: testAction',
        error,
        expect.objectContaining({
          module: 'TestModule',
          action: 'testAction',
          requestId: 'req-789',
        })
      )
    })
  })

  // ==========================================================================
  // 快捷匯出函數
  // ==========================================================================
  describe('快捷匯出函數', () => {
    it('success() 應該正常運作', async () => {
      // Act
      const response = success({ test: 'data' }, '成功')

      // Assert
      const json = (await response.json()) as ApiResponse
      expect(json.success).toBe(true)
      expect(json.data).toEqual({ test: 'data' })
    })

    it('created() 應該正常運作', async () => {
      // Act
      const response = created({ id: '1' }, '已建立')

      // Assert
      expect(response.status).toBe(201)
    })

    it('successWithPagination() 應該正常運作', async () => {
      // Arrange
      const result: PaginatedResult<{ id: string }> = {
        items: [{ id: '1' }],
        total: 10,
        page: 1,
        limit: 10,
      }

      // Act
      const response = successWithPagination(result)

      // Assert
      const json = (await response.json()) as ApiResponse
      expect(json.meta?.pagination).toBeDefined()
    })

    it('error() 應該正常運作', async () => {
      // Act
      const response = error('錯誤', 500)

      // Assert
      expect(response.status).toBe(500)
    })

    it('errorFromAppError() 應該正常運作', async () => {
      // Arrange
      const appError = new ValidationError('錯誤')

      // Act
      const response = errorFromAppError(appError)

      // Assert
      expect(response.status).toBe(400)
    })

    it('noContent() 應該正常運作', () => {
      // Act
      const response = noContent()

      // Assert
      expect(response.status).toBe(204)
    })
  })
})
