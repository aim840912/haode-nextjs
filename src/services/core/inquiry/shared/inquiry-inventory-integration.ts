/**
 * 詢問單庫存整合邏輯
 *
 * 負責處理詢問單狀態變更時的庫存操作:
 * - confirmed: 保留庫存
 * - completed: 完成保留(實際扣減)
 * - cancelled: 釋放保留
 */

import { dbLogger } from '@/lib/logger'
import { InquiryItem, InquiryStatus } from '@/types/inquiry'
import { InquiryInventoryService } from '../InquiryInventoryService'

/**
 * 處理詢問單狀態變更的庫存操作
 */
export async function handleInventoryForStatusChange(
  inquiryId: string,
  previousStatus: InquiryStatus,
  newStatus: InquiryStatus,
  items: InquiryItem[]
): Promise<void> {
  const inventoryService = new InquiryInventoryService()

  // confirmed: 保留庫存
  if (newStatus === 'confirmed' && previousStatus !== 'confirmed') {
    await inventoryService.reserveInventory(inquiryId, items)
    dbLogger.info('詢問單確認，已保留庫存', {
      module: 'InquiryService',
      metadata: { inquiryId, itemsCount: items.length },
    })
  }

  // completed: 完成保留（實際扣減）
  if (newStatus === 'completed' && previousStatus === 'confirmed') {
    await inventoryService.finalizeInventory(items)
    dbLogger.info('詢問單完成，已扣減庫存', {
      module: 'InquiryService',
      metadata: { inquiryId, itemsCount: items.length },
    })
  }

  // cancelled: 釋放保留（如果之前已確認）
  if (newStatus === 'cancelled' && previousStatus === 'confirmed') {
    await inventoryService.releaseInventory(items)
    dbLogger.info('詢問單取消，已釋放保留庫存', {
      module: 'InquiryService',
      metadata: { inquiryId, itemsCount: items.length },
    })
  }
}
