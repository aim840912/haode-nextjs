/**
 * @api {POST} /api/auth/update-password 更新使用者密碼
 * @apiName UpdatePassword
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 更新已登入使用者的密碼。
 * 成功更新後會自動登出使用者，要求使用新密碼重新登入以確保安全。
 * 實施基本的密碼強度檢查（長度、常見弱密碼等）。
 *
 * @apiPermission user
 *
 * @apiBody {String} password 新密碼（必填，6-128 個字元）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 回應資料
 * @apiSuccess {String} data.message 操作訊息
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "message": "密碼更新成功，請重新登入"
 *   },
 *   "message": "密碼已成功更新，為了您的安全，請使用新密碼重新登入"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 請求資料格式錯誤或驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 未登入或會話過期
 *
 * @apiErrorExample {json} 錯誤回應（密碼為空）:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "密碼不能為空",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 錯誤回應（密碼過短）:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "密碼至少需要 6 個字元",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 錯誤回應（弱密碼）:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "請選擇更安全的密碼",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 錯誤回應（相同密碼）:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "新密碼不能與目前密碼相同",
 *   "code": "VALIDATION_ERROR"
 * }
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { supabase } from '@/lib/database/supabase-auth'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'

async function handlePOST(request: NextRequest, user: User) {
  apiLogger.info('開始處理密碼更新請求', {
    module: 'UpdatePasswordAPI',
    action: 'start',
    metadata: { userEmail: user.email, userId: user.id },
  })

  // 解析請求資料
  let requestData
  try {
    requestData = await request.json()
  } catch {
    throw new ValidationError('請求資料格式錯誤')
  }

  const { password } = requestData

  // 驗證密碼
  if (!password) {
    throw new ValidationError('密碼不能為空')
  }

  if (typeof password !== 'string') {
    throw new ValidationError('密碼格式錯誤')
  }

  if (password.length < 6) {
    throw new ValidationError('密碼至少需要 6 個字元')
  }

  if (password.length > 128) {
    throw new ValidationError('密碼不能超過 128 個字元')
  }

  // 基本密碼安全性檢查
  if (password === '123456' || password === 'password' || password === '12345678') {
    throw new ValidationError('請選擇更安全的密碼')
  }

  try {
    apiLogger.info('更新使用者密碼', {
      module: 'UpdatePasswordAPI',
      action: 'update_password',
      metadata: { userId: user.id, userEmail: user.email },
    })

    // 使用 Supabase 更新密碼
    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      apiLogger.error('Supabase 密碼更新失敗', error, {
        module: 'UpdatePasswordAPI',
        action: 'supabase_error',
        metadata: {
          userId: user.id,
          userEmail: user.email,
          supabaseError: error.message,
          errorName: error.name,
        },
      })

      // 根據不同錯誤類型返回適當訊息
      if (error.message.includes('Password should be')) {
        throw new ValidationError('密碼不符合安全要求，請選擇更強的密碼')
      } else if (error.message.includes('Same password')) {
        throw new ValidationError('新密碼不能與目前密碼相同')
      } else if (error.message.includes('User not found')) {
        throw new ValidationError('使用者不存在或會話已過期')
      } else {
        throw new ValidationError('密碼更新失敗，請稍後再試')
      }
    }

    apiLogger.info('密碼更新成功，準備登出使用者', {
      module: 'UpdatePasswordAPI',
      action: 'password_updated',
      metadata: { userId: user.id, userEmail: user.email },
    })

    // 成功更新密碼後，登出使用者以確保安全
    // 使用者需要用新密碼重新登入
    try {
      await supabase.auth.signOut()
      apiLogger.info('使用者已登出，需要重新登入', {
        module: 'UpdatePasswordAPI',
        action: 'user_signed_out',
        metadata: { userId: user.id, userEmail: user.email },
      })
    } catch (signOutError) {
      // 登出錯誤不影響密碼更新的成功
      apiLogger.error('登出時發生錯誤，但密碼已成功更新', signOutError as Error, {
        module: 'UpdatePasswordAPI',
        action: 'signout_warning',
        metadata: { userId: user.id },
      })
    }

    return success(
      { message: '密碼更新成功，請重新登入' },
      '密碼已成功更新，為了您的安全，請使用新密碼重新登入'
    )
  } catch (error) {
    // 如果是我們拋出的驗證錯誤，直接重新拋出
    if (error instanceof ValidationError) {
      throw error
    }

    // 記錄未預期的錯誤
    apiLogger.error('密碼更新發生未預期錯誤', error as Error, {
      module: 'UpdatePasswordAPI',
      action: 'unexpected_error',
      metadata: { userId: user.id, userEmail: user.email },
    })

    throw new ValidationError('服務暫時無法使用，請稍後再試')
  }
}

export const POST = withAuthAndError(handlePOST, {
  module: 'UpdatePasswordAPI',
  enableAuditLog: true,
})
