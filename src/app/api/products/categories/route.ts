// import { NextRequest } from 'next/server' // 未使用
import { adminProductService } from '@/services/core/product/productService'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { success } from '@/lib/api-response'

async function handleGET() {
  const products = await adminProductService.getProducts()

  // 提取所有唯一的分類
  const categories = [...new Set(products.map(product => product.category))]
    .filter(category => category && category.trim() !== '')
    .sort()

  return success(categories, '成功取得產品分類')
}

export const GET = withErrorHandler(handleGET, {
  module: 'ProductCategories',
  enableAuditLog: false,
})
