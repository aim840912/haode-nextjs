import { useAuth } from '@/contexts/AuthContext'

/**
 * 購物車存取權限 Hook
 *
 * 用於判斷當前用戶是否可以使用購物車功能。
 * 購物車功能僅在以下條件下可用：
 * - 開發環境 (NODE_ENV === 'development')
 * - 或管理員權限 (user.role === 'admin')
 *
 * @returns 購物車存取權限狀態
 *
 * @example
 * ```tsx
 * const { canAccessCart, disabledReason } = useCartAccess()
 *
 * <button disabled={!canAccessCart} title={disabledReason}>
 *   加入購物車
 * </button>
 * ```
 */
export function useCartAccess() {
  const { user } = useAuth()

  const isDevelopment = process.env.NODE_ENV === 'development'
  const isAdmin = user?.role === 'admin'
  const canAccessCart = isDevelopment || isAdmin

  // 提供禁用原因以便顯示給用戶
  const disabledReason = !canAccessCart ? '購物車功能暫未開放' : undefined

  return {
    /** 是否可以使用購物車功能 */
    canAccessCart,
    /** 是否為開發環境 */
    isDevelopment,
    /** 是否為管理員 */
    isAdmin,
    /** 禁用原因（用於 tooltip 或提示文字） */
    disabledReason,
  }
}
