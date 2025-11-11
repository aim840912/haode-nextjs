import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'
import { syncOAuthProfile } from '@/lib/database/supabase-auth'
import { apiLogger } from '@/lib/logger'

/**
 * OAuth Callback Handler
 * 處理 Supabase OAuth 回調，交換 code 為 session
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  if (code) {
    const supabase = await createServerSupabaseClient()

    try {
      // 交換 code 為 session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        apiLogger.error('OAuth callback 失敗', new Error(error.message))
        return Response.redirect(`${requestUrl.origin}/login?error=oauth_failed`)
      }

      if (data.user) {
        // 同步 OAuth Profile
        await syncOAuthProfile(data.user.id)

        apiLogger.info('OAuth 登入成功', {
          module: 'AuthCallback',
          metadata: {
            userId: data.user.id,
            provider: data.user.app_metadata.provider,
          },
        })
      }

      // 導向到目標頁面
      return Response.redirect(`${requestUrl.origin}${next}`)
    } catch (error) {
      apiLogger.error(
        'OAuth callback 處理失敗',
        error instanceof Error ? error : new Error(String(error))
      )
      return Response.redirect(`${requestUrl.origin}/login?error=oauth_error`)
    }
  }

  // 沒有 code，導向到登入頁
  return Response.redirect(`${requestUrl.origin}/login`)
}
