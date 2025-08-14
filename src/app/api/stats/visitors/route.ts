import { NextRequest, NextResponse } from 'next/server'
import { readVisitorStats, getDailyStats } from '@/lib/file-storage'

// 獲取訪客統計資料
export async function GET(request: NextRequest) {
  try {
    // 取得統計資料
    const stats = readVisitorStats()
    
    // 取得最近7天的統計（用於趨勢圖）
    const weeklyStats = getDailyStats()

    return NextResponse.json({
      total_visits: stats.total_visits,
      unique_visitors: stats.unique_visitors.length,
      today_visits: stats.today_visits,
      date: new Date().toISOString().split('T')[0],
      weekly_stats: weeklyStats.map(day => ({
        date: day.date,
        today_visits: day.visits,
        unique_visitors: day.visits // 簡化，實際上應該是不重複訪客數
      })),
      top_visitors: stats.top_visitors.map(visitor => ({
        visitor_id: visitor.visitor_id,
        visit_count: visitor.visit_count,
        first_visit: visitor.first_visit,
        last_visit: visitor.last_visit,
        ip_address: visitor.ip_address
      }))
    })

  } catch (error) {
    console.error('Unexpected error in visitor stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 手動重新計算統計資料（管理員功能）
export async function POST(request: NextRequest) {
  try {
    // 檢查是否為管理員（簡化版，實際應該檢查 JWT token）
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 重新讀取統計資料（檔案系統會自動更新）
    const stats = readVisitorStats()

    return NextResponse.json({
      message: 'Statistics refreshed successfully',
      total_visits: stats.total_visits,
      unique_visitors: stats.unique_visitors.length,
      today_visits: stats.today_visits
    })

  } catch (error) {
    console.error('Unexpected error in visitor stats update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}