/**
 * 審計日誌統計 API 路由
 * 提供審計日誌的統計資訊
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase-server';
import { auditLogService } from '@/services/auditLogService';
import { apiLogger } from '@/lib/logger';

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

// GET /api/audit-logs/stats - 取得審計日誌統計
export async function GET(request: NextRequest) {
  try {
    // 驗證使用者認證
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('未認證或會話已過期', 401);
    }

    // 檢查權限（只有管理員和稽核人員可以查看審計日誌統計）
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'auditor'].includes(profile.role)) {
      return createErrorResponse('權限不足，只有管理員和稽核人員可以查看統計資訊', 403);
    }

    // 解析查詢參數
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30;
    const statsType = searchParams.get('type') || 'overview';

    let stats;
    
    switch (statsType) {
      case 'overview':
        // 綜合統計
        const [auditStats, userStats, resourceStats] = await Promise.all([
          auditLogService.getAuditStats(days),
          auditLogService.getUserActivityStats(days),
          auditLogService.getResourceAccessStats(days)
        ]);
        
        stats = {
          audit_stats: auditStats,
          user_stats: userStats.slice(0, 10), // 只取前10名活躍用戶
          resource_stats: resourceStats.slice(0, 10), // 只取前10個熱門資源
          summary: {
            total_actions: auditStats.reduce((sum, stat) => sum + stat.count, 0),
            unique_users: new Set(userStats.map(stat => stat.user_id)).size,
            most_active_day: auditStats.reduce((max, stat) => 
              stat.count > (max?.count || 0) ? stat : max, auditStats[0]
            ),
            sensitive_actions: auditStats
              .filter(stat => ['delete', 'export', 'update'].includes(stat.action))
              .reduce((sum, stat) => sum + stat.count, 0)
          }
        };
        break;

      case 'users':
        // 使用者活動統計
        stats = await auditLogService.getUserActivityStats(days);
        break;

      case 'resources':
        // 資源存取統計
        stats = await auditLogService.getResourceAccessStats(days);
        break;

      case 'actions':
        // 動作統計
        stats = await auditLogService.getAuditStats(days);
        break;

      default:
        return createErrorResponse('不支援的統計類型', 400);
    }

    return createSuccessResponse(stats);

  } catch (error) {
    apiLogger.error('Error fetching audit log stats:', { module: 'AuditLogs', action: 'GET /api/audit-logs/stats', error });
    return createErrorResponse(
      '取得審計統計失敗', 
      500, 
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// 處理其他不支援的 HTTP 方法
export async function POST() {
  return createErrorResponse('不支援的請求方法', 405);
}

export async function PUT() {
  return createErrorResponse('不支援的請求方法', 405);
}

export async function DELETE() {
  return createErrorResponse('不支援的請求方法', 405);
}

export async function PATCH() {
  return createErrorResponse('不支援的請求方法', 405);
}