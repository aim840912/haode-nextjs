/**
 * 單一庫存查詢 API 路由
 * 處理特定庫存查詢單的查詢、更新和刪除
 * 已整合統一驗證和錯誤處理系統
 */

import { NextRequest, NextResponse } from 'next/server'
import { success } from '@/lib/api-response'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'
import { ValidationError, NotFoundError, AuthorizationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'
import { InquirySchemas, CommonValidations } from '@/lib/validation'
import { inquiryCommandService } from '@/services/core/inquiry/InquiryCommandService'
import { inquiryQueryService } from '@/services/core/inquiry/InquiryQueryService'
import { AuditLogger } from '@/services/infrastructure/auditLogService'
import type { Database } from '@/types/database'
import { InquiryUtils } from '@/types/inquiry'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * @api {GET} /api/inquiries/:id 取得單一詢價單
 * @apiName GetInquiryById
 * @apiGroup Inquiries
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得特定詢價單的詳細資訊。
 * - 一般使用者只能查看自己的詢價單
 * - 管理員可以使用 admin=true 查看所有詢價單
 * - 管理員查看時會自動標記為已讀
 *
 * @apiPermission user
 *
 * @apiParam {String} id 詢價單 ID (UUID)
 *
 * @apiQuery {Boolean} [admin=false] 管理員模式（僅管理員可用）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 詢價單資料
 * @apiSuccess {String} data.id 詢價單 ID
 * @apiSuccess {String} data.customer_name 客戶姓名
 * @apiSuccess {String} data.customer_email 客戶 Email
 * @apiSuccess {String} data.status 詢價單狀態
 * @apiSuccess {Boolean} data.is_read 是否已讀
 * @apiSuccess {Boolean} data.is_replied 是否已回覆
 * @apiSuccess {Number} data.total_estimated_amount 總預估金額
 * @apiSuccess {Object[]} data.inquiry_items 詢價項目列表
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "customer_name": "王小明",
 *     "customer_email": "wang@example.com",
 *     "status": "pending",
 *     "is_read": true,
 *     "is_replied": false,
 *     "total_estimated_amount": 15000,
 *     "inquiry_items": [...]
 *   },
 *   "message": "查詢成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 參數驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 未登入或權限不足
 * @apiError (錯誤 4xx) {Object} NotFoundError 詢價單不存在
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 404 Not Found
 * {
 *   "success": false,
 *   "error": "找不到庫存查詢單",
 *   "code": "NOT_FOUND"
 * }
 */
async function handleGET(request: NextRequest, user: User, context?: unknown) {
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

  // 檢查是否為管理員
  const supabase = await createServerSupabaseClient()
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()) as { data: { role: string; name: string } | null; error: Error | null }

  const isAdmin = profile?.role === 'admin'
  const { searchParams } = new URL(request.url)
  const adminMode = searchParams.get('admin') === 'true'

  apiLogger.info('查詢單一庫存查詢單', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
      inquiryId,
      isAdmin,
      adminMode,
    },
  })

  // 取得庫存查詢單
  let inquiry
  if (isAdmin && adminMode) {
    // 管理員可以查看任何庫存查詢單
    inquiry = await inquiryQueryService.getInquiryByIdForAdmin(inquiryId)
  } else {
    // 一般使用者只能查看自己的庫存查詢單
    inquiry = await inquiryQueryService.getInquiryById(user.id, inquiryId)
  }

  if (!inquiry) {
    throw new NotFoundError('找不到庫存查詢單')
  }

  // 管理員查看庫存查詢單時自動標記為已讀
  if (isAdmin && adminMode && !inquiry.is_read) {
    try {
      await (supabase as unknown as SupabaseClient<Database>)
        .from('inquiries')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', inquiryId)

      // 更新本地資料物件
      inquiry.is_read = true
      inquiry.read_at = new Date().toISOString()
    } catch (error) {
      apiLogger.warn('標記詢問單已讀失敗', {
        metadata: { inquiryId, error: (error as Error).message },
      })
    }
  }

  return success(inquiry, '查詢成功')
}

