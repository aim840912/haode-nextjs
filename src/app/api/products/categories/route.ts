import { NextRequest } from 'next/server'
import { supabaseProductService } from '@/services/supabaseProductService'
import { withErrorHandler } from '@/lib/error-handler'
import { success } from '@/lib/api-response'

async function handleGET() {
  const products = await supabaseProductService.getProducts()

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
