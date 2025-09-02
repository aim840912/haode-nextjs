import { NextRequest } from 'next/server'
import { getScheduleService } from '@/services/serviceFactory'
import { ScheduleSchemas } from '@/lib/validation-schemas'
import { ValidationError } from '@/lib/errors'
import { success, created } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/error-handler'
import { apiLogger } from '@/lib/logger'

/**
 * GET /api/schedule - 取得行程列表
 */
async function handleGET(request: NextRequest) {
  // 解析查詢參數
  const url = new URL(request.url)
  const queryParams = Object.fromEntries(url.searchParams.entries())

  const result = ScheduleSchemas.query.safeParse(queryParams)
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`查詢參數驗證失敗: ${errors}`)
  }

  apiLogger.info('查詢行程列表', {
    metadata: { params: result.data },
  })

  const scheduleService = await getScheduleService()
  const schedule = await scheduleService.getSchedule()
  return success(schedule, '查詢成功')
}

/**
 * POST /api/schedule - 創建行程
 */
async function handlePOST(request: NextRequest) {
  // 解析並驗證請求資料
  const body = await request.json()
  const result = ScheduleSchemas.create.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('創建行程', {
    metadata: {
      title: result.data.title,
      location: result.data.location,
      date: result.data.date,
      time: result.data.time,
    },
  })

  const scheduleService = await getScheduleService()
  const scheduleItem = await scheduleService.addSchedule(result.data)
  return created(scheduleItem, '行程創建成功')
}

// 導出處理器
export const GET = withErrorHandler(handleGET, {
  module: 'ScheduleAPI',
  enableAuditLog: false,
})

export const POST = withErrorHandler(handlePOST, {
  module: 'ScheduleAPI',
  enableAuditLog: true,
})
