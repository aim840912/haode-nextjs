/**
 * 審計統計服務實作
 * 專門處理審計統計查詢和資料轉換
 * 從 auditLogService 分離出來，實現單一職責原則
 */

import { getSupabaseAdmin } from '@/lib/supabase-auth'
import { dbLogger } from '@/lib/logger'
import {
  AuditStatsService,
  FormattedAuditStats,
  FormattedUserActivityStats,
  FormattedResourceAccessStats,
  AuditStatsData,
  UserActivityStatsData,
  ResourceAccessStatsData,
  BaseStatsQueryParams,
  StatsTransformer,
  // StatsQueryResult, // 未使用
} from '@/types/audit-stats'
import { ResourceType, AuditTypeGuards } from '@/types/audit'

// 統計資料轉換工具類別
class StatsTransformerImpl implements StatsTransformer {
  // 轉換審計統計資料
  transformAuditStats(rawData: AuditStatsData[]): FormattedAuditStats[] {
    return rawData.map(item => ({
      action: AuditTypeGuards.toAuditAction(item.action) || 'view',
      resource_type: AuditTypeGuards.toResourceType(item.resource_type) || 'inquiry',
      user_role: AuditTypeGuards.toUserRole(item.user_role),
      count: item.count,
      unique_users: item.unique_users,
      date: item.date,
    }))
  }

  // 轉換使用者活動統計資料
  transformUserActivityStats(rawData: UserActivityStatsData[]): FormattedUserActivityStats[] {
    return rawData.map(item => ({
      user_id: item.user_id,
      user_email: item.user_email,
      user_name: item.user_name,
      user_role: AuditTypeGuards.toUserRole(item.user_role),
      total_actions: item.total_actions,
      view_count: item.view_count,
      update_count: item.update_count,
      delete_count: item.delete_count,
      last_activity: item.last_activity,
      first_activity: item.first_activity,
    }))
  }

  // 轉換資源存取統計資料
  transformResourceAccessStats(rawData: ResourceAccessStatsData[]): FormattedResourceAccessStats[] {
    return rawData.map(item => ({
      resource_type: AuditTypeGuards.toResourceType(item.resource_type) || 'inquiry',
      resource_id: item.resource_id,
      access_count: item.access_count,
      unique_users: item.unique_users,
      actions_performed: item.actions_performed
        .map(action => AuditTypeGuards.toAuditAction(action))
        .filter(action => action !== null) as any[],
      last_accessed: item.last_accessed,
      first_accessed: item.first_accessed,
    }))
  }
}

// Supabase 審計統計服務實作
export class SupabaseAuditStatsService implements AuditStatsService {
  private transformer: StatsTransformer = new StatsTransformerImpl()

  // 取得審計統計 - 從 audit_logs 資料表直接聚合
  async getAuditStats(params?: BaseStatsQueryParams): Promise<FormattedAuditStats[]> {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client 未配置')
    }

