/**
 * @api {post} /api/security/csp-report 接收 CSP 違規報告
 * @apiName ReportCSPViolation
 * @apiGroup Security
 * @apiPermission public
 *
 * @apiDescription 接收瀏覽器發送的 Content Security Policy 違規報告，並記錄到日誌系統。高風險違規會被標記為潛在攻擊
 *
 * @apiBody {Object} csp-report CSP 違規報告物件（由瀏覽器自動生成）
 * @apiBody {String} csp-report.violated-directive 違反的 CSP 指令
 * @apiBody {String} csp-report.blocked-uri 被阻止的 URI
 * @apiBody {String} csp-report.document-uri 發生違規的頁面 URI
 * @apiBody {String} [csp-report.source-file] 違規的來源檔案
 * @apiBody {Number} [csp-report.line-number] 違規的行號
 * @apiBody {Number} [csp-report.column-number] 違規的列號
 * @apiBody {String} csp-report.original-policy 原始 CSP 政策
 *
 * @apiSuccess (204) {Empty} - 無內容（報告已成功接收）
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 204 No Content
 *
 * @apiExample {json} 請求範例:
 * POST /api/security/csp-report
 * {
 *   "csp-report": {
 *     "violated-directive": "script-src 'self'",
 *     "blocked-uri": "https://malicious-site.com/script.js",
 *     "document-uri": "https://example.com/page",
 *     "source-file": "https://example.com/app.js",
 *     "line-number": 42,
 *     "column-number": 15,
 *     "original-policy": "default-src 'self'; script-src 'self'"
 *   }
 * }
 *
 * @apiNote 此端點由瀏覽器自動呼叫，不需要手動發送請求。高風險違規（如 javascript:、data:text/html、eval）會被標記並記錄為潛在攻擊
 */

import { NextRequest } from 'next/server'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'

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
