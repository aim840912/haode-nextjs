/**
 * 管理員單一訂單管理 API 路由
 *
 * GET /api/admin/orders/[id] - 取得單一訂單詳情（管理員）
 * PATCH /api/admin/orders/[id] - 更新訂單狀態（管理員）
 */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api-middleware'
import { success } from '@/lib/api-response'
import { ValidationError, NotFoundError, MethodNotAllowedError } from '@/lib/errors'
import { orderService } from '@/services/orderService'
import { OrderStatus } from '@/types/order'
import { z } from 'zod'
import { apiLogger } from '@/lib/logger'

// 管理員訂單更新的驗證 schema
const AdminUpdateOrderSchema = z.object({
  status: z
    .enum([
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ] as const)
    .optional(),
  notes: z.string().optional(),
  trackingNumber: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
})

/**
 * GET /api/admin/orders/[id] - 管理員取得單一訂單詳情
 */
async function handleGET(req: NextRequest, user: any, context?: any) {
  const { id } = await context?.params

  if (!id) {
    throw new ValidationError('訂單 ID 不能為空')
  }

  apiLogger.info('管理員取得訂單詳情', {
    module: 'AdminOrderAPI',
    action: 'getOrderById',
    metadata: { orderId: id, adminId: user.id },
  })

  // 管理員可以查看任何使用者的訂單，所以先取得訂單再驗證
  const order = await orderService.findById(id)

  if (!order) {
    throw new NotFoundError('訂單不存在')
  }

  // 載入訂單項目
  const orderWithItems = await orderService.getOrderById(id, order.userId)

  return success(orderWithItems, '取得訂單詳情成功')
}

/**
 * PATCH /api/admin/orders/[id] - 管理員更新訂單
 */
async function handlePATCH(req: NextRequest, user: any, context?: any) {
  const { id } = await context?.params
  const body = await req.json()

  if (!id) {
    throw new ValidationError('訂單 ID 不能為空')
  }

  apiLogger.info('管理員更新訂單請求', {
    module: 'AdminOrderAPI',
    action: 'updateOrder',
    metadata: { orderId: id, adminId: user.id, updates: Object.keys(body) },
  })

  // 驗證請求資料
  const validation = AdminUpdateOrderSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`驗證失敗: ${errors}`)
  }

  const updates = validation.data

  // 檢查訂單是否存在
  const existingOrder = await orderService.findById(id)
  if (!existingOrder) {
    throw new NotFoundError('訂單不存在')
  }

  // 更新訂單狀態
  if (updates.status) {
    await orderService.updateOrderStatus(id, updates.status, updates.notes)
  }

  // 更新其他欄位
  const otherUpdates: any = {}
  if (updates.trackingNumber !== undefined) {
    otherUpdates.trackingNumber = updates.trackingNumber
  }
  if (updates.estimatedDeliveryDate !== undefined) {
    otherUpdates.estimatedDeliveryDate = updates.estimatedDeliveryDate
  }
  if (updates.notes && !updates.status) {
    otherUpdates.notes = updates.notes
  }

  if (Object.keys(otherUpdates).length > 0) {
    await orderService.update(id, otherUpdates)
  }

  // 取得更新後的訂單
  const updatedOrder = await orderService.getOrderById(id, existingOrder.userId)

  apiLogger.info('管理員更新訂單成功', {
    module: 'AdminOrderAPI',
    action: 'updateOrder',
    metadata: {
      orderId: id,
      adminId: user.id,
      updatedFields: Object.keys(updates),
      newStatus: updates.status,
    },
  })

  return success(updatedOrder, '訂單更新成功')
}

/**
 * 處理不支援的 HTTP 方法
 */
async function handleUnsupportedMethod(request: NextRequest): Promise<never> {
  throw new MethodNotAllowedError(`不支援的方法: ${request.method}`)
}

// 匯出 API 處理器
export const GET = requireAdmin(handleGET)
export const PATCH = requireAdmin(handlePATCH)
export const PUT = requireAdmin(handleUnsupportedMethod)
export const DELETE = requireAdmin(handleUnsupportedMethod)
