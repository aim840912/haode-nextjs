import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { apiLogger } from '@/lib/logger'

/**
 * CSP 違規報告端點
 * 處理瀏覽器發送的 Content Security Policy 違規報告
 */
async function handleCSPReport(request: NextRequest) {
  try {
    const report = await request.json()

    // 記錄 CSP 違規
    apiLogger.warn('CSP 違規檢測', {
      module: 'SecurityAPI',
      action: 'csp_violation',
      metadata: {
        violatedDirective: report['csp-report']?.['violated-directive'],
        blockedUri: report['csp-report']?.['blocked-uri'],
        documentUri: report['csp-report']?.['document-uri'],
        sourceFile: report['csp-report']?.['source-file'],
        lineNumber: report['csp-report']?.['line-number'],
        columnNumber: report['csp-report']?.['column-number'],
        originalPolicy: report['csp-report']?.['original-policy'],
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
      },
    })

    // 如果是高風險違規（可能的攻擊），記錄為錯誤
    const blockedUri = report['csp-report']?.['blocked-uri']
    const isHighRisk =
      blockedUri &&
      (blockedUri.includes('javascript:') ||
        blockedUri.includes('data:text/html') ||
        blockedUri.includes('eval') ||
        blockedUri.match(/https?:\/\/(?!.*\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$)/))

    if (isHighRisk) {
      apiLogger.error(
        '高風險 CSP 違規 - 可能的攻擊嘗試',
        new Error('High risk CSP violation detected'),
        {
          module: 'SecurityAPI',
          action: 'potential_attack',
          metadata: {
            blockedUri,
            documentUri: report['csp-report']?.['document-uri'],
            violatedDirective: report['csp-report']?.['violated-directive'],
            userAgent: request.headers.get('user-agent'),
            clientIp: request.headers.get('x-forwarded-for') || 'unknown',
          },
        }
      )
    }

    // 在開發環境輸出詳細資訊
    if (process.env.NODE_ENV === 'development') {
      apiLogger.info('CSP 違規報告詳細資訊', {
        module: 'SecurityAPI',
        action: 'csp_report_detail',
        metadata: {
          report: JSON.stringify(report, null, 2),
        },
      })
    }

    // 返回 204 No Content（標準做法）
    return new Response(null, { status: 204 })
  } catch (error) {
    // 記錄處理錯誤但不拋出，避免影響報告機制
    apiLogger.error('CSP 報告處理失敗', error as Error, {
      module: 'SecurityAPI',
      action: 'report_processing_error',
      metadata: {
        userAgent: request.headers.get('user-agent'),
      },
    })

    return new Response(null, { status: 204 })
  }
}

// 只允許 POST 請求
export const POST = withErrorHandler(handleCSPReport, {
  module: 'SecurityAPI',
  enableAuditLog: true,
})

// 不支援其他 HTTP 方法
async function handleUnsupportedMethod(request: NextRequest): Promise<never> {
  const { MethodNotAllowedError } = await import('@/lib/errors')
  throw new MethodNotAllowedError(`不支援的方法: ${request.method}`)
}

export const GET = withErrorHandler(handleUnsupportedMethod, { module: 'SecurityAPI' })
export const PUT = withErrorHandler(handleUnsupportedMethod, { module: 'SecurityAPI' })
export const DELETE = withErrorHandler(handleUnsupportedMethod, { module: 'SecurityAPI' })
export const PATCH = withErrorHandler(handleUnsupportedMethod, { module: 'SecurityAPI' })
