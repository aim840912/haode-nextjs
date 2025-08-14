export interface PaymentIntent {
  id: string
  orderId: string
  amount: number
  currency: 'TWD' | 'USD'
  method: 'stripe' | 'ecpay' | 'linepay'
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled'
  clientSecret?: string
  redirectUrl?: string
  createdAt: string
}

export interface StripePaymentRequest {
  orderId: string
  amount: number
  currency: 'TWD' | 'USD'
}

export interface EcpayPaymentRequest {
  orderId: string
  amount: number
  itemName: string
  returnUrl: string
  clientBackUrl: string
}

export interface PaymentCallbackData {
  paymentIntentId: string
  status: 'succeeded' | 'failed'
  orderId: string
  transactionId?: string
  failureReason?: string
}

export interface PaymentService {
  createStripePayment(data: StripePaymentRequest): Promise<PaymentIntent>
  createEcpayPayment(data: EcpayPaymentRequest): Promise<PaymentIntent>
  handleCallback(data: PaymentCallbackData): Promise<void>
  getPaymentStatus(paymentIntentId: string): Promise<PaymentIntent | null>
}