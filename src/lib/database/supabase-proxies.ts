/**
 * Supabase Proxy 物件
 * 提供延遲初始化的 Proxy 包裝
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import {
  getBrowserSupabaseClient,
  getSupabaseServerClient,
  getAdminSupabaseClient,
} from './supabase-clients'

/**
 * 使用 Proxy 實現真正的延遲初始化，避免模組載入時立即執行
 */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    let client: SupabaseClient<Database>

    // 根據環境選擇正確的客戶端
    if (typeof window === 'undefined') {
      // 服務器環境：使用服務端客戶端
      client = getSupabaseServerClient()
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

/**
 * 使用 Proxy 實現延遲初始化的服務端客戶端
 */
export const supabaseServer = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    const client = getSupabaseServerClient()
    const value = client[prop as keyof typeof client]

    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client)
    }

    return value
  },
})

/**
 * 使用 Proxy 實現延遲初始化的管理員客戶端
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    const client = getAdminSupabaseClient()
    const value = client && client[prop as keyof typeof client]

    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client)
    }

    return value
  },
})
