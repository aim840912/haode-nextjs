/**
 * Supabase OAuth 功能
 * 提供 OAuth 登入和 Profile 同步
 */

import { authLogger } from '@/lib/logger'
import { OAuthProvider, OAuthSignInOptions } from '@/types/oauth'
import { getBrowserSupabaseClient, getSupabaseServer } from './supabase-clients'

/**
 * 使用 OAuth Provider 登入
 * @param provider - OAuth 提供者（google, facebook, line）
 * @param options - 登入選項
 */
export async function signInWithProvider(
  provider: OAuthProvider,
  options?: OAuthSignInOptions
): Promise<{ error: Error | null }> {
  const supabaseClient = getBrowserSupabaseClient()

  // LINE 尚未被 Supabase 原生支援，暫時返回錯誤
  if (provider === 'line') {
    const error = new Error('LINE Login 尚未支援')
    authLogger.error('LINE Login 尚未支援', error, {
      module: 'SupabaseOAuth',
      action: 'signInWithProvider',
      metadata: { provider },
    })
    return { error }
  }

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: provider as 'google' | 'facebook',
    options: {
      redirectTo: options?.redirectTo || `${window.location.origin}/auth/callback`,
      scopes: options?.scopes,
    },
  })

  if (error) {
    authLogger.error('OAuth 登入失敗', new Error(error.message), {
      module: 'SupabaseOAuth',
      action: 'signInWithProvider',
      metadata: {
        provider,
        error: error.message,
      },
    })
  }

  return { error }
}

/**
 * 同步 OAuth 使用者 Profile 到 profiles 表
 * 在 OAuth 登入後自動建立或更新使用者資料
 */
export async function syncOAuthProfile(userId: string): Promise<void> {
  const supabaseClient = getSupabaseServer()

  // 取得使用者資訊
  const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId)

  if (userError || !userData?.user) {
    authLogger.error('取得使用者資訊失敗', new Error(userError?.message || '未知錯誤'), {
      module: 'SupabaseOAuth',
      action: 'syncOAuthProfile',
      metadata: {
        userId,
        error: userError?.message,
      },
    })
    return
  }

  const user = userData.user
  const metadata = user.user_metadata as Record<string, any>
  const provider = user.app_metadata.provider as OAuthProvider

  // 檢查 profile 是否已存在
  const { data: existingProfile } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  const profileData = {
    id: userId,
    email: user.email!,
    name: metadata.full_name || metadata.name || user.email?.split('@')[0] || '使用者',
    avatar_url: metadata.avatar_url || metadata.picture,
    oauth_provider: provider,
    updated_at: new Date().toISOString(),
  }

  try {
    if (existingProfile) {
      // 更新現有 profile
      await (supabaseClient as any).from('profiles').update(profileData).eq('id', userId)
    } else {
      // 建立新 profile
      await (supabaseClient as any)
        .from('profiles')
        .insert({ ...profileData, created_at: new Date().toISOString() })
    }

    authLogger.info('OAuth Profile 同步成功', {
      module: 'SupabaseOAuth',
      action: 'syncOAuthProfile',
      metadata: {
        userId,
        provider,
        isNewProfile: !existingProfile,
      },
    })
  } catch (error) {
    authLogger.error('OAuth Profile 同步失敗', error as Error, {
      module: 'SupabaseOAuth',
      action: 'syncOAuthProfile',
      metadata: {
        userId,
        provider,
      },
    })
  }
}
