import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { AuthorizationError } from '@/lib/errors'

/**
 * Admin Proxy API for News
 *
 * 這個代理 API 提供安全的方式讓前端管理介面存取 Admin API，
 * 避免將 ADMIN_API_KEY 暴露到前端代碼中。
 *
 * 驗證流程：
 * 1. 檢查 Supabase session 是否有效
 * 2. 檢查用戶是否為管理員
 * 3. 自動添加 X-Admin-Key 標頭
 * 4. 轉發請求到實際的 Admin API
 */

async function validateAdminUser() {
  const supabase = await createServerSupabaseClient()

  // 檢查用戶認證狀態
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new AuthorizationError('未登入或認證失效')
  }

  // 從 profiles 表獲取用戶角色
  const { data: profile, error: profileError } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()) as { data: { role: string } | null; error: Error | null }

  if (profileError || !profile) {
    throw new AuthorizationError('無法獲取用戶資料')
  }

  if (profile.role !== 'admin') {
    throw new AuthorizationError('需要管理員權限')
  }
}

async function forwardToAdminAPI(method: string, id: string, request: NextRequest) {
  const adminKey = process.env.ADMIN_API_KEY

  if (!adminKey) {
    throw new Error('ADMIN_API_KEY not configured')
  }

  // 動態獲取基礎 URL，優先使用當前請求的 origin
  const requestUrl = new URL(request.url)
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`
  const adminApiUrl = `${baseUrl}/api/admin/news/${id}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 秒超時

  try {
    const response = await fetch(adminApiUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout: ${adminApiUrl}`)
    }
    throw error
  }
}

// DELETE - 刪除新聞
async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  await validateAdminUser()

  const response = await forwardToAdminAPI('DELETE', id, request)
  const data = await response.json()

  return NextResponse.json(data, { status: response.status })
}

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'AdminProxyNewsAPI',
  enableAuditLog: false, // Admin API 本身會記錄審計日誌
})
