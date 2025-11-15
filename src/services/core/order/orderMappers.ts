/**
 * 訂單資料轉換函數
 * 負責將資料庫記錄轉換為應用程式的 Order 和 OrderItem 類型
 */

import { Order, OrderItem } from '@/types/order'

// 資料庫記錄類型
export interface OrderRecord {
  id: string
  order_number: string
  user_id: string
  status: string
  subtotal: number
  shipping_fee: number
  tax: number
  total_amount: number
  shipping_address: any
  payment_method: string
  payment_status: string
  payment_id: string | null
  notes: string | null
  estimated_delivery_date: string | null
  actual_delivery_date: string | null
  tracking_number: string | null
  created_at: string
  updated_at: string
}

export interface OrderItemRecord {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_image: string | null
  quantity: number
  unit_price: number
  price_unit: string | null
  unit_quantity: number | null
  subtotal: number
  created_at: string
  updated_at: string
}

/**
 * 將資料庫訂單記錄轉換為應用程式 Order 類型
 */
export function orderFromDB(record: OrderRecord | any): Order {
  return {
    id: record.id,
    orderNumber: record.order_number,
    userId: record.user_id,
    status: record.status,
    items: [], // 將由呼叫者載入
    subtotal: Number(record.subtotal),
    shippingFee: Number(record.shipping_fee),
    tax: Number(record.tax),
    totalAmount: Number(record.total_amount),
    shippingAddress: record.shipping_address as any,
    paymentMethod: record.payment_method,
    paymentStatus: record.payment_status as any,
    paymentId: record.payment_id,
    notes: record.notes,
    estimatedDeliveryDate: record.estimated_delivery_date,
    actualDeliveryDate: record.actual_delivery_date,
    trackingNumber: record.tracking_number,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  }
}

/**
 * 將資料庫訂單項目記錄轉換為應用程式 OrderItem 類型
 */
export function orderItemFromDB(record: OrderItemRecord | any): OrderItem {
  return {
    id: record.id,
    orderId: record.order_id,
    productId: record.product_id,
    productName: record.product_name,
    productImage: record.product_image,
    quantity: record.quantity,
    unitPrice: Number(record.unit_price),
    priceUnit: record.price_unit,
    unitQuantity: record.unit_quantity,
    subtotal: Number(record.subtotal),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  }
}

/**
 * 生成訂單編號
 */
export async function generateOrderNumber(): Promise<string> {
  const { getSupabaseAdmin } = await import('@/lib/database/supabase-auth')
  const { ErrorFactory } = await import('@/lib/errors')

  const getAdmin = () => {
    const client = getSupabaseAdmin()
    if (!client) {
      throw new Error('Supabase admin client not initialized')
    }
    return client
  }

  try {
    const client = getAdmin()
    const { data, error } = await client.rpc('generate_order_number')

    if (error) {
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'orderMappers',
        action: 'generateOrderNumber',
      })
    }

    return data
  } catch (error) {
    const { ErrorFactory: EF } = await import('@/lib/errors')
    throw EF.fromSupabaseError(error, {
      module: 'orderMappers',
      action: 'generateOrderNumber',
    })
  }
}
