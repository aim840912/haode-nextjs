/**
 * @api {GET} /api/search 搜尋產品
 * @apiName SearchProducts
 * @apiGroup Search
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 搜尋產品（公開 API）。
 * 支援關鍵字搜尋產品名稱、描述和分類。
 * 結果依相關性排序並支援分頁。
 * 會自動記錄搜尋查詢指標。
 *
 * @apiPermission public
 *
 * @apiQuery {String} q 搜尋關鍵字（必填，至少 1 個字元）
 * @apiQuery {Number} [limit=20] 返回結果數量上限
 * @apiQuery {Number} [offset=0] 分頁偏移量
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 搜尋結果
 * @apiSuccess {Object[]} data.results 搜尋結果列表
 * @apiSuccess {String} data.results.id 產品 ID
 * @apiSuccess {String} data.results.title 產品名稱
 * @apiSuccess {String} data.results.description 產品描述
 * @apiSuccess {String} data.results.type 結果類型（固定為 "product"）
 * @apiSuccess {String} data.results.url 產品 URL
 * @apiSuccess {String} data.results.category 產品分類
 * @apiSuccess {String} data.results.image 產品圖片 URL
 * @apiSuccess {Number} data.results.price 產品價格
 * @apiSuccess {Number} data.results.relevanceScore 相關性分數
 * @apiSuccess {Number} data.total 總結果數
 * @apiSuccess {String} data.query 搜尋關鍵字
 * @apiSuccess {Number} data.processingTime 查詢處理時間（毫秒）
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應（有結果）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "results": [
 *       {
 *         "id": "uuid",
 *         "title": "有機草莓",
 *         "description": "新鮮有機草莓",
 *         "type": "product",
 *         "url": "/products?productId=uuid",
 *         "category": "季節水果",
 *         "image": "https://storage.example.com/image.jpg",
 *         "price": 300,
 *         "relevanceScore": 15
 *       }
 *     ],
 *     "total": 1,
 *     "query": "草莓",
 *     "processingTime": 45
 *   },
 *   "message": "搜尋完成"
 * }
 *
 * @apiSuccessExample {json} 成功回應（無結果）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "results": [],
 *     "total": 0,
 *     "query": "",
 *     "processingTime": 2
 *   },
 *   "message": "搜尋完成"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 查詢參數驗證失敗
 *
 * @apiErrorExample {json} 驗證錯誤:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "查詢參數驗證失敗: q: 搜尋關鍵字為必填",
 *   "code": "VALIDATION_ERROR"
 * }
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { SearchSchemas } from '@/lib/validation'
import { productService } from '@/services/core/product/productService'
import { Product } from '@/types/product'
import { SearchResult, SearchResponse } from '@/types/search'

async function handleGET(request: NextRequest) {
  const startTime = Date.now()

  // 解析並驗證查詢參數
  const { searchParams } = new URL(request.url)
  const params = Object.fromEntries(searchParams.entries())
  const result = SearchSchemas.query.safeParse(params)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`查詢參數驗證失敗: ${errors}`)
  }

  const { q: query, limit, offset } = result.data

  if (!query || query.trim().length === 0) {
    return success(
      {
        results: [],
        total: 0,
        query: '',
        processingTime: Date.now() - startTime,
      } as SearchResponse,
      '搜尋完成'
    )
  }

  // 搜尋產品
  const products = await productService.searchProducts(query)

  // 轉換為統一的搜尋結果格式
  const productResults: SearchResult[] = products.map((product: Product) => ({
    id: product.id,
    title: product.name,
    description: product.description,
    type: 'product' as const,
    url: `/products?productId=${product.id}`,
    category: product.category,
    image:
      product.productImages && product.productImages.length > 0
        ? product.productImages[0].storage_url
        : '/images/placeholder.jpg',
    price: product.price,
    relevanceScore: calculateProductRelevance(product, query),
  }))

  // 按相關性排序
  const allResults = [...productResults].sort((a, b) => b.relevanceScore - a.relevanceScore)

  // 應用分頁
  const paginatedResults = allResults.slice(offset, offset + limit)

  const processingTime = Date.now() - startTime
  const response: SearchResponse = {
    results: paginatedResults,
    total: allResults.length,
    query,
    processingTime,
  }

  apiLogger.info('搜尋查詢完成', {
    metadata: {
      query,
      totalResults: allResults.length,
      returnedResults: paginatedResults.length,
      processingTimeMs: processingTime,
    },
  })

  // 記錄搜尋查詢指標
  const { recordSearchQuery } = await import('@/lib/metrics')
  recordSearchQuery(query)

  return success(response, '搜尋完成')
}

// 計算產品相關性分數
function calculateProductRelevance(product: Product, query: string): number {
  const searchTerm = query.toLowerCase()
  const name = product.name.toLowerCase()
  const description = product.description.toLowerCase()
  const category = product.category.toLowerCase()

  let score = 0

  // 名稱完全匹配
  if (name === searchTerm) score += 10
  // 名稱包含搜尋詞
  else if (name.includes(searchTerm)) score += 7

  // 類別匹配
  if (category === searchTerm) score += 5
  else if (category.includes(searchTerm)) score += 3

  // 描述匹配
  if (description.includes(searchTerm)) score += 2

  // 如果是特價商品，增加分數
  if (product.isOnSale) score += 1

  return score
}

// 導出處理器 - 使用統一的錯誤處理系統
export const GET = withErrorHandler(handleGET, {
  module: 'SearchAPI',
  enableAuditLog: false,
})
