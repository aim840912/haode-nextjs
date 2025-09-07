/**
 * 審計日誌系統的類型定義
 * 定義審計日誌相關的介面和枚舉
 */

// 審計動作類型
export type AuditAction =
  | 'view' // 查看單一資源
  | 'view_list' // 查看資源列表
  | 'create' // 建立資源
  | 'update' // 更新資源
  | 'delete' // 刪除資源
  | 'export' // 匯出資料
  | 'status_change' // 狀態變更
  | 'unauthorized_access' // 未授權存取嘗試

// 資源類型 - 基於資料庫約束完整定義
export type ResourceType =
  // 業務相關操作
  | 'inquiry' // 詢問單
  | 'inquiry_item' // 詢價項目
  | 'product' // 產品
  | 'customer_data' // 客戶資料
  | 'audit_log' // 審計日誌
  // 系統管理操作
  | 'security_policy' // 安全政策相關操作
  | 'system_config' // 系統設定相關操作
  | 'migration' // 資料庫遷移操作
  | 'user_management' // 用戶管理操作
  | 'data_maintenance' // 資料維護操作
  // API 相關操作
  | 'admin_api' // Admin API 相關操作
  // 速率限制和監控相關（程式碼中使用）
  | 'rate_limiter' // 速率限制器
  | 'security' // 安全相關
  | 'monitoring' // 監控相關

// 使用者角色
export type UserRole =
  | 'customer' // 客戶
  | 'admin' // 管理員
  | 'auditor' // 稽核人員
  | 'system' // 系統

// 審計日誌基本介面
export interface AuditLog {
  id: string
  user_id: string | null
  user_email: string
  user_name?: string
  user_role?: UserRole
  action: AuditAction
  resource_type: ResourceType
  resource_id: string
  resource_details?: Record<string, unknown>
  previous_data?: Record<string, unknown>
  new_data?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  session_id?: string
  metadata?: Record<string, unknown>
  created_at: string
}

// 建立審計日誌請求介面
export interface CreateAuditLogRequest {
  user_id?: string | null
  user_email: string
  user_name?: string
  user_role?: UserRole
  action: AuditAction
  resource_type: ResourceType
  resource_id: string
  resource_details?: Record<string, unknown>
  previous_data?: Record<string, unknown>
  new_data?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  session_id?: string
  metadata?: Record<string, unknown>
}

// 審計日誌查詢參數
export interface AuditLogQueryParams {
  user_id?: string
  user_email?: string
  user_role?: UserRole
  action?: AuditAction
  resource_type?: ResourceType
  resource_id?: string
  start_date?: string
  end_date?: string
  ip_address?: string
  limit?: number
  offset?: number
  sort_by?: keyof AuditLog
  sort_order?: 'asc' | 'desc'
}

// 審計統計介面
export interface AuditStats {
  action: AuditAction
  resource_type: ResourceType
  user_role?: UserRole
  count: number
  unique_users: number
  date: string
}

// 使用者活動統計介面
export interface UserActivityStats {
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

// 資源存取統計介面
export interface ResourceAccessStats {
  resource_type: ResourceType
  resource_id: string
  access_count: number
  unique_users: number
  actions_performed: AuditAction[]
  last_accessed: string
  first_accessed: string
}

// 審計日誌服務介面 - 專注於日誌記錄和查詢功能
export interface AuditLogService {
  // 記錄審計日誌
  log(request: CreateAuditLogRequest): Promise<void>

  // 查詢審計日誌
  getAuditLogs(params?: AuditLogQueryParams): Promise<AuditLog[]>

  // 取得使用者活動歷史
  getUserHistory(userId: string, limit?: number, offset?: number): Promise<AuditLog[]>

  // 取得資源存取歷史
  getResourceHistory(
    resourceType: ResourceType,
    resourceId: string,
    limit?: number
  ): Promise<AuditLog[]>

  // 注意：統計功能已移至 AuditStatsService，請使用 auditStatsService 取得統計資料
}

// 審計日誌標籤和顏色常數
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  view: '查看',
  view_list: '瀏覽列表',
  create: '建立',
  update: '更新',
  delete: '刪除',
  export: '匯出',
  status_change: '狀態變更',
  unauthorized_access: '未授權存取',
}