/**
 * @api {PUT} /api/inquiries/:id 更新詢價單
 * @apiName UpdateInquiry
 * @apiGroup Inquiries
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 更新詢價單資訊。
 * - 一般使用者可更新客戶資訊、備註、配送地址
 * - 管理員可額外更新狀態、讀取/回覆標記
 * - 狀態更新需驗證狀態轉換規則
 *
 * @apiPermission user
 *
 * @apiParam {String} id 詢價單 ID (UUID)
 *
 * @apiBody {String} [customer_name] 客戶姓名
 * @apiBody {String} [customer_email] 客戶 Email
 * @apiBody {String} [notes] 備註
 * @apiBody {String} [delivery_address] 配送地址
 * @apiBody {String="pending","quoted","confirmed","completed","cancelled"} [status] 狀態（僅管理員）
 * @apiBody {Boolean} [is_read] 是否已讀（僅管理員）
 * @apiBody {Boolean} [is_replied] 是否已回覆（僅管理員）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 更新後的詢價單資料
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "status": "quoted",
 *     "customer_name": "王小明",
 *     "updated_at": "2025-01-07T10:30:00Z"
 *   },
 *   "message": "詢問單更新成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 資料驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 權限不足（狀態更新需管理員）
 * @apiError (錯誤 4xx) {Object} NotFoundError 詢價單不存在
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 403 Forbidden
 * {
 *   "success": false,
 *   "error": "只有管理員可以更新庫存查詢單狀態",
 *   "code": "AUTHORIZATION_ERROR"
 * }
 */
async function handlePUT(request: NextRequest, user: User, context?: unknown) {
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

  // 解析並驗證請求資料
  const body = await request.json()
  const result = InquirySchemas.update.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  // 檢查是否為管理員
  const supabase = await createServerSupabaseClient()
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()) as { data: { role: string; name: string } | null; error: Error | null }

  const isAdmin = profile?.role === 'admin'

  // 如果是狀態更新，檢查管理員權限
  if (result.data.status && !isAdmin) {
    throw new AuthorizationError('只有管理員可以更新庫存查詢單狀態')
  }

  // 如果是讀取/回覆狀態更新，檢查管理員權限
  if ((result.data.is_read !== undefined || result.data.is_replied !== undefined) && !isAdmin) {
    throw new AuthorizationError('只有管理員可以更新庫存查詢單讀取/回覆狀態')
  }

  apiLogger.info('更新庫存查詢單', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
      inquiryId,
      changes: Object.keys(result.data),
      isAdmin,
    },
  })

  // 如果有狀態更新，驗證狀態轉換
  if (result.data.status && isAdmin) {
    // 先取得當前庫存查詢單
    const currentInquiry = await inquiryQueryService.getInquiryByIdForAdmin(inquiryId)
    if (!currentInquiry) {
      throw new NotFoundError('找不到庫存查詢單')
    }

    // 驗證狀態轉換
    if (!InquiryUtils.isValidStatusTransition(currentInquiry.status, result.data.status)) {
      return NextResponse.json(
        {
          error: `無法從 ${currentInquiry.status} 轉換到 ${result.data.status}`,
          availableTransitions: InquiryUtils.getAvailableStatusTransitions(currentInquiry.status),
          success: false,
        },
        { status: 400 }
      )
    }

    // 管理員更新狀態
    const updatedInquiry = await inquiryCommandService.updateInquiryStatus(
      inquiryId,
      result.data.status
    )

    // 記錄詢問單狀態變更的審計日誌
    AuditLogger.logInquiryStatusChange(
      user.id,
      user.email || 'unknown@email.com',
      profile?.name,
      profile?.role,
      inquiryId,
      currentInquiry.status,
      result.data.status,
      {
        customer_name: currentInquiry.customer_name,
        customer_email: currentInquiry.customer_email,
      },
      request
    ).catch(error => {
      apiLogger.warn('審計日誌記錄失敗', {
        module: 'AuditLog',
        action: 'logInquiryStatusChange',
        metadata: { error: (error as Error).message },
      })
    })

    return success(updatedInquiry, '詢問單狀態更新成功')
  }

  // 取得更新前的詢問單資料（用於審計日誌）
  const previousInquiry = await inquiryQueryService.getInquiryById(user.id, inquiryId)
  if (!previousInquiry) {
    throw new NotFoundError('找不到庫存查詢單')
  }

  // 一般使用者更新詢問單
  const updatedInquiry = await inquiryCommandService.updateInquiry(user.id, inquiryId, result.data)

  // 記錄詢問單更新的審計日誌
  AuditLogger.logInquiryUpdate(
    user.id,
    user.email || 'unknown@email.com',
    profile?.name,
    profile?.role,
    inquiryId,
    {
      customer_name: previousInquiry.customer_name,
      customer_email: previousInquiry.customer_email,
      notes: previousInquiry.notes,
      delivery_address: previousInquiry.delivery_address,
    },
    {
      customer_name: updatedInquiry.customer_name,
      customer_email: updatedInquiry.customer_email,
      notes: updatedInquiry.notes,
      delivery_address: updatedInquiry.delivery_address,
    },
    request
  ).catch(error => {
    apiLogger.warn('審計日誌記錄失敗', {
      module: 'AuditLog',
      action: 'logInquiryUpdate',
      metadata: { error: (error as Error).message },
    })
  })

  return success(updatedInquiry, '詢問單更新成功')
}

