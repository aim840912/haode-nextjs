/**
 * 訂單服務相關類型定義
 */

import { OrderStatus } from '@/types/order'

/**
 * 資料庫訂單記錄類型
 */
export interface OrderRecord {
  id: string
  order_number: string
  user_id: string
  status: OrderStatus
  subtotal: number
  shipping_fee: number
  tax: number
  total_amount: number
  shipping_address: Record<string, any>
  payment_method?: string
  payment_status?: string
  payment_id?: string
  notes?: string
  estimated_delivery_date?: string
  actual_delivery_date?: string
  tracking_number?: string
  created_at: string
  updated_at: string
}

/**
 * 資料庫訂單項目記錄類型
 */
export interface OrderItemRecord {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_image?: string
  quantity: number
  unit_price: number
  price_unit?: string
  unit_quantity?: number
  subtotal: number
  created_at: string
  updated_at: string
}
