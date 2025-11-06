/**
 * 詢問單庫存管理服務
 * 負責產品詢價的庫存保留、釋放和扣減操作
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { ValidationError } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import { InquiryItem } from '@/types/inquiry'
import { ServiceSupabaseClient } from '@/types/service.types'

const getAdmin = () => getSupabaseAdmin()

/**
 * 詢問單庫存管理服務
 */
export class InquiryInventoryService {
  private readonly moduleName = 'InquiryInventoryService'

  /**
   * 取得 Supabase 客戶端
   */
  private getSupabaseClient(): ServiceSupabaseClient {
    return getAdmin()!
  }

  /**
   * 保留產品庫存
   * 在詢問單確認時調用
   */
  async reserveInventory(inquiryId: string, items: InquiryItem[]): Promise<void> {
    const client = this.getSupabaseClient()
    const reservedItems: InquiryItem[] = []

    try {
      for (const item of items) {
        const { data, error } = await client.rpc('reserve_product_inventory', {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        })

        if (error) {
          dbLogger.error('保留庫存 RPC 失敗', error, {
            module: this.moduleName,
            metadata: { inquiryId, productId: item.product_id, quantity: item.quantity },
          })
          // 回滾已保留的庫存
          await this.rollbackReservations(inquiryId, reservedItems)
          throw new Error(`保留庫存失敗: ${item.product_name}`)
        }

        if (!data || !data.success) {
          // 保留失敗（庫存不足）
          dbLogger.warn('保留庫存失敗：庫存不足', {
            module: this.moduleName,
            metadata: {
              inquiryId,
              productId: item.product_id,
              productName: item.product_name,
              requested: item.quantity,
              available: data?.available_stock || 0,
            },
          })
          // 回滾已保留的庫存
          await this.rollbackReservations(inquiryId, reservedItems)
          throw new ValidationError(
            `${item.product_name} 可用庫存不足（需要 ${item.quantity}，可用 ${data?.available_stock || 0}）`
          )
        }

        // 記錄成功保留的項目（用於回滾）
        reservedItems.push(item)

        dbLogger.info('保留庫存成功', {
          module: this.moduleName,
          metadata: {
            inquiryId,
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            result: data,
          },
        })
      }
    } catch (error) {
      // 確保錯誤時回滾
      throw error
    }
  }

  /**
   * 釋放保留庫存
   * 在詢問單取消時調用
   */
  async releaseInventory(items: InquiryItem[]): Promise<void> {
    const client = this.getSupabaseClient()

    for (const item of items) {
      try {
        const { data, error } = await client.rpc('release_reserved_inventory', {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        })

        if (error) {
          dbLogger.error('釋放保留庫存失敗', error, {
            module: this.moduleName,
            metadata: { productId: item.product_id, quantity: item.quantity },
          })
          // 繼續釋放其他項目（不中斷）
          continue
        }

        if (!data || !data.success) {
          dbLogger.warn('釋放保留庫存失敗', {
            module: this.moduleName,
            metadata: {
              productId: item.product_id,
              productName: item.product_name,
              quantity: item.quantity,
              error: data?.error || 'Unknown error',
            },
          })
        } else {
          dbLogger.info('釋放保留庫存成功', {
            module: this.moduleName,
            metadata: {
              productId: item.product_id,
              productName: item.product_name,
              quantity: item.quantity,
            },
          })
        }
      } catch (error) {
        dbLogger.error('釋放保留庫存異常', error as Error, {
          module: this.moduleName,
          metadata: { productId: item.product_id, quantity: item.quantity },
        })
        // 繼續處理其他項目
      }
    }
  }

  /**
   * 完成保留（從保留轉為實際扣減）
   * 在詢問單交易完成時調用
   */
  async finalizeInventory(items: InquiryItem[]): Promise<void> {
    const client = this.getSupabaseClient()

    for (const item of items) {
      const { data, error } = await client.rpc('finalize_reserved_inventory', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      })

      if (error) {
        dbLogger.error('完成保留庫存失敗', error, {
          module: this.moduleName,
          metadata: { productId: item.product_id, quantity: item.quantity },
        })
        throw new Error(`完成庫存扣減失敗: ${item.product_name}`)
      }

      if (!data || !data.success) {
        dbLogger.error('完成保留庫存失敗', new Error(data?.error || 'Unknown error'), {
          module: this.moduleName,
          metadata: {
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
          },
        })
        throw new Error(
          `完成庫存扣減失敗: ${item.product_name} - ${data?.error || 'Unknown error'}`
        )
      }

      dbLogger.info('完成保留庫存成功', {
        module: this.moduleName,
        metadata: {
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          result: data,
        },
      })
    }
  }

  /**
   * 回滾保留庫存（錯誤處理）
   * 當保留過程中發生錯誤時，釋放已保留的庫存
   */
  private async rollbackReservations(inquiryId: string, items: InquiryItem[]): Promise<void> {
    if (items.length === 0) return

    dbLogger.warn('開始回滾保留庫存', {
      module: this.moduleName,
      metadata: { inquiryId, itemsCount: items.length },
    })

    await this.releaseInventory(items)

    dbLogger.info('保留庫存回滾完成', {
      module: this.moduleName,
      metadata: { inquiryId, itemsCount: items.length },
    })
  }
}

// 建立並匯出服務實例
export const inquiryInventoryService = new InquiryInventoryService()
