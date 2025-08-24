import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

// 使用 globalThis 確保真正的全域快取
declare global {
  var __supabase_server_ssr_client__: any
  var __supabase_service_client__: any
}

/**
 * 為 Next.js API 路由創建 Supabase 服務端客戶端
 * 正確處理 cookies 以進行認證
 * 使用快取機制避免重複建立客戶端實例
 */
export async function createServerSupabaseClient() {
  // 使用 globalThis 快取，確保真正的單例
  if (globalThis.__supabase_server_ssr_client__) {
    return globalThis.__supabase_server_ssr_client__
  }

  const cookieStore = await cookies()

  globalThis.__supabase_server_ssr_client__ = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // API routes 中設定 cookies 時忽略錯誤
            // 因為 headers 已發送後無法設定
            console.warn('無法設定 cookie:', error)
          }
        },
      },
    }
  )

  return globalThis.__supabase_server_ssr_client__
}

/**
 * 創建服務端 Supabase 客戶端（用於服務層操作）
 * 使用服務角色密鑰進行操作
 * 使用 globalThis 確保真正的全域單例
 */
export function createServiceSupabaseClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  }

  // 使用 globalThis 快取，確保真正的單例
  if (globalThis.__supabase_service_client__) {
    return globalThis.__supabase_service_client__
  }

  globalThis.__supabase_service_client__ = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  return globalThis.__supabase_service_client__
}

/**
 * 獲取當前用戶（用於 API 路由）
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('❌ 用戶認證失敗:', error.message)
      return null
    }
    
    return user
  } catch (error) {
    console.error('❌ 獲取用戶時發生錯誤:', error)
    return null
  }
}

/**
 * 檢查用戶是否已認證（用於 API 路由）
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('需要用戶認證')
  }
  
  return user
}