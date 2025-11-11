/**
 * 使用詢價範本 API
 * POST /api/inquiry-templates/[id]/use - 使用範本（轉換為表單資料並增加使用次數）
 */

import { NextRequest } from 'next/server'
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'
import { success } from '@/lib/api-response'
import { inquiryTemplateService } from '@/services/core/inquiry/inquiryTemplateService'

/**
 * POST /api/inquiry-templates/[id]/use
 * 使用詢價範本
 *
 * 此 API 會：
 * 1. 取得範本資料
 * 2. 轉換為詢價表單資料格式
 * 3. 增加範本的使用次數
 * 4. 更新最後使用時間
 */
async function handlePOST(request: NextRequest, user: User, context?: unknown) {
  const { id } = await (context as { params: Promise<{ id: string }> }).params

  // 使用範本（取得表單資料並更新使用統計）
  const formData = await inquiryTemplateService.useTemplate(id, user.id)

  return success(formData, '範本已套用，使用次數已更新。請檢查自動填入的資料並視需要修改。')
}

// 導出 API 路由處理器
export const POST = withAuthAndError(handlePOST, {
  module: 'InquiryTemplateAPI',
  enableAuditLog: false, // 使用範本不需要記錄到 audit log
})
