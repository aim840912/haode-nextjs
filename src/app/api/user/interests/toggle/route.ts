/**
 * @api {POST} /api/user/interests/toggle 切換產品興趣狀態
 * @apiName ToggleUserInterest
 * @apiGroup UserInterests
 * @apiVersion 1.0.0
 * @apiDescription 切換產品的興趣狀態（如果已存在則移除，否則添加）
 * @apiPermission user
 * @apiBody {String} productId 產品 ID（必填）
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 回應資料
 * @apiSuccess {String} data.userId 使用者 ID
 * @apiSuccess {String} data.productId 產品 ID
 * @apiSuccess {String} data.action 執行的動作（added 或 removed）
 * @apiSuccess {Boolean} data.wasInterested 切換前的狀態
 * @apiSuccess {Boolean} data.nowInterested 切換後的狀態
 * @apiSuccessExample {json} 成功回應（添加）:
 *   HTTP/1.1 200 OK
 *   {"success": true, "data": {"userId": "uuid", "productId": "uuid", "action": "added", "wasInterested": false, "nowInterested": true}, "message": "已加入興趣清單"}
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success } from '@/lib/api-response'
import { ValidationError, MethodNotAllowedError } from '@/lib/errors'
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'
import { userInterestsService } from '@/services/core/user/userInterestsService'

const ToggleInterestSchema = z.object({
  productId: z.string().min(1, '產品ID不能為空'),
})

async function handlePOST(req: NextRequest, user: User) {
  try {
    const body = await req.json()
    const result = ToggleInterestSchema.safeParse(body)

    if (!result.success) {
      const errors = result.error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ')
      throw new ValidationError(`驗證失敗: ${errors}`)
    }

    const { productId } = result.data

    // 先檢查當前狀態
    const currentInterests = await userInterestsService.getUserInterests(user.id)
    const isCurrentlyInterested = currentInterests.includes(productId)

    // 切換興趣狀態
    const success_result = await userInterestsService.toggleInterest(user.id, productId)

    if (!success_result) {
      throw new Error('切換興趣狀態失敗')
    }

    const action = isCurrentlyInterested ? 'removed' : 'added'
    const message = isCurrentlyInterested ? '已從興趣清單移除' : '已加入興趣清單'

    return success(
      {
        userId: user.id,
        productId,
        action,
        wasInterested: isCurrentlyInterested,
        nowInterested: !isCurrentlyInterested,
      },
      message
    )
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new Error('切換興趣狀態失敗')
  }
}

/**
 * 處理不支援的 HTTP 方法
 */
async function handleUnsupportedMethod(request: NextRequest): Promise<never> {
  throw new MethodNotAllowedError(`不支援的方法: ${request.method}`)
}

// 匯出處理器 - 使用組合函數：權限檢查 + 錯誤處理
export const POST = withAuthAndError(handlePOST, {
  module: 'UserInterestsToggleAPI',
  enableAuditLog: true,
})
export const GET = withAuthAndError(handleUnsupportedMethod, { module: 'UserInterestsToggleAPI' })
export const DELETE = withAuthAndError(handleUnsupportedMethod, {
  module: 'UserInterestsToggleAPI',
})
export const PUT = withAuthAndError(handleUnsupportedMethod, { module: 'UserInterestsToggleAPI' })
export const PATCH = withAuthAndError(handleUnsupportedMethod, { module: 'UserInterestsToggleAPI' })
