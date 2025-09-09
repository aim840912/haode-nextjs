import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { type EmailOtpType } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase-auth'
import { apiLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  apiLogger.info('開始處理郵件確認', {
    module: 'AuthConfirmAPI',
    action: 'start',
  })

  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') || '/auth/update-password'

  apiLogger.debug('解析確認參數', {
    module: 'AuthConfirmAPI',
    metadata: {
      hasTokenHash: !!token_hash,
      type,
      next,
    },
  })

  // 檢查必要參數
  if (!token_hash || !type) {
    apiLogger.warn('確認參數不完整', {
      module: 'AuthConfirmAPI',
      metadata: {
        hasTokenHash: !!token_hash,
        type,
        reason: 'missing_required_params',
      },
    })
    redirect('/auth/error?error=invalid_link&message=' + encodeURIComponent('確認連結無效或已過期'))
  }

  try {
    apiLogger.info('開始驗證 OTP', {
      module: 'AuthConfirmAPI',
      action: 'verify_otp',
      metadata: { type },
    })

    // 使用 Supabase 驗證 OTP token
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (error) {
      apiLogger.error('OTP 驗證失敗', error, {
        module: 'AuthConfirmAPI',
        action: 'verify_otp_failed',
        metadata: {
          type,
          supabaseError: error.message,
          errorName: error.name,
        },
      })

      // 根據錯誤類型提供適當的錯誤訊息
      let errorMessage = '連結驗證失敗'
      if (error.message.includes('Token has expired')) {
        errorMessage = '確認連結已過期，請重新申請'
      } else if (error.message.includes('Invalid token')) {
        errorMessage = '確認連結無效，請檢查連結是否完整'
      } else if (error.message.includes('Token already used')) {
        errorMessage = '此連結已經使用過，請重新申請'
      }

      redirect(`/auth/error?error=verification_failed&message=${encodeURIComponent(errorMessage)}`)
    }

    // 驗證成功
    apiLogger.info('OTP 驗證成功', {
      module: 'AuthConfirmAPI',
      action: 'verify_otp_success',
      metadata: {
        type,
        userId: data?.user?.id,
        userEmail: data?.user?.email,
      },
    })

    // 根據 type 決定重定向位置
    let redirectUrl = next

    switch (type) {
      case 'recovery':
        redirectUrl = '/auth/update-password'
        apiLogger.info('密碼重設確認成功，重定向到更新密碼頁面', {
          module: 'AuthConfirmAPI',
          metadata: { userEmail: data?.user?.email },
        })
        break

      case 'email_change':
        redirectUrl = '/profile?tab=profile&success=email_updated'
        apiLogger.info('電子郵件變更確認成功', {
          module: 'AuthConfirmAPI',
          metadata: { userEmail: data?.user?.email },
        })
        break

      case 'signup':
        redirectUrl = '/login?success=email_confirmed'
        apiLogger.info('註冊電子郵件確認成功', {
          module: 'AuthConfirmAPI',
          metadata: { userEmail: data?.user?.email },
        })
        break

      default:
        apiLogger.warn('未知的確認類型', {
          module: 'AuthConfirmAPI',
          metadata: { type },
        })
        redirectUrl = '/login?success=verified'
        break
    }

    redirect(redirectUrl)
  } catch (error) {
    apiLogger.error('確認處理發生未預期錯誤', error as Error, {
      module: 'AuthConfirmAPI',
      action: 'unexpected_error',
      metadata: { type, hasTokenHash: !!token_hash },
    })

    redirect(
      `/auth/error?error=server_error&message=${encodeURIComponent('服務暫時無法使用，請稍後再試')}`
    )
  }
}
