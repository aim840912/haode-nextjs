import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-middleware'
import { success } from '@/lib/api-response'
import { ValidationError, MethodNotAllowedError } from '@/lib/errors'
import { userInterestsServiceV2Simple } from '@/services/v2/userInterestsServiceSimple'
import { z } from 'zod'

// 請求驗證架構
const ToggleInterestSchema = z.object({
  productId: z.string().min(1, '產品ID不能為空'),
})

/**
 * 切換產品興趣狀態（加入或移除）
 */
async function handlePOST(req: NextRequest, user: any) {
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
    const currentInterests = await userInterestsServiceV2Simple.getUserInterests(user.id)
    const isCurrentlyInterested = currentInterests.includes(productId)

    // 切換興趣狀態
    const success_result = await userInterestsServiceV2Simple.toggleInterest(user.id, productId)

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

// 匯出處理器
export const POST = requireAuth(handlePOST)
export const GET = requireAuth(handleUnsupportedMethod)
export const DELETE = requireAuth(handleUnsupportedMethod)
export const PUT = requireAuth(handleUnsupportedMethod)
export const PATCH = requireAuth(handleUnsupportedMethod)
