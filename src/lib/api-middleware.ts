/**
 * 統一 API 權限中間件系統
 * 提供現代化的權限驗證和錯誤處理
 *
 * 功能：
 * - requireAuth: 需要使用者登入
 * - requireAdmin: 需要管理員權限
 * - optionalAuth: 可選認證
 * - 統一錯誤處理
 * - 自動權限檢查
 */

import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/supabase-server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { error } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'

// 使用者類型定義
export interface User {
  id: string
  email: string
  isAdmin: boolean
  name?: string
  role?: string
}

// 內部處理器類型定義（帶認證資訊）
type AuthenticatedInternalHandler = (
  request: NextRequest,
  user: User,
  context?: unknown
) => Promise<Response>

type AdminInternalHandler = (
  request: NextRequest,
  user: User & { isAdmin: true },
  context?: unknown
) => Promise<Response>

type OptionalAuthInternalHandler = (
  request: NextRequest,
  user: User | null,
  context?: unknown
) => Promise<Response>

// Next.js 15 相容的標準處理器類型
export type NextRouteHandler = (request: NextRequest, context?: unknown) => Promise<Response>

/**
 * 取得使用者資訊並檢查管理員權限
 */
async function getUserWithAdminCheck(userId: string): Promise<User> {
  const supabase = await createServerSupabaseClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', userId)
    .single() as { data: { role: string; name: string } | null; error: Error | null }

  if (profileError) {
    apiLogger.warn('無法取得使用者資料', {
      metadata: {
        userId,
        error: profileError.message,
      },
    })
  }

  return {
    id: userId,
    email: '', // email 來自 auth.users 表，需要在呼叫處處理
    name: profile?.name || '',
    role: profile?.role || 'user',
    isAdmin: profile?.role === 'admin',
  }
}

/**
 * 需要使用者認證的中間件
 * 驗證使用者已登入，但不要求管理員權限
 */
export function requireAuth(handler: AuthenticatedInternalHandler): NextRouteHandler {
  return async (request: NextRequest, context?: unknown) => {
    try {
      // 取得當前使用者
      const currentUser = await getCurrentUser()

      if (!currentUser) {
        apiLogger.warn('API 存取未認證', {
          metadata: {
            path: request.nextUrl.pathname,
            method: request.method,
            userAgent: request.headers.get('user-agent'),
          },
        })

        return error('未認證或會話已過期', 401)
      }

      // 取得完整的使用者資訊
      const user = await getUserWithAdminCheck(currentUser.id)
      // 將 auth 使用者的 email 加入到使用者物件中
      user.email = currentUser.email || ''

      apiLogger.debug('使用者通過認證', {
        metadata: {
          userId: user.id,
          email: user.email,
          isAdmin: user.isAdmin,
          path: request.nextUrl.pathname,
        },
      })

      // 呼叫業務處理器
      return handler(request, user, context)
    } catch (err) {
      apiLogger.error('認證中間件錯誤', err as Error, {
        metadata: {
          path: request.nextUrl.pathname,
          method: request.method,
        },
      })

      return error('認證檢查失敗', 500)
    }
  }
}

/**
 * 需要管理員權限的中間件
 * 驗證使用者已登入且具有管理員權限
 */
export function requireAdmin(handler: AdminInternalHandler): NextRouteHandler {
  return async (request: NextRequest, context?: unknown) => {
    try {
      // 取得當前使用者
      const currentUser = await getCurrentUser()

      if (!currentUser) {
        apiLogger.warn('管理員 API 存取未認證', {
          metadata: {
            path: request.nextUrl.pathname,
            method: request.method,
            userAgent: request.headers.get('user-agent'),
          },
        })

        return error('未認證或會話已過期', 401)
      }

      // 取得完整的使用者資訊
      const user = await getUserWithAdminCheck(currentUser.id)
      // 將 auth 使用者的 email 加入到使用者物件中
      user.email = currentUser.email || ''

      if (!user.isAdmin) {
        apiLogger.warn('非管理員嘗試存取管理員 API', {
          metadata: {
            userId: user.id,
            email: user.email,
            role: user.role,
            path: request.nextUrl.pathname,
            method: request.method,
          },
        })

        return error('需要管理員權限才能執行此操作', 403)
      }

      apiLogger.debug('管理員通過認證', {
        metadata: {
          userId: user.id,
          email: user.email,
          path: request.nextUrl.pathname,
        },
      })

      // 呼叫業務處理器，確保 user 有 isAdmin: true 屬性
      return handler(request, { ...user, isAdmin: true } as User & { isAdmin: true }, context)
    } catch (err) {
      apiLogger.error('管理員認證中間件錯誤', err as Error, {
        metadata: {
          path: request.nextUrl.pathname,
          method: request.method,
        },
      })

      return error('權限檢查失敗', 500)
    }
  }
}

/**
 * 可選認證的中間件
 * 使用者可以是登入或未登入狀態，適用於公開但可能需要使用者資訊的 API
 */
export function optionalAuth(handler: OptionalAuthInternalHandler): NextRouteHandler {
  return async (request: NextRequest, context?: unknown) => {
    try {
      // 嘗試取得當前使用者（不拋錯誤）
      let user: User | null = null

      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          user = await getUserWithAdminCheck(currentUser.id)
          // 將 auth 使用者的 email 加入到使用者物件中
          user.email = currentUser.email || ''
        }
      } catch (err) {
        // 忽略認證錯誤，讓 user 保持為 null
        apiLogger.debug('可選認證失敗，繼續以未認證狀態處理', {
          metadata: {
            path: request.nextUrl.pathname,
            error: err instanceof Error ? err.message : String(err),
          },
        })
      }

      if (user) {
        apiLogger.debug('可選認證：使用者已認證', {
          metadata: {
            userId: user.id,
            email: user.email,
            isAdmin: user.isAdmin,
            path: request.nextUrl.pathname,
          },
        })
      } else {
        apiLogger.debug('可選認證：未認證使用者', {
          metadata: {
            path: request.nextUrl.pathname,
          },
        })
      }

      return handler(request, user, context)
    } catch (err) {
      apiLogger.error('可選認證中間件錯誤', err as Error, {
        metadata: {
          path: request.nextUrl.pathname,
          method: request.method,
        },
      })

      return error('認證檢查失敗', 500)
    }
  }
}

// 舊版輔助函數已移除 - 現在直接使用 requireAuth/requireAdmin 即可

/**
 * 檢查使用者是否有權限存取特定資源
 * 用於資源所有權驗證
 */
export function checkResourceOwnership(resourceUserId: string, currentUser: User): boolean {
  // 管理員可以存取所有資源
  if (currentUser.isAdmin) {
    return true
  }

  // 一般使用者只能存取自己的資源
  return resourceUserId === currentUser.id
}

/**
 * 權限檢查輔助函數
 */
export const PermissionHelper = {
  /**
   * 檢查使用者是否為管理員
   */
  isAdmin: (user: User): boolean => user.isAdmin,

  /**
   * 檢查使用者是否可以修改資源
   */
  canModify: (resourceUserId: string, user: User): boolean => {
    return checkResourceOwnership(resourceUserId, user)
  },

  /**
   * 檢查使用者是否可以查看資源
   * 預設與修改權限相同，但可以根據需要覆寫
   */
  canView: (resourceUserId: string, user: User): boolean => {
    return checkResourceOwnership(resourceUserId, user)
  },

  /**
   * 取得使用者權限摘要
   */
  getPermissionSummary: (user: User) => ({
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
    role: user.role || 'user',
  }),
}

// 類型已在上面定義並匯出
