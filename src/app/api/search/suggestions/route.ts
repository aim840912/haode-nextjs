/**
 * 搜尋建議 API
 *
 * 提供即時搜尋建議功能，用於自動完成
 */

import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { fullTextSearchService } from '@/lib/full-text-search'
import { apiLogger } from '@/lib/logger'

async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()
  const limit = parseInt(searchParams.get('limit') || '5')

  // 驗證參數
  if (!query) {
    throw new ValidationError('搜尋關鍵字不能為空')
  }

  if (query.length < 2) {
    throw new ValidationError('搜尋關鍵字至少需要 2 個字元')
  }

  if (limit < 1 || limit > 20) {
    throw new ValidationError('建議數量必須在 1-20 之間')
  }

  apiLogger.info('搜尋建議請求', {
    module: 'SearchSuggestionsAPI',
    metadata: { query: query.substring(0, 20), limit },
  })

  // 獲取搜尋建議
  const suggestions = await fullTextSearchService.getSearchSuggestions(query, 'products', limit)

  return success(
    {
      suggestions,
      query,
      count: suggestions.length,
    },
    '取得搜尋建議成功'
  )
}

export const GET = withErrorHandler(handleGET, {
  module: 'SearchSuggestionsAPI',
})
