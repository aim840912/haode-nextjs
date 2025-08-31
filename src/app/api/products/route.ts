import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/productService'
import { withProductsCache } from '@/lib/api-cache-middleware'
import { apiLogger } from '@/lib/logger'

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'
    const timestamp = searchParams.get('t')
    const nocache = searchParams.get('nocache') === 'true'
    
    let products: any[]
    
    if (nocache) {
      // 繞過快取，直接從資料庫獲取
      apiLogger.debug('繞過快取，直接查詢資料庫', { metadata: { nocache: true } })
      
      // 如果要繞過快取，我們需要直接使用基礎服務
      const { getProductService } = await import('@/services/serviceFactory')
      const baseService = await getProductService()
      
      // 如果是 CachedProductService，獲取其基礎服務
      if ('baseService' in baseService && (baseService as any).baseService) {
        const cachedService = baseService as any
        products = isAdmin && cachedService.baseService.getAllProducts ? 
          await cachedService.baseService.getAllProducts() : 
          await cachedService.baseService.getProducts()
      } else {
        // 直接是基礎服務
        products = isAdmin && baseService.getAllProducts ? 
          await baseService.getAllProducts() : 
          await baseService.getProducts()
      }
    } else {
      // 正常使用快取
      products = isAdmin && productService.getAllProducts ? 
        await productService.getAllProducts() : 
        await productService.getProducts()
    }
    
    const response = NextResponse.json(products)
    
    // 加入 no-cache 標頭確保資料是最新的
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    // 如果是繞過快取的請求，在 header 中標記
    if (nocache) {
      response.headers.set('X-Cache-Bypassed', 'true')
    }
    
    return response
  } catch (error) {
    const nocache = new URL(request.url).searchParams.get('nocache') === 'true'
    apiLogger.error('Error fetching products', error as Error, { metadata: { nocache } })
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const product = await productService.addProduct(body)
    
    // 清除產品快取，確保變更立即生效
    try {
      const { CachedProductService } = await import('@/services/cachedProductService')
      await CachedProductService.clearGlobalCache()
      apiLogger.info('產品新增後已清除全域快取', { metadata: { action: 'product_created' } })
    } catch (cacheError) {
      apiLogger.warn('清除產品快取失敗', { metadata: { error: (cacheError as Error).message } })
    }
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    apiLogger.error('Error creating product', error as Error, { metadata: { action: 'create_product' } })
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

// 暫時繞過快取中間件進行測試
export const GET = handleGET
export const POST = withProductsCache(handlePOST)