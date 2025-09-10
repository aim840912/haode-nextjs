/**
 * 單一訂單 API 路由
 *
 * GET /api/orders/[id] - 取得單一訂單詳情
 * PATCH /api/orders/[id] - 更新訂單（使用者取消訂單）
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-middleware'
import { success } from '@/lib/api-response'
import { ValidationError, NotFoundError, MethodNotAllowedError } from '@/lib/errors'
import { orderService } from '@/services/orderService'
import { z } from 'zod'
import { apiLogger } from '@/lib/logger'

// 訂單更新的驗證 schema
const UpdateOrderSchema = z.object({
  action: z.enum(['cancel'], { message: '僅支援取消訂單操作' }),
  reason: z.string().optional(),
})

/**
 * GET /api/orders/[id] - 取得單一訂單詳情
 */
async function handleGET(req: NextRequest, user: any, context?: any) {
  const { id } = await context?.params

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
 * PATCH /api/orders/[id] - 更新訂單
 */
async function handlePATCH(req: NextRequest, user: any, context?: any) {
  const { id } = await context?.params
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

// 匯出 API 處理器
export const GET = requireAuth(handleGET)
export const PATCH = requireAuth(handlePATCH)
export const PUT = requireAuth(handleUnsupportedMethod)
export const DELETE = requireAuth(handleUnsupportedMethod)
