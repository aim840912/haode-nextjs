/**
 * 審計日誌統計 API 路由
 * 提供審計日誌的統計資訊
 */

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { auditLogService } from '@/services/auditLogService'
import { withErrorHandler } from '@/lib/error-handler'
import { requireAuth } from '@/lib/api-middleware'
import { ValidationError, MethodNotAllowedError } from '@/lib/errors'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'

// GET /api/audit-logs/stats - 取得審計日誌統計
async function handleGET(request: NextRequest, user: { id: string; role?: string }) {
  apiLogger.info('開始查詢審計日誌統計', {
    module: 'AuditLogsStats',
    action: 'GET',
    metadata: { userId: user.id },
  })

  // 檢查權限（只有管理員和稽核人員可以查看審計日誌統計）
  const supabase = await createServerSupabaseClient()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    apiLogger.error('查詢使用者資料失敗', profileError, {
      module: 'AuditLogsStats',
      action: 'GET',
      metadata: { userId: user.id },
    })
    throw new Error('無法驗證使用者資料')
  }

  if (!profile || !['admin', 'auditor'].includes(profile.role)) {
    apiLogger.warn('使用者嘗試存取審計統計但權限不足', {
      module: 'AuditLogsStats',
      action: 'GET',
      metadata: { userId: user.id, userRole: profile?.role },
    })
    throw new ValidationError('權限不足，只有管理員和稽核人員可以查看統計資訊')
  }

  // 解析查詢參數
  const { searchParams } = new URL(request.url)
  const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30
  const statsType = searchParams.get('type') || 'overview'

  if (days < 1 || days > 365) {
    throw new ValidationError('查詢天數必須在 1-365 之間')
  }

  let stats

  switch (statsType) {
    case 'overview':
      // 綜合統計
      const [auditStats, userStats, resourceStats] = await Promise.all([
        auditLogService.getAuditStats(days),
        auditLogService.getUserActivityStats(days),
        auditLogService.getResourceAccessStats(days),
      ])

      stats = {
        audit_stats: auditStats,
        user_stats: userStats.slice(0, 10), // 只取前10名活躍用戶
        resource_stats: resourceStats.slice(0, 10), // 只取前10個熱門資源
        summary: {
          total_actions: auditStats.reduce((sum, stat) => sum + stat.count, 0),
          unique_users: new Set(userStats.map(stat => stat.user_id)).size,
          most_active_day: auditStats.reduce(
            (max, stat) => (stat.count > (max?.count || 0) ? stat : max),
            auditStats[0]
          ),
          sensitive_actions: auditStats
            .filter(stat => ['delete', 'export', 'update'].includes(stat.action))
            .reduce((sum, stat) => sum + stat.count, 0),
        },
      }
      break

    case 'users':
      // 使用者活動統計
      stats = await auditLogService.getUserActivityStats(days)
      break

    case 'resources':
      // 資源存取統計
      stats = await auditLogService.getResourceAccessStats(days)
      break

    case 'actions':
      // 動作統計
      stats = await auditLogService.getAuditStats(days)
      break

    default:
      throw new ValidationError('不支援的統計類型')
  }

  apiLogger.info('審計統計查詢成功', {
    module: 'AuditLogsStats',
    action: 'GET',
    metadata: {
      userId: user.id,
      statsType,
      days,
      resultCount: Array.isArray(stats) ? stats.length : Object.keys(stats).length,
    },
  })

  return success(stats, '取得審計統計成功')
}

// 導出使用 requireAuth 中間件的 GET 處理器
export const GET = requireAuth(handleGET)

// 處理其他不支援的 HTTP 方法
async function handleUnsupportedMethod(): Promise<never> {
  throw new MethodNotAllowedError('不支援的請求方法')
}

export const POST = withErrorHandler(handleUnsupportedMethod, { module: 'AuditLogsStats' })
export const PUT = withErrorHandler(handleUnsupportedMethod, { module: 'AuditLogsStats' })
export const DELETE = withErrorHandler(handleUnsupportedMethod, { module: 'AuditLogsStats' })
export const PATCH = withErrorHandler(handleUnsupportedMethod, { module: 'AuditLogsStats' })
