/**
 * KPI 報告 API 路由
 * 提供關鍵性能指標監控報告給管理員儀表板
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { generateKPIReport } from '@/services/infrastructure/kpiMonitoringService'

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
