/**
 * 詢價統計 API 路由
 * 提供詢價單統計資料給管理員使用
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase-server';

// 統一的錯誤回應函數
function createErrorResponse(message: string, status: number, details?: string) {
  return NextResponse.json(
    { 
      error: message,
      success: false,
      details: process.env.NODE_ENV === 'development' ? details : undefined
    },
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// 統一的成功回應函數
function createSuccessResponse(data: any, message?: string, status: number = 200) {
  return NextResponse.json(
    { 
      success: true,
      data,
      message
    },
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// GET /api/inquiries/stats - 取得詢價統計資料（僅管理員）
export async function GET(request: NextRequest) {
  try {
    // 驗證使用者認證
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('未認證或會話已過期', 401);
    }

    // 檢查是否為管理員
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return createErrorResponse('只有管理員可以查看統計資料', 403);
    }

    // 取得查詢參數
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30'; // 預設 30 天

    // 計算日期範圍
    const daysAgo = parseInt(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // 查詢基本統計
    const { data: basicStats } = await supabase
      .from('inquiries')
      .select('id, status, is_read, is_replied, created_at, replied_at')
      .gte('created_at', startDate.toISOString());

    if (!basicStats) {
      return createErrorResponse('取得統計資料失敗', 500);
    }

    // 計算統計資料
    const totalInquiries = basicStats.length;
    const unreadCount = basicStats.filter(i => !i.is_read).length;
    const unrepliedCount = basicStats.filter(i => !i.is_replied && i.status !== 'cancelled').length;
    const completedCount = basicStats.filter(i => i.status === 'completed').length;
    const cancelledCount = basicStats.filter(i => i.status === 'cancelled').length;

    // 計算平均回覆時間（小時）
    const repliedInquiries = basicStats.filter(i => i.replied_at);
    const avgResponseTime = repliedInquiries.length > 0 
      ? repliedInquiries.reduce((sum, inquiry) => {
          const createdTime = new Date(inquiry.created_at).getTime();
          const repliedTime = new Date(inquiry.replied_at!).getTime();
          return sum + (repliedTime - createdTime) / (1000 * 60 * 60); // 轉換為小時
        }, 0) / repliedInquiries.length
      : 0;

    // 計算各狀態統計
    const statusStats = {
      pending: basicStats.filter(i => i.status === 'pending').length,
      quoted: basicStats.filter(i => i.status === 'quoted').length,
      confirmed: basicStats.filter(i => i.status === 'confirmed').length,
      completed: completedCount,
      cancelled: cancelledCount
    };

    // 計算每日統計（最近 7 天）
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayInquiries = basicStats.filter(inquiry => {
        const inquiryDate = new Date(inquiry.created_at);
        return inquiryDate >= dayStart && inquiryDate <= dayEnd;
      });

      const dayReplied = dayInquiries.filter(i => {
        if (!i.replied_at) return false;
        const repliedDate = new Date(i.replied_at);
        return repliedDate >= dayStart && repliedDate <= dayEnd;
      });

      dailyStats.push({
        date: dayStart.toISOString().split('T')[0],
        total_inquiries: dayInquiries.length,
        replied_inquiries: dayReplied.length,
        reply_rate: dayInquiries.length > 0 
          ? Math.round((dayReplied.length / dayInquiries.length) * 100) 
          : 0
      });
    }

    // 組合回應資料
    const statsData = {
      summary: {
        total_inquiries: totalInquiries,
        unread_count: unreadCount,
        unreplied_count: unrepliedCount,
        read_rate: totalInquiries > 0 ? Math.round(((totalInquiries - unreadCount) / totalInquiries) * 100) : 0,
        reply_rate: totalInquiries > 0 ? Math.round(((totalInquiries - unrepliedCount) / totalInquiries) * 100) : 0,
        completion_rate: totalInquiries > 0 ? Math.round((completedCount / totalInquiries) * 100) : 0,
        cancellation_rate: totalInquiries > 0 ? Math.round((cancelledCount / totalInquiries) * 100) : 0,
        avg_response_time_hours: Math.round(avgResponseTime * 10) / 10 // 保留一位小數
      },
      status_breakdown: statusStats,
      daily_trends: dailyStats,
      timeframe_days: daysAgo
    };

    return createSuccessResponse(statsData);

  } catch (error) {
    return createErrorResponse(
      '取得統計資料失敗',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}