export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export interface ShippingAddress {
  name: string
  phone: string
  street: string
  city: string
  postalCode: string
  country: string
  notes?: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  productName: string
  productImage?: string
  quantity: number
  unitPrice: number
  priceUnit?: string // 價格單位（斤、包、箱等）
  unitQuantity?: number // 單位數量
  subtotal: number
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  orderNumber: string // 訂單編號，如 'ORD20240114001'
  userId: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number // 小計
  shippingFee: number // 運費
  tax: number // 稅費
  totalAmount: number // 總金額
  shippingAddress: ShippingAddress
  paymentMethod?: string // 付款方式
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded' // 付款狀態
  paymentId?: string // 付款系統的交易ID
  notes?: string // 備註
  estimatedDeliveryDate?: string // 預計送達日期
  actualDeliveryDate?: string // 實際送達日期
  trackingNumber?: string // 物流追蹤號碼
  createdAt: string
  updatedAt: string
}

export interface CreateOrderRequest {
  items: {
    productId: string
    quantity: number
  }[]
  shippingAddress: ShippingAddress
  paymentMethod?: string
  notes?: string
}

export interface OrderSummary {
  totalOrders: number
  totalAmount: number
  pendingOrders: number
  processingOrders: number
  deliveredOrders: number
}

export interface OrderService {
  // 使用者訂單操作
  getUserOrders(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<{ orders: Order[]; total: number }>
  getOrderById(orderId: string, userId: string): Promise<Order | null>
  createOrder(userId: string, orderData: CreateOrderRequest): Promise<Order>
  cancelOrder(orderId: string, userId: string, reason?: string): Promise<void>

  // 管理員訂單操作
  getAllOrders(limit?: number, offset?: number): Promise<{ orders: Order[]; total: number }>
  updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<void>
  getOrderSummary(): Promise<OrderSummary>

  // 工具方法
  generateOrderNumber(): Promise<string>
  calculateShippingFee(items: OrderItem[], address: ShippingAddress): Promise<number>
  calculateTax(subtotal: number): number
}

export interface OrderFilters {
  status?: OrderStatus[]
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  userId?: string
}

export interface OrderListResponse {
  orders: Order[]
  total: number
  hasMore: boolean
  nextOffset?: number
}
