/**
 * 管理員訂單管理 API 路由
 *
 * GET /api/admin/orders - 取得所有訂單（管理員）
 * PATCH /api/admin/orders/[id] - 更新訂單狀態（管理員）
 */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api-middleware'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { orderService } from '@/services/orderService'
import { OrderStatus } from '@/types/order'
import { z } from 'zod'
import { apiLogger } from '@/lib/logger'

// 訂單狀態更新的驗證 schema
const AdminUpdateOrderSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ] as const),
  notes: z.string().optional(),
  trackingNumber: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
})

/**
 * GET /api/admin/orders - 取得所有訂單
 */
async function handleGET(req: NextRequest, user: any) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = (page - 1) * limit
  const status = searchParams.get('status')
  const userId = searchParams.get('userId')

  apiLogger.info('管理員取得所有訂單', {
    module: 'AdminOrdersAPI',
    action: 'getAllOrders',
    metadata: { adminId: user.id, page, limit, status, userId },
  })

  const result = await orderService.getAllOrders(limit, offset)

  // 如果有篩選條件，這裡可以進一步過濾
  let filteredOrders = result.orders
  if (status) {
    filteredOrders = result.orders.filter(order => order.status === status)
  }
  if (userId) {
    filteredOrders = filteredOrders.filter(order => order.userId === userId)
  }

  return success(
    {
      orders: filteredOrders,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasNext: offset + limit < result.total,
        hasPrev: page > 1,
      },
      summary: await orderService.getOrderSummary(),
    },
    '取得所有訂單成功'
  )
}

// 匯出 API 處理器
export const GET = requireAdmin(handleGET)
