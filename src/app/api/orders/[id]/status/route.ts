import { NextRequest, NextResponse } from 'next/server'

// 更新訂單狀態 (管理員功能)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // TODO: 驗證用戶是否為管理員
    
    const { id } = await params
    const { status, trackingNumber } = await request.json()
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }
    
    // TODO: 更新訂單狀態到資料庫
    // - 驗證狀態轉換是否合法
    // - 如果狀態是 'shipped'，需要提供追蹤號碼
    // - 發送通知給用戶
    
    const mockUpdatedOrder = {
      id,
      userId: '1',
      status,
      trackingNumber: status === 'shipped' ? trackingNumber : undefined,
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json(mockUpdatedOrder)
    
  } catch (error) {
    console.error('Update order status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}