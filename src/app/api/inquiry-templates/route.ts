/**
 * 詢價範本 API
 * GET /api/inquiry-templates - 列出使用者的範本
 * POST /api/inquiry-templates - 建立新範本
 */

import { NextRequest } from 'next/server'
import { success, created } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'
import { InquiryTemplateSchemas } from '@/lib/validation/domain/inquiry-schemas'
import { inquiryTemplateService } from '@/services/core/inquiry/inquiryTemplateService'
import { InquiryTemplateQueryParams } from '@/types/inquiry-template'

/**
 * GET /api/inquiry-templates
 * 列出使用者的詢價範本
 */
async function handleGET(request: NextRequest, user: User) {
  const { searchParams } = new URL(request.url)

  // 解析查詢參數
  const queryParams: InquiryTemplateQueryParams = {
    inquiry_type: (searchParams.get('inquiry_type') || undefined) as
      | 'product'
      | 'farm_tour'
      | undefined,
    is_active: searchParams.has('is_active') ? searchParams.get('is_active') === 'true' : undefined,
    is_favorite: searchParams.has('is_favorite')
      ? searchParams.get('is_favorite') === 'true'
      : undefined,
    limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    offset: searchParams.has('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    sort_by: (searchParams.get('sort_by') || undefined) as any,
    sort_order: (searchParams.get('sort_order') || undefined) as 'asc' | 'desc' | undefined,
  }

  // 驗證查詢參數
  const validationResult = InquiryTemplateSchemas.query.safeParse(queryParams)
  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`查詢參數驗證失敗: ${errors}`)
  }

  const validatedParams = validationResult.data

  // 查詢範本
  const templates = await inquiryTemplateService.listTemplates(user.id, validatedParams)

  return success(
    {
      templates,
      pagination: {
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        total: templates.length,
      },
    },
    '範本列表查詢成功'
  )
}

/**
 * POST /api/inquiry-templates
 * 建立新詢價範本
 */
async function handlePOST(request: NextRequest, user: User) {
  const body = await request.json()

  // 驗證請求資料
  const validationResult = InquiryTemplateSchemas.create.safeParse(body)
  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  const validatedData = validationResult.data

  // 建立範本
  const template = await inquiryTemplateService.createTemplate(user.id, validatedData)

  return created(template, '範本建立成功')
}

// 導出 API 路由處理器
export const GET = withAuthAndError(handleGET, {
  module: 'InquiryTemplateAPI',
  enableAuditLog: false,
})

export const POST = withAuthAndError(handlePOST, {
  module: 'InquiryTemplateAPI',
  enableAuditLog: true,
})
