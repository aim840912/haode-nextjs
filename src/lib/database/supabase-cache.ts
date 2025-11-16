/**
 * Supabase 客戶端快取管理
 * 提供清除和重建客戶端快取的功能
 */

import { authLogger } from '@/lib/logger'
import { getSupabaseAdmin } from './supabase-clients'

/**
 * 清除管理員 Supabase 客戶端快取
 * 用於 schema 變更後重新建立連線
 */
export function clearAdminClientCache() {
  authLogger.info('清除管理員 Supabase 客戶端快取', {
    module: 'SupabaseCache',
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
    module: 'SupabaseCache',
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
