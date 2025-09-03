import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withErrorHandler } from '@/lib/error-handler'
import { AuthorizationError, ValidationError } from '@/lib/errors'

/**
 * Admin Proxy API for Products
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
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new AuthorizationError('無法獲取用戶資料')
  }

  if (profile.role !== 'admin') {
    throw new AuthorizationError('需要管理員權限')
  }
}

async function forwardToAdminAPI(method: string, body?: unknown, request?: NextRequest) {
  const adminKey = process.env.ADMIN_API_KEY

  if (!adminKey) {
    throw new Error('ADMIN_API_KEY not configured')
  }

  // 動態獲取基礎 URL，優先使用當前請求的 origin
  let baseUrl: string
  if (request) {
    const requestUrl = new URL(request.url)
    baseUrl = `${requestUrl.protocol}//${requestUrl.host}`
  } else {
    baseUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  }

  const adminApiUrl = `${baseUrl}/api/admin/products`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 秒超時

  try {
    const response = await fetch(adminApiUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey,
      },
      body: body ? JSON.stringify(body) : undefined,
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

// GET - 獲取所有產品（包含未啟用的）
async function handleGET(request: NextRequest) {
  await validateAdminUser()

  const response = await forwardToAdminAPI('GET', undefined, request)
  const data = await response.json()

  return NextResponse.json(data, { status: response.status })
}

export const GET = withErrorHandler(handleGET, {
  module: 'AdminProxyAPI',
  enableAuditLog: true,
})

// POST - 新增產品
async function handlePOST(request: NextRequest) {
  await validateAdminUser()

  const body = await request.json()
  const response = await forwardToAdminAPI('POST', body, request)
  const data = await response.json()

  return NextResponse.json(data, { status: response.status })
}

export const POST = withErrorHandler(handlePOST, {
  module: 'AdminProxyAPI',
  enableAuditLog: true,
})

// PUT - 更新產品
async function handlePUT(request: NextRequest) {
  await validateAdminUser()

  const body = await request.json()
  const response = await forwardToAdminAPI('PUT', body, request)
  const data = await response.json()

  return NextResponse.json(data, { status: response.status })
}

export const PUT = withErrorHandler(handlePUT, {
  module: 'AdminProxyAPI',
  enableAuditLog: true,
})

// DELETE - 刪除產品
async function handleDELETE(request: NextRequest) {
  await validateAdminUser()

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    throw new ValidationError('Product ID is required')
  }

  // 構建帶有 query 參數的 URL
  const adminKey = process.env.ADMIN_API_KEY
  if (!adminKey) {
    throw new Error('ADMIN_API_KEY not configured')
  }

  // 動態獲取基礎 URL，使用當前請求的 origin
  const requestUrl = new URL(request.url)
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`
  const adminApiUrl = `${baseUrl}/api/admin/products?id=${id}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 秒超時

  try {
    const response = await fetch(adminApiUrl, {
      method: 'DELETE',
      headers: {
        'X-Admin-Key': adminKey,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout: ${adminApiUrl}`)
    }
    throw error
  }
}

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'AdminProxyAPI',
  enableAuditLog: true,
})
