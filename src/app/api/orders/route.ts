/**
 * 使用者訂單 API 路由
 *
 * GET /api/orders - 取得使用者的訂單列表
 * POST /api/orders - 建立新訂單
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-middleware'
import { success, created } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { orderService } from '@/services/orderService'
import { CreateOrderRequest } from '@/types/order'
import { z } from 'zod'
import { apiLogger } from '@/lib/logger'

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
async function handleGET(req: NextRequest, user: any) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = (page - 1) * limit

  apiLogger.info('取得使用者訂單列表', {
    module: 'OrdersAPI',
    action: 'getUserOrders',
    metadata: { userId: user.id, page, limit },
  })

  const result = await orderService.getUserOrders(user.id, limit, offset)

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
async function handlePOST(req: NextRequest, user: any) {
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
  const order = await orderService.createOrder(user.id, orderData)

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

// 匯出 API 處理器
export const GET = requireAuth(handleGET)
export const POST = requireAuth(handlePOST)
