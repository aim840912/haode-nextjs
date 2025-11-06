/**
 * 訂單服務統一匯出點
 */

export { OrderService, orderService } from './orderService'
export { OrderQueryService } from './OrderQueryService'
export { OrderCommandService } from './OrderCommandService'
export * from './types'

// 匯出舊的轉換器以保持向後相容
export { OrderTransformer, OrderItemTransformer } from './orderService.old'
