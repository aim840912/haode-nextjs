/**
 * 監控服務統一導出
 *
 * 提供統一的監控服務入口點
 */

// 導出類型
export * from './types'

// 導出 Collectors
export * from './collectors'

// 導出 MonitoringService
export * from './MonitoringServiceImpl'

// 註冊所有 Collectors
import { monitoringService } from './MonitoringServiceImpl'
import { rateLimitCollector } from './collectors/RateLimitCollectorImpl'
import { kpiCollector } from './collectors/KPICollectorImpl'
import { auditCollector } from './collectors/AuditCollectorImpl'

// 自動註冊 Collectors
monitoringService.registerCollector(rateLimitCollector)
monitoringService.registerCollector(kpiCollector)
monitoringService.registerCollector(auditCollector)

/**
 * 便利函數：取得已配置的監控服務
 */
export function getMonitoringService() {
  return monitoringService
}

/**
 * 便利函數：生成快速健康檢查報告
 */
export async function getHealthCheck() {
  return monitoringService.generateReport('summary', {
    days: 1,
    includeDetails: false,
  })
}

/**
 * 便利函數：取得所有活躍警報
 */
export async function getActiveAlerts() {
  return monitoringService.getAlerts()
}

/**
 * 便利函數：取得關鍵警報（Critical + High）
 */
export async function getCriticalAlerts() {
  const allAlerts = await monitoringService.getAlerts()
  return allAlerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high')
}
