/**
 * @api {GET} /api/auth/check-phone 檢查手機號碼是否已註冊
 * @apiName CheckPhone
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 檢查指定的手機號碼是否已在系統中註冊。
 * 此 API 通常用於註冊流程中，在使用者提交註冊表單前驗證手機號碼的可用性。
 * 支援台灣手機號碼格式（09 開頭，10 位數字）。
 *
 * @apiPermission public
 *
 * @apiQuery {String} phone 要檢查的手機號碼（支援格式：0912345678 或 0912-345-678）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 檢查結果
 * @apiSuccess {String} data.phone 標準化後的手機號碼（移除空格和連字號）
 * @apiSuccess {Boolean} data.available 手機號碼是否可用（true=可用，false=已被註冊）
 * @apiSuccess {String} data.message 說明訊息
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應（手機號碼可用）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "phone": "0912345678",
 *     "available": true,
 *     "message": "此手機號碼可以使用"
 *   },
 *   "message": "手機號碼檢查完成"
 * }
 *
 * @apiSuccessExample {json} 成功回應（手機號碼已被註冊）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "phone": "0987654321",
 *     "available": false,
 *     "message": "此手機號碼已被註冊"
 *   },
 *   "message": "手機號碼檢查完成"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 手機號碼參數缺失或格式錯誤
 * @apiError (錯誤 5xx) {Object} InternalError 資料庫查詢失敗
 *
 * @apiErrorExample {json} 錯誤回應（缺少參數）:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "請提供手機號碼",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 錯誤回應（格式錯誤）:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "請輸入有效的台灣手機號碼（09開頭，10位數字）",
 *   "code": "VALIDATION_ERROR"
 * }
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { createServiceSupabaseClient } from '@/lib/database/supabase-server'
import { ValidationError } from '@/lib/errors'
import { withErrorHandler } from '@/lib/middleware/error-handler'

async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')

  // 驗證手機號碼參數
  if (!phone) {
    throw new ValidationError('請提供手機號碼')
  }

  // 驗證手機號碼格式
  const cleanPhone = phone.replace(/[-\s]/g, '')
  if (!/^09\d{8}$/.test(cleanPhone)) {
    throw new ValidationError('請輸入有效的台灣手機號碼（09開頭，10位數字）')
  }

  const supabase = createServiceSupabaseClient()

  // 檢查手機號碼是否已被使用
  const { data: existingProfile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', cleanPhone)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 是 "not found" 錯誤，這是我們預期的
    throw new Error('檢查手機號碼時發生錯誤')
  }

  const isAvailable = !existingProfile

  return success(
    {
      phone: cleanPhone,
      available: isAvailable,
      message: isAvailable ? '此手機號碼可以使用' : '此手機號碼已被註冊',
    },
    '手機號碼檢查完成'
  )
}

export const GET = withErrorHandler(handleGET, {
  module: 'CheckPhoneAPI',
  enableAuditLog: false, // 不需要為這種查詢記錄審計日誌
})
