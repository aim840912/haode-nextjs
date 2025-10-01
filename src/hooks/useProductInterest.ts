import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { userInterestsService } from '@/services/core/user/userInterestsService'
import { useToast } from '@/components/ui/feedback/Toast'
import { logger } from '@/lib/logger'

export interface UseProductInterestReturn {
  interestedProducts: Set<string>
  toggleInterest: (productId: string, productName: string, e?: React.MouseEvent) => Promise<void>
  isInterested: (productId: string) => boolean
}

/**
 * 產品興趣管理 Hook
 *
 * 提供統一的產品興趣功能：
 * - 載入使用者興趣清單
 * - 切換產品興趣狀態
 * - 處理未登入用戶的提示
 * - 統一的錯誤處理和通知
 */
export function useProductInterest(): UseProductInterestReturn {
  const [interestedProducts, setInterestedProducts] = useState<Set<string>>(new Set())
  const { user } = useAuth()
  const { success: showSuccess, error: showError, warning: showWarning } = useToast()

  // 載入使用者興趣清單
  useEffect(() => {
    const loadInterestedProducts = async () => {
      if (user?.id) {
        try {
          const interests = await userInterestsService.getUserInterests(user.id)
          setInterestedProducts(new Set(interests))
        } catch (error) {
          logger.error('載入興趣清單失敗', error as Error, {
            metadata: { action: 'load_interests', userId: user.id },
          })
        }
      } else {
        // 未登入時清空興趣清單
        setInterestedProducts(new Set())
      }
    }

    loadInterestedProducts()
  }, [user?.id])

  // 切換產品興趣狀態
  const toggleInterest = useCallback(
    async (productId: string, productName: string, e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation()
      }

      // 檢查登入狀態
      if (!user?.id) {
        showWarning('需要登入', `請先登入以收藏「${productName}」到您的興趣清單`)
        return
      }

      // 樂觀更新 UI
      const wasInterested = interestedProducts.has(productId)
      setInterestedProducts(prev => {
        const newSet = new Set(prev)
        if (wasInterested) {
          newSet.delete(productId)
        } else {
          newSet.add(productId)
        }
        return newSet
      })

      try {
        // 儲存到資料庫
        const success = await userInterestsService.toggleInterest(user.id, productId)

        if (!success) {
          // 如果儲存失敗，恢復原狀態
          setInterestedProducts(prev => {
            const newSet = new Set(prev)
            if (wasInterested) {
              newSet.add(productId) // 恢復
            } else {
              newSet.delete(productId) // 恢復
            }
            return newSet
          })

          showError('操作失敗', '請稍後再試')
          logger.error('更新興趣清單失敗', undefined, {
            metadata: { action: 'toggle_interest', productId, userId: user.id },
          })
          return
        }

        // 成功提示
        if (wasInterested) {
          showSuccess('已移除', `已從興趣清單移除 ${productName}`)
        } else {
          showSuccess('已加入', `已將 ${productName} 加入興趣清單！`)
        }

        // 觸發自定義事件通知其他元件更新
        window.dispatchEvent(new CustomEvent('interestedProductsUpdated'))
      } catch (error) {
        // 發生錯誤時恢復原狀態
        setInterestedProducts(prev => {
          const newSet = new Set(prev)
          if (wasInterested) {
            newSet.add(productId)
          } else {
            newSet.delete(productId)
          }
          return newSet
        })

        showError('操作失敗', '請稍後再試')
        logger.error('切換興趣狀態時發生錯誤', error as Error, {
          metadata: { action: 'toggle_interest', productId, userId: user.id },
        })
      }
    },
    [user?.id, interestedProducts, showSuccess, showError, showWarning]
  )

  // 檢查產品是否已被加入興趣
  const isInterested = useCallback(
    (productId: string) => interestedProducts.has(productId),
    [interestedProducts]
  )

  return {
    interestedProducts,
    toggleInterest,
    isInterested,
  }
}
