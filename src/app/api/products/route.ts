import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/productService'
import { withProductsCache } from '@/lib/api-cache-middleware'

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'
    const timestamp = searchParams.get('t')
    
    
    const products = isAdmin && productService.getAllProducts ? 
      await productService.getAllProducts() : 
      await productService.getProducts()
    
    
    const response = NextResponse.json(products)
    
    // 加入 no-cache 標頭確保資料是最新的
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    
    return response
  } catch (error) {
    console.error('Error fetching products:', error)
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
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

// 暫時繞過快取中間件進行測試
export const GET = handleGET
export const POST = withProductsCache(handlePOST)