import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { success } from '@/lib/api-response'

async function handleGET() {
  // 先返回一個簡單的測試回應
  return success(
    {
      status: 'ok',
      message: 'Metrics API is working',
      timestamp: new Date().toISOString(),
    },
    '指標 API 測試成功'
  )
}

export const GET = withErrorHandler(handleGET, {
  module: 'MetricsAPI',
  enableAuditLog: false,
})
