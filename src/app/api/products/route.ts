import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/productService'
import { withProductsCache } from '@/lib/api-cache-middleware'

async function handleGET() {
  try {
    const products = await productService.getProducts()
    return NextResponse.json(products)
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

// 使用快取中間件包裝 GET 請求
export const GET = withProductsCache(handleGET)
export const POST = withProductsCache(handlePOST)