import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-auth'
import { Product } from '@/types/product'
import { checkAdminPermission, createAuthErrorResponse } from '@/lib/admin-auth-middleware'
import { withRateLimit, IdentifierStrategy } from '@/lib/rate-limiter'
import { unifiedImageService } from '@/lib/unified-image-service'
import { SupabaseAuditLogService } from '@/services/auditLogService'
import { adminProductService } from '@/services/v2/productService'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/error-handler'
import { AdminProductSchemas } from '@/lib/validation-schemas'
import { ValidationError } from '@/lib/errors'
import { success, created } from '@/lib/api-response'

// 資料轉換函數：將資料庫格式轉換為前端格式
function transformFromDB(dbProduct: Record<string, unknown>): Product {
  // 預設圖片對應表
  const defaultImages: { [key: string]: string } = {
    有機紅肉李: '/images/products/red-plum.jpg',
    高山烏龍茶: '/images/products/oolong-tea.jpg',
    季節蔬菜箱: '/images/products/vegetable-box.jpg',
    精選茶包: '/images/products/tea_bag_1.jpg',
  }

  // 安全地獲取產品名稱
  const productName = (dbProduct.name as string) || ''

  // 取得圖片陣列，優先使用新的 images 欄位
  let images: string[] = []

  try {
    // 嘗試解析 images JSONB 欄位
    if (dbProduct.images && typeof dbProduct.images === 'string') {
      images = JSON.parse(dbProduct.images as string)
    } else if (Array.isArray(dbProduct.images)) {
      images = dbProduct.images
    }
  } catch {
    // JSON 解析失敗，使用空陣列
    images = []
  }

  // 如果沒有新格式圖片，回退到舊的 image_url
  if (images.length === 0) {
    const imageUrl =
      (dbProduct.image_url as string) || defaultImages[productName] || '/images/placeholder.jpg'

    // 驗證圖片 URL
    if (imageUrl && typeof imageUrl === 'string') {
      // 修正錯誤的 Imgur 連結
      if (
        imageUrl.includes('imgur.com') &&
        !imageUrl.includes('.jpg') &&
        !imageUrl.includes('.png') &&
        !imageUrl.includes('.jpeg') &&
        !imageUrl.includes('.webp')
      ) {
        images = [defaultImages[productName] || '/images/placeholder.jpg']
      } else {
        images = [imageUrl]
      }
    } else {
      images = ['/images/placeholder.jpg']
    }
  }

  // 確保至少有一張圖片
  if (images.length === 0) {
    images = ['/images/placeholder.jpg']
  }

  return {
    id: String(dbProduct.id || ''),
    name: (dbProduct.name as string) || '',
    description: (dbProduct.description as string) || '',
    price: Number(dbProduct.price) || 0,
    priceUnit: (dbProduct.price_unit as string) || undefined, // 新增：價格單位
    unitQuantity: Number(dbProduct.unit_quantity) || undefined, // 新增：單位數量
    category: (dbProduct.category as string) || '',
    images: images, // 使用完整的圖片陣列
    inventory: Number(dbProduct.stock) || 0,
    isActive: Boolean(dbProduct.is_active),
    createdAt: (dbProduct.created_at as string) || new Date().toISOString(),
    updatedAt: (dbProduct.updated_at as string) || new Date().toISOString(),
  }
}

// GET - 取得所有產品（包含未啟用的）
async function handleGET(request: NextRequest) {
  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // 轉換資料格式
    const transformedProducts = (data || []).map(transformFromDB)

    return success(transformedProducts, '產品載入成功')
  } catch (error) {
    apiLogger.error('Error fetching all products', error as Error)
    throw error // 讓 withErrorHandler 處理統一的錯誤格式
  }
}

// POST - 新增產品
async function handlePOST(request: NextRequest) {
  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  // 驗證請求資料
  const body = await request.json()
  const result = AdminProductSchemas.create.safeParse(body)

  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`產品資料驗證失敗: ${errorMessage}`)
  }

  const productData = result.data

  // 轉換資料格式
  const dbProduct: {
    id?: string
    name: string
    description: string
    price: number
    price_unit?: string | null
    unit_quantity?: number | null
    category: string
    image_url: string | null
    images: string
    stock: number
    is_active: boolean
  } = {
    name: productData.name,
    description: productData.description,
    price: productData.price,
    price_unit: productData.priceUnit || null, // 新增：儲存價格單位
    unit_quantity: productData.unitQuantity || null, // 新增：儲存單位數量
    category: productData.category,
    image_url: productData.images?.[0] || null, // 保持向後相容
    images: JSON.stringify(productData.images || []), // 新增：儲存完整圖片陣列
    stock: productData.inventory || 0,
    is_active: productData.isActive !== false,
  }

  // 如果前端提供了 ID，使用指定的 ID
  if (productData.id) {
    dbProduct.id = productData.id
  }

  const { data, error } = await supabaseAdmin.from('products').insert([dbProduct]).select().single()

  if (error) throw error

  // v2 服務已內建自動快取管理，無需手動清除

  return created({ product: transformFromDB(data) }, '產品建立成功')
}

