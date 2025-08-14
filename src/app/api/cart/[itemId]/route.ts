import { NextRequest, NextResponse } from 'next/server'
import { UpdateCartItemRequest } from '@/types/cart'

// 更新購物車商品數量
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { itemId } = await params
    const body: UpdateCartItemRequest = await request.json()
    
    if (!body.quantity || body.quantity <= 0) {
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      )
    }
    
    // TODO: 實際更新購物車商品邏輯
    // - 驗證商品屬於該用戶
    // - 檢查庫存
    // - 更新數量
    
    const mockUpdatedCart = {
      id: 'cart-1',
      userId: '1',
      items: [
        {
          id: itemId,
          productId: 'product-1',
          product: {
            id: 'product-1',
            name: 'Updated Product',
            price: 100
          },
          quantity: body.quantity,
          price: 100,
          addedAt: new Date().toISOString()
        }
      ],
      totalItems: body.quantity,
      totalPrice: 100 * body.quantity,
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json(mockUpdatedCart)
    
  } catch (error) {
    console.error('Update cart item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 從購物車移除商品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { itemId } = await params
    
    // TODO: 實際移除商品邏輯
    // - 驗證商品屬於該用戶
    // - 從購物車移除商品
    
    const mockUpdatedCart = {
      id: 'cart-1',
      userId: '1',
      items: [],
      totalItems: 0,
      totalPrice: 0,
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json(mockUpdatedCart)
    
  } catch (error) {
    console.error('Remove cart item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}