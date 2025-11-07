import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success } from '@/lib/api-response'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { LocationSchemas } from '@/lib/validation'
import { locationServiceSimple as locationServiceAdapter } from '@/services/core/content/locationServiceSimple'

// UUID ID 驗證 Schema
const UuidIdSchema = z.object({
  id: z.string().uuid('ID 必須是有效的 UUID 格式'),
})

/**
 * @api {GET} /api/locations/:id 取得單一地點
 * @apiName GetLocationById
 * @apiGroup Locations
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 根據 ID 取得特定地點的詳細資訊。
 * 此 API 為公開端點，無需認證即可訪問。
 *
 * @apiPermission public
 *
 * @apiParam {String} id 地點 ID (UUID)
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 地點資料
 * @apiSuccess {String} data.id 地點 ID
 * @apiSuccess {String} data.name 地點名稱
 * @apiSuccess {String} data.address 地址
 * @apiSuccess {Object} [data.coordinates] 座標
 * @apiSuccess {String} [data.description] 地點描述
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "name": "台北門市",
 *     "address": "台北市信義區信義路五段7號",
 *     "coordinates": { "lat": 25.033, "lng": 121.564 },
 *     "description": "台北旗艦店"
 *   },
 *   "message": "查詢成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError ID 格式錯誤
 * @apiError (錯誤 4xx) {Object} NotFoundError 地點不存在
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 404 Not Found
 * {
 *   "success": false,
 *   "error": "地點不存在",
 *   "code": "NOT_FOUND"
 * }
 */
async function handleGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 驗證 UUID ID 格式
  const result = UuidIdSchema.safeParse({ id })
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  apiLogger.info('查詢單一地點', {
    metadata: { locationId: result.data.id },
  })

  const location = await locationServiceAdapter.getLocationById(result.data.id)
  if (!location) {
    throw new NotFoundError('地點不存在')
  }

  return success(location, '查詢成功')
}

/**
 * @api {PUT} /api/locations/:id 更新地點
 * @apiName UpdateLocation
 * @apiGroup Locations
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 更新指定地點的資訊。
 * 此 API 為公開端點，但建議在實際應用中加上權限控制。
 *
 * @apiPermission public
 *
 * @apiParam {String} id 地點 ID (UUID)
 *
 * @apiBody {String} [name] 地點名稱
 * @apiBody {String} [address] 地址
 * @apiBody {Object} [coordinates] 座標資訊
 * @apiBody {Number} coordinates.lat 緯度
 * @apiBody {Number} coordinates.lng 經度
 * @apiBody {String} [description] 地點描述
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 更新後的地點資料
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "name": "台北旗艦門市",
 *     "address": "台北市信義區信義路五段7號",
 *     "updated_at": "2025-01-07T10:30:00Z"
 *   },
 *   "message": "地點更新成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 資料驗證失敗
 * @apiError (錯誤 4xx) {Object} NotFoundError 地點不存在
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "資料驗證失敗: coordinates.lat: 緯度必須為數字",
 *   "code": "VALIDATION_ERROR"
 * }
 */
async function handlePUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 驗證 UUID ID 格式
  const paramResult = UuidIdSchema.safeParse({ id })
  if (!paramResult.success) {
    const errors = paramResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  // 解析並驗證請求資料
  const body = await request.json()
  const result = LocationSchemas.update.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('更新地點', {
    metadata: {
      locationId: paramResult.data.id,
      changes: Object.keys(result.data),
    },
  })

  const updatedLocation = await locationServiceAdapter.updateLocation(
    paramResult.data.id,
    result.data
  )

  return success(updatedLocation, '地點更新成功')
}

/**
 * @api {DELETE} /api/locations/:id 刪除地點
 * @apiName DeleteLocation
 * @apiGroup Locations
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 刪除指定的地點。
 * 此 API 為公開端點，但建議在實際應用中加上權限控制。
 *
 * @apiPermission public
 *
 * @apiParam {String} id 地點 ID (UUID)
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 刪除結果
 * @apiSuccess {String} data.id 已刪除的地點 ID
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000"
 *   },
 *   "message": "地點刪除成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError ID 格式錯誤
 * @apiError (錯誤 4xx) {Object} NotFoundError 地點不存在
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 404 Not Found
 * {
 *   "success": false,
 *   "error": "地點不存在",
 *   "code": "NOT_FOUND"
 * }
 */
async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 驗證 UUID ID 格式
  const result = UuidIdSchema.safeParse({ id })
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  apiLogger.info('刪除地點', {
    metadata: { locationId: result.data.id },
  })

  await locationServiceAdapter.deleteLocation(result.data.id)

  return success({ id: result.data.id }, '地點刪除成功')
}

// 導出處理器
export const GET = withErrorHandler(handleGET, {
  module: 'LocationAPI',
  enableAuditLog: false,
})

export const PUT = withErrorHandler(handlePUT, {
  module: 'LocationAPI',
  enableAuditLog: true,
})

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'LocationAPI',
  enableAuditLog: true,
})
