import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-auth'
import { Product } from '@/types/product'
import { 
  checkAdminPermission, 
  createAuthErrorResponse
} from '@/lib/admin-auth-middleware'
import { withRateLimit, IdentifierStrategy } from '@/lib/rate-limiter'
import { deleteProductImages, ProductImageDeletionResult, listProductImages } from '@/lib/supabase-storage'
import { SupabaseAuditLogService } from '@/services/auditLogService'
import { apiLogger } from '@/lib/logger'

// 資料轉換函數：將資料庫格式轉換為前端格式
function transformFromDB(dbProduct: Record<string, unknown>): Product {
  // 預設圖片對應表
  const defaultImages: { [key: string]: string } = {
    '有機紅肉李': '/images/products/red-plum.jpg',
    '高山烏龍茶': '/images/products/oolong-tea.jpg', 
    '季節蔬菜箱': '/images/products/vegetable-box.jpg',
    '精選茶包': '/images/products/tea_bag_1.jpg'
  }

  // 安全地獲取產品名稱
  const productName = (dbProduct.name as string) || ''
  
  // 取得圖片路徑，優先使用資料庫的值，否則使用預設對應
  let imageUrl = (dbProduct.image_url as string) || defaultImages[productName] || '/images/placeholder.jpg'
  
  // 驗證圖片 URL
  if (!imageUrl || typeof imageUrl !== 'string') {
    imageUrl = '/images/placeholder.jpg'
  }
  
  // 修正錯誤的 Imgur 連結
  if (imageUrl.includes('imgur.com') && !imageUrl.includes('.jpg') && !imageUrl.includes('.png') && !imageUrl.includes('.jpeg') && !imageUrl.includes('.webp')) {
    imageUrl = defaultImages[productName] || '/images/placeholder.jpg'
  }

  return {
    id: String(dbProduct.id || ''),
    name: (dbProduct.name as string) || '',
    description: (dbProduct.description as string) || '',
    price: Number(dbProduct.price) || 0,
    category: (dbProduct.category as string) || '',
    images: imageUrl ? [imageUrl] : [],
    inventory: Number(dbProduct.stock) || 0,
    isActive: Boolean(dbProduct.is_active),
    showInCatalog: dbProduct.show_in_catalog !== false, // 預設為 true
    createdAt: (dbProduct.created_at as string) || new Date().toISOString(),
    updatedAt: (dbProduct.updated_at as string) || new Date().toISOString()
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

    return NextResponse.json({ products: transformedProducts })
  } catch (error) {
    apiLogger.error('Error fetching all products', error as Error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST - 新增產品
async function handlePOST(request: NextRequest) {

  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })
    }

    const productData = await request.json()

    // 轉換資料格式
    const dbProduct: Record<string, unknown> = {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      category: productData.category,
      image_url: productData.images?.[0] || null,
      stock: productData.inventory || 0,
      is_active: productData.isActive !== false
    }

    // 如果前端提供了 ID，使用指定的 ID
    if (productData.id) {
      dbProduct.id = productData.id
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([dbProduct])
      .select()
      .single()

    if (error) throw error

    // 清除產品快取，確保公開 API 能立即看到變更
    try {
      const { CachedProductService } = await import('@/services/cachedProductService')
      await CachedProductService.clearGlobalCache()
    } catch (cacheError) {
      apiLogger.warn('清除產品快取失敗:', cacheError)
      // 不影響主要功能，只記錄警告
    }

    return NextResponse.json({ product: transformFromDB(data) }, { status: 201 })
  } catch (error) {
    apiLogger.error('Error creating product', error as Error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

// PUT - 更新產品
async function handlePUT(request: NextRequest) {

  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })
    }

    const { id, ...productData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // 轉換資料格式
    const dbProduct: Record<string, unknown> = {}
    
    if (productData.name !== undefined) dbProduct.name = productData.name
    if (productData.description !== undefined) dbProduct.description = productData.description
    if (productData.price !== undefined) dbProduct.price = productData.price
    if (productData.category !== undefined) dbProduct.category = productData.category
    if (productData.images && productData.images.length > 0) dbProduct.image_url = productData.images[0]
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

    // 清除產品快取，確保公開 API 能立即看到變更
    try {
      const { CachedProductService } = await import('@/services/cachedProductService')
      await CachedProductService.clearGlobalCache()
    } catch (cacheError) {
      apiLogger.warn('清除產品快取失敗:', cacheError)
      // 不影響主要功能，只記錄警告
    }

    return NextResponse.json({ product: transformFromDB(data) })
  } catch (error) {
    apiLogger.error('Error updating product', error as Error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE - 刪除產品
async function handleDELETE(request: NextRequest) {

  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
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

    // 先刪除 Supabase Storage 中的產品圖片
    let imageDeletionResult: ProductImageDeletionResult
    try {
      apiLogger.info(`🗑️ 開始為產品 ${id} 清理圖片...`)
      imageDeletionResult = await deleteProductImages(id)
      if (imageDeletionResult.success) {
        apiLogger.info(`✅ 產品 ${id} 的圖片清理完成 - 刪除了 ${imageDeletionResult.deletedCount} 個檔案`)
      } else {
        apiLogger.warn(`⚠️ 產品 ${id} 圖片清理失敗: ${imageDeletionResult.error}`)
      }
    } catch (storageError) {
      // 如果函數拋出異常（不應該發生，但作為備用）
      apiLogger.warn(`⚠️ 產品 ${id} 圖片清理過程發生異常:`, storageError)
      imageDeletionResult = {
        success: false,
        productId: id,
        deletedCount: 0,
        deletedFiles: [],
        folderCleanedUp: false,
        error: '圖片清理過程發生異常'
      }
    }

    // 然後刪除資料庫記錄
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error

    // 驗證圖片是否真的被刪除乾淨
    let verificationResult = { verified: false, remainingFiles: [] as any[] }
    if (imageDeletionResult.success && imageDeletionResult.deletedCount > 0) {
      try {
        apiLogger.info(`🔍 驗證產品 ${id} 的圖片是否完全清理...`)
        const remainingImages = await listProductImages(id)
        if (remainingImages.length === 0) {
          apiLogger.info(`✅ 驗證通過：產品 ${id} 的圖片已完全清理`)
          verificationResult.verified = true
        } else {
          apiLogger.warn(`⚠️ 驗證失敗：產品 ${id} 仍有 ${remainingImages.length} 個圖片殘留`)
          verificationResult.remainingFiles = remainingImages
        }
      } catch (verifyError) {
        apiLogger.warn(`⚠️ 無法驗證產品 ${id} 的圖片清理狀態:`, verifyError)
      }
    } else if (imageDeletionResult.deletedCount === 0) {
      // 如果沒有檔案需要刪除，驗證也算通過
      verificationResult.verified = true
    }

    // 記錄審計日誌
    try {
      const auditService = new SupabaseAuditLogService()
      await auditService.log({
        user_id: 'admin-api-key',
        user_email: 'admin@system',
        user_name: 'Admin API',
        user_role: 'admin',
        action: 'delete',
        resource_type: 'product' as any, // 暫時使用 any，稍後會更新 type
        resource_id: id,
        resource_details: productData ? transformFromDB(productData) : {},
        metadata: {
          imageCleanup: imageDeletionResult,
          verification: verificationResult
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        user_agent: request.headers.get('user-agent') || undefined
      })
    } catch (auditError) {
      apiLogger.warn('Failed to log product deletion audit:', auditError)
    }

    // 清除產品快取，確保公開 API 能立即看到變更
    try {
      const { CachedProductService } = await import('@/services/cachedProductService')
      await CachedProductService.clearGlobalCache()
      apiLogger.info('🔄 產品刪除後已清除全域快取')
    } catch (cacheError) {
      apiLogger.warn('清除產品快取失敗:', cacheError)
      // 不影響主要功能，只記錄警告
    }

    return NextResponse.json({ 
      message: 'Product deleted successfully',
      imageCleanup: {
        ...imageDeletionResult,
        verification: verificationResult
      }
    })
  } catch (error) {
    apiLogger.error('Error deleting product', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}

// 套用 Rate Limiting 並導出 API 處理器
const adminRateLimitConfig = {
  maxRequests: 50,
  windowMs: 60 * 1000, // 1 分鐘
  strategy: IdentifierStrategy.API_KEY,
  enableAuditLog: true,
  includeHeaders: true,
  message: '管理員 API 使用頻率超出限制，請稍後重試'
};

export const GET = withRateLimit(handleGET, {
  ...adminRateLimitConfig,
  maxRequests: 100 // GET 請求較寬鬆
});

export const POST = withRateLimit(handlePOST, adminRateLimitConfig);

export const PUT = withRateLimit(handlePUT, adminRateLimitConfig);

export const DELETE = withRateLimit(handleDELETE, {
  ...adminRateLimitConfig,
  maxRequests: 20 // DELETE 請求較嚴格
});