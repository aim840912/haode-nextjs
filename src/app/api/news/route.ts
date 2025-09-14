import { NextRequest } from 'next/server'
import { newsServiceV2Simple as newsService } from '@/services/v2/newsServiceSimple'
import { NewsSchemas } from '@/lib/validation-schemas'
import { ValidationError } from '@/lib/errors'
import { success, created } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/error-handler'
import { apiLogger } from '@/lib/logger'

/**
 * GET /api/news - 取得新聞列表
 */
async function handleGET(request: NextRequest) {
  // 解析查詢參數
  const url = new URL(request.url)
  const queryParams = Object.fromEntries(url.searchParams.entries())

  const result = NewsSchemas.query.safeParse(queryParams)
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`查詢參數驗證失敗: ${errors}`)
  }

  apiLogger.info('查詢新聞列表', {
    metadata: { params: result.data },
  })

  const news = await newsService.getNews()
  return success(news, '查詢成功')
}

/**
 * POST /api/news - 創建新聞
 */
async function handlePOST(request: NextRequest) {
  // 解析並驗證請求資料
  const body = await request.json()
  const result = NewsSchemas.create.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('創建新聞', {
    metadata: {
      title: result.data.title,
      category: result.data.category,
      author: result.data.author,
    },
  })

  const newsItem = await newsService.addNews(result.data)

  // 記錄新聞建立指標
  const { recordBusinessAction } = await import('@/lib/metrics')
  recordBusinessAction('news_created', { newsId: newsItem.id, category: result.data.category })

  return created(newsItem, '新聞創建成功')
}

// 導出處理器
export const GET = withErrorHandler(handleGET, {
  module: 'NewsAPI',
  enableAuditLog: false,
})

export const POST = withErrorHandler(handlePOST, {
  module: 'NewsAPI',
  enableAuditLog: true,
})
