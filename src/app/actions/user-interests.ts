/**
 * 用戶興趣 Server Actions
 *
 * 提供用戶興趣管理的 Server Actions:
 * - toggleInterestAction - 切換產品興趣狀態
 * - syncInterestsAction - 同步本地興趣清單到雲端
 */

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAuth, success, error, validationError } from '@/lib/server'
import { userInterestsService } from '@/services/core/user/userInterestsService'

/**
 * 切換產品興趣狀態 Schema
 */
const ToggleInterestSchema = z.object({
  productId: z.string().min(1, '產品ID不能為空'),
})

/**
 * 同步興趣清單 Schema
 */
const SyncInterestsSchema = z.object({
  localInterests: z.array(z.string()).default([]),
})

/**
 * 切換產品興趣狀態
 *
 * 如果產品已在興趣清單中則移除,否則添加
 *
 * @param data - 包含 productId 的資料
 * @returns ActionResponse 包含切換結果
 *
 * @example
 * ```tsx
 * // 在客戶端元件中使用
 * import { toggleInterestAction } from '@/app/actions/user-interests'
 *
 * function ProductCard({ productId }) {
 *   const [isPending, startTransition] = useTransition()
 *
 *   const handleToggle = () => {
 *     startTransition(async () => {
 *       const result = await toggleInterestAction({ productId })
 *
 *       if (result.success) {
 *         toast.success(result.message)
 *       } else {
 *         toast.error(result.error.message)
 *       }
 *     })
 *   }
 *
 *   return (
 *     <button onClick={handleToggle} disabled={isPending}>
 *       {isPending ? '處理中...' : '加入興趣'}
 *     </button>
 *   )
 * }
 * ```
 */
export async function toggleInterestAction(data: unknown) {
  try {
    // 1. 認證檢查
    const user = await requireAuth()

    // 2. 驗證輸入資料
    const result = ToggleInterestSchema.safeParse(data)

    if (!result.success) {
      return validationError(result.error)
    }

    const { productId } = result.data

    // 3. 檢查當前狀態
    const currentInterests = await userInterestsService.getUserInterests(user.id)
    const isCurrentlyInterested = currentInterests.includes(productId)

    // 4. 切換興趣狀態
    const success_result = await userInterestsService.toggleInterest(user.id, productId)

    if (!success_result) {
      throw new Error('切換興趣狀態失敗')
    }

    // 5. Revalidation - 清除相關頁面快取
    revalidatePath('/products') // 產品列表頁
    revalidatePath(`/products/${productId}`) // 產品詳情頁
    revalidatePath('/user/interests') // 用戶興趣清單頁

    // 6. 返回成功回應
    const action = isCurrentlyInterested ? 'removed' : 'added'
    const message = isCurrentlyInterested ? '已從興趣清單移除' : '已加入興趣清單'

    return success(
      {
        userId: user.id,
        productId,
        action,
        wasInterested: isCurrentlyInterested,
        nowInterested: !isCurrentlyInterested,
      },
      message
    )
  } catch (err) {
    return error(err)
  }
}

/**
 * 同步本地興趣清單到雲端
 *
 * 用於使用者登入時合併本地 (localStorage) 和雲端的興趣清單
 * 同步操作不記錄審計日誌 (非關鍵業務操作)
 *
 * @param data - 包含 localInterests 的資料
 * @returns ActionResponse 包含合併後的興趣清單
 *
 * @example
 * ```tsx
 * // 在客戶端元件中使用 (登入後同步)
 * import { syncInterestsAction } from '@/app/actions/user-interests'
 *
 * function LoginCallback() {
 *   useEffect(() => {
 *     const syncLocalInterests = async () => {
 *       // 從 localStorage 讀取本地興趣
 *       const localInterests = JSON.parse(
 *         localStorage.getItem('interests') || '[]'
 *       )
 *
 *       if (localInterests.length > 0) {
 *         const result = await syncInterestsAction({ localInterests })
 *
 *         if (result.success) {
 *           console.log(`同步了 ${result.data.syncedCount} 個興趣`)
 *           // 清除本地儲存
 *           localStorage.removeItem('interests')
 *         }
 *       }
 *     }
 *
 *     syncLocalInterests()
 *   }, [])
 * }
 * ```
 */
export async function syncInterestsAction(data: unknown) {
  try {
    // 1. 認證檢查
    const user = await requireAuth()

    // 2. 驗證輸入資料
    const result = SyncInterestsSchema.safeParse(data)

    if (!result.success) {
      return validationError(result.error)
    }

    const { localInterests } = result.data

    // 3. 呼叫服務層進行同步
    const mergedInterests = await userInterestsService.syncLocalInterests(user.id, localInterests)

    // 4. Revalidation - 清除興趣相關頁面快取
    revalidatePath('/products') // 產品列表頁
    revalidatePath('/user/interests') // 用戶興趣清單頁

    // 5. 返回成功回應
    return success(
      {
        userId: user.id,
        interests: mergedInterests,
        syncedCount: localInterests.length,
        totalCount: mergedInterests.length,
      },
      '興趣清單同步成功'
    )
  } catch (err) {
    return error(err)
  }
}
