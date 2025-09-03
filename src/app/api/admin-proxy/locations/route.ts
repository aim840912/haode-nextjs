import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { apiLogger } from '@/lib/logger'

/**
 * Admin Proxy API for Locations
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
  
  try {
    // 檢查用戶認證狀態
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { isValid: false, error: '未登入或認證失效' }
    }

    // 從 profiles 表獲取用戶角色
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { isValid: false, error: '無法獲取用戶資料' }
    }

    if (profile.role !== 'admin') {
      return { isValid: false, error: '需要管理員權限' }
    }

    return { isValid: true }
  } catch (error) {
    apiLogger.error('管理員驗證失敗', error instanceof Error ? error : new Error('Unknown validation error'), {
      module: 'AdminProxyLocations',
      action: 'validateAdminUser'
    })
    return { isValid: false, error: '驗證過程發生錯誤' }
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
    baseUrl = process.env.NEXTAUTH_URL || 
              (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  }
  
  const adminApiUrl = `${baseUrl}/api/admin/locations`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 秒超時

  try {
    const response = await fetch(adminApiUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
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

// GET - 獲取所有地點
export async function GET(request: NextRequest) {
  try {
    const validation = await validateAdminUser()
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      )
    }

    const response = await forwardToAdminAPI('GET', undefined, request)
    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    apiLogger.error('管理員代理 GET 請求失敗', error instanceof Error ? error : new Error('Unknown GET error'), {
      module: 'AdminProxyLocations',
      action: 'GET'
    })
    return NextResponse.json(
      { error: `代理請求失敗: ${error instanceof Error ? error.message : '未知錯誤'}` },
      { status: 500 }
    )
  }
}

// POST - 新增地點
export async function POST(request: NextRequest) {
  try {
    const validation = await validateAdminUser()
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      )
    }

    const body = await request.json()
    const response = await forwardToAdminAPI('POST', body, request)
    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    apiLogger.error('管理員代理 POST 請求失敗', error instanceof Error ? error : new Error('Unknown POST error'), {
      module: 'AdminProxyLocations',
      action: 'POST'
    })
    return NextResponse.json(
      { error: `代理請求失敗: ${error instanceof Error ? error.message : '未知錯誤'}` },
      { status: 500 }
    )
  }
}

// PUT - 更新地點
export async function PUT(request: NextRequest) {
  try {
    const validation = await validateAdminUser()
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      )
    }

    const body = await request.json()
    const response = await forwardToAdminAPI('PUT', body, request)
    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    apiLogger.error('管理員代理 PUT 請求失敗', error instanceof Error ? error : new Error('Unknown PUT error'), {
      module: 'AdminProxyLocations',
      action: 'PUT'
    })
    return NextResponse.json(
      { error: `代理請求失敗: ${error instanceof Error ? error.message : '未知錯誤'}` },
      { status: 500 }
    )
  }
}

// DELETE - 刪除地點
export async function DELETE(request: NextRequest) {
  try {
    const validation = await validateAdminUser()
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      )
    }

    // 構建帶有 query 參數的 URL
    const adminKey = process.env.ADMIN_API_KEY
    if (!adminKey) {
      throw new Error('ADMIN_API_KEY not configured')
    }

    // 動態獲取基礎 URL，使用當前請求的 origin
    const requestUrl = new URL(request.url)
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`
    const adminApiUrl = `${baseUrl}/api/admin/locations?id=${id}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 秒超時

    try {
      const response = await fetch(adminApiUrl, {
        method: 'DELETE',
        headers: {
          'X-Admin-Key': adminKey
        },
        signal: controller.signal
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
  } catch (error) {
    apiLogger.error('管理員代理 DELETE 請求失敗', error instanceof Error ? error : new Error('Unknown DELETE error'), {
      module: 'AdminProxyLocations',
      action: 'DELETE'
    })
    return NextResponse.json(
      { error: `代理請求失敗: ${error instanceof Error ? error.message : '未知錯誤'}` },
      { status: 500 }
    )
  }
}