import { NextRequest } from 'next/server'
import { productService } from '@/services/core/product/productService'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { withAdminAndError } from '@/lib/middleware/api-middleware'
import { PublicProductSchemas } from '@/lib/validation'
import { ValidationError } from '@/lib/errors'
import { success, created } from '@/lib/api-response'

async function handleGET(request: NextRequest) {
  // 驗證查詢參數
  const { searchParams } = new URL(request.url)

  // 將 URLSearchParams 轉換為物件
  const queryParams: Record<string, string> = {}
  for (const [key, value] of searchParams.entries()) {
    queryParams[key] = value
  }

  const result = PublicProductSchemas.query.safeParse(queryParams)

  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`查詢參數驗證失敗: ${errorMessage}`)
  }

  const { nocache } = result.data

  // 安全修復：公開 API 只返回已啟用的產品
  // 管理員應使用 /api/admin/products 獲取所有產品
  let products: unknown[]

  if (nocache) {
    // 繞過快取，直接從資料庫獲取
    apiLogger.debug('繞過快取，直接查詢資料庫', { metadata: { nocache: true } })

    // 如果要繞過快取，我們需要直接使用基礎服務
    const { getProductService } = await import('@/services/factory/serviceFactory')
    const baseService = await getProductService()

    // 如果是 CachedProductService，獲取其基礎服務
    if ('baseService' in baseService && (baseService as { baseService?: unknown }).baseService) {
      const cachedService = baseService as {
        baseService: {
          getProducts: () => Promise<unknown[]>
        }
      }
      products = await cachedService.baseService.getProducts()
    } else {
      // 直接是基礎服務
      products = await baseService.getProducts()
    }
  } else {
    // 正常使用快取 - 只獲取已啟用的產品
    products = await productService.getProducts()
  }

  const response = success(products, '產品清單取得成功')

  // 加入 no-cache 標頭確保資料是最新的
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  // 如果是繞過快取的請求，在 header 中標記
  if (nocache) {
    response.headers.set('X-Cache-Bypassed', 'true')
  }

  return response
}

async function handlePOST(request: NextRequest) {
  // 驗證請求資料
  const body = await request.json()
  const result = PublicProductSchemas.create.safeParse(body)

  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`產品建立資料驗證失敗: ${errorMessage}`)
  }

  const productData = {
    ...result.data,
    images: result.data.images || [], // 確保 images 不是 undefined
  }
  const product = await productService.addProduct(productData)

  // 記錄新產品建立指標
  const { recordBusinessAction } = await import('@/lib/metrics')
  recordBusinessAction('product_created', { productId: product.id, category: product.category })

  return created(product, '產品建立成功')
}

// 整合錯誤處理中間件
const handleGETWithError = withErrorHandler(handleGET, {
  module: 'PublicProductsAPI',
  enableAuditLog: false, // 公開 GET 請求通常不需要審計日誌
})

// 導出 API 處理器
export const GET = handleGETWithError
// POST 需要管理員權限 - 使用組合函數：權限檢查 + 錯誤處理
export const POST = withAdminAndError(
  async req => {
    const result = await handlePOST(req)
    // 清除產品快取
    try {
      const { CachedProductService } = await import('@/services/core/product/cachedProductService')
      await CachedProductService.clearGlobalCache()
    } catch {}
    return result
  },
  { module: 'PublicProductsAPI', enableAuditLog: true }
)
