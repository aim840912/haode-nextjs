/**
 * 詢價統計 API 路由
 * 提供詢價單統計資料給管理員使用
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase-server';

// 統一的錯誤回應函數
function createErrorResponse(message: string, status: number, details?: string, errorCode?: string) {
  // 在生產環境中隱藏敏感錯誤訊息
  const isProduction = process.env.NODE_ENV === 'production';
  const sanitizedMessage = isProduction && status >= 500 ? '服務暫時不可用，請稍後重試' : message;
  
  return NextResponse.json(
    { 
      error: sanitizedMessage,
      success: false,
      details: isProduction ? undefined : details,
      errorCode: errorCode,
      timestamp: new Date().toISOString()
    },
    { 
      status,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    }
  );
}

// 統一的成功回應函數
function createSuccessResponse(data: any, message?: string, status: number = 200) {
  return NextResponse.json(
    { 
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    },
    { 
      status,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=30' // 允許快取 30 秒
      }
    }
  );
}

// GET /api/inquiries/stats - 取得詢價統計資料（僅管理員）
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 驗證使用者認證
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error('[InquiryStats] Authentication error:', authError);
      return createErrorResponse('認證服務暫時不可用', 503, 
        authError instanceof Error ? authError.message : 'Unknown auth error', 
        'AUTH_SERVICE_ERROR'
      );
    }

    if (!user) {
      return createErrorResponse('未認證或會話已過期', 401, undefined, 'UNAUTHENTICATED');
    }

    // 檢查是否為管理員
    let supabase;
    try {
      supabase = await createServerSupabaseClient();
    } catch (dbError) {
      console.error('[InquiryStats] Database connection error:', dbError);
      return createErrorResponse('資料庫連線錯誤', 503,
        dbError instanceof Error ? dbError.message : 'Unknown database error',
        'DATABASE_CONNECTION_ERROR'
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[InquiryStats] Profile fetch error:', profileError);
      return createErrorResponse('無法驗證使用者權限', 500,
        profileError.message,
        'PROFILE_FETCH_ERROR'
      );
    }

    if (profile?.role !== 'admin') {
      return createErrorResponse('只有管理員可以查看統計資料', 403, undefined, 'INSUFFICIENT_PERMISSIONS');
    }

    // 取得查詢參數
    const { searchParams } = new URL(request.url);
    const timeframeParam = searchParams.get('timeframe') || '30';
    
    // 驗證 timeframe 參數
    const daysAgo = parseInt(timeframeParam);
    if (isNaN(daysAgo) || daysAgo < 1 || daysAgo > 365) {
      return createErrorResponse('無效的時間範圍參數', 400, 
        `timeframe 必須是 1-365 之間的數字，收到: ${timeframeParam}`,
        'INVALID_TIMEFRAME'
      );
    }

    // 計算日期範圍
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    const startDateISO = startDate.toISOString();

    // 查詢基本統計
    let basicStats;
    try {
      const { data, error: queryError } = await supabase
        .from('inquiries')
        .select('id, status, is_read, is_replied, created_at, replied_at')
        .gte('created_at', startDateISO);

      if (queryError) {
        console.error('[InquiryStats] Query error:', queryError);
        return createErrorResponse('查詢統計資料時發生錯誤', 500,
          queryError.message,
          'QUERY_ERROR'
        );
      }

      basicStats = data;
    } catch (dbError) {
      console.error('[InquiryStats] Database query error:', dbError);
      return createErrorResponse('資料庫查詢失敗', 503,
        dbError instanceof Error ? dbError.message : 'Unknown database error',
        'DATABASE_QUERY_ERROR'
      );
    }

    if (!basicStats) {
      return createErrorResponse('無法取得統計資料', 500, undefined, 'NO_DATA_RETURNED');
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

    // 記錄請求處理時間
    const processingTime = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[InquiryStats] Request processed in ${processingTime}ms`);
    }

    return createSuccessResponse(statsData, `統計資料已成功取得 (處理時間: ${processingTime}ms)`);

  } catch (error) {
    // 記錄未捕獲的錯誤
    console.error('[InquiryStats] Unhandled error:', error);
    
    const processingTime = Date.now() - startTime;
    const errorDetails = error instanceof Error 
      ? `${error.message} (Stack: ${error.stack})`
      : 'Unknown error';
      
    return createErrorResponse(
      '統計資料服務發生未預期的錯誤',
      500,
      `Error after ${processingTime}ms: ${errorDetails}`,
      'UNHANDLED_ERROR'
    );
  }
}