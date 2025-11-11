/**
 * @api {GET} /api/inquiries 取得詢價單列表
 * @apiName GetInquiries
 * @apiGroup Inquiries
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得詢價單列表（需要使用者認證）。
 * 一般使用者僅能查看自己的詢價單。
 * 管理員可使用 admin=true 查詢參數查看所有詢價單。
 *
 * @apiPermission user
 *
 * @apiQuery {Boolean} [admin=false] 管理員模式（僅管理員可用）
 * @apiQuery {Number} [page] 頁碼
 * @apiQuery {Number} [limit] 每頁筆數
 * @apiQuery {String} [status] 篩選狀態
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object[]|Object} data 詢價單列表或分頁資料
 * @apiSuccess {String} data.id 詢價單 ID
 * @apiSuccess {String} data.userId 使用者 ID
 * @apiSuccess {String} data.inquiryType 詢價類型
 * @apiSuccess {String} data.status 詢價狀態
 * @apiSuccess {Object[]} data.items 詢價項目列表
 * @apiSuccess {String} data.createdAt 建立時間
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "userId": "uuid",
 *       "inquiryType": "product",
 *       "status": "pending",
 *       "items": [],
 *       "createdAt": "2025-01-07T00:00:00Z"
 *     }
 *   ],
 *   "message": "庫存查詢單清單取得成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 查詢參數驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 未登入或權限不足
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫查詢失敗
 *
 * @apiErrorExample {json} 驗證錯誤:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "查詢參數驗證失敗: status: 狀態值不正確",
 *   "code": "VALIDATION_ERROR"
 * }
 */

/**
 * @api {POST} /api/inquiries 建立詢價單
 * @apiName CreateInquiry
 * @apiGroup Inquiries
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 建立新詢價單（需要使用者認證）。
 * 成功建立後會記錄業務指標和審計日誌。
 *
 * @apiPermission user
 *
 * @apiBody {String} inquiry_type 詢價類型
 * @apiBody {Object[]} [items] 詢價項目列表
 * @apiBody {String} items.productId 產品 ID
 * @apiBody {Number} items.quantity 數量
 * @apiBody {String} [contactName] 聯絡人姓名
 * @apiBody {String} [contactPhone] 聯絡電話
 * @apiBody {String} [contactEmail] 聯絡 Email
 * @apiBody {String} [message] 詢價訊息
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 建立的詢價單資料
 * @apiSuccess {String} data.id 詢價單 ID
 * @apiSuccess {String} data.inquiryType 詢價類型
 * @apiSuccess {String} data.status 詢價狀態
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "inquiryType": "product",
 *     "status": "pending"
 *   },
 *   "message": "詢價單建立成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 資料驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 未登入或權限不足
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫操作失敗
 *
 * @apiErrorExample {json} 驗證錯誤:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "資料驗證失敗: inquiry_type: 詢價類型為必填",
 *   "code": "VALIDATION_ERROR"
 * }
 */

import { NextRequest } from 'next/server'
import { success, created } from '@/lib/api-response'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'
import { InquirySchemas } from '@/lib/validation'
import { inquiryService as inquiryServiceAdapter } from '@/services/core/inquiry/inquiryService'
import { AuditLogger } from '@/services/infrastructure/auditLogService'

// 使用統一的詢問服務適配器
const inquiryService = inquiryServiceAdapter

// GET /api/inquiries - 取得庫存查詢單清單
async function handleGET(request: NextRequest, user: User) {
  // 解析並驗證查詢參數
  const url = new URL(request.url)
  const searchParams = Object.fromEntries(url.searchParams.entries())
  const result = InquirySchemas.query.safeParse(searchParams)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`查詢參數驗證失敗: ${errors}`)
  }

  // 檢查是否為管理員
  const supabase = await createServerSupabaseClient()
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()) as { data: { role: string; name: string } | null; error: Error | null }

  const isAdmin = profile?.role === 'admin'
  const adminMode = result.data.admin === true

  apiLogger.info('查詢庫存查詢單清單', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
      isAdmin,
      adminMode,
      queryParams: result.data,
    },
  })

  // 取得庫存查詢單清單
  let inquiries
  if (isAdmin && adminMode) {
    inquiries = await inquiryService.getAllInquiries(result.data)
  } else {
    inquiries = await inquiryService.getUserInquiries(user.id, result.data)
  }

  return success(inquiries, '庫存查詢單清單取得成功')
}

// POST /api/inquiries - 建立新庫存查詢單
async function handlePOST(request: NextRequest, user: User) {
  // 取得使用者資訊用於審計日誌
  const supabase = await createServerSupabaseClient()
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()) as { data: { role: string; name: string } | null; error: Error | null }

  // 解析並驗證請求資料
  const body = await request.json()
  const result = InquirySchemas.create.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('創建庫存查詢單', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
      inquiryType: result.data.inquiry_type,
      itemsCount: result.data.items?.length || 0,
    },
  })

  // 建立庫存查詢單
  const inquiry = await inquiryService.createInquiry(user.id, result.data)

  // 記錄詢問提交指標
  const { recordInquirySubmit } = await import('@/lib/metrics')
  recordInquirySubmit(result.data.inquiry_type || '一般詢問', user.id)

  // 記錄詢問單建立的審計日誌
  AuditLogger.logInquiryCreate(
    user.id,
    user.email || 'unknown@email.com',
    profile?.name,
    profile?.role,
    inquiry.id,
    {
      customer_name: inquiry.customer_name,
      customer_email: inquiry.customer_email,
      total_estimated_amount: inquiry.total_estimated_amount,
      items_count: inquiry.inquiry_items?.length || 0,
    },
    request
  ).catch(error => {
    // 非同步記錄失敗，不影響主要流程
    apiLogger.warn('審計日誌記錄失敗', {
      module: 'AuditLog',
      action: 'logInquiryCreate',
      metadata: { error: (error as Error).message },
    })
  })

  return created(inquiry, '詢問單建立成功')
}

// 導出 API 處理器 - 使用組合函數：權限檢查 + 錯誤處理
export const GET = withAuthAndError(handleGET, { module: 'InquiryAPI' })
export const POST = withAuthAndError(handlePOST, { module: 'InquiryAPI', enableAuditLog: true })
