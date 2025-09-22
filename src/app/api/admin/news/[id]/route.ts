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
  checkRateLimit,
} from '@/lib/middleware/admin-auth-middleware'

// DELETE - 刪除新聞 (管理員專用)
async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  const { id } = await params
  if (!id) {
    throw new ValidationError('新聞 ID 為必填參數')
  }

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  // 先獲取新聞資料以便記錄審計日誌
  const { data: newsData, error: fetchError } = await supabaseAdmin
    .from('news')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    apiLogger.error(`Error fetching news ${id} for audit:`, fetchError)
  }

  if (!newsData) {
    throw new NotFoundError(`找不到 ID 為 ${id} 的新聞`)
  }

  // 使用統一圖片服務刪除新聞圖片
  let deletedImageCount = 0
  let imageCleanupSuccess = false
  let imageCleanupError: string | undefined

  try {
    apiLogger.info(`🗑️ 開始為新聞 ${id} 清理圖片...`)
    deletedImageCount = await unifiedImageService.deleteEntityImages('news', id)
    imageCleanupSuccess = true
    apiLogger.info(`✅ 新聞 ${id} 的圖片清理完成 - 刪除了 ${deletedImageCount} 個檔案`)
  } catch (storageError) {
    imageCleanupError = (storageError as Error).message
    apiLogger.warn(`⚠️ 新聞 ${id} 圖片清理過程發生異常`, {
      metadata: { error: imageCleanupError },
    })
  }

  // 然後刪除資料庫記錄
  const { error } = await supabaseAdmin.from('news').delete().eq('id', id)

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
      resource_type: 'news' as const,
      resource_id: id,
      resource_details: newsData as unknown as Record<string, unknown>,
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
    apiLogger.warn('Failed to log news deletion audit', {
      metadata: { error: (auditError as Error).message },
    })
  }

  apiLogger.info('🔄 新聞刪除完成，快取已自動更新')

  return success(
    {
      message: '新聞刪除成功',
      imageCleanup: {
        success: imageCleanupSuccess,
        deletedCount: deletedImageCount,
        error: imageCleanupError,
      },
    },
    '新聞刪除成功'
  )
}

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'AdminNewsAPI',
  enableAuditLog: true,
})
