/**
 * Unified Upload API - Permission Checks
 *
 * 統一圖片上傳 API 的權限檢查邏輯
 */

import { AuthorizationError } from '@/lib/errors'
import type { User } from '@/lib/middleware/api-middleware'

/**
 * 需要管理員權限的模組列表
 */
const ADMIN_ONLY_MODULES = ['products', 'site-settings'] as const

/**
 * 檢查模組是否需要管理員權限
 *
 * @param module - 模組名稱
 * @returns 是否需要管理員權限
 */
export function isAdminOnlyModule(module: string): boolean {
  return ADMIN_ONLY_MODULES.includes(module as (typeof ADMIN_ONLY_MODULES)[number])
}

/**
 * 檢查上傳權限
 *
 * 產品和網站設定模組需要管理員權限
 *
 * @param module - 模組名稱
 * @param user - 使用者資訊
 * @throws {AuthorizationError} 權限不足
 */
export function checkUploadPermission(module: string, user: User): void {
  if (isAdminOnlyModule(module) && !user.isAdmin) {
    const moduleLabel = module === 'products' ? '產品' : '網站設定'
    throw new AuthorizationError(`${moduleLabel}圖片上傳需要管理員權限`)
  }
}

/**
 * 檢查刪除權限
 *
 * 產品和網站設定模組需要管理員權限
 *
 * @param module - 模組名稱
 * @param user - 使用者資訊
 * @throws {AuthorizationError} 權限不足
 */
export function checkDeletePermission(module: string, user: User): void {
  if (isAdminOnlyModule(module) && !user.isAdmin) {
    const moduleLabel = module === 'products' ? '產品' : '網站設定'
    throw new AuthorizationError(`${moduleLabel}圖片刪除需要管理員權限`)
  }
}
