/**
 * 管理員單一訂單管理 API 路由
 *
 * GET /api/admin/orders/[id] - 取得單一訂單詳情（管理員）
 * PATCH /api/admin/orders/[id] - 更新訂單狀態（管理員）
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success } from '@/lib/api-response'
import { ValidationError, NotFoundError, MethodNotAllowedError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { orderCommandService } from '@/services/core/order/OrderCommandService'
import { orderQueryService } from '@/services/core/order/OrderQueryService'

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
 * @api {GET} /api/admin/orders/:id 取得訂單詳情（管理員）
 * @apiName GetOrderByIdAdmin
 * @apiGroup Admin
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 管理員查看任意訂單的詳細資訊。
 * 不受訂單所有權限制，可查看所有使用者的訂單。
 *
 * @apiPermission admin
 *
 * @apiParam {String} id 訂單 ID (UUID)
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 訂單資料
 * @apiSuccess {String} data.id 訂單 ID
 * @apiSuccess {String} data.status 訂單狀態
 * @apiSuccess {Object[]} data.items 訂單項目
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "status": "processing",
 *     "items": [...]
 *   },
 *   "message": "取得訂單詳情成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 訂單 ID 無效
 * @apiError (錯誤 4xx) {Object} NotFoundError 訂單不存在
 * @apiError (錯誤 4xx) {Object} AuthorizationError 需要管理員權限
 */
async function handleGET(req: NextRequest, user: User, context?: unknown) {
  const routeContext = context as { params: Promise<{ id: string }> } | undefined
  if (!routeContext?.params) {
    throw new ValidationError('缺少路由參數')
  }
  const { id } = await routeContext.params

  if (!id) {
    throw new ValidationError('訂單 ID 不能為空')
  }

  apiLogger.info('管理員取得訂單詳情', {
    module: 'AdminOrderAPI',
    action: 'getOrderById',
    metadata: { orderId: id, adminId: user.id },
  })

  // 管理員可以查看任何使用者的訂單，所以先取得訂單再驗證
  const order = await orderQueryService.findById(id)

  if (!order) {
    throw new NotFoundError('訂單不存在')
  }

  // 載入訂單項目
  const orderWithItems = await orderQueryService.getOrderById(id, order.userId)

  return success(orderWithItems, '取得訂單詳情成功')
}

/**
 * @api {PATCH} /api/admin/orders/:id 更新訂單（管理員）
 * @apiName UpdateOrderAdmin
 * @apiGroup Admin
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 管理員更新訂單狀態和資訊。
 * 可更新訂單狀態、備註、物流追蹤號等。
 *
 * @apiPermission admin
 *
 * @apiParam {String} id 訂單 ID (UUID)
 *
 * @apiBody {String="pending","confirmed","processing","shipped","delivered","cancelled","refunded"} [status] 訂單狀態
 * @apiBody {String} [notes] 備註
 * @apiBody {String} [trackingNumber] 物流追蹤號
 * @apiBody {String} [estimatedDeliveryDate] 預估送達日期
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 更新後的訂單資料
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "status": "shipped",
 *     "trackingNumber": "1234567890"
 *   },
 *   "message": "訂單更新成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 資料驗證失敗
 * @apiError (錯誤 4xx) {Object} NotFoundError 訂單不存在
 * @apiError (錯誤 4xx) {Object} AuthorizationError 需要管理員權限
 */
async function handlePATCH(req: NextRequest, user: User, context?: unknown) {
  const routeContext = context as { params: Promise<{ id: string }> } | undefined
  if (!routeContext?.params) {
    throw new ValidationError('缺少路由參數')
  }
  const { id } = await routeContext.params
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
  const existingOrder = await orderQueryService.findById(id)
  if (!existingOrder) {
    throw new NotFoundError('訂單不存在')
  }

  // 更新訂單狀態
  if (updates.status) {
    await orderCommandService.updateOrderStatus(id, updates.status, updates.notes)
  }

  // 更新其他欄位
  const otherUpdates: Partial<{
    trackingNumber: string
    estimatedDeliveryDate: string
    notes: string
  }> = {}
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
    await orderCommandService.updateOrder(id, otherUpdates)
  }

  // 取得更新後的訂單
  const updatedOrder = await orderQueryService.getOrderById(id, existingOrder.userId)

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

// 匯出 API 處理器 - 使用組合函數：權限檢查 + 錯誤處理
export const GET = withAdminAndError(handleGET, { module: 'AdminOrderDetailAPI' })
export const PATCH = withAdminAndError(handlePATCH, {
  module: 'AdminOrderDetailAPI',
  enableAuditLog: true,
})
export const PUT = withAdminAndError(handleUnsupportedMethod, { module: 'AdminOrderDetailAPI' })
export const DELETE = withAdminAndError(handleUnsupportedMethod, { module: 'AdminOrderDetailAPI' })
