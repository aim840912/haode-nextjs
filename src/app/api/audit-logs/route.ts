/**
 * 審計日誌 API 路由
 * 處理審計日誌的查詢和統計
 */

import { NextRequest } from 'next/server'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase-server'
import { auditLogService } from '@/services/auditLogService'
import { withErrorHandler } from '@/lib/error-handler'
import { AuthorizationError, MethodNotAllowedError } from '@/lib/errors'
import { success } from '@/lib/api-response'
import { AuditLogQueryParams, AuditAction, ResourceType, UserRole } from '@/types/audit'

// GET /api/audit-logs - 取得審計日誌清單
async function handleGET(request: NextRequest) {
  // 驗證使用者認證
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthorizationError('未認證或會話已過期')
  }

  // 檢查權限（只有管理員和稽核人員可以查看審計日誌）
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'auditor'].includes(profile.role)) {
    throw new AuthorizationError('權限不足，只有管理員和稽核人員可以查看審計日誌')
  }

  // 解析查詢參數
  const { searchParams } = new URL(request.url)
  const queryParams: AuditLogQueryParams = {
    user_id: searchParams.get('user_id') || undefined,
    user_email: searchParams.get('user_email') || undefined,
    user_role: (searchParams.get('user_role') as UserRole) || undefined,
    action: (searchParams.get('action') as AuditAction) || undefined,
    resource_type: (searchParams.get('resource_type') as ResourceType) || undefined,
    resource_id: searchParams.get('resource_id') || undefined,
    start_date: searchParams.get('start_date') || undefined,
    end_date: searchParams.get('end_date') || undefined,
    ip_address: searchParams.get('ip_address') || undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
    offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    sort_by:
      (searchParams.get('sort_by') as 'created_at' | 'user_email' | 'action') || 'created_at',
    sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
  }

  // 取得審計日誌
  const auditLogs = await auditLogService.getAuditLogs(queryParams)

  return success(auditLogs, '審計日誌查詢成功')
}

export const GET = withErrorHandler(handleGET, {
  module: 'AuditLogs',
  enableAuditLog: true,
})

// 處理其他不支援的 HTTP 方法
async function handleUnsupportedMethods() {
  throw new MethodNotAllowedError('不支援的請求方法')
}

export const POST = withErrorHandler(handleUnsupportedMethods, {
  module: 'AuditLogs',
  enableAuditLog: false,
})

export const PUT = withErrorHandler(handleUnsupportedMethods, {
  module: 'AuditLogs',
  enableAuditLog: false,
})

export const DELETE = withErrorHandler(handleUnsupportedMethods, {
  module: 'AuditLogs',
  enableAuditLog: false,
})

export const PATCH = withErrorHandler(handleUnsupportedMethods, {
  module: 'AuditLogs',
  enableAuditLog: false,
})
