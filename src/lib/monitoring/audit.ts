/**
 * 審計統計工具函數
 *
 * 薄包裝層：直接代理 SupabaseAuditStatsService
 * 提供統一的參數格式和過濾邏輯
 */

import { SupabaseAuditStatsService } from '@/services/infrastructure/auditStatsService'
import type {
  FormattedAuditStats,
  FormattedUserActivityStats,
  FormattedResourceAccessStats,
} from '@/types/audit-stats'

// === 類型定義 ===

export interface AuditStatsParams {
  days?: number
  startDate?: string
  endDate?: string
  limit?: number
}

export interface UserActivityParams extends AuditStatsParams {
  userId?: string
  userRole?: string
  minActions?: number
}

export interface ResourceAccessParams extends AuditStatsParams {
  resourceType?: string
  resourceId?: string
  minAccess?: number
}

// === 服務實例 ===

const auditStatsService = new SupabaseAuditStatsService()

// === 核心函數 (直接代理) ===

/**
 * 取得審計統計
 */
export async function getAuditStats(params?: AuditStatsParams): Promise<FormattedAuditStats[]> {
  return auditStatsService.getAuditStats({
    days: params?.days,
    start_date: params?.startDate,
    end_date: params?.endDate,
  })
}

/**
 * 取得使用者活動統計
 */
export async function getUserActivityStats(
  params?: UserActivityParams
): Promise<FormattedUserActivityStats[]> {
  const result = await auditStatsService.getUserActivityStats({
    days: params?.days,
    start_date: params?.startDate,
    end_date: params?.endDate,
  })

  // 應用過濾
  let filtered = result

  if (params?.userId) {
    filtered = filtered.filter(stat => stat.user_id === params.userId)
  }

  if (params?.userRole) {
    filtered = filtered.filter(stat => stat.user_role === params.userRole)
  }

  if (params?.minActions !== undefined) {
    filtered = filtered.filter(stat => stat.total_actions >= params.minActions!)
  }

  if (params?.limit) {
    filtered = filtered.slice(0, params.limit)
  }

  return filtered
}

/**
 * 取得資源存取統計
 */
export async function getResourceAccessStats(
  params?: ResourceAccessParams
): Promise<FormattedResourceAccessStats[]> {
  const result = await auditStatsService.getResourceAccessStats({
    days: params?.days,
    start_date: params?.startDate,
    end_date: params?.endDate,
  })

  // 應用過濾
  let filtered = result

  if (params?.resourceType) {
    filtered = filtered.filter(stat => stat.resource_type === params.resourceType)
  }

  if (params?.resourceId) {
    filtered = filtered.filter(stat => stat.resource_id === params.resourceId)
  }

  if (params?.minAccess !== undefined) {
    filtered = filtered.filter(stat => stat.access_count >= params.minAccess!)
  }

  if (params?.limit) {
    filtered = filtered.slice(0, params.limit)
  }

  return filtered
}
