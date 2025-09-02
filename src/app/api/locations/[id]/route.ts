import { NextRequest } from 'next/server'
import { locationService } from '@/services/locationService'
import { LocationSchemas } from '@/lib/validation-schemas'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { success } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/error-handler'
import { apiLogger } from '@/lib/logger'
import { z } from 'zod'

// 數字 ID 驗證 Schema
const NumericIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID 必須是有效的數字')
    .transform(val => parseInt(val)),
})

/**
 * GET /api/locations/[id] - 取得單一地點
 */
async function handleGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 驗證數字 ID 格式
  const result = NumericIdSchema.safeParse({ id })
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  apiLogger.info('查詢單一地點', {
    metadata: { locationId: result.data.id },
  })

  const location = await locationService.getLocationById(result.data.id)
  if (!location) {
    throw new NotFoundError('地點不存在')
  }

  return success(location, '查詢成功')
}

/**
 * PUT /api/locations/[id] - 更新地點
 */
async function handlePUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 驗證數字 ID 格式
  const paramResult = NumericIdSchema.safeParse({ id })
  if (!paramResult.success) {
    const errors = paramResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  // 解析並驗證請求資料
  const body = await request.json()
  const result = LocationSchemas.update.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('更新地點', {
    metadata: {
      locationId: paramResult.data.id,
      changes: Object.keys(result.data),
    },
  })

  const updatedLocation = await locationService.updateLocation(paramResult.data.id, result.data)

  return success(updatedLocation, '地點更新成功')
}

/**
 * DELETE /api/locations/[id] - 刪除地點
 */
async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 驗證數字 ID 格式
  const result = NumericIdSchema.safeParse({ id })
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  apiLogger.info('刪除地點', {
    metadata: { locationId: result.data.id },
  })

  await locationService.deleteLocation(result.data.id)

  return success({ id: result.data.id }, '地點刪除成功')
}

// 導出處理器
export const GET = withErrorHandler(handleGET, {
  module: 'LocationAPI',
  enableAuditLog: false,
})

export const PUT = withErrorHandler(handlePUT, {
  module: 'LocationAPI',
  enableAuditLog: true,
})

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'LocationAPI',
  enableAuditLog: true,
})
