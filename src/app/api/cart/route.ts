import { NextRequest, NextResponse } from 'next/server'
import { AddToCartRequest } from '@/types/cart'

// 獲取購物車
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // TODO: 從 token 獲取 userId 並查詢購物車
    const mockCart = {
      id: 'cart-1',
      userId: '1',
      items: [],
      totalItems: 0,
      totalPrice: 0,
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json(mockCart)
    
  } catch (error) {
    console.error('Cart fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 添加商品到購物車
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body: AddToCartRequest = await request.json()
    
    // 基本驗證
    if (!body.productId || !body.quantity || body.quantity <= 0) {
      return NextResponse.json(
        { error: 'Product ID and valid quantity are required' },
        { status: 400 }
      )
    }
    
    // TODO: 實際的購物車邏輯
    // - 檢查商品是否存在
    // - 檢查庫存是否足夠
    // - 添加到購物車或更新數量
    
    const mockUpdatedCart = {
      id: 'cart-1',
      userId: '1',
      items: [
        {
          id: 'item-1',
          productId: body.productId,
          product: {
            id: body.productId,
            name: 'Mock Product',
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
    console.error('Add to cart error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 清空購物車
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // TODO: 清空用戶的購物車
    
    return NextResponse.json({ message: 'Cart cleared successfully' })
    
  } catch (error) {
    console.error('Clear cart error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}