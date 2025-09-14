import { NextRequest } from 'next/server'
import { locationServiceV2Simple as locationServiceAdapter } from '@/services/v2/locationServiceSimple'
import { LocationSchemas } from '@/lib/validation-schemas'
import { ValidationError } from '@/lib/errors'
import { success, created } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/error-handler'
import { apiLogger } from '@/lib/logger'

/**
 * GET /api/locations - 取得地點列表
 */
async function handleGET(request: NextRequest) {
  // 解析查詢參數
  const url = new URL(request.url)
  const queryParams = Object.fromEntries(url.searchParams.entries())

  const result = LocationSchemas.query.safeParse(queryParams)
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`查詢參數驗證失敗: ${errors}`)
  }

  apiLogger.info('查詢地點列表', {
    metadata: { params: result.data },
  })

  const locations = await locationServiceAdapter.getLocations()
  return success(locations, '查詢成功')
}

/**
 * POST /api/locations - 創建地點
 */
async function handlePOST(request: NextRequest) {
  // 解析並驗證請求資料
  const body = await request.json()
  const result = LocationSchemas.create.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('創建地點', {
    metadata: {
      name: result.data.name,
      address: result.data.address,
      coordinates: result.data.coordinates,
    },
  })

  const newLocation = await locationServiceAdapter.addLocation(result.data)
  return created(newLocation, '地點創建成功')
}

// 導出處理器
export const GET = withErrorHandler(handleGET, {
  module: 'LocationAPI',
  enableAuditLog: false,
})

export const POST = withErrorHandler(handlePOST, {
  module: 'LocationAPI',
  enableAuditLog: true,
})
