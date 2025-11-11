/**
 * @api {GET} /api/site-settings 取得網站設定
 * @apiName GetSiteSettings
 * @apiGroup SiteSettings
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得網站設定（公開 API，可選認證）。
 * 支援查詢單一設定、多個設定或所有設定。
 *
 * @apiPermission optionalAuth
 *
 * @apiQuery {String} [key] 設定鍵名（查詢單一設定）
 * @apiQuery {String} [keys] 設定鍵名列表，逗號分隔（查詢多個設定）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object|Object[]} data 設定資料（單一物件或陣列）
 * @apiSuccess {String} data.key 設定鍵名
 * @apiSuccess {*} data.value 設定值
 * @apiSuccess {String} data.type 設定類型
 * @apiSuccess {String} [data.description] 設定說明
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應（單一設定）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "key": "site_name",
 *     "value": "我的網站",
 *     "type": "string",
 *     "description": "網站名稱"
 *   },
 *   "message": "設定取得成功"
 * }
 *
 * @apiSuccessExample {json} 成功回應（多個設定）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": [
 *     { "key": "site_name", "value": "我的網站", "type": "string" },
 *     { "key": "site_description", "value": "描述", "type": "string" }
 *   ],
 *   "message": "批次設定取得成功"
 * }
 *
 * @apiSuccessExample {json} 成功回應（所有設定）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": [
 *     { "key": "site_name", "value": "我的網站", "type": "string" },
 *     { "key": "contact_email", "value": "email@example.com", "type": "string" }
 *   ],
 *   "message": "所有設定取得成功"
 * }
 *
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫查詢失敗
 */

/**
 * @api {POST} /api/site-settings 建立網站設定
 * @apiName CreateSiteSetting
 * @apiGroup SiteSettings
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 建立新網站設定（需要管理員權限）。
 * 會記錄審計日誌。
 *
 * @apiPermission admin
 *
 * @apiBody {String} key 設定鍵名（必填）
 * @apiBody {*} value 設定值（必填）
 * @apiBody {String} type 設定類型（必填，如：string, number, boolean, json）
 * @apiBody {String} [description] 設定說明
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 建立的設定資料
 * @apiSuccess {String} data.key 設定鍵名
 * @apiSuccess {*} data.value 設定值
 * @apiSuccess {String} data.type 設定類型
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "data": {
 *     "key": "site_name",
 *     "value": "我的網站",
 *     "type": "string"
 *   },
 *   "message": "設定建立成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 資料驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 權限不足
 *
 * @apiErrorExample {json} 驗證錯誤:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "設定鍵 (key) 為必填欄位",
 *   "code": "VALIDATION_ERROR"
 * }
 */

/**
 * @api {PUT} /api/site-settings 更新網站設定
 * @apiName UpdateSiteSetting
 * @apiGroup SiteSettings
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 更新指定的網站設定（需要管理員權限）。
 * 需透過查詢參數指定要更新的設定鍵名。
 * 會記錄審計日誌。
 *
 * @apiPermission admin
 *
 * @apiQuery {String} key 要更新的設定鍵名（必填）
 *
 * @apiBody {*} value 新的設定值（必填）
 * @apiBody {String} [description] 新的設定說明
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 更新後的設定資料
 * @apiSuccess {String} data.key 設定鍵名
 * @apiSuccess {*} data.value 設定值
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "key": "site_name",
 *     "value": "更新後的網站名稱"
 *   },
 *   "message": "設定更新成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 資料驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 權限不足
 * @apiError (錯誤 4xx) {Object} NotFoundError 設定不存在
 *
 * @apiErrorExample {json} 缺少 key 參數:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "請提供設定鍵 (key)",
 *   "code": "VALIDATION_ERROR"
 * }
 */

/**
 * @api {DELETE} /api/site-settings 刪除網站設定
 * @apiName DeleteSiteSetting
 * @apiGroup SiteSettings
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 刪除指定的網站設定（需要管理員權限）。
 * 需透過查詢參數指定要刪除的設定鍵名。
 * 會記錄審計日誌。
 *
 * @apiPermission admin
 *
 * @apiQuery {String} key 要刪除的設定鍵名（必填）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 刪除結果
 * @apiSuccess {String} data.key 被刪除的設定鍵名
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "key": "site_name"
 *   },
 *   "message": "設定刪除成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 參數驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 權限不足
 * @apiError (錯誤 4xx) {Object} NotFoundError 設定不存在
 *
 * @apiErrorExample {json} 缺少 key 參數:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "請提供設定鍵 (key)",
 *   "code": "VALIDATION_ERROR"
 * }
 */

