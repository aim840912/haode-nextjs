/**
 * 批量審計日誌 API 路由
 * 處理審計日誌的批量刪除和清理操作
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase-server';
import { auditLogService } from '@/services/auditLogService';
import { apiLogger } from '@/lib/logger';
import { withErrorHandler } from '@/lib/error-handler';
import { success, error as errorResponse } from '@/lib/api-response';
import { ValidationError, AuthorizationError } from '@/lib/errors';

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

// POST /api/audit-logs/batch - 批量操作審計日誌
async function handlePOST(request: NextRequest) {
  // 驗證使用者認證
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorizationError('未認證或會話已過期');
  }

    // 檢查權限（只有管理員可以批量操作審計日誌）
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new AuthorizationError('權限不足，只有管理員可以批量操作審計日誌');
    }

    // 解析請求內容
    const body = await request.json();
    const { operation, ids, filters } = body;

    if (!operation) {
      throw new ValidationError('缺少操作類型 (operation)');
    }

    switch (operation) {
      case 'delete_by_ids':
        return await handleDeleteByIds(supabase, user, profile, ids, request);
      
      case 'delete_by_filters':
        return await handleDeleteByFilters(supabase, user, profile, filters, request);
      
      case 'cleanup_old':
        return await handleCleanupOld(supabase, user, profile, filters?.days || 365, request);
      
      default:
        throw new ValidationError('不支援的操作類型');
    }

  apiLogger.info('批量審計日誌操作完成', {
    module: 'AuditLogBatchAPI',
    action: 'POST /api/audit-logs/batch',
    metadata: { operation: body.operation }
  });
}

export const POST = withErrorHandler(handlePOST, {
  module: 'AuditLogBatchAPI',
  enableAuditLog: true
});

// 按 ID 批量刪除
async function handleDeleteByIds(
  supabase: any, 
  user: any, 
  profile: any, 
  ids: string[], 
  request: NextRequest
) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError('缺少要刪除的日誌 ID 列表');
  }

  if (ids.length > 100) {
    throw new ValidationError('單次最多只能刪除 100 筆記錄');
  }

  // 先取得要刪除的日誌資料
  const { data: logsToDelete, error: fetchError } = await supabase
    .from('audit_logs')
    .select('*')
    .in('id', ids);

  if (fetchError) {
    apiLogger.error('取得待刪除審計日誌失敗', fetchError, {
      module: 'AuditLogBatchAPI',
      action: 'handleDeleteByIds',
      metadata: { ids }
    });
    throw new Error('取得待刪除審計日誌失敗');
  }

  if (!logsToDelete || logsToDelete.length === 0) {
    throw new ValidationError('找不到指定的審計日誌');
  }

  // 執行批量刪除
  const { data, error: deleteError } = await supabase
    .from('audit_logs')
    .delete()
    .in('id', ids)
    .select();

  if (deleteError) {
    apiLogger.error('批量刪除審計日誌失敗', deleteError, {
      module: 'AuditLogBatchAPI',
      action: 'handleDeleteByIds',
      metadata: { ids, deletedCount: data?.length || 0 }
    });
    throw new Error('批量刪除審計日誌失敗');
  }

  const deletedCount = data?.length || 0;

  // 記錄批量刪除操作的審計日誌
  await auditLogService.log({
    user_id: user.id,
    user_email: user.email || 'unknown@email.com',
    user_name: profile.name,
    user_role: profile.role,
    action: 'delete',
    resource_type: 'audit_log',
    resource_id: 'batch',
    metadata: {
      operation: 'batch_delete_by_ids',
      deleted_count: deletedCount,
      deleted_ids: ids,
      deletion_reason: 'admin_batch_deletion'
    },
    ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    user_agent: request.headers.get('user-agent') || undefined
  }).catch(error => {
    apiLogger.error('記錄批量刪除審計日誌失敗', error as Error, {
      module: 'AuditLogBatchAPI',
      action: 'handleDeleteByIds'
    });
  });

  apiLogger.info('批量刪除審計日誌成功', {
    module: 'AuditLogBatchAPI',
    action: 'handleDeleteByIds',
    metadata: { deletedCount, idsCount: ids.length }
  });

  return success(
    { deleted_count: deletedCount },
    `成功刪除 ${deletedCount} 筆審計日誌`
  );
}

// 按條件批量刪除
async function handleDeleteByFilters(
  supabase: any, 
  user: any, 
  profile: any, 
  filters: any, 
  request: NextRequest
) {
  if (!filters) {
    return createErrorResponse('缺少篩選條件', 400);
  }

  let query = supabase.from('audit_logs').delete();

  // 套用篩選條件
  if (filters.start_date) {
    query = query.gte('created_at', filters.start_date);
  }
  if (filters.end_date) {
    query = query.lte('created_at', filters.end_date);
  }
  if (filters.user_email) {
    query = query.ilike('user_email', `%${filters.user_email}%`);
  }
  if (filters.action) {
    query = query.eq('action', filters.action);
  }
  if (filters.resource_type) {
    query = query.eq('resource_type', filters.resource_type);
  }

  const { data, error: deleteError } = await query.select();

  if (deleteError) {
    apiLogger.error('按條件批量刪除審計日誌失敗', deleteError, {
      module: 'AuditLogBatchAPI',
      action: 'handleDeleteByFilters',
      metadata: { filters }
    });
    throw new Error('按條件批量刪除審計日誌失敗');
  }

  const deletedCount = data?.length || 0;

  // 記錄批量刪除操作的審計日誌
  await auditLogService.log({
    user_id: user.id,
    user_email: user.email || 'unknown@email.com',
    user_name: profile.name,
    user_role: profile.role,
    action: 'delete',
    resource_type: 'audit_log',
    resource_id: 'batch',
    metadata: {
      operation: 'batch_delete_by_filters',
      deleted_count: deletedCount,
      filters: filters,
      deletion_reason: 'admin_conditional_deletion'
    },
    ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    user_agent: request.headers.get('user-agent') || undefined
  }).catch(error => {
    apiLogger.error('記錄按條件批量刪除審計日誌失敗', error as Error, {
      module: 'AuditLogBatchAPI',
      action: 'handleDeleteByFilters'
    });
  });

  apiLogger.info('按條件批量刪除審計日誌成功', {
    module: 'AuditLogBatchAPI',
    action: 'handleDeleteByFilters',
    metadata: { deletedCount, filters }
  });

  return success(
    { deleted_count: deletedCount },
    `成功刪除 ${deletedCount} 筆符合條件的審計日誌`
  );
}

// 清理舊日誌
async function handleCleanupOld(
  supabase: any, 
  user: any, 
  profile: any, 
  daysToKeep: number, 
  request: NextRequest
) {
  if (typeof daysToKeep !== 'number' || daysToKeep < 0) {
    return createErrorResponse('保留天數必須是非負數', 400);
  }

  try {
    // 呼叫資料庫清理函數
    const { data, error } = await supabase
      .rpc('cleanup_old_audit_logs', { days_to_keep: daysToKeep });

    if (error) {
      apiLogger.error('清理舊審計日誌失敗', error as Error, {
        module: 'AuditLogBatchAPI',
        action: 'handleCleanupOld',
        metadata: { daysToKeep }
      });
      throw new Error('清理舊審計日誌失敗');
    }

    const deletedCount = data || 0;

    // 記錄清理操作的審計日誌
    await auditLogService.log({
      user_id: user.id,
      user_email: user.email || 'unknown@email.com',
      user_name: profile.name,
      user_role: profile.role,
      action: 'delete',
      resource_type: 'audit_log',
      resource_id: 'cleanup',
      metadata: {
        operation: 'cleanup_old_logs',
        days_to_keep: daysToKeep,
        deleted_count: deletedCount,
        deletion_reason: 'admin_scheduled_cleanup'
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      user_agent: request.headers.get('user-agent') || undefined
    }).catch(error => {
      apiLogger.error('記錄清理舊審計日誌操作失敗', error as Error, {
        module: 'AuditLogBatchAPI',
        action: 'handleCleanupOld'
      });
    });

    apiLogger.info('清理舊審計日誌成功', {
      module: 'AuditLogBatchAPI',
      action: 'handleCleanupOld',
      metadata: { deletedCount, daysToKeep }
    });

    return success(
      { deleted_count: deletedCount, days_kept: daysToKeep },
      `成功清理 ${deletedCount} 筆舊審計日誌（保留最近 ${daysToKeep} 天）`
    );

  } catch (error) {
    apiLogger.error('清理舊審計日誌異常', error as Error, {
      module: 'AuditLogBatchAPI',
      action: 'handleCleanupOld',
      metadata: { daysToKeep }
    });
    throw error;
  }
}

// 處理其他不支援的 HTTP 方法
export async function GET() {
  return errorResponse('不支援的請求方法', 405);
}

export async function PUT() {
  return errorResponse('不支援的請求方法', 405);
}

export async function DELETE() {
  return errorResponse('不支援的請求方法', 405);
}

export async function PATCH() {
  return errorResponse('不支援的請求方法', 405);
}