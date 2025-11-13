/**
 * @api {GET} /api/orders 取得使用者訂單列表
 * @apiName GetUserOrders
 * @apiGroup Orders
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得當前登入使用者的所有訂單列表，支援分頁查詢（需要使用者認證）。
 * 返回結果包含完整的分頁資訊。
 *
 * @apiPermission user
 *
 * @apiQuery {Number} [page=1] 頁碼（從 1 開始）
 * @apiQuery {Number} [limit=20] 每頁筆數（最大 50）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 回應資料
 * @apiSuccess {Object[]} data.orders 訂單列表
 * @apiSuccess {String} data.orders.id 訂單 ID
 * @apiSuccess {String} data.orders.orderNumber 訂單編號
 * @apiSuccess {String} data.orders.userId 使用者 ID
 * @apiSuccess {String} data.orders.status 訂單狀態（pending/processing/delivered/cancelled）
 * @apiSuccess {Object[]} data.orders.items 訂單項目列表
 * @apiSuccess {Number} data.orders.totalAmount 訂單總金額
 * @apiSuccess {Object} data.orders.shippingAddress 配送地址
 * @apiSuccess {String} data.orders.paymentMethod 付款方式
 * @apiSuccess {String} data.orders.paymentStatus 付款狀態
 * @apiSuccess {String} data.orders.createdAt 建立時間
 * @apiSuccess {Object} data.pagination 分頁資訊
 * @apiSuccess {Number} data.pagination.page 當前頁碼
 * @apiSuccess {Number} data.pagination.limit 每頁筆數
 * @apiSuccess {Number} data.pagination.total 總筆數
 * @apiSuccess {Number} data.pagination.totalPages 總頁數
 * @apiSuccess {Boolean} data.pagination.hasNext 是否有下一頁
 * @apiSuccess {Boolean} data.pagination.hasPrev 是否有上一頁
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "orders": [
 *       {
 *         "id": "uuid",
 *         "orderNumber": "ORD-20250107-001",
 *         "userId": "uuid",
 *         "status": "pending",
 *         "items": [],
 *         "totalAmount": 1500,
 *         "shippingAddress": {},
 *         "paymentMethod": "信用卡",
 *         "paymentStatus": "pending",
 *         "createdAt": "2025-01-07T00:00:00Z"
 *       }
 *     ],
 *     "pagination": {
 *       "page": 1,
 *       "limit": 20,
 *       "total": 50,
 *       "totalPages": 3,
 *       "hasNext": true,
 *       "hasPrev": false
 *     }
 *   },
 *   "message": "取得訂單列表成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} AuthorizationError 未登入或權限不足
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫查詢失敗
 *
 * @apiErrorExample {json} 未登入錯誤:
 * HTTP/1.1 401 Unauthorized
 * {
 *   "success": false,
 *   "error": "未授權訪問",
 *   "code": "UNAUTHORIZED"
 * }
 */

/**
 * @api {POST} /api/orders 建立訂單
 * @apiName CreateOrder
 * @apiGroup Orders
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 建立新訂單（需要使用者認證）。
 * 系統會自動驗證產品庫存、計算訂單金額、生成訂單編號。
 * 成功建立後會記錄業務指標。
 *
 * @apiPermission user
 *
 * @apiBody {Object[]} items 訂單項目列表（至少 1 項）
 * @apiBody {String} items.productId 產品 ID（UUID 格式）
 * @apiBody {Number} items.quantity 購買數量（正整數）
 * @apiBody {Object} shippingAddress 配送地址
 * @apiBody {String} shippingAddress.name 收件人姓名
 * @apiBody {String} shippingAddress.phone 收件人電話
 * @apiBody {String} shippingAddress.street 街道地址
 * @apiBody {String} shippingAddress.city 城市
 * @apiBody {String} shippingAddress.postalCode 郵遞區號
 * @apiBody {String} shippingAddress.country 國家
 * @apiBody {String} [shippingAddress.notes] 地址備註
 * @apiBody {String} [paymentMethod] 付款方式
 * @apiBody {String} [notes] 訂單備註
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 建立的訂單資料
 * @apiSuccess {String} data.id 訂單 ID
 * @apiSuccess {String} data.orderNumber 訂單編號
 * @apiSuccess {String} data.status 訂單狀態
 * @apiSuccess {Number} data.totalAmount 訂單總金額
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "orderNumber": "ORD-20250107-001",
 *     "status": "pending",
 *     "totalAmount": 1500
 *   },
 *   "message": "訂單建立成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 資料驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 未登入或權限不足
 * @apiError (錯誤 4xx) {Object} NotFoundError 產品不存在
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫操作失敗
 *
 * @apiErrorExample {json} 驗證錯誤（訂單項目為空）:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "訂單項目不能為空",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 驗證錯誤（產品 ID 格式）:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "產品 ID 格式不正確",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 驗證錯誤（地址資訊）:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "收件人姓名不能為空",
 *   "code": "VALIDATION_ERROR"
 * }
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, created } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'
import { orderQueryService } from '@/services/core/order/OrderQueryService'
import { orderCommandService } from '@/services/core/order/OrderCommandService'
import { CreateOrderRequest } from '@/types/order'

// 建立訂單的驗證 schema
const CreateOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid('產品 ID 格式不正確'),
        quantity: z.number().int().positive('數量必須大於 0'),
      })
    )
    .min(1, '訂單項目不能為空'),
  shippingAddress: z.object({
    name: z.string().min(1, '收件人姓名不能為空'),
    phone: z.string().min(1, '收件人電話不能為空'),
    street: z.string().min(1, '街道地址不能為空'),
    city: z.string().min(1, '城市不能為空'),
    postalCode: z.string().min(1, '郵遞區號不能為空'),
    country: z.string().min(1, '國家不能為空'),
    notes: z.string().optional(),
  }),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
})

/**
 * GET /api/orders - 取得使用者的訂單列表
 */
async function handleGET(req: NextRequest, user: User) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = (page - 1) * limit

  apiLogger.info('取得使用者訂單列表', {
    module: 'OrdersAPI',
    action: 'getUserOrders',
    metadata: { userId: user.id, page, limit },
  })

  const result = await orderQueryService.getUserOrders(user.id, limit, offset)

  return success(
    {
      orders: result.orders,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasNext: offset + limit < result.total,
        hasPrev: page > 1,
      },
    },
    '取得訂單列表成功'
  )
}

/**
 * POST /api/orders - 建立新訂單
 */
async function handlePOST(req: NextRequest, user: User) {
  const body = await req.json()

  apiLogger.info('建立新訂單請求', {
    module: 'OrdersAPI',
    action: 'createOrder',
    metadata: { userId: user.id, itemCount: body.items?.length },
  })

  // 驗證請求資料
  const validation = CreateOrderSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`驗證失敗: ${errors}`)
  }

  const orderData: CreateOrderRequest = validation.data
  const order = await orderCommandService.createOrder(user.id, orderData)

  apiLogger.info('建立訂單成功', {
    module: 'OrdersAPI',
    action: 'createOrder',
    metadata: {
      userId: user.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
    },
  })

  return created(order, '訂單建立成功')
}

// 匯出 API 處理器 - 使用組合函數：權限檢查 + 錯誤處理
export const GET = withAuthAndError(handleGET, { module: 'OrdersAPI' })
export const POST = withAuthAndError(handlePOST, { module: 'OrdersAPI', enableAuditLog: true })