// PUT - 更新產品
async function handlePUT(request: NextRequest) {
  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  // 驗證請求資料
  const body = await request.json()
  const result = AdminProductSchemas.update.safeParse(body)

  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`產品更新資料驗證失敗: ${errorMessage}`)
  }

  const { id, ...productData } = result.data

  // 轉換資料格式
  const dbProduct: Record<string, unknown> = {}

  if (productData.name !== undefined) dbProduct.name = productData.name
  if (productData.description !== undefined) dbProduct.description = productData.description
  if (productData.price !== undefined) dbProduct.price = productData.price
  if (productData.priceUnit !== undefined) dbProduct.price_unit = productData.priceUnit || null // 新增：更新價格單位
  if (productData.unitQuantity !== undefined)
    dbProduct.unit_quantity = productData.unitQuantity || null // 新增：更新單位數量
  if (productData.category !== undefined) dbProduct.category = productData.category
  if (productData.images !== undefined) {
    dbProduct.image_url = productData.images.length > 0 ? productData.images[0] : null // 保持向後相容
    dbProduct.images = JSON.stringify(productData.images) // 新增：更新完整圖片陣列
  }
  if (productData.inventory !== undefined) dbProduct.stock = productData.inventory
  if (productData.isActive !== undefined) dbProduct.is_active = productData.isActive

  dbProduct.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(dbProduct)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // v2 服務已內建自動快取管理，無需手動清除

  return success({ product: transformFromDB(data) }, '產品更新成功')
}

// DELETE - 刪除產品
async function handleDELETE(request: NextRequest) {
  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    throw new ValidationError('產品 ID 為必填參數')
  }

  // 驗證 ID 格式
  const result = AdminProductSchemas.deleteParams.safeParse({ id })
  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`產品 ID 驗證失敗: ${errorMessage}`)
  }

  // 先獲取產品資料以便記錄審計日誌
  const { data: productData, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    apiLogger.error(`Error fetching product ${id} for audit:`, fetchError)
  }

  // 使用統一圖片服務刪除產品圖片
  let deletedImageCount = 0
  let imageCleanupSuccess = false
  let imageCleanupError: string | undefined

  try {
    apiLogger.info(`🗑️ 開始為產品 ${id} 清理圖片...`)
    deletedImageCount = await unifiedImageService.deleteEntityImages('products', id)
    imageCleanupSuccess = true
    apiLogger.info(`✅ 產品 ${id} 的圖片清理完成 - 刪除了 ${deletedImageCount} 個檔案`)
  } catch (storageError) {
    imageCleanupError = (storageError as Error).message
    apiLogger.warn(`⚠️ 產品 ${id} 圖片清理過程發生異常`, {
      metadata: { error: imageCleanupError },
    })
  }

  // 然後刪除資料庫記錄
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id)

  if (error) throw error

  // 記錄審計日誌
  try {
    const auditService = new SupabaseAuditLogService()
    await auditService.log({
      user_id: 'admin-api-key',
      user_email: 'admin@system',
      user_name: 'Admin API',
      user_role: 'admin',
      action: 'delete',
      resource_type: 'product' as const, // 指定具體的資源類型
      resource_id: id,
      resource_details: productData
        ? (transformFromDB(productData) as unknown as Record<string, unknown>)
        : {},
      metadata: {
        imageCleanup: {
          success: imageCleanupSuccess,
          deletedCount: deletedImageCount,
          error: imageCleanupError,
        },
      },
      ip_address:
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    })
  } catch (auditError) {
    apiLogger.warn('Failed to log product deletion audit', {
      metadata: { error: (auditError as Error).message },
    })
  }

  // v2 服務已內建自動快取管理，無需手動清除
  apiLogger.info('🔄 產品刪除完成，快取已自動更新')

  return success(
    {
      message: '產品刪除成功',
      imageCleanup: {
        success: imageCleanupSuccess,
        deletedCount: deletedImageCount,
        error: imageCleanupError,
      },
    },
    '產品刪除成功'
  )
}

// 套用 Rate Limiting 並導出 API 處理器
const adminRateLimitConfig = {
  maxRequests: 50,
  windowMs: 60 * 1000, // 1 分鐘
  strategy: IdentifierStrategy.API_KEY,
  enableAuditLog: true,
  includeHeaders: true,
  message: '管理員 API 使用頻率超出限制，請稍後重試',
}

// 整合錯誤處理中間件
const handleGETWithError = withErrorHandler(handleGET, {
  module: 'AdminProductsAPI',
  enableAuditLog: false,
})

const handlePOSTWithError = withErrorHandler(handlePOST, {
  module: 'AdminProductsAPI',
  enableAuditLog: true,
})

const handlePUTWithError = withErrorHandler(handlePUT, {
  module: 'AdminProductsAPI',
  enableAuditLog: true,
})

const handleDELETEWithError = withErrorHandler(handleDELETE, {
  module: 'AdminProductsAPI',
  enableAuditLog: true,
})

// 導出 API 處理器（保留 Rate Limiting）
export const GET = withRateLimit(handleGETWithError, {
  ...adminRateLimitConfig,
  maxRequests: 100, // GET 請求較寬鬆
})

export const POST = withRateLimit(handlePOSTWithError, adminRateLimitConfig)

export const PUT = withRateLimit(handlePUTWithError, adminRateLimitConfig)

export const DELETE = withRateLimit(handleDELETEWithError, {
  ...adminRateLimitConfig,
  maxRequests: 20, // DELETE 請求較嚴格
})
