import { NextRequest } from 'next/server'
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { userInterestsService } from '@/services/core/user/userInterestsService'
import { z } from 'zod'

// 請求驗證架構
const SyncInterestsSchema = z.object({
  localInterests: z.array(z.string()).default([]),
})

/**
 * 同步本地興趣清單到雲端
 * 用於使用者登入時合併本地和雲端的興趣清單
 */
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
