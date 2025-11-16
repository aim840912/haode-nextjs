/**
 * Server Actions 回應格式工具
 *
 * 提供統一的 Server Action 回應格式:
 * - 成功回應 (success)
 * - 錯誤回應 (error)
 * - 驗證錯誤 (validation error)
 * - 分頁回應 (paginated)
 *
 * ⚠️ Server Actions 不能返回 NextResponse,只能返回序列化的純對象
 */

import { AppError, ErrorType, ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { ZodError } from 'zod'

/**
 * Server Action 成功回應介面
 */
export interface ActionSuccess<T = unknown> {
  success: true
  data: T
  message?: string
  timestamp: string
}

/**
 * Server Action 錯誤回應介面
 */
export interface ActionError {
  success: false
  error: {
    code: string
    type: ErrorType
    message: string
    details?: unknown
    timestamp: string
    traceId?: string
  }
}

/**
 * Server Action 驗證錯誤介面
 */
export interface ActionValidationError {
  success: false
  error: {
    code: 'VALIDATION_FAILED'
    type: ErrorType.VALIDATION
    message: string
    validationErrors: Array<{
      field: string
      message: string
    }>
    timestamp: string
  }
}

/**
 * Server Action 回應類型聯合
 */
export type ActionResponse<T = unknown> = ActionSuccess<T> | ActionError | ActionValidationError

/**
 * 分頁回應資料介面
 */
export interface PaginatedData<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Server Action 回應建構器
 */
export class ActionResponseBuilder {
  /**
   * 建立成功回應
   */
  static success<T>(data: T, message?: string): ActionSuccess<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * 建立錯誤回應 (從 AppError)
   */
  static errorFromAppError(error: AppError): ActionError {
    // 記錄錯誤 (Server Actions 錯誤也需要記錄)
    apiLogger.error('Server Action 錯誤', error, {
      module: 'ServerAction',
      action: 'error',
      metadata: {
        errorType: error.errorType,
        errorCode: error.errorCode,
        traceId: error.traceId,
      },
    })

    return {
      success: false,
      error: {
        code: error.errorCode,
        type: error.errorType,
        message: error.message,
        // 在開發環境中包含詳細資訊
        details: process.env.NODE_ENV === 'development' ? error.details : undefined,
        timestamp: new Date().toISOString(),
        traceId: error.traceId,
      },
    }
  }

  /**
   * 建立錯誤回應 (從一般 Error)
   */
  static error(error: unknown): ActionError {
    // 如果已經是 AppError,使用專用方法
    if (error instanceof AppError) {
      return this.errorFromAppError(error)
    }

    // 記錄一般錯誤
    apiLogger.error(
      'Server Action 未預期錯誤',
      error instanceof Error ? error : new Error(String(error)),
      {
        module: 'ServerAction',
        action: 'error',
      }
    )

    // 轉換為標準錯誤回應
    const errorMessage = error instanceof Error ? error.message : '發生未知錯誤'

    return {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        type: ErrorType.INTERNAL,
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
    }
  }

  /**
   * 建立驗證錯誤回應 (從 Zod 錯誤)
   */
  static validationError(zodError: ZodError): ActionValidationError {
    const validationErrors = zodError.issues.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }))

    // 記錄驗證錯誤
    apiLogger.warn('Server Action 驗證失敗', {
      metadata: {
        validationErrors,
      },
    })

    return {
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        type: ErrorType.VALIDATION,
        message: '資料驗證失敗',
        validationErrors,
        timestamp: new Date().toISOString(),
      },
    }
  }

  /**
   * 建立認證錯誤回應
   */
  static unauthorized(message: string = '需要登入才能執行此操作'): ActionError {
    return {
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        type: ErrorType.AUTHENTICATION,
        message,
        timestamp: new Date().toISOString(),
      },
    }
  }

  /**
   * 建立授權錯誤回應
   */
  static forbidden(message: string = '權限不足,無法執行此操作'): ActionError {
    return {
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        type: ErrorType.AUTHORIZATION,
        message,
        timestamp: new Date().toISOString(),
      },
    }
  }

  /**
   * 建立分頁成功回應
   */
  static successWithPagination<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    message?: string
  ): ActionSuccess<PaginatedData<T>> {
    const totalPages = Math.ceil(total / limit)

    return {
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      message,
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * 快捷方法 - 成功回應
 *
 * @example
 * ```ts
 * 'use server'
 *
 * export async function createProductAction(data: ProductInput) {
 *   const user = await requireAuth()
 *   const product = await productService.create(data, user.id)
 *
 *   return success(product, '產品建立成功')
 * }
 * ```
 */
export const success = <T>(data: T, message?: string): ActionSuccess<T> =>
  ActionResponseBuilder.success(data, message)

/**
 * 快捷方法 - 錯誤回應
 *
 * @example
 * ```ts
 * 'use server'
 *
 * export async function deleteProductAction(id: string) {
 *   try {
 *     const user = await requireAuth()
 *     await productService.delete(id, user.id)
 *     return success(null, '產品刪除成功')
 *   } catch (err) {
 *     return error(err)
 *   }
 * }
 * ```
 */
export const error = (err: unknown): ActionError => ActionResponseBuilder.error(err)

/**
 * 快捷方法 - 驗證錯誤
 *
 * @example
 * ```ts
 * 'use server'
 *
 * import { z } from 'zod'
 *
 * const schema = z.object({ name: z.string() })
 *
 * export async function createAction(data: unknown) {
 *   const result = schema.safeParse(data)
 *
 *   if (!result.success) {
 *     return validationError(result.error)
 *   }
 *
 *   return success(result.data)
 * }
 * ```
 */
export const validationError = (zodError: ZodError): ActionValidationError =>
  ActionResponseBuilder.validationError(zodError)

/**
 * 快捷方法 - 認證錯誤
 */
export const unauthorized = (message?: string): ActionError =>
  ActionResponseBuilder.unauthorized(message)

/**
 * 快捷方法 - 授權錯誤
 */
export const forbidden = (message?: string): ActionError => ActionResponseBuilder.forbidden(message)

/**
 * 快捷方法 - 分頁回應
 *
 * @example
 * ```ts
 * 'use server'
 *
 * export async function getProductsAction(page: number = 1, limit: number = 20) {
 *   const { items, total } = await productService.findAll({ page, limit })
 *
 *   return successWithPagination(items, total, page, limit)
 * }
 * ```
 */
export const successWithPagination = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): ActionSuccess<PaginatedData<T>> =>
  ActionResponseBuilder.successWithPagination(items, total, page, limit, message)

/**
 * Server Action 錯誤處理包裝器
 *
 * 自動捕獲錯誤並轉換為標準回應格式
 *
 * @example
 * ```ts
 * 'use server'
 *
 * export const createProductAction = withActionErrorHandler(
 *   async (data: ProductInput) => {
 *     const user = await requireAuth()
 *     const product = await productService.create(data, user.id)
 *
 *     return success(product, '產品建立成功')
 *   }
 * )
 * ```
 */
export function withActionErrorHandler<TArgs extends unknown[], TReturn>(
  action: (...args: TArgs) => Promise<ActionResponse<TReturn>>
): (...args: TArgs) => Promise<ActionResponse<TReturn>> {
  return async (...args: TArgs): Promise<ActionResponse<TReturn>> => {
    try {
      return await action(...args)
    } catch (err) {
      // 自動處理錯誤
      return error(err)
    }
  }
}
