/**
 * 付款狀態查詢 API
 *
 * GET /api/payments/[orderId]/status
 * 查詢指定訂單的付款狀態
 */

import { NextRequest } from 'next/server'
import { withAuthAndError, type User } from '@/lib/middleware/api-middleware'
import { success } from '@/lib/api-response'
import { NotFoundError, AuthorizationError } from '@/lib/errors'
import { paymentService } from '@/services/core/payment'
import { createClient } from '@supabase/supabase-js'

async function handleGET(
  request: NextRequest,
  user: User,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params

  // 使用 service role 檢查訂單所有權
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 檢查訂單是否存在且屬於該使用者
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, user_id')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    throw new NotFoundError('訂單')
  }

  // 檢查權限（只能查詢自己的訂單，除非是管理員）
  if (order.user_id !== user.id && user.role !== 'admin') {
    throw new AuthorizationError('您沒有權限查詢此訂單')
  }

  // 取得付款狀態
  const status = await paymentService.getPaymentStatus(orderId)

  if (!status) {
    throw new NotFoundError('付款資訊')
  }

  return success(status, '查詢成功')
}

export const GET = withAuthAndError(
  (request: NextRequest, user: User) => {
    // 從 URL 路徑取得 orderId
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const orderId = pathParts[pathParts.indexOf('payments') + 1]

    return handleGET(request, user, {
      params: Promise.resolve({ orderId }),
    })
  },
  { module: 'PaymentStatusAPI' }
)
