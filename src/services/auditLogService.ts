/**
 * 審計日誌服務實作
 * 提供審計日誌的記錄、查詢和統計功能
 * 
 * 審計策略：
 * - ✅ 記錄重要操作：建立(create)、更新(update)、刪除(delete)
 * - ✅ 記錄狀態變更：status_change
 * - ✅ 記錄單一資源查看：view（敏感資料）
 * - ✅ 記錄未授權訪問：unauthorized_access
 * - ❌ 不記錄列表瀏覽：view_list（已優化移除，減少雜訊）
 * - ❌ 不記錄靜態頁面訪問：page_view
 */

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { dbLogger } from '@/lib/logger';
import { 
  AuditLogService,
  AuditLog,
  CreateAuditLogRequest,
  AuditLogQueryParams,
  AuditStats,
  UserActivityStats,
  ResourceAccessStats,
  AuditLogUtils,
  ResourceType,
  AuditAction
} from '@/types/audit';

// Supabase 審計日誌服務實作
export class SupabaseAuditLogService implements AuditLogService {
  
  // 記錄審計日誌
  async log(request: CreateAuditLogRequest): Promise<void> {
    try {
      // 驗證請求資料
      const validation = AuditLogUtils.validateAuditLogRequest(request);
      if (!validation.isValid) {
        dbLogger.info('審計日誌驗證失敗', { metadata: { errors: validation.errors } });
        return; // 不拋出錯誤，避免影響主要業務流程
      }

      // 檢查是否為重複操作（5分鐘內相同使用者、相同動作、相同資源）
      if (await this.isDuplicateLogEntry(request)) {
        dbLogger.info('跳過重複的審計日誌記錄', {
          metadata: {
            action: request.action,
            resource: request.resource_type,
            resourceId: request.resource_id,
            user: request.user_email
          }
        });
        return;
      }

      // 準備審計日誌資料
      const auditData = {
        user_id: request.user_id,
        user_email: request.user_email,
        user_name: request.user_name,
        user_role: request.user_role,
        action: request.action,
        resource_type: request.resource_type,
        resource_id: request.resource_id,
        resource_details: request.resource_details || {},
        previous_data: request.previous_data || {},
        new_data: request.new_data || {},
        ip_address: request.ip_address,
        user_agent: request.user_agent,
        session_id: request.session_id,
        metadata: request.metadata || {}
      };

      // 插入審計日誌
      const { error } = await createServiceSupabaseClient()
        .from('audit_logs')
        .insert(auditData as any);

      if (error) {
        dbLogger.info('審計日誌記錄失敗', {
          metadata: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            data: auditData
          }
        });
        // 不拋出錯誤，避免影響主要業務流程
      } else {
        dbLogger.info('審計日誌記錄成功', {
          metadata: {
            action: request.action,
            resource: request.resource_type,
            resourceId: request.resource_id,
            user: request.user_email
          }
        });
      }

    } catch (error) {
      dbLogger.error('審計日誌記錄異常', error instanceof Error ? error : new Error('Unknown error'), {
        metadata: { context: 'log_audit_entry' }
      });
      // 不拋出錯誤，避免影響主要業務流程
    }
  }

  // 檢查是否為重複的日誌記錄
  private async isDuplicateLogEntry(request: CreateAuditLogRequest): Promise<boolean> {
    try {
      // 只對查看操作進行重複檢查，避免影響重要的修改操作
      if (!['view', 'view_list'].includes(request.action)) {
        return false;
      }

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data, error } = await createServiceSupabaseClient()
        .from('audit_logs')
        .select('id')
        .eq('user_email', request.user_email)
        .eq('action', request.action)
        .eq('resource_type', request.resource_type)
        .eq('resource_id', request.resource_id)
        .gte('created_at', fiveMinutesAgo)
        .limit(1);

      if (error) {
        dbLogger.error('檢查重複日誌失敗', new Error(`${error.message} (code: ${error.code})`), {
          metadata: { context: 'check_duplicate_log' }
        });
        return false; // 發生錯誤時不阻止記錄
      }

      return (data && data.length > 0);
    } catch (error) {
      dbLogger.error('檢查重複日誌異常', error instanceof Error ? error : new Error('Unknown error'), {
        metadata: { context: 'check_duplicate_log' }
      });
      return false; // 發生錯誤時不阻止記錄
    }
  }

  // 查詢審計日誌
  async getAuditLogs(params?: AuditLogQueryParams): Promise<AuditLog[]> {
    try {
      let query = createServiceSupabaseClient()
        .from('audit_logs')
        .select('*');

      // 套用篩選條件
      if (params) {
        if (params.user_id) {
          query = query.eq('user_id', params.user_id);
        }
        if (params.user_email) {
          query = query.ilike('user_email', `%${params.user_email}%`);
        }
        if (params.user_role) {
          query = query.eq('user_role', params.user_role);
        }
        if (params.action) {
          query = query.eq('action', params.action);
        }
        if (params.resource_type) {
          query = query.eq('resource_type', params.resource_type);
        }
        if (params.resource_id) {
          query = query.eq('resource_id', params.resource_id);
        }
        if (params.start_date) {
          query = query.gte('created_at', params.start_date);
        }
        if (params.end_date) {
          query = query.lte('created_at', params.end_date);
        }
        if (params.ip_address) {
          // 使用文字轉換來支援部分匹配和 INET 類型兼容
          query = query.filter('ip_address::text', 'ilike', `%${params.ip_address}%`);
        }

        // 排序
        const sortBy = params.sort_by || 'created_at';
        const sortOrder = params.sort_order || 'desc';
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        // 分頁
        if (params.limit) {
          query = query.limit(params.limit);
        }
        if (params.offset) {
          query = query.range(params.offset, (params.offset + (params.limit || 50)) - 1);
        }
      } else {
        // 預設排序
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        dbLogger.error('查詢審計日誌失敗', new Error(`${error.message} (code: ${error.code})`), {
          metadata: { context: 'get_audit_logs' }
        });
        throw new Error(`查詢審計日誌失敗: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      dbLogger.error('查詢審計日誌異常', error instanceof Error ? error : new Error('Unknown error'), {
        metadata: { context: 'get_audit_logs' }
      });
      throw new Error(error instanceof Error ? error.message : '查詢審計日誌時發生未知錯誤');
    }
  }

  // 取得使用者活動歷史
  async getUserHistory(userId: string, limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
    try {
      const { data, error } = await createServiceSupabaseClient()
        .rpc('get_user_audit_history', {
          target_user_id: userId,
          limit_count: limit,
          offset_count: offset
        } as any);

      if (error) {
        dbLogger.error('取得使用者活動歷史失敗', new Error(`${error.message} (code: ${error.code})`), {
          metadata: { context: 'get_user_history', userId }
        });
        throw new Error(`取得使用者活動歷史失敗: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      dbLogger.error('取得使用者活動歷史異常', error instanceof Error ? error : new Error('Unknown error'), {
        metadata: { context: 'get_user_history', userId }
      });
      throw new Error(error instanceof Error ? error.message : '取得使用者活動歷史時發生未知錯誤');
    }
  }

  // 取得資源存取歷史
  async getResourceHistory(
    resourceType: ResourceType, 
    resourceId: string, 
    limit: number = 100
  ): Promise<AuditLog[]> {
    try {
      const { data, error } = await createServiceSupabaseClient()
        .rpc('get_resource_audit_history', {
          target_resource_type: resourceType,
          target_resource_id: resourceId,
          limit_count: limit
        } as any);

      if (error) {
        dbLogger.error('取得資源存取歷史失敗', new Error(`${error.message} (code: ${error.code})`), {
          metadata: { context: 'get_resource_history', resourceType, resourceId }
        });
        throw new Error(`取得資源存取歷史失敗: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      dbLogger.error('取得資源存取歷史異常', error instanceof Error ? error : new Error('Unknown error'), {
        metadata: { context: 'get_resource_history', resourceType, resourceId }
      });
      throw new Error(error instanceof Error ? error.message : '取得資源存取歷史時發生未知錯誤');
    }
  }

  // 取得審計統計
  async getAuditStats(days: number = 30): Promise<AuditStats[]> {
    try {
      const { data, error } = await createServiceSupabaseClient()
        .from('audit_stats')
        .select('*')
        .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: false });

      if (error) {
        dbLogger.error('取得審計統計失敗', new Error(`${error.message} (code: ${error.code})`), {
          metadata: { context: 'get_audit_stats', days }
        });
        throw new Error(`取得審計統計失敗: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      dbLogger.error('取得審計統計異常', error instanceof Error ? error : new Error('Unknown error'), {
        metadata: { context: 'get_audit_stats', days }
      });
      throw new Error(error instanceof Error ? error.message : '取得審計統計時發生未知錯誤');
    }
  }

  // 取得使用者活動統計
  async getUserActivityStats(days: number = 30): Promise<UserActivityStats[]> {
    try {
      const { data, error } = await createServiceSupabaseClient()
        .from('user_activity_stats')
        .select('*')
        .gte('first_activity', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('total_actions', { ascending: false });

      if (error) {
        dbLogger.error('取得使用者活動統計失敗', new Error(`${error.message} (code: ${error.code})`), {
          metadata: { context: 'get_user_activity_stats', days }
        });
        throw new Error(`取得使用者活動統計失敗: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      dbLogger.error('取得使用者活動統計異常', error instanceof Error ? error : new Error('Unknown error'), {
        metadata: { context: 'get_user_activity_stats', days }
      });
      throw new Error(error instanceof Error ? error.message : '取得使用者活動統計時發生未知錯誤');
    }
  }

  // 取得資源存取統計
  async getResourceAccessStats(days: number = 30): Promise<ResourceAccessStats[]> {
    try {
      const { data, error } = await createServiceSupabaseClient()
        .from('resource_access_stats')
        .select('*')
        .gte('first_accessed', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('access_count', { ascending: false });

      if (error) {
        dbLogger.error('取得資源存取統計失敗', new Error(`${error.message} (code: ${error.code})`), {
          metadata: { context: 'get_resource_access_stats', days }
        });
        throw new Error(`取得資源存取統計失敗: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      dbLogger.error('取得資源存取統計異常', error instanceof Error ? error : new Error('Unknown error'), {
        metadata: { context: 'get_resource_access_stats', days }
      });
      throw new Error(error instanceof Error ? error.message : '取得資源存取統計時發生未知錯誤');
    }
  }
}

// 審計日誌服務實例
export const auditLogService = new SupabaseAuditLogService();

// 審計日誌輔助函數
export class AuditLogger {
  
  // 記錄詢問單查看
  static async logInquiryView(
    userId: string | null,
    userEmail: string,
    userName: string | undefined,
    userRole: string | undefined,
    inquiryId: string,
    inquiryDetails?: Record<string, unknown>,
    request?: Request
  ): Promise<void> {
    await auditLogService.log({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      user_role: userRole as any,
      action: 'view',
      resource_type: 'inquiry',
      resource_id: inquiryId,
      resource_details: inquiryDetails,
      ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
      user_agent: request?.headers.get('user-agent') || undefined
    });
  }

  // 記錄詢問單列表查看
  // @deprecated 已棄用：列表瀏覽記錄會產生過多雜訊，建議移除調用
  static async logInquiryListView(
    userId: string | null,
    userEmail: string,
    userName: string | undefined,
    userRole: string | undefined,
    filters?: Record<string, unknown>,
    request?: Request
  ): Promise<void> {
    await auditLogService.log({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      user_role: userRole as any,
      action: 'view_list',
      resource_type: 'inquiry',
      resource_id: 'list',
      metadata: {
        filters: filters || {}
      },
      ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
      user_agent: request?.headers.get('user-agent') || undefined
    });
  }

  // 記錄詢問單建立
  static async logInquiryCreate(
    userId: string | null,
    userEmail: string,
    userName: string | undefined,
    userRole: string | undefined,
    inquiryId: string,
    inquiryData: Record<string, unknown>,
    request?: Request
  ): Promise<void> {
    await auditLogService.log({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      user_role: userRole as any,
      action: 'create',
      resource_type: 'inquiry',
      resource_id: inquiryId,
      new_data: inquiryData,
      resource_details: {
        customer_name: inquiryData.customer_name,
        customer_email: inquiryData.customer_email,
        total_amount: inquiryData.total_estimated_amount
      },
      ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
      user_agent: request?.headers.get('user-agent') || undefined
    });
  }

  // 記錄詢問單更新
  static async logInquiryUpdate(
    userId: string | null,
    userEmail: string,
    userName: string | undefined,
    userRole: string | undefined,
    inquiryId: string,
    previousData: Record<string, unknown>,
    newData: Record<string, unknown>,
    request?: Request
  ): Promise<void> {
    await auditLogService.log({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      user_role: userRole as any,
      action: 'update',
      resource_type: 'inquiry',
      resource_id: inquiryId,
      previous_data: previousData,
      new_data: newData,
      resource_details: {
        customer_name: newData.customer_name || previousData.customer_name
      },
      ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
      user_agent: request?.headers.get('user-agent') || undefined
    });
  }

  // 記錄詢問單刪除
  static async logInquiryDelete(
    userId: string | null,
    userEmail: string,
    userName: string | undefined,
    userRole: string | undefined,
    inquiryId: string,
    inquiryData: Record<string, unknown>,
    request?: Request
  ): Promise<void> {
    await auditLogService.log({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      user_role: userRole as any,
      action: 'delete',
      resource_type: 'inquiry',
      resource_id: inquiryId,
      previous_data: inquiryData,
      resource_details: {
        customer_name: inquiryData.customer_name,
        customer_email: inquiryData.customer_email
      },
      ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
      user_agent: request?.headers.get('user-agent') || undefined
    });
  }

  // 記錄詢問單狀態變更
  static async logInquiryStatusChange(
    userId: string | null,
    userEmail: string,
    userName: string | undefined,
    userRole: string | undefined,
    inquiryId: string,
    previousStatus: string,
    newStatus: string,
    inquiryDetails?: Record<string, unknown>,
    request?: Request
  ): Promise<void> {
    await auditLogService.log({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      user_role: userRole as any,
      action: 'status_change',
      resource_type: 'inquiry',
      resource_id: inquiryId,
      previous_data: { status: previousStatus },
      new_data: { status: newStatus },
      resource_details: inquiryDetails,
      metadata: {
        status_change: {
          from: previousStatus,
          to: newStatus
        }
      },
      ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
      user_agent: request?.headers.get('user-agent') || undefined
    });
  }
}

// 匯出預設審計日誌服務
export default auditLogService;