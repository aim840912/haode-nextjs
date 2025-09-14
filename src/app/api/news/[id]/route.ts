import { NextRequest } from 'next/server'
import { newsServiceV2Simple as newsService } from '@/services/v2/newsServiceSimple'
import { NewsSchemas, CommonValidations } from '@/lib/validation-schemas'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { success } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/error-handler'
import { apiLogger } from '@/lib/logger'

/**
 * GET /api/news/[id] - 取得單一新聞
 */
async function handleGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 驗證 UUID 格式
  const result = CommonValidations.uuidParam.safeParse({ id })
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  apiLogger.info('查詢單一新聞', {
    metadata: { newsId: id },
  })

  const newsItem = await newsService.getNewsById(id)
  if (!newsItem) {
    throw new NotFoundError('新聞不存在')
  }

  return success(newsItem, '查詢成功')
}

/**
 * PUT /api/news/[id] - 更新新聞
 */
async function handlePUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 驗證 UUID 格式
  const paramResult = CommonValidations.uuidParam.safeParse({ id })
  if (!paramResult.success) {
    const errors = paramResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  // 解析並驗證請求資料
  const body = await request.json()
  const result = NewsSchemas.update.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('更新新聞', {
    metadata: {
      newsId: id,
      changes: Object.keys(result.data),
    },
  })

  const newsItem = await newsService.updateNews(id, result.data)

  return success(newsItem, '新聞更新成功')
}

/**
 * DELETE /api/news/[id] - 刪除新聞
 */
async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 驗證 UUID 格式
  const result = CommonValidations.uuidParam.safeParse({ id })
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  apiLogger.info('刪除新聞', {
    metadata: { newsId: id },
  })

  await newsService.deleteNews(id)

  return success({ id }, '新聞刪除成功')
}

// 導出處理器
export const GET = withErrorHandler(handleGET, {
  module: 'NewsAPI',
  enableAuditLog: false,
})

export const PUT = withErrorHandler(handlePUT, {
  module: 'NewsAPI',
  enableAuditLog: true,
})

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'NewsAPI',
  enableAuditLog: true,
})
