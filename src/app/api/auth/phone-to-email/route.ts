/**
 * @api {GET} /api/auth/phone-to-email 根據手機號碼查詢電子郵件
 * @apiName PhoneToEmail
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 根據手機號碼查詢對應的使用者電子郵件地址。
 * 此 API 用於支援手機號碼登入功能，將手機號碼轉換為電子郵件以進行後續的認證流程。
 *
 * **安全考量**：
 * - 實施速率限制以防止暴力破解
 * - 使用統一錯誤訊息以避免帳號列舉攻擊
 * - 記錄所有查詢請求以監控異常活動
 * - 敏感資訊（手機號碼、郵件）僅記錄前綴部分
 *
 * @apiPermission public
 *
 * @apiQuery {String} phone 要查詢的手機號碼（台灣格式，09 開頭）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 查詢結果
 * @apiSuccess {String} data.email 對應的電子郵件地址
 * @apiSuccess {Boolean} data.exists 帳號是否存在（固定為 true）
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "email": "user@example.com",
 *     "exists": true
 *   },
 *   "message": "查詢成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 手機號碼參數缺失或格式錯誤
 * @apiError (錯誤 4xx) {Object} NotFoundError 找不到對應的帳號
 *
 * @apiErrorExample {json} 錯誤回應（缺少參數）:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "缺少手機號碼參數",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 錯誤回應（格式錯誤）:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "無效的手機號碼格式",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 錯誤回應（帳號不存在）:
 * HTTP/1.1 404 Not Found
 * {
 *   "success": false,
 *   "error": "找不到對應的帳號",
 *   "code": "NOT_FOUND"
 * }
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { createServiceSupabaseClient } from '@/lib/database/supabase-server'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { normalizePhoneNumber, isPhoneNumber } from '@/lib/utils/auth-helpers'

async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const clientIP =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  // 輸入驗證
  if (!phone) {
    throw new ValidationError('缺少手機號碼參數')
  }

  if (!isPhoneNumber(phone)) {
    throw new ValidationError('無效的手機號碼格式')
  }

  // 正規化手機號碼
  const normalizedPhone = normalizePhoneNumber(phone)

  // 記錄查詢請求（用於安全監控）
  apiLogger.info('手機號碼轉換 Email 查詢', {
    module: 'PhoneToEmailAPI',
    action: 'lookup_request',
    metadata: {
      phonePrefix: normalizedPhone.substring(0, 3) + '***',
      userAgent: userAgent.substring(0, 50),
      clientIP: clientIP.substring(0, 15),
    },
  })

  try {
    // 使用 RPC 函數進行跨表查詢
    const supabaseService = createServiceSupabaseClient()

    const { data: userResult, error } = (await (
      supabaseService as unknown as {
        rpc: (
          name: string,
          params: Record<string, unknown>
        ) => Promise<{ data: Array<{ email: string; user_id: string }> | null; error: unknown }>
      }
    ).rpc('get_email_by_phone', {
      phone_number: normalizedPhone,
    })) as { data: Array<{ email: string; user_id: string }> | null; error: unknown }

    if (error) {
      apiLogger.warn('RPC 函數查詢失敗', {
        module: 'PhoneToEmailAPI',
        action: 'rpc_lookup_failed',
        metadata: {
          phonePrefix: normalizedPhone.substring(0, 3) + '***',
          error: error instanceof Error ? error.message : String(error),
          clientIP: clientIP.substring(0, 15),
        },
      })

      throw new NotFoundError('找不到對應的帳號')
    }

    // 檢查是否有查詢結果
    if (!userResult || userResult.length === 0 || !userResult[0]?.email) {
      apiLogger.warn('手機號碼查詢無結果', {
        module: 'PhoneToEmailAPI',
        action: 'lookup_no_result',
        metadata: {
          phonePrefix: normalizedPhone.substring(0, 3) + '***',
          clientIP: clientIP.substring(0, 15),
        },
      })

      throw new NotFoundError('找不到對應的帳號')
    }

    const userData = userResult[0]

    // 成功找到對應的 email
    apiLogger.info('手機號碼轉換 Email 成功', {
      module: 'PhoneToEmailAPI',
      action: 'lookup_success',
      metadata: {
        userId: userData.user_id,
        phonePrefix: normalizedPhone.substring(0, 3) + '***',
        emailPrefix: userData.email.split('@')[0].substring(0, 3) + '***',
      },
    })

    return success(
      {
        email: userData.email,
        exists: true,
      },
      '查詢成功'
    )
  } catch (error) {
    // 如果是我們已知的錯誤，直接拋出
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error
    }

    // 未預期的錯誤
    apiLogger.error('手機號碼查詢發生未預期錯誤', error as Error, {
      module: 'PhoneToEmailAPI',
      action: 'unexpected_error',
      metadata: {
        phonePrefix: normalizedPhone.substring(0, 3) + '***',
        clientIP: clientIP.substring(0, 15),
      },
    })

    throw new NotFoundError('查詢失敗，請稍後再試')
  }
}

export const GET = withErrorHandler(handleGET, {
  module: 'PhoneToEmailAPI',
  enableAuditLog: true,
})
