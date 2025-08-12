import { NextRequest, NextResponse } from 'next/server'
import { EcpayPaymentRequest } from '@/types/payment'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body: EcpayPaymentRequest = await request.json()
    
    // 基本驗證
    if (!body.orderId || !body.amount || !body.itemName || !body.returnUrl || !body.clientBackUrl) {
      return NextResponse.json(
        { error: 'All fields are required for ECPay payment' },
        { status: 400 }
      )
    }
    
    // TODO: 整合綠界 ECPay API
    // - 生成交易參數
    // - 創建檢查碼
    // - 返回支付表單 HTML 或重定向 URL
    
    const mockPaymentIntent = {
      id: `ecpay_${Date.now()}`,
      orderId: body.orderId,
      amount: body.amount,
      currency: 'TWD' as const,
      method: 'ecpay' as const,
      status: 'pending' as const,
      redirectUrl: `https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5?${new URLSearchParams({
        MerchantID: 'TEST_MERCHANT_ID',
        MerchantTradeNo: body.orderId,
        MerchantTradeDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        PaymentType: 'aio',
        TotalAmount: body.amount.toString(),
        TradeDesc: body.itemName,
        ItemName: body.itemName,
        ReturnURL: body.returnUrl,
        ClientBackURL: body.clientBackUrl,
        // ... 其他 ECPay 參數
      }).toString()}`,
      createdAt: new Date().toISOString()
    }
    
    return NextResponse.json(mockPaymentIntent)
    
  } catch (error) {
    console.error('ECPay payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}