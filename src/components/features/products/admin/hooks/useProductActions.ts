'use client'

import { useCallback } from 'react'
import { Product } from '@/types/product'
import { useAuth } from '@/lib/auth-context'
import { useCSRFToken } from '@/hooks/useCSRFToken'
import { useToast } from '@/components/ui/feedback/Toast'
import { logger } from '@/lib/logger'

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
}

/**
 * 產品操作 Hook
 * 負責處理產品的刪除、上架/下架等操作
 */
export function useProductActions({
  products,
  setProducts,
  onDelete,
  onToggleActive,
  refetchData,
}: UseProductActionsProps): UseProductActionsReturn {
  const { user } = useAuth()
  const { token: csrfToken, loading: csrfLoading, error: csrfError } = useCSRFToken()
  const { success, error: errorToast, warning } = useToast()

  const isActionDisabled = csrfLoading || !csrfToken || !!csrfError

  const handleDelete = useCallback(
    async (id: string) => {
      if (!user) {
        warning('請先登入', '您需要登入後才能刪除產品')
        return
      }

      const productToDelete = products.find(p => p.id === id)
      const productName = productToDelete?.name || '產品'

      if (!confirm(`確定要刪除產品「${productName}」嗎？此操作無法復原。`)) {
        return
      }

      if (isActionDisabled) {
        if (csrfLoading) {
          warning('請稍候', '正在初始化安全驗證...')
        } else if (csrfError) {
          errorToast('安全驗證失敗', '請重新整理頁面後再試')
        }
        return
      }

      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }

        if (csrfToken) {
          headers['x-csrf-token'] = csrfToken
        }

        const response = await fetch(`/api/admin-proxy/products?id=${id}`, {
          method: 'DELETE',
          headers,
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        success('刪除成功', `產品「${productName}」已刪除`)
        onDelete?.(id)

        if (refetchData) {
          await refetchData()
        }
      } catch (error) {
        logger.error('Error deleting product', error as Error, {
          metadata: { productId: id, module: 'useProductActions' },
        })

        const errorMessage = error instanceof Error ? error.message : '刪除失敗，請稍後再試'
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
      }
    },
    [
      user,
      products,
      csrfToken,
      csrfLoading,
      csrfError,
      isActionDisabled,
      onDelete,
      refetchData,
      success,
      errorToast,
      warning,
    ]
  )

  const handleToggleActive = useCallback(
    async (id: string, isActive: boolean) => {
      if (!user) {
        warning('請先登入', '您需要登入後才能修改產品狀態')
        return
      }

      const productToUpdate = products.find(p => p.id === id)
      const productName = productToUpdate?.name || '產品'
      const newActiveState = !isActive
      const actionText = newActiveState ? '上架' : '下架'

      if (isActionDisabled) {
        if (csrfLoading) {
          warning('請稍候', '正在初始化安全驗證...')
        } else if (csrfError) {
          errorToast('安全驗證失敗', '請重新整理頁面後再試')
        }
        return
      }

      try {
        // 樂觀更新
        setProducts(prevProducts =>
          prevProducts.map(p => (p.id === id ? { ...p, isActive: newActiveState } : p))
        )

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }

        if (csrfToken) {
          headers['x-csrf-token'] = csrfToken
        }

        const response = await fetch(`/api/admin-proxy/products`, {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify({ id, isActive: newActiveState }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        success(`${actionText}成功`, `產品「${productName}」已${actionText}`)
        onToggleActive?.(id, newActiveState)
      } catch (error) {
        logger.error('Error updating product', error as Error, {
          metadata: { productId: id, module: 'useProductActions' },
        })

        const errorMessage = error instanceof Error ? error.message : '更新失敗，請稍後再試'
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

        // 回滾樂觀更新
        setProducts(prevProducts =>
          prevProducts.map(p => (p.id === id ? { ...p, isActive: isActive } : p))
        )
      }
    },
    [
      user,
      products,
      setProducts,
      csrfToken,
      csrfLoading,
      csrfError,
      isActionDisabled,
      onToggleActive,
      success,
      errorToast,
      warning,
    ]
  )

  return {
    handleDelete,
    handleToggleActive,
    isActionDisabled,
  }
}
