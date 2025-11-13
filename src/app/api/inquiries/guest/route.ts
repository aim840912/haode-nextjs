/**
 * @api {POST} /api/inquiries/guest 建立訪客詢價單
 * @apiName CreateGuestInquiry
 * @apiGroup Inquiries
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 建立訪客詢價單（無需登入）。
 * 訪客詢價會使用特殊的系統 user_id，並在 notes 中標記。
 * 成功後可選擇發送 Email 確認信。
 *
 * @apiPermission public
 *
 * @apiBody {String} customer_name 客戶姓名
 * @apiBody {String} customer_email 客戶 Email
 * @apiBody {String} [customer_phone] 聯絡電話
 * @apiBody {String} inquiry_type 詢價類型（目前僅支援 "product"）
 * @apiBody {Object[]} items 詢價項目列表
 * @apiBody {String} items.product_id 產品 ID
 * @apiBody {String} items.product_name 產品名稱
 * @apiBody {Number} items.quantity 數量
 * @apiBody {Number} [items.unit_price] 單價
 * @apiBody {String} [notes] 備註
 * @apiBody {String} [delivery_address] 配送地址
 * @apiBody {String} [preferred_delivery_date] 希望配送日期
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 建立的詢價單資料
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "status": "pending"
 *   },
 *   "message": "詢價已送出，我們會儘快回覆您"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 資料驗證失敗
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫操作失敗
 */

import { NextRequest } from 'next/server'
import { created } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { InquirySchemas } from '@/lib/validation'
import { inquiryCommandService } from '@/services/core/inquiry/InquiryCommandService'

// 訪客詢價使用的系統 user_id（全零 UUID）
const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000'

// POST /api/inquiries/guest - 建立訪客詢價單
async function handlePOST(request: NextRequest) {
  // 解析並驗證請求資料
  const body = await request.json()
  const result = InquirySchemas.guest.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  const guestData = result.data

  apiLogger.info('建立訪客詢價單', {
    metadata: {
      customerEmail: guestData.customer_email,
      customerName: guestData.customer_name,
      inquiryType: guestData.inquiry_type,
      itemsCount: guestData.items.length,
    },
  })

  // 在 notes 中標記這是訪客詢價
  const guestNotes = [
    '【訪客詢價】',
    guestData.notes || '',
    `\n提交時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`,
    `聯絡 Email: ${guestData.customer_email}`,
    guestData.customer_phone ? `聯絡電話: ${guestData.customer_phone}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  // 建立詢價單資料（轉換為完整格式）
  const inquiryData = {
    customer_name: guestData.customer_name,
    customer_email: guestData.customer_email,
    customer_phone: guestData.customer_phone,
    inquiry_type: guestData.inquiry_type,
    notes: guestNotes,
    delivery_address: guestData.delivery_address,
    preferred_delivery_date: guestData.preferred_delivery_date,
    items: guestData.items,
  }

  // 使用特殊的訪客 user_id 建立詢價單
  const inquiry = await inquiryCommandService.createInquiry(GUEST_USER_ID, inquiryData)

  apiLogger.info('訪客詢價單建立成功', {
    metadata: {
      inquiryId: inquiry.id,
      customerEmail: guestData.customer_email,
    },
  })

  // TODO: 後續可加入 Email 確認機制
  // await sendGuestInquiryConfirmation(guestData.customer_email, inquiry.id)

  return created(
    {
      id: inquiry.id,
      status: inquiry.status,
      customer_name: inquiry.customer_name,
    },
    '詢價已送出，我們會儘快回覆您'
  )
}

// 導出 API 處理器 - 使用錯誤處理中間件（無需認證）
export const POST = withErrorHandler(handlePOST, {
  module: 'GuestInquiryAPI',
  enableAuditLog: false, // 訪客詢價不記錄審計日誌
})
