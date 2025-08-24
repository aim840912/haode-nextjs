import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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
    console.error('Admin validation error:', error)
    return { isValid: false, error: '驗證過程發生錯誤' }
  }
}

async function forwardToAdminAPI(method: string, body?: any) {
  const adminKey = process.env.ADMIN_API_KEY
  
  if (!adminKey) {
    throw new Error('ADMIN_API_KEY not configured')
  }

  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
  const adminApiUrl = `${baseUrl}/api/admin/locations`

  const response = await fetch(adminApiUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey
    },
    body: body ? JSON.stringify(body) : undefined
  })

  return response
}

// GET - 獲取所有地點
export async function GET() {
  try {
    const validation = await validateAdminUser()
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      )
    }

    const response = await forwardToAdminAPI('GET')
    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Admin proxy GET error:', error)
    return NextResponse.json(
      { error: '代理請求失敗' },
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
    const response = await forwardToAdminAPI('POST', body)
    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Admin proxy POST error:', error)
    return NextResponse.json(
      { error: '代理請求失敗' },
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
    const response = await forwardToAdminAPI('PUT', body)
    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Admin proxy PUT error:', error)
    return NextResponse.json(
      { error: '代理請求失敗' },
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

    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
    const adminApiUrl = `${baseUrl}/api/admin/locations?id=${id}`

    const response = await fetch(adminApiUrl, {
      method: 'DELETE',
      headers: {
        'X-Admin-Key': adminKey
      }
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Admin proxy DELETE error:', error)
    return NextResponse.json(
      { error: '代理請求失敗' },
      { status: 500 }
    )
  }
}