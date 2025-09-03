/**
 * 審計日誌 API 路由
 * 處理審計日誌的查詢和統計
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase-server';
import { auditLogService } from '@/services/auditLogService';
import { apiLogger } from '@/lib/logger';
import { 
  AuditLogQueryParams,
  AuditAction,
  ResourceType,
  UserRole
} from '@/types/audit';

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

// GET /api/audit-logs - 取得審計日誌清單
export async function GET(request: NextRequest) {
  try {
    // 驗證使用者認證
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('未認證或會話已過期', 401);
    }

    // 檢查權限（只有管理員和稽核人員可以查看審計日誌）
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'auditor'].includes(profile.role)) {
      return createErrorResponse('權限不足，只有管理員和稽核人員可以查看審計日誌', 403);
    }

    // 解析查詢參數
    const { searchParams } = new URL(request.url);
    const queryParams: AuditLogQueryParams = {
      user_id: searchParams.get('user_id') || undefined,
      user_email: searchParams.get('user_email') || undefined,
      user_role: searchParams.get('user_role') as UserRole || undefined,
      action: searchParams.get('action') as AuditAction || undefined,
      resource_type: searchParams.get('resource_type') as ResourceType || undefined,
      resource_id: searchParams.get('resource_id') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      ip_address: searchParams.get('ip_address') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      sort_by: searchParams.get('sort_by') as any || 'created_at',
      sort_order: searchParams.get('sort_order') as any || 'desc'
    };

    // 取得審計日誌
    const auditLogs = await auditLogService.getAuditLogs(queryParams);

    return createSuccessResponse(auditLogs);

  } catch (error) {
    apiLogger.error('Error fetching audit logs:', { module: 'AuditLogs', action: 'GET /api/audit-logs', error });
    return createErrorResponse(
      '取得審計日誌失敗', 
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