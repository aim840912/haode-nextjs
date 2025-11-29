'use client'

import { useCallback, useState, useTransition } from 'react'
import { useToast } from '@/components/ui/feedback/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { deleteProductAction, toggleProductActiveAction } from '@/app/actions/products'
import { logger } from '@/lib/logger'
import { Product } from '@/types/product'

interface UseProductActionsProps {
  products: Product[]
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  onDelete?: (id: string) => void
  onToggleActive?: (id: string, isActive: boolean) => void
  refetchData?: () => Promise<void>
}

interface UseProductActionsReturn {
  handleDelete: (id: string) => Promise<void>
  handleToggleActive: (id: string, isActive: boolean) => Promise<void>
  isActionDisabled: boolean
  isProductOperating: (id: string) => boolean
}

/**
 * 產品操作 Hook
 * 負責處理產品的刪除、上架/下架等操作
 *
 * 使用 Server Actions 進行資料變更，不再需要 CSRF Token
 */
export function useProductActions({
  products,
  setProducts,
  onDelete,
  onToggleActive,
  refetchData,
}: UseProductActionsProps): UseProductActionsReturn {
  const { user } = useAuth()
  const { success, error: errorToast, warning } = useToast()
  const [isPending, startTransition] = useTransition()

  // 操作狀態管理 - 追蹤正在進行操作的產品 ID
  const [operatingProductIds, setOperatingProductIds] = useState<Set<string>>(new Set())

  // Server Actions 不需要 CSRF token，只檢查是否有正在進行的操作
  const isActionDisabled = isPending

  // 檢查特定產品是否正在進行操作
  const isProductOperating = useCallback(
    (id: string) => {
      return operatingProductIds.has(id)
    },
    [operatingProductIds]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (!user) {
        warning('請先登入', '您需要登入後才能刪除產品')
        return
      }

      // 檢查產品是否正在進行操作
      if (operatingProductIds.has(id)) {
        warning('請稍候', '該產品正在進行其他操作，請稍後再試')
        return
      }

      const productToDelete = products.find(p => p.id === id)
      const productName = productToDelete?.name || '產品'

      if (!confirm(`確定要刪除產品「${productName}」嗎？此操作無法復原。`)) {
        return
      }

      // 標記為操作中
      setOperatingProductIds(prev => new Set(prev).add(id))

      startTransition(async () => {
        try {
          const result = await deleteProductAction(id)

          if (result.success) {
            success('刪除成功', `產品「${productName}」已刪除`)
            onDelete?.(id)

            if (refetchData) {
              await refetchData()
            }
          } else {
            errorToast('刪除失敗', result.error?.message || '刪除失敗，請稍後再試', [
              {
                label: '重試',
                onClick: () => handleDelete(id),
                variant: 'primary',
              },
            ])

            if (refetchData) {
              await refetchData()
            }
          }
        } catch (err) {
          logger.error('Error deleting product', err as Error, {
            metadata: { productId: id, module: 'useProductActions' },
          })

          const errorMessage = err instanceof Error ? err.message : '刪除失敗，請稍後再試'
          errorToast('刪除失敗', `無法刪除產品「${productName}」: ${errorMessage}`, [
            {
              label: '重試',
              onClick: () => handleDelete(id),
              variant: 'primary',
            },
          ])

          if (refetchData) {
            await refetchData()
          }
        } finally {
          // 移除操作狀態
          setOperatingProductIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
          })
        }
      })
    },
    [user, products, operatingProductIds, onDelete, refetchData, success, errorToast, warning]
  )

  const handleToggleActive = useCallback(
    async (id: string, isActive: boolean) => {
      if (!user) {
        warning('請先登入', '您需要登入後才能修改產品狀態')
        return
      }

      // 檢查產品是否正在進行操作
      if (operatingProductIds.has(id)) {
        warning('請稍候', '該產品正在進行其他操作，請稍後再試')
        return
      }

      const productToUpdate = products.find(p => p.id === id)
      const productName = productToUpdate?.name || '產品'
      const newActiveState = !isActive
      const actionText = newActiveState ? '上架' : '下架'

      // 標記為操作中
      setOperatingProductIds(prev => new Set(prev).add(id))

      // 樂觀更新
      setProducts(prevProducts =>
        prevProducts.map(p => (p.id === id ? { ...p, isActive: newActiveState } : p))
      )

      startTransition(async () => {
        try {
          const result = await toggleProductActiveAction(id, newActiveState)

          if (result.success) {
            success(`${actionText}成功`, `產品「${productName}」已${actionText}`)
            onToggleActive?.(id, newActiveState)
          } else {
            // 回滾樂觀更新
            setProducts(prevProducts =>
              prevProducts.map(p => (p.id === id ? { ...p, isActive: isActive } : p))
            )

            errorToast(
              `${actionText}失敗`,
              result.error?.message || `無法${actionText}產品「${productName}」`,
              [
                {
                  label: '重試',
                  onClick: () => handleToggleActive(id, isActive),
                  variant: 'primary',
                },
              ]
            )
          }
        } catch (err) {
          logger.error('Error updating product', err as Error, {
            metadata: { productId: id, module: 'useProductActions' },
          })

          // 回滾樂觀更新
          setProducts(prevProducts =>
            prevProducts.map(p => (p.id === id ? { ...p, isActive: isActive } : p))
          )

          const errorMessage = err instanceof Error ? err.message : '更新失敗，請稍後再試'
          errorToast(
            `${actionText}失敗`,
            `無法${actionText}產品「${productName}」: ${errorMessage}`,
            [
              {
                label: '重試',
                onClick: () => handleToggleActive(id, isActive),
                variant: 'primary',
              },
            ]
          )
        } finally {
          // 移除操作狀態
          setOperatingProductIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
          })
        }
      })
    },
    [user, products, setProducts, operatingProductIds, onToggleActive, success, errorToast, warning]
  )

  return {
    handleDelete,
    handleToggleActive,
    isActionDisabled,
    isProductOperating,
  }
}
