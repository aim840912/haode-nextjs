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

// DELETE - 刪除精彩時刻 (管理員專用)
async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  const { id } = await params
  if (!id) {
    throw new ValidationError('精彩時刻 ID 為必填參數')
  }

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  // 先獲取精彩時刻資料以便記錄審計日誌
  const { data: momentData, error: fetchError } = await supabaseAdmin
    .from('moments')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    apiLogger.error(`Error fetching moment ${id} for audit:`, fetchError)
  }

  if (!momentData) {
    throw new NotFoundError(`找不到 ID 為 ${id} 的精彩時刻`)
  }

  // 刪除精彩時刻圖片（從 moments.images 欄位）
  let deletedImageCount = 0
  let imageCleanupSuccess = false
  let imageCleanupError: string | undefined

  try {
    apiLogger.info(`🗑️ 開始為精彩時刻 ${id} 清理圖片...`)

    // 從 moments.images 欄位中提取圖片 URL
    const imageUrls = momentData.images || []

    if (imageUrls.length > 0) {
      // 從 URL 中提取檔案路徑
      const filePaths: string[] = []
      for (const url of imageUrls) {
        if (typeof url === 'string' && url.includes('/storage/v1/object/public/media/')) {
          // 提取路徑部分：https://xxx.supabase.co/storage/v1/object/public/media/moments/2025-09/xxx.jpg
          // 獲得：moments/2025-09/xxx.jpg
          const pathMatch = url.match(/\/storage\/v1\/object\/public\/media\/(.+)$/)
          if (pathMatch) {
            filePaths.push(pathMatch[1])
          }
        }
      }

      if (filePaths.length > 0) {
        // 批量刪除檔案
        const { error: storageError } = await supabaseAdmin.storage.from('media').remove(filePaths)

        if (storageError) {
          throw new Error(`Storage deletion failed: ${storageError.message}`)
        }

        deletedImageCount = filePaths.length
      }
    }

    imageCleanupSuccess = true
    apiLogger.info(`✅ 精彩時刻 ${id} 的圖片清理完成 - 刪除了 ${deletedImageCount} 個檔案`)
  } catch (storageError) {
    imageCleanupError = (storageError as Error).message
    apiLogger.warn(`⚠️ 精彩時刻 ${id} 圖片清理過程發生異常`, {
      metadata: { error: imageCleanupError },
    })
  }

  // 然後刪除資料庫記錄
  const { error } = await supabaseAdmin.from('moments').delete().eq('id', id)

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
      resource_type: 'moments' as const,
      resource_id: id,
      resource_details: momentData as unknown as Record<string, unknown>,
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
    apiLogger.warn('Failed to log moment deletion audit', {
      metadata: { error: (auditError as Error).message },
    })
  }

  apiLogger.info('🔄 精彩時刻刪除完成，快取已自動更新')

  return success(
    {
      message: '精彩時刻刪除成功',
      imageCleanup: {
        success: imageCleanupSuccess,
        deletedCount: deletedImageCount,
        error: imageCleanupError,
      },
    },
    '精彩時刻刪除成功'
  )
}

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'AdminMomentsAPI',
  enableAuditLog: true,
})
