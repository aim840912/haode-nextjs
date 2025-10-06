import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { unifiedImageService } from '@/services/infrastructure/unified-image-service'
import { SupabaseAuditLogService } from '@/services/infrastructure/auditLogService'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { success } from '@/lib/api-response'
import {
  checkAdminPermission,
  createAuthErrorResponse,
} from '@/lib/middleware/admin-auth-middleware'

// DELETE - 刪除農場體驗活動 (管理員專用)
async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  const { id } = await params
  if (!id) {
    throw new ValidationError('農場體驗活動 ID 為必填參數')
  }

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  // 先獲取活動資料以便記錄審計日誌
  const { data: activityData, error: fetchError } = await supabaseAdmin
    .from('farm_tour')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    apiLogger.error(`Error fetching farm tour activity ${id} for audit:`, fetchError)
  }

  if (!activityData) {
    throw new NotFoundError(`找不到 ID 為 ${id} 的農場體驗活動`)
  }

  // 使用統一圖片服務刪除活動圖片
  let deletedImageCount = 0
  let imageCleanupSuccess = false
  let imageCleanupError: string | undefined

  try {
    apiLogger.info(`🗑️ 開始為農場體驗活動 ${id} 清理圖片...`)
    deletedImageCount = await unifiedImageService.deleteEntityImages('farm-tour', id)
    imageCleanupSuccess = true
    apiLogger.info(`✅ 農場體驗活動 ${id} 的圖片清理完成 - 刪除了 ${deletedImageCount} 個檔案`)
  } catch (storageError) {
    imageCleanupError = (storageError as Error).message
    apiLogger.warn(`⚠️ 農場體驗活動 ${id} 圖片清理過程發生異常`, {
      metadata: { error: imageCleanupError },
    })
  }

  // 然後刪除資料庫記錄
  const { error } = await supabaseAdmin.from('farm_tour').delete().eq('id', id)

  if (error) throw error

  // 記錄審計日誌
  try {
    const auditService = new SupabaseAuditLogService()
    await auditService.log({
      user_id: 'admin-api-key',
      user_email: 'admin@system',
      user_name: 'Admin API',
      user_role: 'admin',
      action: 'delete',
      resource_type: 'farm_tour' as const,
      resource_id: id,
      resource_details: activityData as unknown as Record<string, unknown>,
      metadata: {
        imageCleanup: {
          success: imageCleanupSuccess,
          deletedCount: deletedImageCount,
          error: imageCleanupError,
        },
      },
      ip_address:
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    })
  } catch (auditError) {
    apiLogger.warn('Failed to log farm tour activity deletion audit', {
      metadata: { error: (auditError as Error).message },
    })
  }

  apiLogger.info('🔄 農場體驗活動刪除完成，快取已自動更新')

  return success(
    {
      message: '農場體驗活動刪除成功',
      imageCleanup: {
        success: imageCleanupSuccess,
        deletedCount: deletedImageCount,
        error: imageCleanupError,
      },
    },
    '農場體驗活動刪除成功'
  )
}

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'AdminFarmTourAPI',
  enableAuditLog: true,
})
