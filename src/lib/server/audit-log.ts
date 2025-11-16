/**
 * Server Actions 審計日誌工具
 *
 * 提供 Server-only 的審計日誌記錄功能:
 * - 自動記錄用戶操作
 * - 整合現有 auditLogService
 * - 簡化 Server Actions 中的審計日誌使用
 *
 * ⚠️ 只能在 Server Actions 中使用
 */

import { headers } from 'next/headers'
import { apiLogger } from '@/lib/logger'
import { auditLogService } from '@/services/infrastructure/auditLogService'
import { CreateAuditLogRequest, ResourceType, AuditAction } from '@/types/audit'
import { ServerUser } from './auth'

/**
 * Server Action 審計日誌參數
 */
export interface ServerAuditLogParams {
  /** 用戶資訊 */
  user: ServerUser
  /** 操作動作 */
  action: AuditAction
  /** 資源類型 */
  resourceType: ResourceType
  /** 資源 ID */
  resourceId?: string
  /** 資源詳情 */
  resourceDetails?: Record<string, unknown>
  /** 變更前資料 (用於 update/delete) */
  previousData?: Record<string, unknown>
  /** 變更後資料 (用於 create/update) */
  newData?: Record<string, unknown>
  /** 額外元資料 */
  metadata?: Record<string, unknown>
}

/**
 * 從 headers 取得客戶端資訊
 */
async function getClientInfo(): Promise<{
  ipAddress?: string
  userAgent?: string
}> {
  const headersList = await headers()

  const ipAddress =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    undefined

  const userAgent = headersList.get('user-agent') || undefined

  return { ipAddress, userAgent }
}

/**
 * 記錄審計日誌
 *
 * @param params - 審計日誌參數
 *
 * @example
 * ```ts
 * 'use server'
 *
 * export async function updateProductAction(id: string, data: ProductInput) {
 *   const user = await requireAuth()
 *
 *   const oldProduct = await productService.findById(id)
 *   const newProduct = await productService.update(id, data, user.id)
 *
 *   // 記錄審計日誌
 *   await logAudit({
 *     user,
 *     action: 'update',
 *     resourceType: 'product',
 *     resourceId: id,
 *     previousData: oldProduct,
 *     newData: newProduct,
 *   })
 *
 *   return success(newProduct, '產品更新成功')
 * }
 * ```
 */
export async function logAudit(params: ServerAuditLogParams): Promise<void> {
  const {
    user,
    action,
    resourceType,
    resourceId,
    resourceDetails,
    previousData,
    newData,
    metadata,
  } = params

  try {
    // 取得客戶端資訊
    const { ipAddress, userAgent } = await getClientInfo()

    // 構建審計日誌請求
    const auditRequest: CreateAuditLogRequest = {
      user_id: user.id,
      user_email: user.email,
      user_name: user.email.split('@')[0], // 從 email 提取用戶名
      user_role: user.isAdmin ? 'admin' : 'customer',
      action,
      resource_type: resourceType,
      resource_id: resourceId || '', // 提供預設值避免 undefined
      resource_details: resourceDetails,
      previous_data: previousData,
      new_data: newData,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: {
        ...metadata,
        source: 'server_action',
      },
    }

    // 調用現有的審計日誌服務
    await auditLogService.log(auditRequest)
  } catch (error) {
    // 審計日誌失敗不應該影響主要業務邏輯
    apiLogger.error('Server Action 審計日誌記錄失敗', error as Error, {
      module: 'ServerAudit',
      action: 'logAudit',
      metadata: {
        userId: user.id,
        action,
        resourceType,
        resourceId,
      },
    })
  }
}

/**
 * Server Action 審計日誌包裝器
 *
 * 自動為 Server Action 添加審計日誌記錄
 *
 * @example
 * ```ts
 * 'use server'
 *
 * export const deleteProductAction = withAuditLog(
 *   async (id: string) => {
 *     const user = await requireAuth()
 *     const product = await productService.findById(id)
 *
 *     await productService.delete(id, user.id)
 *
 *     return success(null, '產品刪除成功')
 *   },
 *   {
 *     getAuditParams: async (id: string) => {
 *       const user = await requireAuth()
 *       const product = await productService.findById(id)
 *
 *       return {
 *         user,
 *         action: 'delete',
 *         resourceType: 'product',
 *         resourceId: id,
 *         previousData: product,
 *       }
 *     }
 *   }
 * )
 * ```
 */
export function withAuditLog<TArgs extends unknown[], TReturn>(
  action: (...args: TArgs) => Promise<TReturn>,
  config: {
    getAuditParams: (...args: TArgs) => Promise<ServerAuditLogParams>
  }
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    // 執行操作
    const result = await action(...args)

    // 記錄審計日誌 (異步,不阻塞返回)
    config
      .getAuditParams(...args)
      .then(logAudit)
      .catch(error => {
        apiLogger.error('審計日誌包裝器失敗', error as Error)
      })

    return result
  }
}

/**
 * 快捷方法 - 記錄建立操作
 *
 * @example
 * ```ts
 * await logCreate(user, 'product', newProduct.id, { newData: newProduct })
 * ```
 */
export async function logCreate(
  user: ServerUser,
  resourceType: ResourceType,
  resourceId: string,
  options?: {
    newData?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  await logAudit({
    user,
    action: 'create',
    resourceType,
    resourceId,
    newData: options?.newData,
    metadata: options?.metadata,
  })
}

/**
 * 快捷方法 - 記錄更新操作
 *
 * @example
 * ```ts
 * await logUpdate(user, 'product', id, {
 *   previousData: oldProduct,
 *   newData: newProduct
 * })
 * ```
 */
export async function logUpdate(
  user: ServerUser,
  resourceType: ResourceType,
  resourceId: string,
  options: {
    previousData: Record<string, unknown>
    newData: Record<string, unknown>
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  await logAudit({
    user,
    action: 'update',
    resourceType,
    resourceId,
    previousData: options.previousData,
    newData: options.newData,
    metadata: options.metadata,
  })
}

/**
 * 快捷方法 - 記錄刪除操作
 *
 * @example
 * ```ts
 * await logDelete(user, 'product', id, { previousData: product })
 * ```
 */
export async function logDelete(
  user: ServerUser,
  resourceType: ResourceType,
  resourceId: string,
  options?: {
    previousData?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  await logAudit({
    user,
    action: 'delete',
    resourceType,
    resourceId,
    previousData: options?.previousData,
    metadata: options?.metadata,
  })
}

/**
 * 快捷方法 - 記錄狀態變更
 *
 * @example
 * ```ts
 * await logStatusChange(user, 'order', orderId, {
 *   previousData: { status: 'pending' },
 *   newData: { status: 'confirmed' }
 * })
 * ```
 */
export async function logStatusChange(
  user: ServerUser,
  resourceType: ResourceType,
  resourceId: string,
  options: {
    previousData: Record<string, unknown>
    newData: Record<string, unknown>
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  await logAudit({
    user,
    action: 'status_change',
    resourceType,
    resourceId,
    previousData: options.previousData,
    newData: options.newData,
    metadata: options.metadata,
  })
}
