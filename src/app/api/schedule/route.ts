/**
 * @api {GET} /api/schedule 取得擺攤行程列表
 * @apiName GetSchedules
 * @apiGroup Schedule
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得所有擺攤行程的列表資料。
 * 此 API 為公開端點，無需認證即可訪問。
 * 可用於展示農場的市集擺攤行程。
 *
 * @apiPermission public
 *
 * @apiQuery {String} [status] 行程狀態篩選（upcoming/ongoing/completed）
 * @apiQuery {String} [date] 日期篩選（ISO 8601 格式）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object[]} data 行程列表
 * @apiSuccess {String} data.id 行程 ID
 * @apiSuccess {String} data.title 市集名稱
 * @apiSuccess {String} data.location 地點
 * @apiSuccess {String} data.date 日期
 * @apiSuccess {String} data.time 時間
 * @apiSuccess {String[]} data.products 販售商品列表
 * @apiSuccess {String} data.status 行程狀態（upcoming/ongoing/completed）
 * @apiSuccess {String} [data.specialOffer] 特別優惠
 * @apiSuccess {String} [data.weatherNote] 天氣注意事項
 * @apiSuccess {String} data.contact 聯絡方式
 * @apiSuccess {String} data.description 行程描述
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "550e8400-e29b-41d4-a716-446655440000",
 *       "title": "板橋農夫市集",
 *       "location": "新北市板橋區",
 *       "date": "2025-01-15",
 *       "time": "09:00",
 *       "products": ["草莓", "芭樂"],
 *       "status": "upcoming",
 *       "specialOffer": "草莓特價一斤250元",
 *       "contact": "0912345678",
 *       "description": "週末農夫市集"
 *     }
 *   ],
 *   "message": "查詢成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 查詢參數驗證失敗
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫查詢失敗
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "查詢參數驗證失敗: date: 日期格式錯誤",
 *   "code": "VALIDATION_ERROR"
 * }
 */

/**
 * @api {POST} /api/schedule 建立擺攤行程
 * @apiName CreateSchedule
 * @apiGroup Schedule
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 建立新的擺攤行程。
 * 此 API 為公開端點，但建議在實際應用中加上管理員權限控制。
 *
 * @apiPermission public
 *
 * @apiBody {String} title 市集名稱（必填）
 * @apiBody {String} location 地點（必填）
 * @apiBody {String} date 日期（ISO 8601 格式，必填）
 * @apiBody {String} time 時間（HH:MM 格式，必填）
 * @apiBody {String[]} products 販售商品列表（必填）
 * @apiBody {String} [status=upcoming] 行程狀態
 * @apiBody {String} [specialOffer] 特別優惠
 * @apiBody {String} [weatherNote] 天氣注意事項
 * @apiBody {String} contact 聯絡方式（必填）
 * @apiBody {String} description 行程描述（必填）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 建立的行程資料
 * @apiSuccess {String} data.id 行程 ID
 * @apiSuccess {String} data.title 市集名稱
 * @apiSuccess {String} data.location 地點
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "data": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "title": "板橋農夫市集",
 *     "location": "新北市板橋區",
 *     "date": "2025-01-15",
 *     "time": "09:00",
 *     "status": "upcoming"
 *   },
 *   "message": "行程創建成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 資料驗證失敗
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫操作失敗
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "資料驗證失敗: title: 市集名稱為必填",
 *   "code": "VALIDATION_ERROR"
 * }
 */

import { NextRequest } from 'next/server'
import { success, created } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { ScheduleSchemas } from '@/lib/validation'
import { getScheduleService } from '@/services/factory/serviceFactory'

async function handleGET(request: NextRequest) {
  // 解析查詢參數
  const url = new URL(request.url)
  const queryParams = Object.fromEntries(url.searchParams.entries())

  const result = ScheduleSchemas.query.safeParse(queryParams)
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`查詢參數驗證失敗: ${errors}`)
  }

  apiLogger.info('查詢行程列表', {
    metadata: { params: result.data },
  })

  const scheduleService = await getScheduleService()
  const schedule = await scheduleService.getSchedule()
  return success(schedule, '查詢成功')
}

/**
 * POST /api/schedule - 創建行程
 */
async function handlePOST(request: NextRequest) {
  // 解析並驗證請求資料
  const body = await request.json()
  const result = ScheduleSchemas.create.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('創建行程', {
    metadata: {
      title: result.data.title,
      location: result.data.location,
      date: result.data.date,
      time: result.data.time,
    },
  })

  const scheduleService = await getScheduleService()
  const scheduleItem = await scheduleService.addSchedule(result.data)
  return created(scheduleItem, '行程創建成功')
}

// 導出處理器
export const GET = withErrorHandler(handleGET, {
  module: 'ScheduleAPI',
  enableAuditLog: false,
})

export const POST = withErrorHandler(handlePOST, {
  module: 'ScheduleAPI',
  enableAuditLog: true,
})
