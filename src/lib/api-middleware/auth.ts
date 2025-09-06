/**
 * API 權限中間件系統
 * 統一處理 API 路由的認證和授權邏輯
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase-server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withErrorHandler, ApiHandler } from '@/lib/error-handler'
import { AuthorizationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// 使用者類型定義 - 直接使用 Supabase User 類型
export type User = SupabaseUser

// 中間件處理函數的類型定義
export type AuthenticatedHandler = (
  request: NextRequest,
  context: { user: User; params?: Record<string, string> }
) => Promise<NextResponse>

export type AdminHandler = (
  request: NextRequest,
  context: { user: User; isAdmin: true; params?: Record<string, string> }
) => Promise<NextResponse>

export type OptionalAuthHandler = (
  request: NextRequest,
  context: { user: User | null; params?: Record<string, string> }
) => Promise<NextResponse>

/**
 * 檢查使用者是否為管理員
 */
async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single() as { data: { role: string } | null; error: any }

    return profile?.role === 'admin'
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    apiLogger.error('檢查管理員權限失敗', errorObj, {
      metadata: {
        userId,
      },
    })
    return false
  }
}

/**
 * 需要使用者登入的中間件
 *
 * @example
 * export const GET = requireAuth(async (req, { user }) => {
 *   // 這裡可以直接使用 user，不需要再檢查登入狀態
 *   return success(data, 'success')
 * })
 */
export function requireAuth(handler: AuthenticatedHandler): ApiHandler {
  return withErrorHandler(
    async (request: NextRequest, params?: unknown) => {
      const user = await getCurrentUser()

      if (!user) {
        apiLogger.warn('未認證的 API 存取嘗試', {
          metadata: {
            path: request.url,
            method: request.method,
            userAgent: request.headers.get('user-agent'),
          },
        })
        throw new AuthorizationError('需要登入才能存取此資源')
      }

      apiLogger.debug('使用者通過認證', {
        userId: user.id,
        metadata: {
          email: user.email,
          path: request.url,
        },
      })

      return handler(request, { user, params: params as Record<string, string> })
    },
    {
      module: 'RequireAuth',
    }
  )
}

/**
 * 需要管理員權限的中間件
 *
 * @example
 * export const DELETE = requireAdmin(async (req, { user, isAdmin }) => {
 *   // 這裡保證 user 是管理員，isAdmin 永遠是 true
 *   return success(null, '刪除成功')
 * })
 */
export function requireAdmin(handler: AdminHandler): ApiHandler {
  return withErrorHandler(
    async (request: NextRequest, params?: unknown) => {
      const user = await getCurrentUser()

      if (!user) {
        apiLogger.warn('未認證的管理員 API 存取嘗試', {
          metadata: {
            path: request.url,
            method: request.method,
            userAgent: request.headers.get('user-agent'),
          },
        })
        throw new AuthorizationError('需要登入才能存取此資源')
      }

      const isAdmin = await checkAdminRole(user.id)

      if (!isAdmin) {
        apiLogger.warn('非管理員嘗試存取管理員 API', {
          userId: user.id,
          metadata: {
            email: user.email,
            path: request.url,
            method: request.method,
          },
        })
        throw new AuthorizationError('需要管理員權限才能存取此資源')
      }

      apiLogger.debug('管理員通過認證', {
        userId: user.id,
        metadata: {
          email: user.email,
          path: request.url,
        },
      })

      return handler(request, { user, isAdmin: true, params: params as Record<string, string> })
    },
    {
      module: 'RequireAdmin',
    }
  )
}

/**
 * 可選認證的中間件（公開 API 但可能需要使用者資訊）
 *
 * @example
 * export const GET = optionalAuth(async (req, { user }) => {
 *   // user 可能是 null（未登入）或實際的使用者物件
 *   if (user) {
 *     return success(personalizedData, 'success')
 *   } else {
 *     return success(publicData, 'success')
 *   }
 * })
 */
export function optionalAuth(handler: OptionalAuthHandler): ApiHandler {
  return withErrorHandler(
    async (request: NextRequest, params?: unknown) => {
      let user: User | null = null

      try {
        user = await getCurrentUser()
      } catch (error) {
        // 忽略認證錯誤，因為這是可選的
        apiLogger.debug('可選認證失敗（正常）', {
          metadata: {
            path: request.url,
            error: error instanceof Error ? error.message : String(error),
          },
        })
      }

      apiLogger.debug('可選認證處理', {
        userId: user?.id,
        metadata: {
          hasUser: !!user,
          path: request.url,
        },
      })

      return handler(request, { user, params: params as Record<string, string> })
    },
    {
      module: 'OptionalAuth',
    }
  )
}

/**
 * 組合多個中間件的工具函數
 *
 * @example
 * // 需要認證且啟用快取的 API
 * export const GET = compose(requireAuth, withCache)(handler)
 */
export function compose<T extends ((handler: ApiHandler) => ApiHandler)[]>(...middlewares: T) {
  return (handler: ApiHandler) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}
