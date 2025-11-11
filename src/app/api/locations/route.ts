import { NextRequest } from 'next/server'
import { success, created } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { LocationSchemas } from '@/lib/validation'
import { locationServiceSimple as locationServiceAdapter } from '@/services/core/content/locationServiceSimple'

/**
 * @api {GET} /api/locations 取得地點列表
 * @apiName GetLocations
 * @apiGroup Locations
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得所有地點的列表資料。
 * 此 API 為公開端點，無需認證即可訪問。
 *
 * @apiPermission public
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object[]} data 地點列表
 * @apiSuccess {String} data.id 地點 ID
 * @apiSuccess {String} data.name 地點名稱
 * @apiSuccess {String} data.address 地址
 * @apiSuccess {Object} [data.coordinates] 座標
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "550e8400-e29b-41d4-a716-446655440000",
 *       "name": "台北門市",
 *       "address": "台北市信義區信義路五段7號",
 *       "coordinates": { "lat": 25.033, "lng": 121.564 }
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
 *   "error": "查詢參數驗證失敗: limit: 必須為正整數",
 *   "code": "VALIDATION_ERROR"
 * }
 */
async function handleGET(request: NextRequest) {
  // 解析查詢參數
  const url = new URL(request.url)
  const queryParams = Object.fromEntries(url.searchParams.entries())

  const result = LocationSchemas.query.safeParse(queryParams)
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`查詢參數驗證失敗: ${errors}`)
  }

  apiLogger.info('查詢地點列表', {
    metadata: { params: result.data },
  })

  const locations = await locationServiceAdapter.getLocations()
  return success(locations, '查詢成功')
}

/**
 * @api {POST} /api/locations 建立地點
 * @apiName CreateLocation
 * @apiGroup Locations
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 建立新的地點資料。
 * 此 API 為公開端點，但建議在實際應用中加上權限控制。
 *
 * @apiPermission public
 *
 * @apiBody {String} name 地點名稱
 * @apiBody {String} address 地址
 * @apiBody {Object} [coordinates] 座標資訊
 * @apiBody {Number} coordinates.lat 緯度
 * @apiBody {Number} coordinates.lng 經度
 * @apiBody {String} [description] 地點描述
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 建立的地點資料
 * @apiSuccess {String} data.id 地點 ID
 * @apiSuccess {String} data.name 地點名稱
 * @apiSuccess {String} data.address 地址
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "data": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "name": "台北門市",
 *     "address": "台北市信義區信義路五段7號",
 *     "coordinates": { "lat": 25.033, "lng": 121.564 }
 *   },
 *   "message": "地點創建成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 資料驗證失敗
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫操作失敗
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "資料驗證失敗: name: 地點名稱為必填",
 *   "code": "VALIDATION_ERROR"
 * }
 */
async function handlePOST(request: NextRequest) {
  // 解析並驗證請求資料
  const body = await request.json()
  const result = LocationSchemas.create.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('創建地點', {
    metadata: {
      name: result.data.name,
      address: result.data.address,
      coordinates: result.data.coordinates,
    },
  })

  const newLocation = await locationServiceAdapter.addLocation(result.data)
  return created(newLocation, '地點創建成功')
}

// 導出處理器
export const GET = withErrorHandler(handleGET, {
  module: 'LocationAPI',
  enableAuditLog: false,
})

export const POST = withErrorHandler(handlePOST, {
  module: 'LocationAPI',
  enableAuditLog: true,
})