export const AUDIT_ACTION_COLORS: Record<AuditAction, string> = {
  view: 'text-blue-600 bg-blue-50',
  view_list: 'text-blue-600 bg-blue-50',
  create: 'text-green-600 bg-green-50',
  update: 'text-yellow-600 bg-yellow-50',
  delete: 'text-red-600 bg-red-50',
  export: 'text-purple-600 bg-purple-50',
  status_change: 'text-orange-600 bg-orange-50',
  unauthorized_access: 'text-red-800 bg-red-100',
}

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  inquiry: '詢問單',
  inquiry_item: '詢價項目',
  product: '產品',
  customer_data: '客戶資料',
  audit_log: '審計日誌',
  security_policy: '安全政策',
  system_config: '系統設定',
  migration: '資料庫遷移',
  user_management: '用戶管理',
  data_maintenance: '資料維護',
  admin_api: 'Admin API',
  rate_limiter: '速率限制器',
  security: '安全相關',
  monitoring: '監控相關',
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  customer: '客戶',
  admin: '管理員',
  auditor: '稽核人員',
  system: '系統',
}

// 類型守衛函數 - 安全轉換字串為枚舉類型
export const AuditTypeGuards = {
  // 檢查是否為有效的 AuditAction
  isValidAuditAction(value: string): value is AuditAction {
    return [
      'view',
      'view_list',
      'create',
      'update',
      'delete',
      'export',
      'status_change',
      'unauthorized_access',
    ].includes(value)
  },

  // 檢查是否為有效的 ResourceType
  isValidResourceType(value: string): value is ResourceType {
    return [
      'inquiry',
      'inquiry_item',
      'customer_data',
      'audit_log',
      'security_policy',
      'system_config',
      'migration',
      'user_management',
      'data_maintenance',
      'admin_api',
      'rate_limiter',
      'security',
      'monitoring',
    ].includes(value)
  },

  // 檢查是否為有效的 UserRole
  isValidUserRole(value: string): value is UserRole {
    return ['customer', 'admin', 'auditor', 'system'].includes(value)
  },

  // 安全轉換字串為 UserRole（含預設值）
  toUserRole(value: string | undefined | null): UserRole | undefined {
    if (!value) return undefined
    return this.isValidUserRole(value) ? (value as UserRole) : undefined
  },

  // 安全轉換字串為 AuditAction
  toAuditAction(value: string): AuditAction | null {
    return this.isValidAuditAction(value) ? (value as AuditAction) : null
  },

  // 安全轉換字串為 ResourceType
  toResourceType(value: string): ResourceType | null {
    return this.isValidResourceType(value) ? (value as ResourceType) : null
  },
}

// 審計日誌工具類別
export class AuditLogUtils {
  // 格式化審計日誌顯示文字
  static formatAuditMessage(log: AuditLog): string {
    const action = AUDIT_ACTION_LABELS[log.action]
    const resource = RESOURCE_TYPE_LABELS[log.resource_type]
    const user = log.user_name || log.user_email

    return `${user} ${action}了${resource}`
  }

  // 取得動作的嚴重程度（用於排序和篩選）
  static getActionSeverity(action: AuditAction): number {
    const severity: Record<AuditAction, number> = {
      view: 1,
      view_list: 1,
      export: 2,
      create: 3,
      update: 4,
      status_change: 4,
      delete: 5,
      unauthorized_access: 6,
    }
    return severity[action]
  }

  // 檢查是否為敏感操作
  static isSensitiveAction(action: AuditAction): boolean {
    return ['delete', 'export', 'update'].includes(action)
  }

  // 檢查是否為系統操作
  static isSystemAction(log: AuditLog): boolean {
    return log.user_role === 'system' || log.user_email === 'system'
  }

  // 格式化時間差（多久前）
  static formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return '剛剛'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} 分鐘前`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} 小時前`
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} 天前`
    } else {
      return date.toLocaleDateString('zh-TW')
    }
  }

  // 建立資源詳情摘要
  static createResourceSummary(
    resourceType: ResourceType,
    resourceDetails?: Record<string, unknown>
  ): string {
    if (!resourceDetails) return ''

    switch (resourceType) {
      case 'inquiry':
        return resourceDetails.customer_name ? `客戶：${resourceDetails.customer_name}` : '詢問單'
      case 'inquiry_item':
        return resourceDetails.product_name ? `商品：${resourceDetails.product_name}` : '詢價項目'
      case 'customer_data':
        return resourceDetails.customer_name ? `客戶：${resourceDetails.customer_name}` : '客戶資料'
      default:
        return ''
    }
  }

  // 驗證審計日誌請求
  static validateAuditLogRequest(request: CreateAuditLogRequest): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!request.user_email || request.user_email.trim() === '') {
      errors.push('使用者 Email 不能為空')
    }

    if (!request.action) {
      errors.push('動作類型不能為空')
    }

    if (!request.resource_type) {
      errors.push('資源類型不能為空')
    }

    if (!request.resource_id || request.resource_id.trim() === '') {
      errors.push('資源 ID 不能為空')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}
