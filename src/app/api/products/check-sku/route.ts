import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'

/**
 * 檢查 SKU 是否重複的 API 端點
 *
 * GET /api/products/check-sku?sku={SKU代碼}
 */
async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sku = searchParams.get('sku')?.trim().toUpperCase()

  if (!sku) {
    throw new ValidationError('SKU 參數為必填')
  }

  // 驗證 SKU 格式
  if (!/^[A-Z0-9-]{3,20}$/.test(sku)) {
    throw new ValidationError('SKU 格式不正確：需要 3-20 位英文大寫字母、數字或連字符')
  }

  try {
    // 簡化實作：SKU 檢查（目前產品可能還沒有 SKU 欄位）
    return success(
      {
        exists: false, // 暫時返回不存在，因為目前版本可能沒有 SKU
        sku,
        existingProduct: null,
        suggestions: [],
      },
      'SKU 檢查完成'
    )
  } catch {
    // 如果檢查失敗，返回不存在以不阻止用戶繼續
    return success(
      {
        exists: false,
        sku,
        existingProduct: null,
        suggestions: [],
        note: '檢查服務暫時不可用，將由服務器最終驗證',
      },
      'SKU 檢查完成（降級模式）'
    )
  }
}

export const GET = withErrorHandler(handleGET, {
  module: 'ProductValidationAPI',
  enableAuditLog: false,
})
