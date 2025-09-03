import { NextRequest } from 'next/server'
import { productServiceAdapter as productService } from '@/services/productServiceAdapter'
import { AdminProductSchemas, CommonValidations } from '@/lib/validation-schemas'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { success } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/error-handler'
import { apiLogger } from '@/lib/logger'

/**
 * GET /api/products/[id] - 取得單一產品
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

  apiLogger.info('查詢單一產品', {
    metadata: { productId: id },
  })

  const product = await productService.getProductById(id)
  if (!product) {
    throw new NotFoundError('產品不存在')
  }

  return success(product, '查詢成功')
}

/**
 * PUT /api/products/[id] - 更新產品
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
  const result = AdminProductSchemas.update.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('更新產品', {
    metadata: {
      productId: id,
      changes: Object.keys(result.data),
    },
  })

  const product = await productService.updateProduct(id, result.data)

  // 手動清除產品相關的快取
  try {
    const { CacheManager } = await import('@/lib/cache-server')
    await CacheManager.deletePattern('products:*')
  } catch (cacheError) {
    apiLogger.warn('清除快取失敗', {
      metadata: { errorMessage: (cacheError as Error).message },
    })
  }

  return success(product, '產品更新成功')
}

/**
 * DELETE /api/products/[id] - 刪除產品
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

  apiLogger.info('刪除產品', {
    metadata: { productId: id },
  })

  await productService.deleteProduct(id)

  // 手動清除產品相關的快取
  try {
    const { CacheManager } = await import('@/lib/cache-server')
    await CacheManager.deletePattern('products:*')
  } catch (cacheError) {
    apiLogger.warn('清除快取失敗', {
      metadata: { errorMessage: (cacheError as Error).message },
    })
  }

  return success({ id }, '產品刪除成功')
}

// 導出處理器
export const GET = withErrorHandler(handleGET, {
  module: 'ProductAPI',
  enableAuditLog: false,
})

export const PUT = withErrorHandler(handlePUT, {
  module: 'ProductAPI',
  enableAuditLog: true,
})

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'ProductAPI',
  enableAuditLog: true,
})
