/**
 * 單一訂單 API 路由
 *
 * GET /api/orders/[id] - 取得單一訂單詳情
 * PATCH /api/orders/[id] - 更新訂單（使用者取消訂單）
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success } from '@/lib/api-response'
import { ValidationError, NotFoundError, MethodNotAllowedError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'
import { orderService } from '@/services/core/order'

// 訂單更新的驗證 schema
const UpdateOrderSchema = z.object({
  action: z.enum(['cancel'], { message: '僅支援取消訂單操作' }),
  reason: z.string().optional(),
})

/**
 * @api {GET} /api/orders/:id 取得單一訂單詳情
 * @apiName GetOrderById
 * @apiGroup Orders
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得當前登入使用者的特定訂單詳細資訊。
 * 只能查看自己的訂單，系統會自動驗證訂單所有權。
 *
 * @apiPermission user
 *
 * @apiParam {String} id 訂單 ID (UUID)
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 訂單資料
 * @apiSuccess {String} data.id 訂單 ID
 * @apiSuccess {String} data.orderNumber 訂單編號
 * @apiSuccess {String} data.status 訂單狀態
 * @apiSuccess {Number} data.totalAmount 訂單總金額
 * @apiSuccess {String} data.createdAt 建立時間
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "orderNumber": "ORD-20250107-001",
 *     "status": "pending",
 *     "totalAmount": 1500,
 *     "createdAt": "2025-01-07T10:30:00Z"
 *   },
 *   "message": "取得訂單詳情成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 訂單 ID 格式錯誤
 * @apiError (錯誤 4xx) {Object} AuthorizationError 未登入或權限不足
 * @apiError (錯誤 4xx) {Object} NotFoundError 訂單不存在或無權限查看
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 404 Not Found
 * {
 *   "success": false,
 *   "error": "訂單不存在或無權限查看",
 *   "code": "NOT_FOUND"
 * }
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

  apiLogger.info('取得訂單詳情', {
    module: 'OrderAPI',
    action: 'getOrderById',
    metadata: { orderId: id, userId: user.id },
  })

  const order = await orderService.getOrderById(id, user.id)

  if (!order) {
    throw new NotFoundError('訂單不存在或無權限查看')
  }

  return success(order, '取得訂單詳情成功')
}

/**
 * @api {PATCH} /api/orders/:id 取消訂單
 * @apiName CancelOrder
 * @apiGroup Orders
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 更新訂單狀態，目前僅支援取消訂單操作。
 * 使用者只能取消自己的訂單，並可選擇性提供取消原因。
 *
 * @apiPermission user
 *
 * @apiParam {String} id 訂單 ID (UUID)
 *
 * @apiBody {String="cancel"} action 操作類型（目前僅支援 "cancel"）
 * @apiBody {String} [reason] 取消原因
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 回應資料（null）
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": null,
 *   "message": "訂單已成功取消"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 資料驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 未登入或權限不足
 * @apiError (錯誤 4xx) {Object} NotFoundError 訂單不存在或無權限操作
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "驗證失敗: action: 僅支援取消訂單操作",
 *   "code": "VALIDATION_ERROR"
 * }
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

  apiLogger.info('更新訂單請求', {
    module: 'OrderAPI',
    action: 'updateOrder',
    metadata: { orderId: id, userId: user.id, action: body.action },
  })

  // 驗證請求資料
  const validation = UpdateOrderSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`驗證失敗: ${errors}`)
  }

  const { action, reason } = validation.data

  if (action === 'cancel') {
    await orderService.cancelOrder(id, user.id, reason)

    apiLogger.info('取消訂單成功', {
      module: 'OrderAPI',
      action: 'cancelOrder',
      metadata: { orderId: id, userId: user.id, reason },
    })

    return success(null, '訂單已成功取消')
  }

  throw new ValidationError('不支援的操作')
}

/**
 * 處理不支援的 HTTP 方法
 */
async function handleUnsupportedMethod(request: NextRequest): Promise<never> {
  throw new MethodNotAllowedError(`不支援的方法: ${request.method}`)
}

// 匯出 API 處理器 - 使用組合函數：權限檢查 + 錯誤處理
export const GET = withAuthAndError(handleGET, { module: 'OrderAPI' })
export const PATCH = withAuthAndError(handlePATCH, { module: 'OrderAPI', enableAuditLog: true })
export const PUT = withAuthAndError(handleUnsupportedMethod, { module: 'OrderAPI' })
export const DELETE = withAuthAndError(handleUnsupportedMethod, { module: 'OrderAPI' })
