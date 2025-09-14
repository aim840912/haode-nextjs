import { NextRequest } from 'next/server'
import { productService } from '@/services/v2/productService'
import { withProductsCache } from '@/lib/api-cache-middleware'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/error-handler'
import { PublicProductSchemas } from '@/lib/validation-schemas'
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

  const { admin: isAdmin, nocache } = result.data

  let products: unknown[]

  if (nocache) {
    // 繞過快取，直接從資料庫獲取
    apiLogger.debug('繞過快取，直接查詢資料庫', { metadata: { nocache: true } })

    // 如果要繞過快取，我們需要直接使用基礎服務
    const { getProductService } = await import('@/services/serviceFactory')
    const baseService = await getProductService()

    // 如果是 CachedProductService，獲取其基礎服務
    if ('baseService' in baseService && (baseService as { baseService?: unknown }).baseService) {
      const cachedService = baseService as {
        baseService: {
          getAllProducts?: () => Promise<unknown[]>
          getProducts: () => Promise<unknown[]>
        }
      }
      products =
        isAdmin && cachedService.baseService.getAllProducts
          ? await cachedService.baseService.getAllProducts()
          : await cachedService.baseService.getProducts()
    } else {
      // 直接是基礎服務
      products =
        isAdmin && baseService.getAllProducts
          ? await baseService.getAllProducts()
          : await baseService.getProducts()
    }
  } else {
    // 正常使用快取
    products =
      isAdmin && productService.getAllProducts
        ? await productService.getAllProducts()
        : await productService.getProducts()
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

  // 清除產品快取，確保變更立即生效
  try {
    const { CachedProductService } = await import('@/services/cachedProductService')
    await CachedProductService.clearGlobalCache()
    apiLogger.info('產品新增後已清除全域快取', { metadata: { action: 'product_created' } })
  } catch (cacheError) {
    apiLogger.warn('清除產品快取失敗', { metadata: { error: (cacheError as Error).message } })
  }

  return created(product, '產品建立成功')
}

// 整合錯誤處理中間件
const handleGETWithError = withErrorHandler(handleGET, {
  module: 'PublicProductsAPI',
  enableAuditLog: false, // 公開 GET 請求通常不需要審計日誌
})

const handlePOSTWithError = withErrorHandler(handlePOST, {
  module: 'PublicProductsAPI',
  enableAuditLog: true, // POST 請求需要審計日誌
})

// 導出 API 處理器（保留快取中間件）
export const GET = handleGETWithError
export const POST = withProductsCache(handlePOSTWithError)
