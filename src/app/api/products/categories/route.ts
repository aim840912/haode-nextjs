import { adminProductService } from '@/services/core/product/productService'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { success } from '@/lib/api-response'
import { getDefaultCategories } from '@/constants/productCategories'

async function handleGET() {
  const products = await adminProductService.getProducts()

  // 提取所有唯一的分類
  const existingCategories = [...new Set(products.map(product => product.category))]
    .filter(category => category && category.trim() !== '')
    .sort()

  // 如果沒有現有分類，返回預設分類
  if (existingCategories.length === 0) {
    const defaultCategories = getDefaultCategories()
    return success(defaultCategories, '成功取得產品分類（使用預設分類）')
  }

  // 合併現有分類和預設分類，去重並排序
  const defaultCategories = getDefaultCategories()
  const allCategories = [...new Set([...existingCategories, ...defaultCategories])].sort()

  return success(allCategories, '成功取得產品分類')
}

export const GET = withErrorHandler(handleGET, {
  module: 'ProductCategories',
  enableAuditLog: false,
})
