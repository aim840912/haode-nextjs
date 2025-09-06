/**
 * 單個審計日誌 API 路由
 * 處理個別審計日誌的刪除操作
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase-server';
import { auditLogService } from '@/services/auditLogService';
import { apiLogger } from '@/lib/logger';
import { withErrorHandler } from '@/lib/error-handler';
import { success, error as errorResponse } from '@/lib/api-response';
import { ValidationError, AuthorizationError, NotFoundError } from '@/lib/errors';

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
async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 驗證使用者認證
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorizationError('未認證或會話已過期');
  }

    // 檢查權限（只有管理員和稽核人員可以查看審計日誌詳情）
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null; error: any };

    if (!profile || !['admin', 'auditor'].includes(profile.role)) {
      throw new AuthorizationError('權限不足，只有管理員和稽核人員可以查看審計日誌');
    }

    // 取得審計日誌
    const { data: auditLog, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      apiLogger.error('取得審計日誌失敗', error as Error, {
        module: 'AuditLogDetailAPI',
        action: 'GET /api/audit-logs/[id]',
        metadata: { auditLogId: id }
      });
      throw new Error('取得審計日誌失敗');
    }

    if (!auditLog) {
      throw new NotFoundError('找不到指定的審計日誌');
    }

    apiLogger.info('取得審計日誌詳情成功', {
      module: 'AuditLogDetailAPI',
      action: 'GET /api/audit-logs/[id]',
      metadata: { auditLogId: id }
    });

    return success(auditLog);

}

export const GET = withErrorHandler(handleGET, {
  module: 'AuditLogDetailAPI',
  enableAuditLog: false
});

// DELETE /api/audit-logs/[id] - 刪除單個審計日誌
async function handleDELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 驗證使用者認證
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorizationError('未認證或會話已過期');
  }

    // 檢查權限（只有管理員可以刪除審計日誌）
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single() as { data: { role: string; name: string } | null; error: any };

    if (!profile || profile.role !== 'admin') {
      throw new AuthorizationError('權限不足，只有管理員可以刪除審計日誌');
    }

    // 先取得要刪除的日誌資料（用於記錄刪除操作）
    const { data: auditLogToDelete, error: fetchError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('id', id)
      .single() as { data: any | null; error: any };

    if (fetchError) {
      apiLogger.error('取得待刪除審計日誌失敗', fetchError, {
        module: 'AuditLogDetailAPI',
        action: 'DELETE /api/audit-logs/[id]',
        metadata: { auditLogId: id }
      });
      throw new NotFoundError('找不到指定的審計日誌');
    }

    if (!auditLogToDelete) {
      throw new NotFoundError('找不到指定的審計日誌');
    }

    // 執行刪除操作
    const { error: deleteError } = await supabase
      .from('audit_logs')
      .delete()
      .eq('id', id);

    if (deleteError) {
      apiLogger.error('刪除審計日誌失敗', deleteError, {
        module: 'AuditLogDetailAPI',
        action: 'DELETE /api/audit-logs/[id]',
        metadata: { auditLogId: id }
      });
      throw new Error('刪除審計日誌失敗');
    }

    // 記錄刪除操作的審計日誌
    await auditLogService.log({
      user_id: user.id,
      user_email: user.email || 'unknown@email.com',
      user_name: profile.name || 'Unknown',
      user_role: profile.role || 'Unknown',
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
    }).catch(error => {
      apiLogger.error('記錄刪除審計日誌操作失敗', error as Error, {
        module: 'AuditLogDetailAPI',
        action: 'DELETE /api/audit-logs/[id]'
      });
    }); // 不讓審計日誌記錄失敗影響主要操作

    apiLogger.info('刪除審計日誌成功', {
      module: 'AuditLogDetailAPI',
      action: 'DELETE /api/audit-logs/[id]',
      metadata: { auditLogId: id }
    });

    return success(null, '審計日誌已成功刪除');
}

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'AuditLogDetailAPI',
  enableAuditLog: true
});

// 處理其他不支援的 HTTP 方法
export async function POST() {
  return errorResponse('不支援的請求方法', 405);
}

export async function PUT() {
  return errorResponse('不支援的請求方法', 405);
}

export async function PATCH() {
  return errorResponse('不支援的請求方法', 405);
}