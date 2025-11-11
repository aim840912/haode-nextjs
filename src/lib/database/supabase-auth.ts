import { createBrowserClient } from '@supabase/ssr'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { authLogger } from '@/lib/logger'
import { Database } from '@/types/database'
import { OAuthProvider, OAuthSignInOptions } from '@/types/oauth'

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
function getBrowserSupabaseClient(): SupabaseClient<Database> {
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

// 客戶端 Supabase client getter function - 延遲初始化
export function getSupabaseClient(): SupabaseClient<Database> {
  return getBrowserSupabaseClient()
}

// 使用 Proxy 實現真正的延遲初始化，避免模組載入時立即執行
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    let client: SupabaseClient<Database>

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

// 服務端客戶端創建已遷移至 @/lib/database/supabase-server
// 這裡保留介面以確保向後相容性

/**
 * 取得管理員 Supabase 客戶端 (全域 Singleton)
 */
function getAdminSupabaseClient(): SupabaseClient<Database> | null {
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

// 服務端 Supabase 客戶端（用於 API routes） - 重建為通用客戶端
export function getSupabaseServer(): SupabaseClient<Database> {
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
export function getSupabaseAdmin(): SupabaseClient<Database> {
  const client = getAdminSupabaseClient()
  if (!client) {
    throw new Error(
      'Supabase admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY environment variable.'
    )
  }
  return client
}

// 使用 Proxy 實現延遲初始化的服務端客戶端 - 重導向至統一實作
export const supabaseServer = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    const client = getSupabaseServer()
    return client[prop as keyof typeof client]
  },
})

// 使用 Proxy 實現延遲初始化的管理員客戶端
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
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

  return {
    ...data,
    phone: data.phone ?? undefined,
    address: data.address ?? undefined,
  } as Profile
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

// 支援手機號碼或電子郵件登入
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

// 登出使用者
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

// 監聽認證狀態變化
export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

/**
 * 清除管理員 Supabase 客戶端快取
 * 用於 schema 變更後重新建立連線
 */
export function clearAdminClientCache() {
  authLogger.info('清除管理員 Supabase 客戶端快取', {
    module: 'SupabaseAuth',
    action: 'clearAdminClientCache',
    metadata: {
      hadCachedClient: !!globalThis.__supabase_admin_client__,
    },
  })

  globalThis.__supabase_admin_client__ = undefined
}

/**
 * 強制重新建立管理員 Supabase 客戶端
 * 用於解決 schema 快取問題
 */
export function refreshAdminClient() {
  clearAdminClientCache()
  return getSupabaseAdmin()
}

/**
 * 清除所有 Supabase 客戶端快取
 * 用於 schema 變更後強制重新建立所有連線
 */
export function clearAllClientCaches() {
  authLogger.info('清除所有 Supabase 客戶端快取', {
    module: 'SupabaseAuth',
    action: 'clearAllClientCaches',
    metadata: {
      hadBrowserClient: !!globalThis.__supabase_browser_client__,
      hadAdminClient: !!globalThis.__supabase_admin_client__,
      hadServerClientSimple: !!globalThis.__supabase_server_client_simple__,
    },
  })

  globalThis.__supabase_browser_client__ = undefined
  globalThis.__supabase_admin_client__ = undefined
  globalThis.__supabase_server_client_simple__ = undefined
}

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
      module: 'SupabaseAuth',
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
      module: 'SupabaseAuth',
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
      module: 'SupabaseAuth',
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
      module: 'SupabaseAuth',
      action: 'syncOAuthProfile',
      metadata: {
        userId,
        provider,
        isNewProfile: !existingProfile,
      },
    })
  } catch (error) {
    authLogger.error('OAuth Profile 同步失敗', error as Error, {
      module: 'SupabaseAuth',
      action: 'syncOAuthProfile',
      metadata: {
        userId,
        provider,
      },
    })
  }
}
