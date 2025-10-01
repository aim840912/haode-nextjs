import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import type { Product } from '@/types/product'
import type { User } from '@/types/auth'

export interface UseInterestsReturn {
  interestedProducts: string[]
  interestedProductsData: Product[]
  loadingInterests: boolean
  loadInterests: () => Promise<void>
  removeFromInterests: (productId: string, productName: string) => Promise<void>
}

/**
 * 收藏清單 Hook
 * 負責載入和管理使用者收藏的產品
 */
export function useInterests(
  user: User | null,
  onSuccess: (message: string) => void,
  onError: (message: string) => void
): UseInterestsReturn {
  const [interestedProducts, setInterestedProducts] = useState<string[]>([])
  const [interestedProductsData, setInterestedProductsData] = useState<Product[]>([])
  const [loadingInterests, setLoadingInterests] = useState(false)

  // 載入收藏的產品資料
  const fetchInterestedProductsData = useCallback(
    async (productIds: string[]) => {
      setLoadingInterests(true)
      try {
        const response = await fetch('/api/products')
        if (response.ok) {
          const result = await response.json()

          // 處理統一 API 回應格式
          const allProducts = result.data || result

          // 確保 allProducts 是陣列
          if (!Array.isArray(allProducts)) {
            logger.error('API 回應格式錯誤：data 不是陣列', new Error('Invalid API response'), {
              metadata: { response: result },
            })
            setInterestedProductsData([])
            return
          }

          const filteredProducts = allProducts.filter(
            (product: Product) => productIds.includes(product.id) && product.isActive
          )
          setInterestedProductsData(filteredProducts)
        }
      } catch (error) {
        logger.error('Error fetching interested products', error as Error, {
          metadata: { userId: user?.id },
        })
      } finally {
        setLoadingInterests(false)
      }
    },
    [user]
  )

  // 載入收藏清單
  const loadInterests = useCallback(async () => {
    if (!user) return

    try {
      // 使用 API 路由取得興趣清單
      const response = await fetch('/api/user/interests')
      if (!response.ok) {
        throw new Error('Failed to fetch interests')
      }

      const result = await response.json()
      const interests = result.data?.interests || []
      setInterestedProducts(interests)

      if (interests.length > 0) {
        await fetchInterestedProductsData(interests)
      } else {
        setInterestedProductsData([])
      }
    } catch (error) {
      logger.error('Error loading interests', error as Error, {
        metadata: { userId: user?.id },
      })
    }
  }, [user, fetchInterestedProductsData])

  // 移除收藏
  const removeFromInterests = useCallback(
    async (productId: string, productName: string) => {
      if (!user) return

      try {
        // 使用 toggle API 移除興趣
        const response = await fetch('/api/user/interests/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId }),
        })

        if (!response.ok) {
          throw new Error('Failed to remove interest')
        }

        // 更新本地狀態
        setInterestedProducts(prev => prev.filter(id => id !== productId))
        setInterestedProductsData(prev => prev.filter(product => product.id !== productId))

        onSuccess(`已將「${productName}」從收藏清單中移除`)
      } catch (error) {
        logger.error('Error removing interest', error as Error, {
          metadata: { userId: user?.id, productId },
        })
        onError('移除失敗，請稍後再試')
      }
    },
    [user, onSuccess, onError]
  )

  return {
    interestedProducts,
    interestedProductsData,
    loadingInterests,
    loadInterests,
    removeFromInterests,
  }
}
