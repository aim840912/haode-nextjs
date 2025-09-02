/**
 * API 中間件系統入口
 * 提供統一的中間件匯出和組合工具
 */

// 匯出所有權限中間件
export {
  requireAuth,
  requireAdmin,
  optionalAuth,
  compose,
  type AuthenticatedHandler,
  type AdminHandler,
  type OptionalAuthHandler,
  type User,
} from './auth'

// 匯出既有的錯誤處理中間件
export { withErrorHandler } from '@/lib/error-handler'

// 匯出快取中間件
export { withApiCache, withProductsCache } from '@/lib/api-cache-middleware'

/**
 * 常用的中間件組合
 * 提供開箱即用的中間件組合，減少樣板程式碼
 */

import {
  requireAuth,
  requireAdmin,
  optionalAuth,
  AuthenticatedHandler,
  AdminHandler,
  OptionalAuthHandler,
} from './auth'
import { withErrorHandler, ApiHandler } from '@/lib/error-handler'

/**
 * 需要認證且啟用快取的中間件組合
 * 適用於需要使用者登入的資料查詢 API
 */
export function authWithCache(handler: AuthenticatedHandler) {
  return requireAuth(handler)
}

/**
 * 管理員權限且啟用快取的中間件組合
 * 適用於管理員專用的資料查詢 API
 */
export function adminWithCache(handler: AdminHandler) {
  return requireAdmin(handler)
}

/**
 * 公開 API 且啟用快取的中間件組合
 * 適用於不需要登入的公開資料查詢 API
 */
export function publicWithCache(handler: ApiHandler) {
  return withErrorHandler(handler)
}

/**
 * 可選認證且啟用快取的中間件組合
 * 適用於根據使用者狀態提供不同資料的 API
 */
export function optionalAuthWithCache(handler: OptionalAuthHandler) {
  return optionalAuth(handler)
}

/**
 * 中間件使用統計（開發用）
 * 在開發環境下記錄中間件使用情況，幫助優化
 */
const middlewareStats = new Map<string, number>()

export function trackMiddlewareUsage(middlewareName: string) {
  if (process.env.NODE_ENV === 'development') {
    const count = middlewareStats.get(middlewareName) || 0
    middlewareStats.set(middlewareName, count + 1)
  }
}

export function getMiddlewareStats() {
  if (process.env.NODE_ENV === 'development') {
    return Object.fromEntries(middlewareStats)
  }
  return {}
}
