/**
 * 審計統計專用類型定義
 * 專門為統計服務設計的介面和類型
 */

import { AuditAction, ResourceType, UserRole } from './audit'

// 基礎統計查詢參數
export interface BaseStatsQueryParams {
  days?: number
  start_date?: string
  end_date?: string
}

// 審計統計資料介面 - 與資料庫 RPC 返回格式對應
export interface AuditStatsData {
  action: string
  resource_type: string
  user_role?: string
  count: number
  unique_users: number
  date: string
}

// 格式化後的審計統計介面
export interface FormattedAuditStats {
  action: AuditAction
  resource_type: ResourceType
  user_role?: UserRole
  count: number
  unique_users: number
  date: string
}

// 使用者活動統計資料介面 - 與資料庫 RPC 返回格式對應
export interface UserActivityStatsData {
  user_id: string
  user_email: string
  user_name?: string
  user_role?: string
  total_actions: number
  view_count: number
  update_count: number
  delete_count: number
  last_activity: string
  first_activity: string
}

// 格式化後的使用者活動統計介面
export interface FormattedUserActivityStats {
  user_id: string
  user_email: string
  user_name?: string
  user_role?: UserRole
  total_actions: number
  view_count: number
  update_count: number
  delete_count: number
  last_activity: string
  first_activity: string
}

// 資源存取統計資料介面 - 與資料庫 RPC 返回格式對應
export interface ResourceAccessStatsData {
  resource_type: string
  resource_id: string
  access_count: number
  unique_users: number
  actions_performed: string[]
  last_accessed: string
  first_accessed: string
}

// 格式化後的資源存取統計介面
export interface FormattedResourceAccessStats {
  resource_type: ResourceType
  resource_id: string
  access_count: number
  unique_users: number
  actions_performed: AuditAction[]
  last_accessed: string
  first_accessed: string
}

// 審計統計服務介面
export interface AuditStatsService {
  // 取得審計統計
  getAuditStats(params?: BaseStatsQueryParams): Promise<FormattedAuditStats[]>

  // 取得使用者活動統計
  getUserActivityStats(params?: BaseStatsQueryParams): Promise<FormattedUserActivityStats[]>

  // 取得資源存取統計
  getResourceAccessStats(params?: BaseStatsQueryParams): Promise<FormattedResourceAccessStats[]>

  // 取得使用者歷史統計
  getUserHistory(userId: string, limit?: number, offset?: number): Promise<FormattedUserActivityStats[]>

  // 取得資源存取歷史
  getResourceHistory(
    resourceType: ResourceType,
    resourceId: string,
    limit?: number
  ): Promise<FormattedResourceAccessStats[]>
}

// 統計資料轉換工具類型
export interface StatsTransformer {
  // 轉換審計統計資料
  transformAuditStats(rawData: AuditStatsData[]): FormattedAuditStats[]

  // 轉換使用者活動統計資料
  transformUserActivityStats(rawData: UserActivityStatsData[]): FormattedUserActivityStats[]

  // 轉換資源存取統計資料
  transformResourceAccessStats(rawData: ResourceAccessStatsData[]): FormattedResourceAccessStats[]
}

// RPC 調用參數類型
export interface AuditStatsRpcParams {
  p_days?: number
  p_start_date?: string
  p_end_date?: string
  p_user_id?: string
  p_resource_type?: string
  p_resource_id?: string
  p_limit?: number
  p_offset?: number
}

// 統計查詢結果類型
export interface StatsQueryResult<T> {
  data: T[]
  error?: Error
  count?: number
}