import { NextRequest } from 'next/server'
import { success, created } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { withAdminAndError, withOptionalAuthAndError, User } from '@/lib/middleware/api-middleware'
import { siteSettingsService } from '@/services/core/content/siteSettingsService'
import type { SiteSettingInput, SiteSettingUpdate } from '@/types/siteSettings'

/**
 * GET /api/site-settings
 * 取得所有設定或指定 key 的設定
 */
async function handleGET(req: NextRequest, _user: User | null) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  const keys = searchParams.get('keys')

  if (key) {
    const setting = await siteSettingsService.getByKey(key)
    return success(setting, '設定取得成功')
  }

  if (keys) {
    const keyArray = keys.split(',').map(k => k.trim())
    const settingsMap = await siteSettingsService.getByKeys(keyArray)
    // 將 Record 轉換為陣列，因為前端期望的是 SiteSetting[]
    const settings = Object.values(settingsMap)
    return success(settings, '批次設定取得成功')
  }

  const settings = await siteSettingsService.getAll()
  return success(settings, '所有設定取得成功')
}

export const GET = withOptionalAuthAndError(handleGET, { module: 'SiteSettingsAPI' })

/**
 * POST /api/site-settings
 * 建立新設定（管理員權限）
 */
async function handlePOST(req: NextRequest, _user: User) {
  const body = await req.json()

  if (!body.key?.trim()) {
    throw new ValidationError('設定鍵 (key) 為必填欄位')
  }

  if (!body.value) {
    throw new ValidationError('設定值 (value) 為必填欄位')
  }

  if (!body.type) {
    throw new ValidationError('設定類型 (type) 為必填欄位')
  }

  const input: SiteSettingInput = {
    key: body.key,
    value: body.value,
    type: body.type,
    description: body.description,
  }

  const setting = await siteSettingsService.create(input)
  return created(setting, '設定建立成功')
}

export const POST = withAdminAndError(handlePOST, {
  module: 'SiteSettingsAPI',
  enableAuditLog: true,
})

/**
 * PUT /api/site-settings
 * 更新設定（管理員權限）
 */
async function handlePUT(req: NextRequest, _user: User) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')

  if (!key) {
    throw new ValidationError('請提供設定鍵 (key)')
  }

  const body = await req.json()

  if (!body.value) {
    throw new ValidationError('設定值 (value) 為必填欄位')
  }

  const input: SiteSettingUpdate = {
    value: body.value,
    description: body.description,
  }

  const setting = await siteSettingsService.update(key, input)
  return success(setting, '設定更新成功')
}

export const PUT = withAdminAndError(handlePUT, { module: 'SiteSettingsAPI', enableAuditLog: true })

/**
 * DELETE /api/site-settings
 * 刪除設定（管理員權限）
 */
async function handleDELETE(req: NextRequest, _user: User) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')

  if (!key) {
    throw new ValidationError('請提供設定鍵 (key)')
  }

  await siteSettingsService.delete(key)
  return success({ deleted: true }, '設定刪除成功')
}

export const DELETE = withAdminAndError(handleDELETE, {
  module: 'SiteSettingsAPI',
  enableAuditLog: true,
})

/**
 * PATCH /api/site-settings
 * Upsert 設定（存在則更新，不存在則創建）（管理員權限）
 */
async function handlePATCH(req: NextRequest, _user: User) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')

  if (!key) {
    throw new ValidationError('請提供設定鍵 (key)')
  }

  const body = await req.json()

  if (!body.value) {
    throw new ValidationError('設定值 (value) 為必填欄位')
  }

  const input = {
    value: body.value,
    description: body.description,
    type: body.type,
  }

  const setting = await siteSettingsService.upsert(key, input)
  return success(setting, '設定已儲存')
}

export const PATCH = withAdminAndError(handlePATCH, {
  module: 'SiteSettingsAPI',
  enableAuditLog: true,
})
