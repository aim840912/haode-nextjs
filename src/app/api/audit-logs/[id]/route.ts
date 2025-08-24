/**
 * 單個審計日誌 API 路由
 * 處理個別審計日誌的刪除操作
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase-server';
import { auditLogService } from '@/services/auditLogService';

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
function createSuccessResponse(data?: any, message?: string, status: number = 200) {
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

// GET /api/audit-logs/[id] - 取得單個審計日誌詳情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 驗證使用者認證
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('未認證或會話已過期', 401);
    }

    // 檢查權限（只有管理員和稽核人員可以查看審計日誌詳情）
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'auditor'].includes(profile.role)) {
      return createErrorResponse('權限不足，只有管理員和稽核人員可以查看審計日誌', 403);
    }

    // 取得審計日誌
    const { data: auditLog, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('取得審計日誌失敗:', error);
      return createErrorResponse('取得審計日誌失敗', 500, error.message);
    }

    if (!auditLog) {
      return createErrorResponse('找不到指定的審計日誌', 404);
    }

    return createSuccessResponse(auditLog);

  } catch (error) {
    console.error('Error fetching audit log:', error);
    return createErrorResponse(
      '取得審計日誌失敗', 
      500, 
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// DELETE /api/audit-logs/[id] - 刪除單個審計日誌
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 驗證使用者認證
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('未認證或會話已過期', 401);
    }

    // 檢查權限（只有管理員可以刪除審計日誌）
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return createErrorResponse('權限不足，只有管理員可以刪除審計日誌', 403);
    }

    // 先取得要刪除的日誌資料（用於記錄刪除操作）
    const { data: auditLogToDelete, error: fetchError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('取得待刪除審計日誌失敗:', fetchError);
      return createErrorResponse('找不到指定的審計日誌', 404);
    }

    if (!auditLogToDelete) {
      return createErrorResponse('找不到指定的審計日誌', 404);
    }

    // 執行刪除操作
    const { error: deleteError } = await supabase
      .from('audit_logs')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('刪除審計日誌失敗:', deleteError);
      return createErrorResponse('刪除審計日誌失敗', 500, deleteError.message);
    }

    // 記錄刪除操作的審計日誌
    await auditLogService.log({
      user_id: user.id,
      user_email: user.email || 'unknown@email.com',
      user_name: profile.name,
      user_role: profile.role,
      action: 'delete',
      resource_type: 'audit_log',
      resource_id: id,
      previous_data: auditLogToDelete,
      metadata: {
        deletion_reason: 'admin_manual_deletion',
        deleted_log_action: auditLogToDelete.action,
        deleted_log_resource: auditLogToDelete.resource_type,
        deleted_log_date: auditLogToDelete.created_at
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      user_agent: request.headers.get('user-agent') || undefined
    }).catch(console.error); // 不讓審計日誌記錄失敗影響主要操作

    return createSuccessResponse(null, '審計日誌已成功刪除');

  } catch (error) {
    console.error('Error deleting audit log:', error);
    return createErrorResponse(
      '刪除審計日誌失敗', 
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

export async function PATCH() {
  return createErrorResponse('不支援的請求方法', 405);
}