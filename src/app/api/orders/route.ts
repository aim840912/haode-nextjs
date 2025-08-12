import { NextRequest, NextResponse } from 'next/server'
import { CreateOrderRequest } from '@/types/order'

// 創建訂單
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body: CreateOrderRequest = await request.json()
    
    // 基本驗證
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      )
    }
    
    if (!body.shippingAddress || !body.paymentMethod) {
      return NextResponse.json(
        { error: 'Shipping address and payment method are required' },
        { status: 400 }
      )
    }
    
    // TODO: 實際創建訂單邏輯
    // - 驗證商品和庫存
    // - 計算總金額和運費
    // - 創建訂單記錄
    // - 減少庫存
    // - 清空購物車
    
    const totalAmount = body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const shippingFee = totalAmount >= 1000 ? 0 : 100 // 滿1000免運費
    
    const mockOrder = {
      id: `order-${Date.now()}`,
      userId: '1',
      items: body.items.map(item => ({
        id: `item-${Math.random().toString(36).substr(2, 9)}`,
        productId: item.productId,
        product: {
          id: item.productId,
          name: `Product ${item.productId}`,
          price: item.price,
          // ... other product fields
        },
        quantity: item.quantity,
        price: item.price,
        addedAt: new Date().toISOString()
      })),
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      paymentMethod: body.paymentMethod,
      shippingAddress: body.shippingAddress,
      totalAmount,
      shippingFee,
      finalAmount: totalAmount + shippingFee,
      notes: body.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json(mockOrder, { status: 201 })
    
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 獲取用戶訂單列表
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // TODO: 從資料庫獲取用戶訂單
    const mockOrders = [
      {
        id: 'order-1',
        userId: '1',
        items: [],
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'stripe',
        totalAmount: 500,
        shippingFee: 0,
        finalAmount: 500,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-05T00:00:00.000Z'
      }
    ]
    
    return NextResponse.json(mockOrders)
    
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}