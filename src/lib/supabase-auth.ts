import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { authLogger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 使用 globalThis 確保真正的全域單例
declare global {
  var __supabase_browser_client__: ReturnType<typeof createBrowserClient<Database>> | undefined
  var __supabase_admin_client__: ReturnType<typeof createClient<Database>> | undefined
  var __supabase_server_client_simple__: ReturnType<typeof createClient<Database>> | undefined
}

/**
 * 取得瀏覽器端 Supabase 客戶端 (真正的全域 Singleton)
 * 使用 globalThis 確保在開發模式下也只有一個實例
 */
function getBrowserSupabaseClient() {
  // 只在瀏覽器環境中運作
  if (typeof window === 'undefined') {
    throw new Error('getBrowserSupabaseClient should only be called in browser environment')
  }

  if (!globalThis.__supabase_browser_client__) {
    globalThis.__supabase_browser_client__ = createBrowserClient<Database>(
      supabaseUrl,
      supabaseAnonKey
    )
  }

  return globalThis.__supabase_browser_client__
}

// 客戶端 Supabase client getter function - 延遲初始化
export function getSupabaseClient() {
  return getBrowserSupabaseClient()
}

// 使用 Proxy 實現真正的延遲初始化，避免模組載入時立即執行
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
  get(target, prop) {
    let client:
      | ReturnType<typeof createBrowserClient<Database>>
      | ReturnType<typeof createClient<Database>>

    // 根據環境選擇正確的客戶端
    if (typeof window === 'undefined') {
      // 服務器環境：使用服務端客戶端
      client = getSupabaseServer()
    } else {
      // 瀏覽器環境：使用瀏覽器客戶端
      client = getBrowserSupabaseClient()
    }

    const value = client[prop as keyof typeof client]

    // 如果是函數，確保 this 綁定正確
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client)
    }

    return value
  },
})

// 服務端客戶端創建已遷移至 @/lib/supabase-server
// 這裡保留介面以確保向後相容性

/**
 * 取得管理員 Supabase 客戶端 (全域 Singleton)
 */
function getAdminSupabaseClient() {
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
      }
    )
  }

  return globalThis.__supabase_admin_client__
}

// 服務端 Supabase 客戶端（用於 API routes） - 重建為通用客戶端
export function getSupabaseServer() {
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

// 管理員 Supabase 客戶端（具有更高權限） - 使用 getter 函數
export function getSupabaseAdmin() {
  return getAdminSupabaseClient()
}

// 使用 Proxy 實現延遲初始化的服務端客戶端 - 重導向至統一實作
export const supabaseServer = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(target, prop) {
    const client = getSupabaseServer()
    return client[prop as keyof typeof client]
  },
})

// 使用 Proxy 實現延遲初始化的管理員客戶端
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(target, prop) {
    const client = getAdminSupabaseClient()
    return client && client[prop as keyof typeof client]
  },
})

// Profile 相關功能
export interface Profile {
  id: string
  name: string
  phone?: string
  address?: {
    street?: string
    city?: string
    postalCode?: string
    country?: string
  }
  role: 'customer' | 'admin'
  created_at: string
  updated_at: string
}

// 取得使用者 profile
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

  if (error) {
    authLogger.error('Failed to fetch user profile', new Error(error.message), {
      module: 'supabase-auth',
      action: 'getUserProfile',
      metadata: {
        userId,
        error: error.message,
        code: error.code,
      },
    })
    return null
  }

  return data
}

// 建立或更新使用者 profile
export async function upsertProfile(
  profile: Partial<Profile> & { id: string }
): Promise<Profile | null> {
  const { data, error } = await (supabase as any).from('profiles').upsert(profile).select().single()

  if (error) {
    authLogger.error('Failed to upsert user profile', new Error(error.message), {
      module: 'supabase-auth',
      action: 'upsertProfile',
      metadata: {
        userId: profile.id,
        error: error.message,
        code: error.code,
      },
    })
    return null
  }

  return data
}

// 更新使用者 profile
export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    authLogger.error('Failed to update user profile', new Error(error.message), {
      module: 'supabase-auth',
      action: 'updateProfile',
      metadata: {
        userId,
        error: error.message,
        code: error.code,
      },
    })
    return null
  }

  return data
}

// 註冊新使用者
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
      // 等待一點時間讓觸發器執行
      await new Promise(resolve => setTimeout(resolve, 1000))

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

// 登入使用者
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

// 登出使用者
export async function signOutUser() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}

// 監聽認證狀態變化
export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  return supabase.auth.onAuthStateChange(callback)
}
