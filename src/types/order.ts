import { CartItem } from './cart'

export interface Order {
  id: string
  userId: string
  items: CartItem[]
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: 'stripe' | 'ecpay' | 'linepay' | 'cash'
  shippingAddress: {
    name: string
    phone: string
    street: string
    city: string
    postalCode: string
    country: string
  }
  totalAmount: number
  shippingFee: number
  finalAmount: number
  notes?: string
  trackingNumber?: string
  createdAt: string
  updatedAt: string
}

export interface CreateOrderRequest {
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
  shippingAddress: Order['shippingAddress']
  paymentMethod: Order['paymentMethod']
  notes?: string
}

export interface OrderService {
  createOrder(userId: string, orderData: CreateOrderRequest): Promise<Order>
  getOrder(orderId: string): Promise<Order | null>
  getUserOrders(userId: string): Promise<Order[]>
  updateOrderStatus(orderId: string, status: Order['status']): Promise<Order>
  updatePaymentStatus(orderId: string, paymentStatus: Order['paymentStatus']): Promise<Order>
  addTrackingNumber(orderId: string, trackingNumber: string): Promise<Order>
}