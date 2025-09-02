import { NextRequest } from 'next/server'
import { getFarmTourService } from '@/services/serviceFactory'
import { withErrorHandler } from '@/lib/error-handler'
import { success, created } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { FarmTourActivitySchemas } from '@/lib/validation-schemas'
import { apiLogger } from '@/lib/logger'

// GET - 獲取所有農場體驗活動
async function handleGET() {
  const farmTourService = await getFarmTourService()
  const activities = await farmTourService.getAll()
  
  apiLogger.info('農場體驗活動清單查詢成功', {
    metadata: { count: activities.length }
  })
  
  return success(activities, '農場體驗活動清單取得成功')
}

// POST - 新增農場體驗活動
async function handlePOST(request: NextRequest) {
  // 解析並驗證請求資料
  const body = await request.json()
  const result = FarmTourActivitySchemas.create.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('建立農場體驗活動', {
    metadata: {
      title: result.data.title,
      season: result.data.season,
      price: result.data.price,
      available: result.data.available
    }
  })

  const farmTourService = await getFarmTourService()
  const newActivity = await farmTourService.create(result.data)
  
  return created(newActivity, '農場體驗活動建立成功')
}

// 導出處理器 - 套用錯誤處理中間件
export const GET = withErrorHandler(handleGET, {
  module: 'FarmTourAPI',
  enableAuditLog: false
})

export const POST = withErrorHandler(handlePOST, {
  module: 'FarmTourAPI',
  enableAuditLog: true
})