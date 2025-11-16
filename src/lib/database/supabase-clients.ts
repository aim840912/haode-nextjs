/**
 * Supabase 客戶端管理
 * 提供瀏覽器、伺服器和管理員客戶端的建立和管理
 */

import { createBrowserClient } from '@supabase/ssr'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 使用 globalThis 確保真正的全域單例
declare global {
  var __supabase_browser_client__: SupabaseClient<Database> | undefined
  var __supabase_admin_client__: SupabaseClient<Database> | undefined
  var __supabase_server_client_simple__: SupabaseClient<Database> | undefined
}

/**
 * 取得瀏覽器端 Supabase 客戶端 (真正的全域 Singleton)
 * 使用 globalThis 確保在開發模式下也只有一個實例
 */
export function getBrowserSupabaseClient(): SupabaseClient<Database> {
  // 只在瀏覽器環境中運作
  if (typeof window === 'undefined') {
    throw new Error('getBrowserSupabaseClient should only be called in browser environment')
  }

  if (!globalThis.__supabase_browser_client__) {
    globalThis.__supabase_browser_client__ = createBrowserClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            // 解析所有 cookies
            return document.cookie.split('; ').reduce(
              (cookies, cookie) => {
                const [name, ...rest] = cookie.split('=')
                if (name) {
                  cookies.push({
                    name,
                    value: decodeURIComponent(rest.join('=')),
                  })
                }
                return cookies
              },
              [] as { name: string; value: string }[]
            )
          },
          setAll(cookiesToSet) {
            // 設置所有 cookies
            cookiesToSet.forEach(({ name, value, options }) => {
              let cookieString = `${name}=${encodeURIComponent(value)}`

              // 添加 cookie 選項
              if (options?.maxAge) {
                cookieString += `; max-age=${options.maxAge}`
              }
              if (options?.path) {
                cookieString += `; path=${options.path}`
              } else {
                cookieString += '; path=/'
              }
              if (options?.domain) {
                cookieString += `; domain=${options.domain}`
              }
              if (options?.sameSite) {
                cookieString += `; samesite=${options.sameSite}`
              }
              if (options?.secure) {
                cookieString += '; secure'
              }

              document.cookie = cookieString
            })
          },
        },
      }
    )
  }

  return globalThis.__supabase_browser_client__
}

/**
 * 取得管理員 Supabase 客戶端 (全域 Singleton)
 */
export function getAdminSupabaseClient(): SupabaseClient<Database> | null {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null
  }

  if (!globalThis.__supabase_admin_client__) {
    globalThis.__supabase_admin_client__ = createClient<Database>(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'x-supabase-role': 'service_role',
          },
        },
      }
    )
  }

  return globalThis.__supabase_admin_client__
}

/**
 * 服務端 Supabase 客戶端（用於 API routes）
 */
export function getSupabaseServerClient(): SupabaseClient<Database> {
  // 在客戶端環境中，使用瀏覽器客戶端
  if (typeof window !== 'undefined') {
    return getBrowserSupabaseClient()
  }

  // 在服務端環境中，創建一個不依賴 next/headers 的簡單服務端客戶端
  if (!globalThis.__supabase_server_client_simple__) {
    globalThis.__supabase_server_client_simple__ = createClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }

  return globalThis.__supabase_server_client_simple__
}

/**
 * 客戶端 Supabase client getter function - 延遲初始化
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  return getBrowserSupabaseClient()
}

/**
 * 管理員 Supabase 客戶端（具有更高權限）
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  const client = getAdminSupabaseClient()
  if (!client) {
    throw new Error(
      'Supabase admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY environment variable.'
    )
  }
  return client
}

/**
 * 服務端 Supabase 客戶端 getter
 */
export function getSupabaseServer(): SupabaseClient<Database> {
  return getSupabaseServerClient()
}
