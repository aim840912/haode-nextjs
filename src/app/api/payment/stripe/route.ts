import { NextRequest, NextResponse } from 'next/server'
import { StripePaymentRequest } from '@/types/payment'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body: StripePaymentRequest = await request.json()
    
    // 基本驗證
    if (!body.orderId || !body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Order ID and valid amount are required' },
        { status: 400 }
      )
    }
    
    // TODO: 整合 Stripe API
    // - 創建 PaymentIntent
    // - 返回 client_secret 給前端
    // - 更新訂單的支付狀態
    
    const mockPaymentIntent = {
      id: `pi_${Math.random().toString(36).substr(2, 24)}`,
      orderId: body.orderId,
      amount: body.amount,
      currency: body.currency,
      method: 'stripe' as const,
      status: 'pending' as const,
      clientSecret: `pi_${Math.random().toString(36).substr(2, 24)}_secret_${Math.random().toString(36).substr(2, 16)}`,
      createdAt: new Date().toISOString()
    }
    
    return NextResponse.json(mockPaymentIntent)
    
  } catch (error) {
    console.error('Stripe payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}