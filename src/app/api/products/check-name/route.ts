import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'

/**
 * 檢查產品名稱是否重複的 API 端點
 *
 * GET /api/products/check-name?name={產品名稱}
 */
async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')?.trim()

  if (!name) {
    throw new ValidationError('產品名稱參數為必填')
  }

  if (name.length < 2) {
    throw new ValidationError('產品名稱至少需要 2 個字元')
  }

  try {
    // 使用現有 API 搜尋產品（簡化實作）
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/products?search=${encodeURIComponent(name)}`,
      {
        method: 'GET',
      }
    )

    let exactMatch = false
    if (response.ok) {
      const data = await response.json()
      const products = data.data || []

      // 檢查是否有完全相同的名稱
      exactMatch = products.some(
        (product: any) => product.name.toLowerCase().trim() === name.toLowerCase().trim()
      )
    }

    return success(
      {
        exists: exactMatch,
        name,
        suggestions: exactMatch ? [`${name} (特別版)`, `${name} (新款)`, `${name} V2`] : [],
        similarProducts: [],
      },
      '產品名稱檢查完成'
    )
  } catch (error) {
    // 如果檢查失敗，返回不存在以不阻止用戶繼續
    return success(
      {
        exists: false,
        name,
        suggestions: [],
        similarProducts: [],
        note: '檢查服務暫時不可用，將由服務器最終驗證',
      },
      '產品名稱檢查完成（降級模式）'
    )
  }
}

// 使用 GET 方法以支援簡單查詢
export const GET = withErrorHandler(handleGET, {
  module: 'ProductValidationAPI',
  enableAuditLog: false, // 名稱檢查不需要審計日誌
})
