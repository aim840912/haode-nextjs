/**
 * 指標收集中間件
 * 自動記錄 API 請求和回應時間
 */

import { NextRequest } from 'next/server'
import { recordApiRequest } from '@/lib/metrics'

export function withMetrics<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const startTime = Date.now()
    const method = request.method
    const pathname = new URL(request.url).pathname

    try {
      const response = await handler(request, ...args)
      const duration = Date.now() - startTime

      // 記錄成功的 API 請求
      recordApiRequest(method, pathname, duration, response.status)

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      // 記錄失敗的 API 請求（假設是 500 錯誤）
      recordApiRequest(method, pathname, duration, 500)

      throw error
    }
  }
}

/**
 * 為現有的錯誤處理中間件添加指標收集功能
 */
export function enhanceErrorHandlerWithMetrics<T extends unknown[]>(
  wrappedHandler: (request: NextRequest, ...args: T) => Promise<Response>
) {
  return withMetrics(wrappedHandler)
}
