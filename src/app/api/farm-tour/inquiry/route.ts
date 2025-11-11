/**
 * @api {POST} /api/farm-tour/inquiry 建立農場體驗預約詢問
 * @apiName CreateFarmTourInquiry
 * @apiGroup FarmTour
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 建立新的農場體驗活動預約詢問單。
 * 需要使用者登入，並實施速率限制（15 分鐘內最多 5 次請求）。
 * 成功建立後會自動記錄審計日誌。
 *
 * @apiPermission user
 *
 * @apiBody {String} customer_name 客戶姓名（必填）
 * @apiBody {String} customer_email 客戶電子郵件（必填）
 * @apiBody {String} [customer_phone] 客戶電話
 * @apiBody {String} activity_title 活動標題（必填）
 * @apiBody {String} visit_date 參觀日期（ISO 8601 格式，必填）
 * @apiBody {String} visitor_count 參觀人數（必填）
 * @apiBody {String} [notes] 備註說明
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 建立的詢問單資料
 * @apiSuccess {String} data.id 詢問單 ID
 * @apiSuccess {String} data.customer_name 客戶姓名
 * @apiSuccess {String} data.customer_email 客戶電子郵件
 * @apiSuccess {String} data.inquiry_type 詢問類型（固定為 farm_tour）
 * @apiSuccess {String} data.activity_title 活動標題
 * @apiSuccess {String} data.visit_date 參觀日期
 * @apiSuccess {String} data.visitor_count 參觀人數
 * @apiSuccess {String} data.status 詢問狀態（初始為 pending）
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "data": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "customer_name": "王小明",
 *     "customer_email": "wang@example.com",
 *     "customer_phone": "0912345678",
 *     "inquiry_type": "farm_tour",
 *     "activity_title": "草莓採摘體驗",
 *     "visit_date": "2025-01-15T10:00:00Z",
 *     "visitor_count": "10",
 *     "notes": "希望安排上午場次",
 *     "status": "pending",
 *     "created_at": "2025-01-07T00:00:00Z"
 *   },
 *   "message": "農場參觀預約詢問已成功提交，我們將盡快與您聯繫"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 請求資料格式錯誤或驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 未登入或會話過期
 * @apiError (錯誤 4xx) {Object} RateLimitError 超過速率限制（15 分鐘內最多 5 次）
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫操作失敗
 *
 * @apiErrorExample {json} 錯誤回應（驗證失敗）:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "資料驗證失敗: customer_name: 客戶姓名為必填",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 錯誤回應（速率限制）:
 * HTTP/1.1 429 Too Many Requests
 * {
 *   "success": false,
 *   "error": "農場參觀預約提交過於頻繁，請等待 15 分鐘後重試",
 *   "code": "RATE_LIMIT_EXCEEDED"
 * }
 */

import { NextRequest } from 'next/server'
import { created } from '@/lib/api-response'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'
import { ValidationError, MethodNotAllowedError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'
import { withRateLimit, IdentifierStrategy } from '@/lib/rate-limiter'
import { inquiryService } from '@/services/core/inquiry/inquiryService'
import { AuditLogger } from '@/services/infrastructure/auditLogService'
import { CreateInquiryRequest, InquiryUtils } from '@/types/inquiry'

// 農場參觀預約詢問的資料介面
interface FarmTourInquiryRequest {
  customer_name: string
  customer_email: string
  customer_phone?: string
  activity_title: string
  visit_date: string
  visitor_count: string
  notes?: string
}

// POST /api/farm-tour/inquiry - 建立農場參觀預約詢問
async function handlePOST(request: NextRequest, user: User) {
  // 取得使用者資訊
  const supabase = await createServerSupabaseClient()
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()) as { data: { role: string; name: string } | null; error: Error | null }

  // 解析請求資料
  let farmTourData: FarmTourInquiryRequest
  try {
    farmTourData = await request.json()
  } catch {
    throw new ValidationError('請求資料格式錯誤')
  }

  // 轉換為詢問單格式
  const inquiryData: CreateInquiryRequest = {
    customer_name: farmTourData.customer_name,
    customer_email: farmTourData.customer_email,
    customer_phone: farmTourData.customer_phone,
    inquiry_type: 'farm_tour',
    activity_title: farmTourData.activity_title,
    visit_date: farmTourData.visit_date,
    visitor_count: farmTourData.visitor_count,
    notes: farmTourData.notes,
    // 農場參觀詢問不需要商品項目
    items: [],
  }

  // 驗證請求資料
  const validation = InquiryUtils.validateInquiryRequest(inquiryData)
  if (!validation.isValid) {
    throw new ValidationError(`資料驗證失敗: ${validation.errors.join(', ')}`)
  }

  // 建立詢問單
  const inquiry = await inquiryService.createInquiry(user.id, inquiryData)

  // 記錄農場參觀預約詢問建立的審計日誌
  AuditLogger.logInquiryCreate(
    user.id,
    user.email || 'unknown@email.com',
    profile?.name,
    profile?.role,
    inquiry.id,
    {
      customer_name: inquiry.customer_name,
      customer_email: inquiry.customer_email,
      inquiry_type: 'farm_tour',
      activity_title: inquiry.activity_title,
      visit_date: inquiry.visit_date,
      visitor_count: inquiry.visitor_count,
    },
    request
  ).catch(error => {
    // Note: Audit logging errors are handled silently to not break the main flow
    apiLogger.error('農場參觀詢問審計日誌記錄失敗', error as Error, {
      module: 'FarmTourInquiryAPI',
      metadata: { inquiryId: inquiry.id },
    })
  })

  return created(
    inquiry as unknown as Record<string, unknown>,
    '農場參觀預約詢問已成功提交，我們將盡快與您聯繫'
  )
}

// 套用認證中間件與 Rate Limiting 並導出 API 處理器
const authenticatedPOST = withAuthAndError(handlePOST, {
  module: 'FarmTourInquiryAPI',
  enableAuditLog: true,
})

export const POST = withRateLimit(authenticatedPOST, {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 分鐘
  strategy: IdentifierStrategy.COMBINED,
  enableAuditLog: true,
  includeHeaders: true,
  message: '農場參觀預約提交過於頻繁，請等待 15 分鐘後重試',
})

// 處理其他不支援的 HTTP 方法
async function handleUnsupportedMethods(): Promise<never> {
  throw new MethodNotAllowedError('不支援的請求方法')
}

export const GET = withAuthAndError(handleUnsupportedMethods, { module: 'FarmTourInquiryAPI' })
export const PUT = withAuthAndError(handleUnsupportedMethods, { module: 'FarmTourInquiryAPI' })
export const DELETE = withAuthAndError(handleUnsupportedMethods, { module: 'FarmTourInquiryAPI' })
export const PATCH = withAuthAndError(handleUnsupportedMethods, { module: 'FarmTourInquiryAPI' })
