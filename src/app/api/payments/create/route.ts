/**
 * 付款建立 API
 *
 * POST /api/payments/create
 * 建立藍新金流付款表單資料
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuthAndError, type User } from '@/lib/middleware/api-middleware'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { paymentService } from '@/services/core/payment'
import type { PaymentMethod } from '@/types/order'

// 請求驗證 Schema
const createPaymentSchema = z.object({
  orderId: z.string().uuid('訂單 ID 格式不正確'),
  paymentMethod: z.enum(['CREDIT', 'VACC', 'CVS', 'WEBATM']),
  email: z.string().email('Email 格式不正確').optional(),
  orderComment: z.string().max(300, '備註最多 300 字').optional(),
})

async function handlePOST(request: NextRequest, user: User) {
  const body = await request.json()

  // 驗證請求資料
  const result = createPaymentSchema.safeParse(body)
  if (!result.success) {
    throw new ValidationError(result.error.issues[0].message)
  }

  const { orderId, paymentMethod, email, orderComment } = result.data

  // 建立付款表單資料
  const paymentFormData = await paymentService.createPayment({
    orderId,
    paymentMethod: paymentMethod as PaymentMethod,
    email,
    orderComment,
  })

  return success(paymentFormData, '付款表單建立成功')
}

export const POST = withAuthAndError(handlePOST, {
  module: 'PaymentAPI',
  enableAuditLog: true,
})
