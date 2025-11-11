/**
 * @api {GET} /api/schedule/:id 取得單一擺攤行程
 * @apiName GetScheduleById
 * @apiGroup Schedule
 * @apiVersion 1.0.0
 *
 * @apiDescription 根據 ID 取得特定擺攤行程的詳細資訊。
 * @apiPermission public
 * @apiParam {String} id 行程 ID (UUID)
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 行程詳細資料
 * @apiSuccessExample {json} 成功回應:
 *   HTTP/1.1 200 OK
 *   {"success": true, "data": {"id": "uuid", "title": "板橋農夫市集"}, "message": "查詢成功"}
 * @apiError (錯誤 4xx) {Object} NotFoundError 行程不存在
 */

/**
 * @api {PUT} /api/schedule/:id 更新擺攤行程
 * @apiName UpdateSchedule
 * @apiGroup Schedule
 * @apiVersion 1.0.0
 *
 * @apiDescription 更新指定的擺攤行程資訊。
 * @apiPermission public
 * @apiParam {String} id 行程 ID (UUID)
 * @apiBody {String} [title] 市集名稱
 * @apiBody {String} [location] 地點
 * @apiBody {String} [date] 日期
 * @apiBody {String} [time] 時間
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 更新後的行程資料
 * @apiSuccessExample {json} 成功回應:
 *   HTTP/1.1 200 OK
 *   {"success": true, "data": {"id": "uuid", "title": "更新後市集"}, "message": "行程更新成功"}
 * @apiError (錯誤 4xx) {Object} NotFoundError 行程不存在
 */

/**
 * @api {DELETE} /api/schedule/:id 刪除擺攤行程
 * @apiName DeleteSchedule
 * @apiGroup Schedule
 * @apiVersion 1.0.0
 *
 * @apiDescription 刪除指定的擺攤行程。
 * @apiPermission public
 * @apiParam {String} id 行程 ID (UUID)
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 刪除結果
 * @apiSuccessExample {json} 成功回應:
 *   HTTP/1.1 200 OK
 *   {"success": true, "data": {"id": "uuid"}, "message": "行程刪除成功"}
 * @apiError (錯誤 4xx) {Object} NotFoundError 行程不存在
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { ScheduleSchemas, CommonValidations } from '@/lib/validation'
import { getScheduleService } from '@/services/factory/serviceFactory'

async function handleGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 驗證 UUID 格式
  const result = CommonValidations.uuidParam.safeParse({ id })
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  apiLogger.info('查詢單一行程', {
    metadata: { scheduleId: id },
  })

  const scheduleService = await getScheduleService()
  const scheduleItem = await scheduleService.getScheduleById(id)
  if (!scheduleItem) {
    throw new NotFoundError('行程不存在')
  }

  return success(scheduleItem, '查詢成功')
}

/**
 * PUT /api/schedule/[id] - 更新行程
 */
async function handlePUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 驗證 UUID 格式
  const paramResult = CommonValidations.uuidParam.safeParse({ id })
  if (!paramResult.success) {
    const errors = paramResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  // 解析並驗證請求資料
  const body = await request.json()
  const result = ScheduleSchemas.update.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('更新行程', {
    metadata: {
      scheduleId: id,
      changes: Object.keys(result.data),
    },
  })

  const scheduleService = await getScheduleService()
  const scheduleItem = await scheduleService.updateSchedule(id, result.data)

  return success(scheduleItem, '行程更新成功')
}

/**
 * DELETE /api/schedule/[id] - 刪除行程
 */
async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 驗證 UUID 格式
  const result = CommonValidations.uuidParam.safeParse({ id })
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  apiLogger.info('刪除行程', {
    metadata: { scheduleId: id },
  })

  const scheduleService = await getScheduleService()
  await scheduleService.deleteSchedule(id)

  return success({ id }, '行程刪除成功')
}

// 導出處理器
export const GET = withErrorHandler(handleGET, {
  module: 'ScheduleAPI',
  enableAuditLog: false,
})

export const PUT = withErrorHandler(handlePUT, {
  module: 'ScheduleAPI',
  enableAuditLog: true,
})

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'ScheduleAPI',
  enableAuditLog: true,
})