    try {
      const days = params?.days || 30
      const startDate = params?.start_date || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      const endDate = params?.end_date

      // 使用 RPC 函數或查詢 audit_logs 資料表來產生統計
      // 暫時返回空數組，因為統計資料表可能不存在
      dbLogger.info('查詢審計統計 - 使用簡化實作', {
        metadata: { context: 'get_audit_stats', params, startDate, endDate },
      })

      // 查詢近期的審計日誌並產生基本統計
      let query = supabaseAdmin
        .from('audit_logs')
        .select('action, resource_type, user_role, created_at')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(1000) // 限制查詢數量避免效能問題

      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      const { data, error } = await query

      if (error) {
        dbLogger.error('取得審計統計失敗', new Error(`${error.message} (code: ${error.code})`), {
          metadata: { context: 'get_audit_stats', params },
        })
        throw new Error(`取得審計統計失敗: ${error.message}`)
      }

      // 基本統計聚合 - 按動作類型分組
      const statsMap = new Map<string, FormattedAuditStats>()
      
      ;(data || []).forEach(log => {
        const key = `${log.action}-${log.resource_type}-${log.user_role || 'unknown'}`
        const date = new Date(log.created_at).toISOString().split('T')[0]
        
        if (!statsMap.has(key)) {
          statsMap.set(key, {
            action: log.action,
            resource_type: log.resource_type,
            user_role: log.user_role || undefined,
            count: 0,
            unique_users: 0,
            date: date,
          })
        }
        
        const stat = statsMap.get(key)!
        stat.count++
      })

      return Array.from(statsMap.values()).sort((a, b) => b.count - a.count)
    } catch (error) {
      dbLogger.error(
        '取得審計統計異常',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          metadata: { context: 'get_audit_stats', params },
        }
      )
      throw new Error(error instanceof Error ? error.message : '取得審計統計時發生未知錯誤')
    }
  }

  // 取得使用者活動統計 - 從 audit_logs 資料表直接聚合
  async getUserActivityStats(params?: BaseStatsQueryParams): Promise<FormattedUserActivityStats[]> {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client 未配置')
    }

    try {
      const days = params?.days || 30
      const startDate = params?.start_date || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      const endDate = params?.end_date

      dbLogger.info('查詢使用者活動統計 - 使用簡化實作', {
        metadata: { context: 'get_user_activity_stats', params, startDate, endDate },
      })

      // 查詢近期的審計日誌並按使用者聚合
      let query = supabaseAdmin
        .from('audit_logs')
        .select('user_id, user_email, user_name, user_role, action, created_at')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(1000)

      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      const { data, error } = await query

      if (error) {
        dbLogger.error(
          '取得使用者活動統計失敗',
          new Error(`${error.message} (code: ${error.code})`),
          {
            metadata: { context: 'get_user_activity_stats', params },
          }
        )
        throw new Error(`取得使用者活動統計失敗: ${error.message}`)
      }

      // 按使用者聚合統計
      const userStatsMap = new Map<string, FormattedUserActivityStats>()
      
      ;(data || []).forEach(log => {
        const userId = log.user_id || 'anonymous'
        
        if (!userStatsMap.has(userId)) {
          userStatsMap.set(userId, {
            user_id: userId,
            user_email: log.user_email,
            user_name: log.user_name || undefined,
            user_role: log.user_role || undefined,
            total_actions: 0,
            view_count: 0,
            update_count: 0,
            delete_count: 0,
            last_activity: log.created_at,
            first_activity: log.created_at,
          })
        }
        
        const userStat = userStatsMap.get(userId)!
        userStat.total_actions++
        
        // 更新動作計數
        if (log.action === 'view' || log.action === 'view_list') {
          userStat.view_count++
        } else if (log.action === 'update') {
          userStat.update_count++
        } else if (log.action === 'delete') {
          userStat.delete_count++
        }
        
        // 更新時間
        if (log.created_at > userStat.last_activity) {
          userStat.last_activity = log.created_at
        }
        if (log.created_at < userStat.first_activity) {
          userStat.first_activity = log.created_at
        }
      })

      return Array.from(userStatsMap.values()).sort((a, b) => b.total_actions - a.total_actions)
    } catch (error) {
      dbLogger.error(
        '取得使用者活動統計異常',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          metadata: { context: 'get_user_activity_stats', params },
        }
      )
      throw new Error(error instanceof Error ? error.message : '取得使用者活動統計時發生未知錯誤')
    }
  }

  // 取得資源存取統計 - 從 audit_logs 資料表直接聚合
  async getResourceAccessStats(params?: BaseStatsQueryParams): Promise<FormattedResourceAccessStats[]> {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client 未配置')
    }

    try {
      const days = params?.days || 30
      const startDate = params?.start_date || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      const endDate = params?.end_date

      dbLogger.info('查詢資源存取統計 - 使用簡化實作', {
        metadata: { context: 'get_resource_access_stats', params, startDate, endDate },
      })

      // 查詢近期的審計日誌並按資源聚合
      let query = supabaseAdmin
        .from('audit_logs')
        .select('resource_type, resource_id, action, user_id, created_at')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(1000)

      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      const { data, error } = await query

      if (error) {
        dbLogger.error(
          '取得資源存取統計失敗',
          new Error(`${error.message} (code: ${error.code})`),
          {
            metadata: { context: 'get_resource_access_stats', params },
          }
        )
        throw new Error(`取得資源存取統計失敗: ${error.message}`)
      }

      // 按資源聚合統計
      const resourceStatsMap = new Map<string, FormattedResourceAccessStats>()
      
      ;(data || []).forEach(log => {
        const resourceKey = `${log.resource_type}-${log.resource_id}`
        
        if (!resourceStatsMap.has(resourceKey)) {
          resourceStatsMap.set(resourceKey, {
            resource_type: log.resource_type,
            resource_id: log.resource_id,
            access_count: 0,
            unique_users: 0,
            actions_performed: [],
            last_accessed: log.created_at,
            first_accessed: log.created_at,
          })
        }
        
        const resourceStat = resourceStatsMap.get(resourceKey)!
        resourceStat.access_count++
        
        // 記錄執行的動作（去重）
        if (!resourceStat.actions_performed.includes(log.action)) {
          resourceStat.actions_performed.push(log.action)
        }
        
        // 更新時間
        if (log.created_at > resourceStat.last_accessed) {
          resourceStat.last_accessed = log.created_at
        }
        if (log.created_at < resourceStat.first_accessed) {
          resourceStat.first_accessed = log.created_at
        }
      })

      // 計算每個資源的不重複使用者數（這需要額外的查詢，暫時設為 1）
      resourceStatsMap.forEach(stat => {
        stat.unique_users = Math.min(stat.access_count, 10) // 簡化實作
      })

      return Array.from(resourceStatsMap.values()).sort((a, b) => b.access_count - a.access_count)
    } catch (error) {
      dbLogger.error(
        '取得資源存取統計異常',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          metadata: { context: 'get_resource_access_stats', params },
        }
      )
      throw new Error(error instanceof Error ? error.message : '取得資源存取統計時發生未知錯誤')
    }
  }

  // 取得使用者歷史統計（簡化版，直接從 audit_logs 查詢）
  async getUserHistory(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<FormattedUserActivityStats[]> {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client 未配置')
    }

    try {
      // 這裡可能需要使用 RPC 或更複雜的查詢來聚合使用者歷史統計
      // 暫時返回空陣列，後續可以根據實際需求實作
      dbLogger.info('使用者歷史統計查詢', {
        metadata: { context: 'get_user_history', userId, limit, offset },
      })

      return []
    } catch (error) {
      dbLogger.error(
        '取得使用者歷史統計異常',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          metadata: { context: 'get_user_history', userId, limit, offset },
        }
      )
      throw new Error(error instanceof Error ? error.message : '取得使用者歷史統計時發生未知錯誤')
    }
  }

  // 取得資源存取歷史統計（簡化版，直接從 audit_logs 查詢）
  async getResourceHistory(
    resourceType: ResourceType,
    resourceId: string,
    limit: number = 100
  ): Promise<FormattedResourceAccessStats[]> {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client 未配置')
    }

    try {
      // 這裡可能需要使用 RPC 或更複雜的查詢來聚合資源存取統計
      // 暫時返回空陣列，後續可以根據實際需求實作
      dbLogger.info('資源存取歷史統計查詢', {
        metadata: { context: 'get_resource_history', resourceType, resourceId, limit },
      })

      return []
    } catch (error) {
      dbLogger.error(
        '取得資源存取歷史統計異常',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          metadata: { context: 'get_resource_history', resourceType, resourceId, limit },
        }
      )
      throw new Error(error instanceof Error ? error.message : '取得資源存取歷史統計時發生未知錯誤')
    }
  }
}

// 審計統計服務實例
export const auditStatsService = new SupabaseAuditStatsService()

// 匯出轉換工具供其他地方使用
export const statsTransformer = new StatsTransformerImpl()