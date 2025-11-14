/**
 * API Route Helpers for /api/inquiries/[id]
 * 共用的驗證、權限和工具函數
 */

import { createServerSupabaseClient } from '@/lib/database/supabase-server'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { CommonValidations } from '@/lib/validation'

/**
 * 驗證並解析路由 ID 參數
 * @param context - Next.js 路由 context
 * @returns 驗證後的 inquiry ID
 * @throws ValidationError 當參數格式錯誤時
 */
export async function validateRouteId(context?: unknown): Promise<string> {
  const routeContext = context as { params: Promise<{ id: string }> } | undefined

  if (!routeContext?.params) {
    throw new ValidationError('缺少路由參數')
  }

  const { id: inquiryId } = await routeContext.params

  // 驗證 UUID 格式
  const paramResult = CommonValidations.uuidParam.safeParse({ id: inquiryId })
  if (!paramResult.success) {
    const errors = paramResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  return inquiryId
}

/**
 * 檢查使用者是否為管理員
 * @param userId - 使用者 ID
 * @returns Profile 資料，包含 role 和 name
 */
export async function checkAdminRole(userId: string): Promise<{
  role: string
  name: string
  isAdmin: boolean
}> {
  const supabase = await createServerSupabaseClient()
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', userId)
    .single()) as { data: { role: string; name: string } | null; error: Error | null }

  const isAdmin = profile?.role === 'admin'

  return {
    role: profile?.role || 'user',
    name: profile?.name || 'Unknown',
    isAdmin,
  }
}

/**
 * 記錄審計日誌，並統一處理錯誤
 * @param logPromise - 審計日誌的 Promise
 * @param action - 操作名稱（用於錯誤日誌）
 */
export async function logAuditWithErrorHandling(
  logPromise: Promise<void>,
  action: string
): Promise<void> {
  try {
    await logPromise
  } catch (error) {
    apiLogger.warn('審計日誌記錄失敗', {
      module: 'AuditLog',
      action,
      metadata: { error: (error as Error).message },
    })
  }
}