/**
 * @api {DELETE} /api/inquiries/:id 刪除詢價單
 * @apiName DeleteInquiry
 * @apiGroup Inquiries
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 刪除指定的詢價單。
 * 僅限管理員操作，刪除時會記錄完整的審計日誌。
 *
 * @apiPermission admin
 *
 * @apiParam {String} id 詢價單 ID (UUID)
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 刪除結果
 * @apiSuccess {String} data.id 已刪除的詢價單 ID
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000"
 *   },
 *   "message": "詢問單刪除成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 參數驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 權限不足（需要管理員）
 * @apiError (錯誤 4xx) {Object} NotFoundError 詢價單不存在
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 403 Forbidden
 * {
 *   "success": false,
 *   "error": "只有管理員可以刪除詢問單",
 *   "code": "AUTHORIZATION_ERROR"
 * }
 */
async function handleDELETE(request: NextRequest, user: User, context?: unknown) {
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

  // 檢查是否為管理員
  const supabase = await createServerSupabaseClient()
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()) as { data: { role: string; name: string } | null; error: Error | null }

  if (profile?.role !== 'admin') {
    throw new AuthorizationError('只有管理員可以刪除詢問單')
  }

  apiLogger.info('刪除庫存查詢單', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
      inquiryId,
      adminUser: profile?.name,
    },
  })

  // 先取得詢問單資料（用於審計日誌）
  const inquiryToDelete = await inquiryQueryService.getInquiryByIdForAdmin(inquiryId)
  if (!inquiryToDelete) {
    throw new NotFoundError('找不到庫存查詢單')
  }

  // 刪除詢問單
  await inquiryCommandService.deleteInquiry(inquiryId)

  // 記錄詢問單刪除的審計日誌
  AuditLogger.logInquiryDelete(
    user.id,
    user.email || 'unknown@email.com',
    profile?.name,
    profile?.role,
    inquiryId,
    {
      customer_name: inquiryToDelete.customer_name,
      customer_email: inquiryToDelete.customer_email,
      status: inquiryToDelete.status,
      total_estimated_amount: inquiryToDelete.total_estimated_amount,
      items_count: inquiryToDelete.inquiry_items?.length || 0,
    },
    request
  ).catch(error => {
    apiLogger.warn('審計日誌記錄失敗', {
      module: 'AuditLog',
      action: 'logInquiryDelete',
      metadata: { error: (error as Error).message },
    })
  })

  return success({ id: inquiryId }, '詢問單刪除成功')
}

/**
 * @api {PATCH} /api/inquiries/:id 快速更新詢價單狀態
 * @apiName PatchInquiryStatus
 * @apiGroup Inquiries
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 快速更新詢價單的讀取/回覆狀態。
 * 僅限管理員操作，適用於批次標記已讀或已回覆。
 * 更新時會自動設定對應的時間戳記。
 *
 * @apiPermission admin
 *
 * @apiParam {String} id 詢價單 ID (UUID)
 *
 * @apiBody {Boolean} [is_read] 是否已讀
 * @apiBody {Boolean} [is_replied] 是否已回覆
 * @apiBody {String="pending","quoted","confirmed","completed","cancelled"} [status] 詢價單狀態
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 更新後的詢價單資料
 * @apiSuccess {Boolean} data.is_read 是否已讀
 * @apiSuccess {Boolean} data.is_replied 是否已回覆
 * @apiSuccess {String} [data.read_at] 讀取時間
 * @apiSuccess {String} [data.replied_at] 回覆時間
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "is_read": true,
 *     "is_replied": true,
 *     "read_at": "2025-01-07T10:30:00Z",
 *     "replied_at": "2025-01-07T10:35:00Z"
 *   },
 *   "message": "詢問單更新成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 資料驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 權限不足（需要管理員）
 * @apiError (錯誤 4xx) {Object} NotFoundError 詢價單不存在
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 403 Forbidden
 * {
 *   "success": false,
 *   "error": "只有管理員可以更新庫存查詢單狀態",
 *   "code": "AUTHORIZATION_ERROR"
 * }
 */
