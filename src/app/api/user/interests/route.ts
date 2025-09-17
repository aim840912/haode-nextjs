import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-middleware'
import { success, created } from '@/lib/api-response'
import { ValidationError, NotFoundError, MethodNotAllowedError } from '@/lib/errors'
import { userInterestsServiceV2Simple } from '@/services/v2/userInterestsServiceSimple'
import { z } from 'zod'

// 請求驗證架構
const AddInterestSchema = z.object({
  productId: z.string().min(1, '產品ID不能為空'),
})

const RemoveInterestSchema = z.object({
  productId: z.string().min(1, '產品ID不能為空'),
})

/**
 * 獲取使用者興趣清單
 */
async function handleGET(req: NextRequest, user: any) {
  try {
    const interests = await userInterestsServiceV2Simple.getUserInterests(user.id)
    return success({ interests }, '獲取興趣清單成功')
  } catch (error) {
    throw new Error('獲取興趣清單失敗')
  }
}

/**
 * 新增產品到興趣清單
 */
async function handlePOST(req: NextRequest, user: any) {
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
    const success_result = await userInterestsServiceV2Simple.addInterest(user.id, productId)

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
async function handleDELETE(req: NextRequest, user: any) {
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

    const success_result = await userInterestsServiceV2Simple.removeInterest(user.id, productId)

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

// 匯出處理器
export const GET = requireAuth(handleGET)
export const POST = requireAuth(handlePOST)
export const DELETE = requireAuth(handleDELETE)
export const PUT = requireAuth(handleUnsupportedMethod)
export const PATCH = requireAuth(handleUnsupportedMethod)
