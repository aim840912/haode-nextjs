import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { UserSchemas } from '@/lib/validation-schemas'
import { supabase } from '@/lib/supabase-auth'
import { apiLogger } from '@/lib/logger'

async function handlePOST(request: NextRequest) {
  apiLogger.info('開始處理忘記密碼請求', {
    module: 'ForgotPasswordAPI',
    action: 'start',
  })

  // 解析請求資料
  let requestData
  try {
    requestData = await request.json()
  } catch {
    throw new ValidationError('請求資料格式錯誤')
  }

  // 驗證輸入資料
  const validation = UserSchemas.resetPassword.safeParse(requestData)
  if (!validation.success) {
    const errors = validation.error.issues
      .map((issue: any) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`驗證失敗: ${errors}`)
  }

  const { email } = validation.data

  try {
    // 設定重定向 URL
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`

    apiLogger.info('發送密碼重設郵件', {
      module: 'ForgotPasswordAPI',
      action: 'send_reset_email',
      metadata: { email, redirectTo },
    })

    // 呼叫 Supabase 發送重設郵件
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      apiLogger.error('Supabase 密碼重設失敗', error, {
        module: 'ForgotPasswordAPI',
        action: 'supabase_error',
        metadata: { email, supabaseError: error.message },
      })

      // 根據不同錯誤類型返回適當訊息
      if (error.message.includes('Email not confirmed')) {
        throw new ValidationError('此電子郵件尚未完成驗證，請先確認您的電子郵件')
      } else if (error.message.includes('User not found')) {
        // 基於安全考量，不透露使用者是否存在，統一返回成功訊息
        apiLogger.warn('嘗試重設不存在的使用者密碼', {
          module: 'ForgotPasswordAPI',
          metadata: { email },
        })
      } else if (error.message.includes('Email rate limit exceeded')) {
        throw new ValidationError('發送郵件過於頻繁，請稍後再試（每小時限制 2 封郵件）')
      } else {
        throw new ValidationError('發送重設郵件失敗，請稍後再試')
      }
    }

    apiLogger.info('密碼重設郵件發送成功', {
      module: 'ForgotPasswordAPI',
      action: 'send_success',
      metadata: { email },
    })

    return success({ email }, '如果此電子郵件已註冊，您將收到密碼重設連結')
  } catch (error) {
    // 如果是我們拋出的驗證錯誤，直接重新拋出
    if (error instanceof ValidationError) {
      throw error
    }

    // 記錄未預期的錯誤
    apiLogger.error('密碼重設處理發生未預期錯誤', error as Error, {
      module: 'ForgotPasswordAPI',
      action: 'unexpected_error',
      metadata: { email },
    })

    throw new ValidationError('服務暫時無法使用，請稍後再試')
  }
}

export const POST = withErrorHandler(handlePOST, {
  module: 'ForgotPasswordAPI',
})
