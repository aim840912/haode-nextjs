/**
 * Supabase 認證模組 - 統一匯出點
 * 提供認證相關功能並重新匯出各模組的功能
 */

import { authLogger } from '@/lib/logger'
import { supabase } from './supabase-proxies'

// 重新匯出所有模組
export * from './supabase-clients'
export * from './supabase-proxies'
export * from './supabase-cache'
export * from './supabase-profile'
export * from './supabase-oauth'

// ============================================================
// 認證流程功能 (保留在主檔案)
// ============================================================

/**
 * 註冊新使用者
 */
export async function signUpUser(email: string, password: string, name: string, phone?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        phone: phone || '',
      },
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  // 後端補救機制：確保電話號碼儲存到 profiles 表
  if (data.user && phone) {
    try {
      // 等待一點時間讓觸發器執行（增加到 2 秒以確保觸發器完成）
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 檢查 profile 是否已建立且有電話號碼
      const { data: profile, error: profileError } = (await supabase
        .from('profiles')
        .select('phone')
        .eq('id', data.user.id)
        .single()) as { data: { phone: string | null } | null; error: Error | null }

      if (profileError) {
        authLogger.warn('無法檢查 profile', {
          module: 'signUpUser',
          action: 'profile_check',
          metadata: { userId: data.user.id, error: profileError.message },
        })
      } else if (!profile?.phone && phone) {
        // 如果觸發器沒有儲存電話號碼，手動更新
        authLogger.info('補救機制：更新電話號碼到 profile', {
          module: 'signUpUser',
          action: 'phone_remedy',
          metadata: { userId: data.user.id, phone: phone.substring(0, 3) + '***' },
        })

        const { error: updateError } = await (supabase as any)
          .from('profiles')
          .update({ phone })
          .eq('id', data.user.id)

        if (updateError) {
          authLogger.error('無法更新電話號碼', updateError as Error, {
            module: 'signUpUser',
            action: 'phone_update',
            metadata: { userId: data.user.id },
          })
        }
      }
    } catch (remedyError) {
      authLogger.error('後端補救機制執行失敗', remedyError as Error, {
        module: 'signUpUser',
        action: 'remedy_mechanism',
        metadata: { userId: data.user.id },
      })
      // 不拋出錯誤，避免影響註冊流程
    }
  }

  return data
}

/**
 * 登入使用者
 */
export async function signInUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * 支援手機號碼或電子郵件登入
 */
export async function signInWithPhoneOrEmail(
  identifier: string,
  password: string,
  inputType: 'email' | 'phone'
) {
  let email = identifier

  // 如果是手機號碼，需要先查詢對應的 email
  if (inputType === 'phone') {
    try {
      const response = await fetch(
        `/api/auth/phone-to-email?phone=${encodeURIComponent(identifier)}`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || '查詢手機號碼對應的帳號失敗')
      }

      const result = await response.json()
      if (!result.success || !result.data?.email) {
        throw new Error('找不到對應的帳號')
      }

      email = result.data.email

      authLogger.info('手機號碼登入：成功取得對應 Email', {
        module: 'signInWithPhoneOrEmail',
        action: 'phone_to_email_success',
        metadata: {
          phonePrefix: identifier.substring(0, 3) + '***',
          emailPrefix: email.split('@')[0].substring(0, 3) + '***',
        },
      })
    } catch (error) {
      authLogger.warn('手機號碼登入：查詢 Email 失敗', {
        module: 'signInWithPhoneOrEmail',
        action: 'phone_to_email_failed',
        metadata: {
          phonePrefix: identifier.substring(0, 3) + '***',
          error: error instanceof Error ? error.message : String(error),
        },
      })
      throw error
    }
  }

  // 使用 email 進行實際登入
  return await signInUser(email, password)
}

/**
 * 登出使用者
 */
export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut()

    // 檢查是否為預期的錯誤（session 已失效等）
    if (error) {
      const isExpectedError =
        error.message?.includes('Invalid Refresh Token') ||
        error.message?.includes('refresh_token_not_found') ||
        error.message?.includes('Auth session missing') ||
        error.status === 403 ||
        error.status === 401

      if (isExpectedError) {
        // 這些錯誤表示 session 已經失效，登出目標已達成
        authLogger.info('Session 已失效，視為成功登出', {
          module: 'supabase-auth',
          action: 'signOutUser',
          metadata: {
            errorMessage: error.message,
            errorStatus: error.status,
          },
        })
        return // 成功完成登出
      }

      // 其他錯誤才需要拋出
      authLogger.error('登出時發生未預期錯誤', new Error(error.message), {
        module: 'supabase-auth',
        action: 'signOutUser',
        metadata: {
          errorMessage: error.message,
          errorStatus: error.status,
        },
      })
      throw new Error(error.message)
    }

    authLogger.info('登出成功', {
      module: 'supabase-auth',
      action: 'signOutUser',
    })
  } catch (error) {
    // 捕獲網路錯誤等其他異常
    const err = error as { message?: string; status?: number }

    // 檢查是否為預期的錯誤
    const isExpectedError =
      err.message?.includes('Invalid Refresh Token') ||
      err.message?.includes('refresh_token_not_found') ||
      err.message?.includes('Auth session missing') ||
      err.status === 403 ||
      err.status === 401

    if (isExpectedError) {
      authLogger.info('Session 已失效（捕獲異常），視為成功登出', {
        module: 'supabase-auth',
        action: 'signOutUser',
        metadata: {
          errorMessage: err.message,
          errorStatus: err.status,
        },
      })
      return // 成功完成登出
    }

    // 重新拋出未預期的錯誤
    throw error
  }
}

/**
 * 監聽認證狀態變化
 */
export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  return supabase.auth.onAuthStateChange(callback)
}
