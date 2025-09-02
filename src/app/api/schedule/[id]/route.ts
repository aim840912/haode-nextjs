import { NextRequest } from 'next/server'
import { scheduleService } from '@/services/scheduleService'
import { ScheduleSchemas, CommonValidations } from '@/lib/validation-schemas'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { success } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/error-handler'
import { apiLogger } from '@/lib/logger'

/**
 * GET /api/schedule/[id] - 取得單一行程
 */
async function handleGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 驗證 UUID 格式
  const result = CommonValidations.uuidParam.safeParse({ id })
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  apiLogger.info('查詢單一行程', {
    metadata: { scheduleId: id },
  })

  const scheduleItem = await scheduleService.getScheduleById(id)
  if (!scheduleItem) {
    throw new NotFoundError('行程不存在')
  }

  return success(scheduleItem, '查詢成功')
}

/**
 * PUT /api/schedule/[id] - 更新行程
 */
async function handlePUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 驗證 UUID 格式
  const paramResult = CommonValidations.uuidParam.safeParse({ id })
  if (!paramResult.success) {
    const errors = paramResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  // 解析並驗證請求資料
  const body = await request.json()
  const result = ScheduleSchemas.update.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('更新行程', {
    metadata: {
      scheduleId: id,
      changes: Object.keys(result.data),
    },
  })

  const scheduleItem = await scheduleService.updateSchedule(id, result.data)

  return success(scheduleItem, '行程更新成功')
}

/**
 * DELETE /api/schedule/[id] - 刪除行程
 */
async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 驗證 UUID 格式
  const result = CommonValidations.uuidParam.safeParse({ id })
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  apiLogger.info('刪除行程', {
    metadata: { scheduleId: id },
  })

  await scheduleService.deleteSchedule(id)

  return success({ id }, '行程刪除成功')
}

// 導出處理器
export const GET = withErrorHandler(handleGET, {
  module: 'ScheduleAPI',
  enableAuditLog: false,
})

export const PUT = withErrorHandler(handlePUT, {
  module: 'ScheduleAPI',
  enableAuditLog: true,
})

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'ScheduleAPI',
  enableAuditLog: true,
})
