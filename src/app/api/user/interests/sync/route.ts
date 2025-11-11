/**
 * @api {POST} /api/user/interests/sync 同步本地興趣清單到雲端
 * @apiName SyncUserInterests
 * @apiGroup UserInterests
 * @apiVersion 1.0.0
 * @apiDescription 用於使用者登入時合併本地和雲端的興趣清單
 * @apiPermission user
 * @apiBody {String[]} [localInterests] 本地興趣產品 ID 列表（預設為空陣列）
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 回應資料
 * @apiSuccess {String} data.userId 使用者 ID
 * @apiSuccess {String[]} data.interests 合併後的興趣列表
 * @apiSuccess {Number} data.syncedCount 同步的產品數量
 * @apiSuccess {Number} data.totalCount 合併後的總數量
 * @apiSuccessExample {json} 成功回應:
 *   HTTP/1.1 200 OK
 *   {"success": true, "data": {"userId": "uuid", "interests": ["uuid1"], "syncedCount": 2, "totalCount": 3}, "message": "興趣清單同步成功"}
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'
import { userInterestsService } from '@/services/core/user/userInterestsService'

const SyncInterestsSchema = z.object({
  localInterests: z.array(z.string()).default([]),
})

async function handlePOST(req: NextRequest, user: User) {
  try {
    const body = await req.json()
    const result = SyncInterestsSchema.safeParse(body)

    if (!result.success) {
      const errors = result.error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ')
      throw new ValidationError(`驗證失敗: ${errors}`)
    }

    const { localInterests } = result.data

    // 呼叫服務層進行同步
    const mergedInterests = await userInterestsService.syncLocalInterests(user.id, localInterests)

    return success(
      {
        userId: user.id,
        interests: mergedInterests,
        syncedCount: localInterests.length,
        totalCount: mergedInterests.length,
      },
      '興趣清單同步成功'
    )
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new Error('同步興趣清單失敗')
  }
}

// 匯出處理器 - 使用組合函數：權限檢查 + 錯誤處理
export const POST = withAuthAndError(handlePOST, {
  module: 'UserInterestsSyncAPI',
  enableAuditLog: false, // 同步操作不需要稽核日誌
})
