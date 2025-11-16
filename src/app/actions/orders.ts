/**
 * 訂單 Server Actions
 *
 * 提供訂單管理的 Server Actions:
 * - createOrderAction - 建立訂單 (需要登入)
 * - cancelOrderAction - 取消訂單 (需要登入)
 */

'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import {
  requireAuth,
  success,
  error,
  validationError,
  logCreate,
  logStatusChange,
} from '@/lib/server'
import { apiLogger } from '@/lib/logger'
import { orderService } from '@/services/core/order/OrderService'
import { CreateOrderRequest } from '@/types/order'
import { NotFoundError } from '@/lib/errors'

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

// 訂單取消的驗證 schema
const CancelOrderSchema = z.object({
  orderId: z.string().uuid('訂單 ID 格式不正確'),
  reason: z.string().optional(),
})

/**
 * 建立訂單
 *
 * 需要登入的用戶才能使用
 * 系統會自動驗證產品庫存、計算訂單金額、生成訂單編號
 *
 * @param data - 訂單資料
 * @returns ActionResponse 包含建立的訂單資訊
 *
 * @example
 * ```tsx
 * import { createOrderAction } from '@/app/actions/orders'
 *
 * function CheckoutForm() {
 *   const [isPending, startTransition] = useTransition()
 *
 *   const handleSubmit = async (formData) => {
 *     startTransition(async () => {
 *       const result = await createOrderAction({
 *         items: [
 *           { productId: 'uuid', quantity: 2 }
 *         ],
 *         shippingAddress: {
 *           name: formData.get('name'),
 *           phone: formData.get('phone'),
 *           street: formData.get('street'),
 *           city: formData.get('city'),
 *           postalCode: formData.get('postalCode'),
 *           country: formData.get('country')
 *         },
 *         paymentMethod: 'credit_card'
 *       })
 *
 *       if (result.success) {
 *         toast.success(result.message)
 *         router.push(`/orders/${result.data.id}`)
 *       } else {
 *         toast.error(result.error.message)
 *       }
 *     })
 *   }
 * }
 * ```
 */
export async function createOrderAction(data: unknown) {
  try {
    // 1. 認證檢查
    const user = await requireAuth()

    // 2. 驗證輸入資料
    const result = CreateOrderSchema.safeParse(data)

    if (!result.success) {
      return validationError(result.error)
    }

    // 3. 記錄建立訂單操作
    apiLogger.info('建立新訂單', {
      metadata: {
        userId: user.id,
        userEmail: user.email,
        itemCount: result.data.items.length,
      },
    })

    // 4. 建立訂單
    const orderData: CreateOrderRequest = result.data
    const order = await orderService.createOrder(user.id, orderData)

    // 5. 記錄成功
    apiLogger.info('建立訂單成功', {
      metadata: {
        userId: user.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
      },
    })

    // 6. 審計日誌
    await logCreate(user, 'order', order.id, {
      newData: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        itemsCount: result.data.items.length,
        paymentMethod: result.data.paymentMethod,
      },
    })

    // 7. Revalidation
    revalidatePath('/orders') // 用戶訂單列表
    revalidatePath('/admin/orders') // 管理員看板

    // 8. 返回成功回應
    return success(order, '訂單建立成功')
  } catch (err) {
    return error(err)
  }
}

/**
 * 取消訂單
 *
 * 用戶只能取消自己的訂單,並可選擇性提供取消原因
 *
 * @param data - 包含 orderId 和可選的 reason
 * @returns ActionResponse 包含取消結果
 *
 * @example
 * ```tsx
 * import { cancelOrderAction } from '@/app/actions/orders'
 *
 * function OrderActions({ orderId }) {
 *   const [isPending, startTransition] = useTransition()
 *
 *   const handleCancel = async () => {
 *     if (!confirm('確定要取消這個訂單嗎?')) return
 *
 *     startTransition(async () => {
 *       const result = await cancelOrderAction({
 *         orderId,
 *         reason: '不需要了'
 *       })
 *
 *       if (result.success) {
 *         toast.success(result.message)
 *         router.refresh()
 *       } else {
 *         toast.error(result.error.message)
 *       }
 *     })
 *   }
 *
 *   return (
 *     <button onClick={handleCancel} disabled={isPending}>
 *       {isPending ? '取消中...' : '取消訂單'}
 *     </button>
 *   )
 * }
 * ```
 */
export async function cancelOrderAction(data: unknown) {
  try {
    // 1. 認證檢查
    const user = await requireAuth()

    // 2. 驗證輸入資料
    const result = CancelOrderSchema.safeParse(data)

    if (!result.success) {
      return validationError(result.error)
    }

    const { orderId, reason } = result.data

    // 3. 記錄取消訂單操作
    apiLogger.info('取消訂單', {
      metadata: {
        userId: user.id,
        orderId,
        reason,
      },
    })

    // 4. 檢查訂單存在並取得當前狀態 (用於審計日誌)
    const currentOrder = await orderService.getOrderById(orderId, user.id)

    if (!currentOrder) {
      throw new NotFoundError('訂單不存在或無權限操作')
    }

    // 5. 執行取消訂單
    await orderService.cancelOrder(orderId, user.id, reason)

    // 6. 記錄成功
    apiLogger.info('取消訂單成功', {
      metadata: {
        userId: user.id,
        orderId,
        reason,
      },
    })

    // 7. 審計日誌 - 記錄狀態變更
    await logStatusChange(user, 'order', orderId, {
      previousData: {
        status: currentOrder.status,
      },
      newData: {
        status: 'cancelled',
      },
      metadata: {
        reason,
        orderNumber: currentOrder.orderNumber,
        totalAmount: currentOrder.totalAmount,
      },
    })

    // 8. Revalidation
    revalidatePath('/orders') // 用戶訂單列表
    revalidatePath(`/orders/${orderId}`) // 訂單詳情頁
    revalidatePath('/admin/orders') // 管理員看板

    // 9. 返回成功回應
    return success(null, '訂單已成功取消')
  } catch (err) {
    return error(err)
  }
}
