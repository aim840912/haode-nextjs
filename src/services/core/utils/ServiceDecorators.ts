/**
 * Service 層裝飾器
 * 提供統一的錯誤處理、計時、日誌記錄功能
 */

import {
  ErrorFactory,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  MethodNotAllowedError,
} from '@/lib/errors'
import { dbLogger } from '@/lib/logger'

/**
 * Service 操作裝飾器配置
 */
interface ServiceOperationConfig {
  module: string
  action: string
  context?: Record<string, any>
}

/**
 * 包裝 Service 操作,提供統一的錯誤處理和日誌記錄
 *
 * @example
 * ```typescript
 * async getUserOrders(userId: string) {
 *   return withServiceOperation(
 *     { module: 'OrderService', action: '取得使用者訂單', context: { userId } },
 *     async () => {
 *       // 實際業務邏輯
 *       const orders = await client.from('orders').select('*')
 *       return orders
 *     }
 *   )
 * }
 * ```
 */
export async function withServiceOperation<T>(
  config: ServiceOperationConfig,
  operation: () => Promise<T>
): Promise<T> {
  const { module, action, context } = config
  const timer = dbLogger.timer(action)

  try {
    const result = await operation()
    timer.end({ metadata: context })
    return result
  } catch (error) {
    timer.end()

    // 如果是我們自定義的錯誤類型，直接重新拋出，不要轉換
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof AuthorizationError ||
      error instanceof MethodNotAllowedError
    ) {
      throw error
    }

    // 其他錯誤（主要是 Supabase 錯誤）使用 ErrorFactory 轉換
    throw ErrorFactory.fromSupabaseError(error, {
      module,
      action,
      context,
    })
  }
}

/**
 * 包裝 Service 操作並記錄成功訊息
 */
export async function withServiceOperationLogged<T>(
  config: ServiceOperationConfig,
  operation: () => Promise<T>,
  successMessage?: string
): Promise<T> {
  const result = await withServiceOperation(config, operation)

  if (successMessage) {
    dbLogger.info(successMessage, {
      module: config.module,
      action: config.action,
      metadata: config.context,
    })
  }

  return result
}
