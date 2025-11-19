/**
 * @api {POST} /api/upload/unified 上傳圖片
 * @apiName UploadImage
 * @apiGroup Upload
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 統一圖片上傳 API(需要使用者認證)。
 * 支援多種模組的圖片上傳:產品、地點、網站設定等。
 * 可選擇上傳單一尺寸或多個尺寸的圖片。
 * 產品和網站設定模組需要管理員權限。
 *
 * @apiPermission user (產品和網站設定需要 admin)
 *
 * @apiBody {File} file 圖片檔案(必填)
 * @apiBody {String} module 模組名稱(必填,如:products, locations, site-settings)
 * @apiBody {String} entityId 實體 ID(必填)
 * @apiBody {String} [size=medium] 圖片尺寸(small, medium, large)
 * @apiBody {Number} [display_position=0] 顯示順序
 * @apiBody {Boolean} [generateMultipleSizes=false] 是否生成多個尺寸
 * @apiBody {String} [alt_text] 圖片替代文字
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object|Object[]} data 上傳結果(單一圖片或多個尺寸)
 * @apiSuccess {String} data.id 圖片 ID
 * @apiSuccess {String} data.storage_url 圖片 URL
 * @apiSuccess {String} data.module 模組名稱
 * @apiSuccess {String} data.size 圖片尺寸
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應(單一尺寸):
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "storage_url": "https://storage.example.com/image.jpg",
 *     "module": "products",
 *     "size": "medium",
 *     "display_position": 0
 *   },
 *   "message": "圖片上傳成功"
 * }
 *
 * @apiSuccessExample {json} 成功回應(多個尺寸):
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "data": [
 *     { "id": "uuid-1", "storage_url": "image-small.jpg", "size": "small" },
 *     { "id": "uuid-2", "storage_url": "image-medium.jpg", "size": "medium" },
 *     { "id": "uuid-3", "storage_url": "image-large.jpg", "size": "large" }
 *   ],
 *   "message": "圖片上傳成功(3 個尺寸)"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 上傳參數驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 權限不足(產品/網站設定需管理員)
 * @apiError (錯誤 5xx) {Object} UploadError 圖片上傳失敗
 *
 * @apiErrorExample {json} 缺少檔案:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "請選擇要上傳的圖片檔案",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 權限不足:
 * HTTP/1.1 403 Forbidden
 * {
 *   "success": false,
 *   "error": "產品圖片上傳需要管理員權限",
 *   "code": "FORBIDDEN"
 * }
 */

/**
 * @api {GET} /api/upload/unified 查詢圖片列表
 * @apiName GetImages
 * @apiGroup Upload
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 查詢指定模組和實體的所有圖片(需要使用者認證)。
 *
 * @apiPermission user
 *
 * @apiQuery {String} module 模組名稱(必填)
 * @apiQuery {String} entityId 實體 ID(必填)
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object[]} data 圖片列表
 * @apiSuccess {String} data.id 圖片 ID
 * @apiSuccess {String} data.storage_url 圖片 URL
 * @apiSuccess {Number} data.display_position 顯示順序
 * @apiSuccess {String} data.alt_text 替代文字
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "storage_url": "https://storage.example.com/image.jpg",
 *       "display_position": 0,
 *       "alt_text": "產品圖片"
 *     }
 *   ],
 *   "message": "圖片列表取得成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 查詢參數驗證失敗
 */

/**
 * @api {PUT} /api/upload/unified 更新圖片資訊或重新排序
 * @apiName UpdateImages
 * @apiGroup Upload
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 更新圖片資訊或重新排序圖片(需要使用者認證)。
 * 支援兩種操作:reorder(重新排序)、update(更新單一圖片資訊)。
 *
 * @apiPermission user
 *
 * @apiBody {String} action 操作類型(reorder 或 update)
 * @apiBody {String} module 模組名稱(必填)
 * @apiBody {String} entityId 實體 ID(必填)
 * @apiBody {Object[]} [images] 圖片列表(reorder 操作時必填)
 * @apiBody {String} images.id 圖片 ID
 * @apiBody {Number} images.display_position 新的顯示順序
 * @apiBody {String} [imageId] 圖片 ID(update 操作時必填)
 * @apiBody {Object} [data] 更新資料(update 操作時必填)
 * @apiBody {String} [data.alt_text] 新的替代文字
 * @apiBody {Object} [data.metadata] 新的元資料
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 更新結果
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應(重新排序):
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": { "updated": 3 },
 *   "message": "圖片順序更新成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 參數驗證失敗
 */

/**
 * @api {DELETE} /api/upload/unified 刪除圖片
 * @apiName DeleteImage
 * @apiGroup Upload
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 刪除指定圖片(需要使用者認證)。
 * 會同時刪除資料庫記錄和 Storage 檔案。
 *
 * @apiPermission user
 *
 * @apiQuery {String} imageId 圖片 ID(必填)
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 刪除結果
 * @apiSuccess {String} data.imageId 被刪除的圖片 ID
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": { "imageId": "uuid" },
 *   "message": "圖片刪除成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 圖片 ID 為必填
 * @apiError (錯誤 4xx) {Object} NotFoundError 圖片不存在
 */

import { NextResponse } from 'next/server'
import { withAuthAndError } from '@/lib/middleware/api-middleware'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import {
  handleUpload,
  handleGetImages,
  handleUpdateImages,
  handleDeleteImage,
} from '@/lib/upload/unified/handlers'

/**
 * OPTIONS - CORS 預檢請求處理
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-csrf-token',
      'Access-Control-Max-Age': '86400', // 24 小時
    },
  })
}

/**
 * 導出 API 處理器 - 使用統一中間件組合
 */
export const POST = withAuthAndError(handleUpload, {
  module: 'UnifiedImageAPI',
  enableAuditLog: true,
})

export const GET = withErrorHandler(handleGetImages, {
  module: 'UnifiedImageAPI',
  enableAuditLog: false,
})

export const PATCH = withErrorHandler(handleUpdateImages, {
  module: 'UnifiedImageAPI',
  enableAuditLog: true,
})

export const DELETE = withAuthAndError(handleDeleteImage, {
  module: 'UnifiedImageAPI',
  enableAuditLog: true,
})
