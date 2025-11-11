/**
 * @api {GET} /api/farm-tour/:id 取得單一農場體驗活動
 * @apiName GetFarmTourActivityById
 * @apiGroup FarmTour
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 根據 ID 取得特定農場體驗活動的詳細資訊。
 * 此 API 為公開端點，無需認證即可訪問。
 *
 * @apiPermission public
 *
 * @apiParam {String} id 活動 ID (UUID)
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 活動詳細資料
 * @apiSuccess {String} data.id 活動 ID
 * @apiSuccess {String} data.title 活動標題
 * @apiSuccess {String} data.description 活動描述
 * @apiSuccess {Number} data.price 活動價格
 * @apiSuccess {Number} data.start_month 活動開始月份
 * @apiSuccess {Number} data.end_month 活動結束月份
 * @apiSuccess {Boolean} data.available 是否開放預約
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "title": "草莓採摘體驗",
 *     "description": "親手採摘新鮮草莓，享受田園樂趣",
 *     "price": 300,
 *     "start_month": 12,
 *     "end_month": 4,
 *     "available": true
 *   },
 *   "message": "成功取得農場參觀活動"
 * }
 *
 * @apiError (錯誤 4xx) {Object} NotFoundError 活動不存在
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 404 Not Found
 * {
 *   "success": false,
 *   "error": "Activity not found",
 *   "code": "NOT_FOUND"
 * }
 */

/**
 * @api {PUT} /api/farm-tour/:id 更新農場體驗活動
 * @apiName UpdateFarmTourActivity
 * @apiGroup FarmTour
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 更新指定的農場體驗活動資訊。
 * 此 API 為公開端點，但建議在實際應用中加上管理員權限控制。
 *
 * @apiPermission public
 *
 * @apiParam {String} id 活動 ID (UUID)
 *
 * @apiBody {String} [title] 活動標題
 * @apiBody {String} [description] 活動描述
 * @apiBody {Number} [price] 活動價格
 * @apiBody {Number} [start_month] 活動開始月份（1-12）
 * @apiBody {Number} [end_month] 活動結束月份（1-12）
 * @apiBody {Boolean} [available] 是否開放預約
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 更新後的活動資料
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "title": "草莓採摘體驗（升級版）",
 *     "price": 350,
 *     "available": true,
 *     "updated_at": "2025-01-07T10:30:00Z"
 *   },
 *   "message": "農場參觀活動已成功更新"
 * }
 *
 * @apiError (錯誤 4xx) {Object} NotFoundError 活動不存在
 * @apiError (錯誤 4xx) {Object} ValidationError 資料驗證失敗
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 404 Not Found
 * {
 *   "success": false,
 *   "error": "Activity not found",
 *   "code": "NOT_FOUND"
 * }
 */

/**
 * @api {DELETE} /api/farm-tour/:id 刪除農場體驗活動
 * @apiName DeleteFarmTourActivity
 * @apiGroup FarmTour
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 刪除指定的農場體驗活動。
 * 此 API 為公開端點，但建議在實際應用中加上管理員權限控制。
 *
 * @apiPermission public
 *
 * @apiParam {String} id 活動 ID (UUID)
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 刪除結果
 * @apiSuccess {Boolean} data.deleted 是否已刪除（固定為 true）
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "deleted": true
 *   },
 *   "message": "農場參觀活動已成功刪除"
 * }
 *
 * @apiError (錯誤 4xx) {Object} NotFoundError 活動不存在
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 404 Not Found
 * {
 *   "success": false,
 *   "error": "Activity not found",
 *   "code": "NOT_FOUND"
 * }
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { NotFoundError } from '@/lib/errors'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { getFarmTourService } from '@/services/factory/serviceFactory'

async function handleGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const farmTourService = await getFarmTourService()
  const activity = await farmTourService.getById(id)

  if (!activity) {
    throw new NotFoundError('Activity not found')
  }

  return success(activity, '成功取得農場參觀活動')
}

export const GET = withErrorHandler(handleGET, {
  module: 'FarmTourDetail',
  enableAuditLog: false,
})

// PUT - 更新活動
async function handlePUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const farmTourService = await getFarmTourService()
  const updatedActivity = await farmTourService.update(id, body)

  if (!updatedActivity) {
    throw new NotFoundError('Activity not found')
  }

  return success(updatedActivity, '農場參觀活動已成功更新')
}

export const PUT = withErrorHandler(handlePUT, {
  module: 'FarmTourDetail',
  enableAuditLog: true,
})

// DELETE - 刪除活動
async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const farmTourService = await getFarmTourService()
  const result = await farmTourService.delete(id)

  if (!result) {
    throw new NotFoundError('Activity not found')
  }

  return success({ deleted: true }, '農場參觀活動已成功刪除')
}

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'FarmTourDetail',
  enableAuditLog: true,
})
