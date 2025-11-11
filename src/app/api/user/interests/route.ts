/**
 * @api {GET} /api/user/interests 取得使用者興趣清單
 * @apiName GetUserInterests
 * @apiGroup UserInterests
 * @apiVersion 1.0.0
 * @apiDescription 取得當前登入使用者的產品興趣清單
 * @apiPermission user
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 回應資料
 * @apiSuccess {String[]} data.interests 興趣產品 ID 列表
 * @apiSuccessExample {json} 成功回應:
 *   HTTP/1.1 200 OK
 *   {"success": true, "data": {"interests": ["uuid1", "uuid2"]}, "message": "獲取興趣清單成功"}
 */

/**
 * @api {POST} /api/user/interests 新增產品到興趣清單
 * @apiName AddUserInterest
 * @apiGroup UserInterests
 * @apiVersion 1.0.0
 * @apiDescription 將指定產品添加到使用者興趣清單
 * @apiPermission user
 * @apiBody {String} productId 產品 ID（必填）
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccessExample {json} 成功回應:
 *   HTTP/1.1 201 Created
 *   {"success": true, "data": {"userId": "uuid", "productId": "uuid", "action": "added"}, "message": "已加入興趣清單"}
 */

/**
 * @api {DELETE} /api/user/interests 從興趣清單移除產品
 * @apiName RemoveUserInterest
 * @apiGroup UserInterests
 * @apiVersion 1.0.0
 * @apiDescription 從使用者興趣清單中移除指定產品
 * @apiPermission user
 * @apiBody {String} productId 產品 ID（必填）
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccessExample {json} 成功回應:
 *   HTTP/1.1 200 OK
 *   {"success": true, "data": {"userId": "uuid", "productId": "uuid", "action": "removed"}, "message": "已從興趣清單移除"}
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, created } from '@/lib/api-response'
import { ValidationError, MethodNotAllowedError } from '@/lib/errors'
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'
import { userInterestsService } from '@/services/core/user/userInterestsService'

const AddInterestSchema = z.object({
  productId: z.string().min(1, '產品ID不能為空'),
})

const RemoveInterestSchema = z.object({
  productId: z.string().min(1, '產品ID不能為空'),
})

async function handleGET(req: NextRequest, user: User) {
  const interests = await userInterestsService.getUserInterests(user.id)
  return success({ interests }, '獲取興趣清單成功')
}

/**
 * 新增產品到興趣清單
 */
async function handlePOST(req: NextRequest, user: User) {
  try {
    const body = await req.json()
    const result = AddInterestSchema.safeParse(body)

    if (!result.success) {
      const errors = result.error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ')
      throw new ValidationError(`驗證失敗: ${errors}`)
    }

    const { productId } = result.data

    // 使用 toggleInterest 來處理，如果已存在則不會重複添加
    const success_result = await userInterestsService.addInterest(user.id, productId)

    if (!success_result) {
      throw new Error('新增興趣失敗')
    }

    return created(
      {
        userId: user.id,
        productId,
        action: 'added',
      },
      '已加入興趣清單'
    )
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new Error('新增興趣失敗')
  }
}

/**
 * 從興趣清單移除產品
 */
async function handleDELETE(req: NextRequest, user: User) {
  try {
    const body = await req.json()
    const result = RemoveInterestSchema.safeParse(body)

    if (!result.success) {
      const errors = result.error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ')
      throw new ValidationError(`驗證失敗: ${errors}`)
    }

    const { productId } = result.data

    const success_result = await userInterestsService.removeInterest(user.id, productId)

    if (!success_result) {
      throw new Error('移除興趣失敗')
    }

    return success(
      {
        userId: user.id,
        productId,
        action: 'removed',
      },
      '已從興趣清單移除'
    )
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new Error('移除興趣失敗')
  }
}

/**
 * 處理不支援的 HTTP 方法
 */
async function handleUnsupportedMethod(request: NextRequest): Promise<never> {
  throw new MethodNotAllowedError(`不支援的方法: ${request.method}`)
}

// 匯出處理器 - 使用組合函數：權限檢查 + 錯誤處理
export const GET = withAuthAndError(handleGET, { module: 'UserInterestsAPI' })
export const POST = withAuthAndError(handlePOST, {
  module: 'UserInterestsAPI',
  enableAuditLog: true,
})
export const DELETE = withAuthAndError(handleDELETE, {
  module: 'UserInterestsAPI',
  enableAuditLog: true,
})
export const PUT = withAuthAndError(handleUnsupportedMethod, { module: 'UserInterestsAPI' })
export const PATCH = withAuthAndError(handleUnsupportedMethod, { module: 'UserInterestsAPI' })
