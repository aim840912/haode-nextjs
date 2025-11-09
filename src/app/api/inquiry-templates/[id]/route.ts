/**
 * 詢價範本詳細 API
 * GET /api/inquiry-templates/[id] - 取得單一範本
 * PUT /api/inquiry-templates/[id] - 更新範本
 * DELETE /api/inquiry-templates/[id] - 刪除範本
 */

import { NextRequest } from 'next/server'
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'
import { success } from '@/lib/api-response'
import { InquiryTemplateSchemas } from '@/lib/validation/domain/inquiry-schemas'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { inquiryTemplateService } from '@/services/core/inquiry/inquiryTemplateService'

/**
 * GET /api/inquiry-templates/[id]
 * 取得單一詢價範本
 */
async function handleGET(request: NextRequest, user: User, context?: unknown) {
  const { id } = await (context as { params: Promise<{ id: string }> }).params

  const template = await inquiryTemplateService.getTemplate(id, user.id)

  if (!template) {
    throw new NotFoundError('範本不存在或無權限查看')
  }

  return success(template, '範本查詢成功')
}

/**
 * PUT /api/inquiry-templates/[id]
 * 更新詢價範本
 */
async function handlePUT(request: NextRequest, user: User, context?: unknown) {
  const { id } = await (context as { params: Promise<{ id: string }> }).params
  const body = await request.json()

  // 驗證請求資料
  const validationResult = InquiryTemplateSchemas.update.safeParse(body)
  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  const validatedData = validationResult.data

  // 更新範本
  const template = await inquiryTemplateService.updateTemplate(id, user.id, validatedData)

  return success(template, '範本更新成功')
}

/**
 * DELETE /api/inquiry-templates/[id]
 * 刪除詢價範本
 */
async function handleDELETE(request: NextRequest, user: User, context?: unknown) {
  const { id } = await (context as { params: Promise<{ id: string }> }).params

  await inquiryTemplateService.deleteTemplate(id, user.id)

  return success(null, '範本刪除成功')
}

// 導出 API 路由處理器
export const GET = withAuthAndError(handleGET, {
  module: 'InquiryTemplateAPI',
  enableAuditLog: false,
})

export const PUT = withAuthAndError(handlePUT, {
  module: 'InquiryTemplateAPI',
  enableAuditLog: true,
})

export const DELETE = withAuthAndError(handleDELETE, {
  module: 'InquiryTemplateAPI',
  enableAuditLog: true,
})
