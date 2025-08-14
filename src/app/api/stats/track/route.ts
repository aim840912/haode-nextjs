import { NextRequest, NextResponse } from 'next/server'
import { updateVisitor, readVisitors } from '@/lib/file-storage'
import crypto from 'crypto'

// 生成訪客唯一識別碼
function generateVisitorId(ip: string, userAgent: string): string {
  const data = `${ip}-${userAgent}`
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32)
}

// 記錄頁面訪問
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      page_path, 
      page_title, 
      referrer,
      visitor_fingerprint // 可選：客戶端生成的瀏覽器指紋
    } = body

    // 取得客戶端資訊
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              '127.0.0.1'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 生成訪客 ID（優先使用客戶端指紋，否則使用 IP + UserAgent）
    const visitorId = visitor_fingerprint || generateVisitorId(ip, userAgent)

    // 檢查是否為現有訪客
    const existingVisitors = readVisitors()
    const existingVisitor = existingVisitors[visitorId]
    const isNewVisitor = !existingVisitor

    // 檢查是否為今天第一次訪問（用於今日訪客統計）
    const today = new Date().toISOString().split('T')[0]
    const lastVisitDate = existingVisitor?.last_visit?.split('T')[0]
    const isNewVisitToday = !existingVisitor || lastVisitDate !== today

    // 更新訪客記錄
    const updatedVisitor = updateVisitor(
      visitorId, 
      ip.split(',')[0].trim(), 
      userAgent,
      isNewVisitToday
    )

    // 回傳成功訊息和訪客 ID（用於客戶端追蹤）
    return NextResponse.json({
      success: true,
      visitor_id: visitorId,
      is_new_visitor: isNewVisitor,
      visit_count: updatedVisitor.visit_count,
      is_new_visit_today: isNewVisitToday
    })

  } catch (error) {
    console.error('Unexpected error in visitor tracking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 取得特定訪客的訪問記錄
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const visitorId = searchParams.get('visitor_id')

    if (!visitorId) {
      return NextResponse.json(
        { error: 'visitor_id is required' },
        { status: 400 }
      )
    }

    // 取得訪客基本資訊
    const visitors = readVisitors()
    const visitor = visitors[visitorId]

    if (!visitor) {
      return NextResponse.json(
        { error: 'Visitor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      visitor,
      page_views: [] // 簡化版本不記錄頁面瀏覽歷史
    })

  } catch (error) {
    console.error('Unexpected error in visitor data fetch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}