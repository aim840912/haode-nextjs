/**
 * @api {GET} /api/farm-tour 取得農場體驗活動列表
 * @apiName GetFarmTourActivities
 * @apiGroup FarmTour
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得所有農場體驗活動的列表資料。
 * 此 API 為公開端點，無需認證即可訪問。
 * 可用於展示農場提供的各種體驗活動。
 *
 * @apiPermission public
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object[]} data 農場體驗活動列表
 * @apiSuccess {String} data.id 活動 ID
 * @apiSuccess {String} data.title 活動標題
 * @apiSuccess {String} data.description 活動描述
 * @apiSuccess {Number} data.price 活動價格
 * @apiSuccess {Number} data.start_month 活動開始月份（1-12）
 * @apiSuccess {Number} data.end_month 活動結束月份（1-12）
 * @apiSuccess {Boolean} data.available 是否開放預約
 * @apiSuccess {String} data.created_at 建立時間
 * @apiSuccess {String} data.updated_at 更新時間
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "550e8400-e29b-41d4-a716-446655440000",
 *       "title": "草莓採摘體驗",
 *       "description": "親手採摘新鮮草莓，享受田園樂趣",
 *       "price": 300,
 *       "start_month": 12,
 *       "end_month": 4,
 *       "available": true,
 *       "created_at": "2025-01-07T00:00:00Z",
 *       "updated_at": "2025-01-07T00:00:00Z"
 *     }
 *   ],
 *   "message": "農場體驗活動清單取得成功"
 * }
 *
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫查詢失敗
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "success": false,
 *   "error": "資料庫查詢失敗",
 *   "code": "DATABASE_ERROR"
 * }
 */

/**
 * @api {POST} /api/farm-tour 建立農場體驗活動
 * @apiName CreateFarmTourActivity
 * @apiGroup FarmTour
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 建立新的農場體驗活動。
 * 此 API 為公開端點，但建議在實際應用中加上管理員權限控制。
 *
 * @apiPermission public
 *
 * @apiBody {String} title 活動標題（必填）
 * @apiBody {String} description 活動描述
 * @apiBody {Number} price 活動價格（必填）
 * @apiBody {Number} start_month 活動開始月份（1-12，必填）
 * @apiBody {Number} end_month 活動結束月份（1-12，必填）
 * @apiBody {Boolean} [available=true] 是否開放預約
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 建立的活動資料
 * @apiSuccess {String} data.id 活動 ID
 * @apiSuccess {String} data.title 活動標題
 * @apiSuccess {Number} data.price 活動價格
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "data": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "title": "草莓採摘體驗",
 *     "description": "親手採摘新鮮草莓",
 *     "price": 300,
 *     "start_month": 12,
 *     "end_month": 4,
 *     "available": true
 *   },
 *   "message": "農場體驗活動建立成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 資料驗證失敗
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫操作失敗
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "資料驗證失敗: title: 活動標題為必填",
 *   "code": "VALIDATION_ERROR"
 * }
 */

import { NextRequest } from 'next/server'
import { success, created } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { FarmTourActivitySchemas } from '@/lib/validation'
import { farmTourService } from '@/services/factory/serviceFactory'

async function handleGET() {
  const activities = await farmTourService.getAll()

  apiLogger.info('農場體驗活動清單查詢成功', {
    metadata: { count: activities.length },
  })

  return success(activities, '農場體驗活動清單取得成功')
}

// POST - 新增農場體驗活動
async function handlePOST(request: NextRequest) {
  // 解析並驗證請求資料
  const body = await request.json()
  const result = FarmTourActivitySchemas.create.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('建立農場體驗活動', {
    metadata: {
      title: result.data.title,
      start_month: result.data.start_month,
      end_month: result.data.end_month,
      price: result.data.price,
      available: result.data.available,
    },
  })

  const newActivity = await farmTourService.create(result.data as any)

  return created(newActivity, '農場體驗活動建立成功')
}

// 導出處理器 - 套用錯誤處理中間件
export const GET = withErrorHandler(handleGET, {
  module: 'FarmTourAPI',
  enableAuditLog: false,
})

export const POST = withErrorHandler(handlePOST, {
  module: 'FarmTourAPI',
  enableAuditLog: true,
})
