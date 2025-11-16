/**
 * Server Actions 認證工具
 *
 * 提供 Server-only 的認證檢查功能,用於 Server Actions 中:
 * - 從 cookies 取得當前用戶
 * - 檢查用戶認證狀態
 * - 檢查管理員權限
 * - 與現有 JWT 系統整合
 *
 * ⚠️ 只能在 Server Actions 或 Server Components 中使用
 */

import { cookies } from 'next/headers'
import * as jwt from 'jsonwebtoken'
import { authLogger } from '@/lib/logger'
import { AuthenticationError, AuthorizationError } from '@/lib/errors'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET 環境變數是必填項目,請在 .env.local 中設定')
}

if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET 必須至少包含 32 個字元以確保安全性')
}

/**
 * 用戶資訊介面
 */
export interface ServerUser {
  id: string
  email: string
  isAdmin: boolean
}

/**
 * JWT Payload 介面
 */
interface JWTPayload {
  userId: string
  email: string
  isAdmin?: boolean
  iat?: number
  exp?: number
}

/**
 * 從 JWT token 驗證並提取用戶資訊
 */
function verifyJWTToken(token: string): ServerUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as JWTPayload
    return {
      id: decoded.userId,
      email: decoded.email,
      isAdmin: decoded.isAdmin || false,
    }
  } catch (error) {
    authLogger.warn('JWT token 驗證失敗', {
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    })
    return null
  }
}

/**
 * 從 cookies 中取得認證 token
 */
async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()

  // 嘗試從不同可能的 cookie 名稱取得 token
  // 1. Authorization header 格式的 cookie
  const authCookie = cookieStore.get('authorization')
  if (authCookie?.value) {
    const token = authCookie.value.startsWith('Bearer ')
      ? authCookie.value.substring(7)
      : authCookie.value
    return token
  }

  // 2. 直接的 token cookie
  const tokenCookie = cookieStore.get('token')
  if (tokenCookie?.value) {
    return tokenCookie.value
  }

  // 3. auth-token cookie (備用)
  const authTokenCookie = cookieStore.get('auth-token')
  if (authTokenCookie?.value) {
    return authTokenCookie.value
  }

  return null
}

/**
 * 取得當前用戶 (可選認證)
 *
 * 如果用戶未登入,返回 null 而不拋出錯誤
 * 用於公開的 Server Actions 或需要區分登入/未登入狀態的場景
 *
 * @returns ServerUser | null
 *
 * @example
 * ```ts
 * 'use server'
 *
 * export async function getProductsAction() {
 *   const user = await auth() // 可能為 null
 *
 *   if (user) {
 *     // 已登入用戶: 顯示個人化內容
 *     return getPersonalizedProducts(user.id)
 *   } else {
 *     // 訪客: 顯示一般內容
 *     return getPublicProducts()
 *   }
 * }
 * ```
 */
export async function auth(): Promise<ServerUser | null> {
  const token = await getAuthToken()

  if (!token) {
    return null
  }

  return verifyJWTToken(token)
}

/**
 * 要求用戶必須已認證
 *
 * 如果用戶未登入,拋出 AuthenticationError
 * 用於需要登入才能執行的 Server Actions
 *
 * @returns ServerUser
 * @throws AuthenticationError - 當用戶未登入時
 *
 * @example
 * ```ts
 * 'use server'
 *
 * export async function createOrderAction(data: CreateOrderInput) {
 *   const user = await requireAuth() // 拋出錯誤如果未登入
 *
 *   const order = await orderService.createOrder(user.id, data)
 *   return { success: true, data: order }
 * }
 * ```
 */
export async function requireAuth(): Promise<ServerUser> {
  const user = await auth()

  if (!user) {
    authLogger.warn('Server Action 認證失敗: 用戶未登入', {
      metadata: {
        module: 'ServerAuth',
        action: 'requireAuth',
      },
    })
    throw new AuthenticationError('需要登入才能執行此操作')
  }

  return user
}

/**
 * 要求用戶必須是管理員
 *
 * 如果用戶未登入或不是管理員,拋出相應錯誤
 * 用於管理員專用的 Server Actions
 *
 * @returns ServerUser (保證 isAdmin === true)
 * @throws AuthenticationError - 當用戶未登入時
 * @throws AuthorizationError - 當用戶不是管理員時
 *
 * @example
 * ```ts
 * 'use server'
 *
 * export async function deleteUserAction(userId: string) {
 *   const admin = await requireAdmin() // 拋出錯誤如果不是管理員
 *
 *   await userService.deleteUser(userId, admin.id)
 *   return { success: true }
 * }
 * ```
 */
export async function requireAdmin(): Promise<ServerUser> {
  const user = await requireAuth()

  if (!user.isAdmin) {
    authLogger.warn('Server Action 授權失敗: 用戶不是管理員', {
      metadata: {
        module: 'ServerAuth',
        action: 'requireAdmin',
        userId: user.id,
        email: user.email,
      },
    })
    throw new AuthorizationError('需要管理員權限才能執行此操作')
  }

  return user
}

/**
 * 檢查用戶是否已認證 (布林值)
 *
 * 與 auth() 類似,但只返回布林值而不返回用戶物件
 * 用於需要快速檢查登入狀態的場景
 *
 * @returns boolean
 *
 * @example
 * ```ts
 * 'use server'
 *
 * export async function getNavMenuAction() {
 *   const isLoggedIn = await isAuthenticated()
 *
 *   return {
 *     items: isLoggedIn ? authenticatedMenuItems : guestMenuItems
 *   }
 * }
 * ```
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await auth()
  return user !== null
}

/**
 * 檢查用戶是否是管理員 (布林值)
 *
 * @returns boolean
 *
 * @example
 * ```ts
 * 'use server'
 *
 * export async function getAdminMenuAction() {
 *   const isAdmin = await isAdmin()
 *
 *   if (!isAdmin) {
 *     return { items: [] }
 *   }
 *
 *   return { items: adminMenuItems }
 * }
 * ```
 */
export async function isAdmin(): Promise<boolean> {
  const user = await auth()
  return user !== null && user.isAdmin
}
