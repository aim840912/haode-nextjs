/**
 * Orders API 客戶端包裝層
 * 提供類型安全的 API 呼叫函數，供客戶端元件使用
 */

import { apiLogger } from '@/lib/logger'
import { apiClient } from '@/lib/api-client'
import { handleApiError } from './common'
import type {
  Order,
  CreateOrderRequest,
  OrderStatus,
  OrderListResponse,
  OrderFilters,
  OrderSummary,
} from '@/types/order'

/**
 * 訂單查詢參數
 */
export interface FetchOrdersParams extends OrderFilters {
  page?: number
  limit?: number
  offset?: number
}

/**
 * 訂單更新資料
 */
export interface UpdateOrderData {
  status?: OrderStatus
  trackingNumber?: string
  estimatedDeliveryDate?: string
  actualDeliveryDate?: string
  notes?: string
}

/**
 * 取得訂單列表（使用者）
 * @param params - 查詢參數（篩選、分頁）
 * @returns 訂單列表和總數
 */
export async function fetchUserOrders(params?: FetchOrdersParams): Promise<OrderListResponse> {
  try {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)))
          } else {
            searchParams.append(key, String(value))
          }
        }
      })
    }

    const endpoint = `/api/orders${searchParams.toString() ? `?${searchParams}` : ''}`
    const result = await apiClient.get<OrderListResponse>(endpoint)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得訂單列表失敗')
    }

    apiLogger.info('訂單列表取得成功', {
      metadata: { count: result.data.orders.length, total: result.data.total },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchUserOrders', 'OrdersAPI')
  }
}

/**
 * 取得單一訂單詳情
 * @param id - 訂單 ID
 * @returns 訂單詳細資料
 */
export async function fetchOrderById(id: string): Promise<Order> {
  try {
    const result = await apiClient.get<Order>(`/api/orders/${id}`)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得訂單詳情失敗')
    }

    apiLogger.info('訂單詳情取得成功', {
      metadata: { orderId: id },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchOrderById', 'OrdersAPI')
  }
}

/**
 * 建立新訂單
 * @param data - 訂單資料
 * @returns 建立的訂單
 */
export async function createOrder(data: CreateOrderRequest): Promise<Order> {
  try {
    const result = await apiClient.post<Order>(
      '/api/orders',
      data as unknown as Record<string, unknown>
    )

    if (!result.success || !result.data) {
      throw new Error(result.message || '建立訂單失敗')
    }

    apiLogger.info('訂單建立成功', {
      metadata: {
        orderId: result.data.id,
        orderNumber: result.data.orderNumber,
        totalAmount: result.data.totalAmount,
      },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'createOrder', 'OrdersAPI')
  }
}

/**
 * 更新訂單
 * @param id - 訂單 ID
 * @param data - 更新資料
 * @returns 更新後的訂單
 */
export async function updateOrder(id: string, data: UpdateOrderData): Promise<Order> {
  try {
    const result = await apiClient.put<Order>(
      `/api/orders/${id}`,
      data as unknown as Record<string, unknown>
    )

    if (!result.success || !result.data) {
      throw new Error(result.message || '更新訂單失敗')
    }

    apiLogger.info('訂單更新成功', {
      metadata: { orderId: id, updates: Object.keys(data) },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'updateOrder', 'OrdersAPI')
  }
}

/**
 * 取消訂單
 * @param id - 訂單 ID
 * @param reason - 取消原因
 * @returns 是否取消成功
 */
export async function cancelOrder(id: string, reason?: string): Promise<boolean> {
  try {
    const result = await apiClient.patch<Order>(`/api/orders/${id}`, {
      status: 'cancelled',
      notes: reason,
    })

    if (!result.success) {
      throw new Error(result.message || '取消訂單失敗')
    }

    apiLogger.info('訂單取消成功', {
      metadata: { orderId: id, reason },
    })

    return true
  } catch (error) {
    handleApiError(error, 'cancelOrder', 'OrdersAPI')
  }
}

/**
 * 取得訂單統計（管理員）
 * @returns 訂單統計資料
 */
export async function fetchOrderSummary(): Promise<OrderSummary> {
  try {
    const result = await apiClient.get<OrderSummary>('/api/orders/summary')

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得訂單統計失敗')
    }

    apiLogger.info('訂單統計取得成功', {
      metadata: {
        totalOrders: result.data.totalOrders,
        totalAmount: result.data.totalAmount,
      },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchOrderSummary', 'OrdersAPI')
  }
}
