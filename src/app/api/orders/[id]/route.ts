import { NextRequest, NextResponse } from 'next/server'

// 獲取單一訂單詳細資訊
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { id } = params
    
    // TODO: 從資料庫查詢訂單
    // - 驗證訂單屬於該用戶
    // - 返回訂單詳細資訊
    
    const mockOrder = {
      id,
      userId: '1',
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          product: {
            id: 'product-1',
            name: '紅肉李果乾',
            price: 300,
            images: ['/products/red_plum_2.jpg']
          },
          quantity: 2,
          price: 300,
          addedAt: '2024-01-01T00:00:00.000Z'
        }
      ],
      status: 'delivered' as const,
      paymentStatus: 'paid' as const,
      paymentMethod: 'stripe' as const,
      shippingAddress: {
        name: '測試用戶',
        phone: '+886-912-345-678',
        street: '台北市信義區信義路五段7號',
        city: '台北市',
        postalCode: '11049',
        country: '台灣'
      },
      totalAmount: 600,
      shippingFee: 0,
      finalAmount: 600,
      trackingNumber: 'TW123456789',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-05T00:00:00.000Z'
    }
    
    return NextResponse.json(mockOrder)
    
  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}