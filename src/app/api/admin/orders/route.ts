/**
 * 管理員訂單管理 API 路由
 *
 * GET /api/admin/orders - 取得所有訂單（管理員）
 * PATCH /api/admin/orders/[id] - 更新訂單狀態（管理員）
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { orderQueryService } from '@/services/core/order/OrderQueryService'

/**
 * @api {GET} /api/admin/orders 取得所有訂單（管理員）
 * @apiName GetAllOrders
 * @apiGroup Admin
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 管理員查看所有訂單，支援分頁和篩選。
 * 可依狀態、使用者 ID 進行篩選。
 *
 * @apiPermission admin
 *
 * @apiQuery {Number} [page=1] 頁碼
 * @apiQuery {Number} [limit=20] 每頁筆數（最大 100）
 * @apiQuery {String} [status] 篩選訂單狀態
 * @apiQuery {String} [userId] 篩選特定使用者的訂單
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 回應資料
 * @apiSuccess {Object[]} data.orders 訂單列表
 * @apiSuccess {Object} data.pagination 分頁資訊
 * @apiSuccess {Object} data.summary 訂單摘要統計
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "orders": [...],
 *     "pagination": {
 *       "page": 1,
 *       "limit": 20,
 *       "total": 150,
 *       "totalPages": 8
 *     },
 *     "summary": {...}
 *   },
 *   "message": "取得所有訂單成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} AuthorizationError 需要管理員權限
 */
async function handleGET(req: NextRequest, user: User) {
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

  const result = await orderQueryService.getAllOrders(limit, offset)

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
      summary: await orderQueryService.getOrderSummary(),
    },
    '取得所有訂單成功'
  )
}

// 匯出 API 處理器 - 使用組合函數：權限檢查 + 錯誤處理
export const GET = withAdminAndError(handleGET, { module: 'AdminOrdersAPI' })
