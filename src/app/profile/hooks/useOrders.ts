import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import type { Order } from '@/types/order'
import type { User } from '@/types/auth'

export interface UseOrdersReturn {
  orders: Order[]
  loadingOrders: boolean
  ordersError: string | null
  loadOrders: () => Promise<void>
  cancelOrder: (orderId: string) => Promise<void>
  getStatusText: (status: string) => string
  getStatusColor: (status: string) => string
}

/**
 * 訂單管理 Hook
 * 負責載入訂單列表和取消訂單
 */
export function useOrders(
  user: User | null,
  onSuccess: (message: string) => void,
  onError: (message: string) => void
): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  // 載入訂單資料
  const loadOrders = useCallback(async () => {
    if (!user) return

    setLoadingOrders(true)
    setOrdersError(null)

    try {
      const response = await fetch('/api/orders?limit=10')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setOrders(result.data.orders || [])
        } else {
          throw new Error(result.message || '載入訂單失敗')
        }
      } else {
        throw new Error('載入訂單失敗')
      }
    } catch (error) {
      logger.error('Error loading orders', error as Error, {
        metadata: { userId: user?.id },
      })
      setOrdersError('載入訂單失敗，請稍後再試')
      setOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }, [user])

  // 取消訂單
  const cancelOrder = useCallback(
    async (orderId: string) => {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'cancel',
            reason: '使用者主動取消',
          }),
        })

        if (response.ok) {
          onSuccess('訂單已成功取消')
          // 重新載入訂單列表
          loadOrders()
        } else {
          const errorData = await response.json()
          onError(errorData.message || '取消訂單失敗，請稍後再試')
        }
      } catch (cancelError) {
        logger.error('Error canceling order', cancelError as Error, {
          metadata: { orderId },
        })
        onError('取消訂單失敗，請稍後再試')
      }
    },
    [loadOrders, onSuccess, onError]
  )

  // 訂單狀態文字
  const getStatusText = useCallback((status: string): string => {
    switch (status) {
      case 'pending':
        return '待確認'
      case 'confirmed':
        return '已確認'
      case 'processing':
        return '處理中'
      case 'shipped':
        return '已出貨'
      case 'delivered':
        return '已送達'
      case 'cancelled':
        return '已取消'
      default:
        return status
    }
  }, [])

  // 訂單狀態顏色
  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-purple-100 text-purple-800'
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  return {
    orders,
    loadingOrders,
    ordersError,
    loadOrders,
    cancelOrder,
    getStatusText,
    getStatusColor,
  }
}
