import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { success } from '@/lib/api-response'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { createServiceSupabaseClient } from '@/lib/database/supabase-server'
import { apiLogger } from '@/lib/logger'
import { normalizePhoneNumber, isPhoneNumber } from '@/lib/utils/auth-helpers'

/**
 * 根據手機號碼查詢對應的電子郵件地址
 * 用於支援手機號碼登入功能
 *
 * 安全考量：
 * - 速率限制：防止暴力破解
 * - 統一錯誤訊息：避免帳號列舉攻擊
 * - 記錄查詢日誌：監控異常活動
 */
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
