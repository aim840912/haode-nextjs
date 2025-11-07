/**
 * KPI 報告 API 路由
 * 提供關鍵性能指標監控報告給管理員儀表板
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { generateKPIReport } from '@/services/infrastructure/kpiMonitoringService'

/**
 * @api {GET} /api/admin/kpi-report 取得 KPI 監控報告
 * @apiName GetKPIReport
 * @apiGroup Admin
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 生成關鍵性能指標（KPI）監控報告。
 * 包含系統健康分數、效能指標、警報資訊等。
 *
 * @apiPermission admin
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data KPI 報告資料
 * @apiSuccess {Object[]} data.measurements 指標測量資料
 * @apiSuccess {Object[]} data.alerts 警報列表
 * @apiSuccess {Number} data.overallHealthScore 整體健康分數
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "measurements": [...],
 *     "alerts": [],
 *     "overallHealthScore": 95
 *   },
 *   "message": "KPI 監控報告取得成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} AuthorizationError 需要管理員權限
 */
async function handleGET(request: NextRequest, user: User & { isAdmin: true }) {
  apiLogger.info('管理員查詢 KPI 報告', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
    },
  })

  // 生成 KPI 監控報告
  const report = await generateKPIReport()

  apiLogger.info('KPI 報告生成完成', {
    metadata: {
      userId: user.id,
      measurementsCount: report.measurements.length,
      alertsCount: report.alerts.length,
      healthScore: report.overallHealthScore,
    },
  })

  return success(report, 'KPI 監控報告取得成功')
}

// 導出處理器 - 使用組合函數：權限檢查 + 錯誤處理
export const GET = withAdminAndError(handleGET, { module: 'KPIReportAPI' })