async function handlePATCH(request: NextRequest, user: User, context?: unknown) {
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

  // 檢查是否為管理員
  const supabase = await createServerSupabaseClient()
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()) as { data: { role: string; name: string } | null; error: Error | null }

  if (profile?.role !== 'admin') {
    throw new AuthorizationError('只有管理員可以更新庫存查詢單狀態')
  }

  // 解析並驗證請求資料
  const body = await request.json()
  const result = InquirySchemas.statusUpdate.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('快速更新庫存查詢單狀態', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
      inquiryId,
      changes: Object.keys(result.data),
      adminUser: profile?.name,
    },
  })

  // 準備更新資料
  const updateData: Record<string, unknown> = {}

  if (result.data.is_read !== undefined) {
    updateData.is_read = result.data.is_read
    if (result.data.is_read && !updateData.read_at) {
      updateData.read_at = new Date().toISOString()
    }
  }

  if (result.data.is_replied !== undefined) {
    updateData.is_replied = result.data.is_replied
    if (result.data.is_replied && !updateData.replied_at) {
      updateData.replied_at = new Date().toISOString()
      updateData.replied_by = user.id
    }
  }

  if (result.data.status !== undefined) {
    updateData.status = result.data.status
  }

  // 先取得當前詢問單資料
  const currentInquiry = await inquiryQueryService.getInquiryByIdForAdmin(inquiryId)
  if (!currentInquiry) {
    throw new NotFoundError('找不到庫存查詢單')
  }

  // 執行更新
  const { data: updatedInquiry, error } = await (supabase as unknown as SupabaseClient<Database>)
    .from('inquiries')
    .update(updateData)
    .eq('id', inquiryId)
    .select(
      `
      *, 
      inquiry_items (
        id,
        product_id,
        product_name,
        product_category,
        quantity,
        unit_price,
        total_price,
        notes,
        created_at
      )
    `
    )
    .single()

  if (error) {
    throw error
  }

  // 記錄審計日誌
  if (result.data.is_read !== undefined || result.data.is_replied !== undefined) {
    const previousStatus = `read:${currentInquiry.is_read},replied:${currentInquiry.is_replied}`
    const newStatus = `read:${updateData.is_read ?? currentInquiry.is_read},replied:${updateData.is_replied ?? currentInquiry.is_replied}`

    AuditLogger.logInquiryStatusChange(
      user.id,
      user.email || 'unknown@email.com',
      profile?.name,
      profile?.role,
      inquiryId,
      previousStatus,
      newStatus,
      {
        customer_name: currentInquiry.customer_name,
        customer_email: currentInquiry.customer_email,
        is_read_changed: result.data.is_read !== undefined,
        is_replied_changed: result.data.is_replied !== undefined,
      },
      request
    ).catch(error => {
      apiLogger.warn('審計日誌記錄失敗', {
        module: 'AuditLog',
        action: 'logInquiryStatusChange',
        metadata: { error: (error as Error).message },
      })
    })
  }

  return success(updatedInquiry, '詢問單更新成功')
}

// 導出處理器 - 使用組合函數：權限檢查 + 錯誤處理
export const GET = withAuthAndError(handleGET, { module: 'InquiryDetailAPI' })
export const PUT = withAuthAndError(handlePUT, { module: 'InquiryDetailAPI', enableAuditLog: true })
export const DELETE = withAuthAndError(handleDELETE, {
  module: 'InquiryDetailAPI',
  enableAuditLog: true,
})
export const PATCH = withAuthAndError(handlePATCH, {
  module: 'InquiryDetailAPI',
  enableAuditLog: true,
})
