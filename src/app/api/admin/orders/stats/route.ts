/**
 * 管理員訂單統計 API
 *
 * 輕量級端點，只返回待處理訂單數量
 * 用於管理員選單的通知徽章
 */

import { NextRequest } from 'next/server'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { success } from '@/lib/api-response'
import { orderService } from '@/services/core/order/OrderService'

async function handleGET(_req: NextRequest, _user: User) {
  const summary = await orderService.getOrderSummary()

  return success(
    {
      pending_orders: summary.pendingOrders,
    },
    '取得訂單統計成功'
  )
}

export const GET = withAdminAndError(handleGET, { module: 'OrderStatsAPI' })
