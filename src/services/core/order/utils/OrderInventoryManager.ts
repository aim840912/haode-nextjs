/**
 * 訂單庫存管理工具
 * 負責產品庫存的更新和恢復
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { ErrorFactory, NotFoundError } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import type { OrderItem } from '@/types/order'

const getAdmin = () => {
  const client = getSupabaseAdmin()
  if (!client) {
    throw new Error('Supabase admin client not initialized')
  }
  return client
}

export class OrderInventoryManager {
  /**
   * 取得產品詳情（簡化版）
   */
  static async getProductById(productId: string): Promise<any> {
    const client = getAdmin()
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'OrderInventoryManager',
        action: 'getProductById',
        context: { productId },
      })
    }

    return data
  }

  /**
   * 更新產品庫存（減少庫存）
   */
  static async updateInventory(items: { productId: string; quantity: number }[]): Promise<void> {
    const client = getAdmin()

    for (const item of items) {
      const { error } = await client.rpc('update_product_inventory', {
        p_product_id: item.productId,
        p_quantity_change: -item.quantity, // 減少庫存
      })

      if (error) {
        dbLogger.error('更新產品庫存失敗', error, {
          module: 'OrderInventoryManager',
          action: 'updateInventory',
          metadata: { productId: item.productId, quantity: item.quantity },
        })
      }
    }
  }

  /**
   * 恢復產品庫存（增加庫存）
   */
  static async restoreInventory(items: OrderItem[]): Promise<void> {
    const client = getAdmin()

    for (const item of items) {
      const { error } = await client.rpc('update_product_inventory', {
        p_product_id: item.productId,
        p_quantity_change: item.quantity, // 增加庫存
      })

      if (error) {
        dbLogger.error('恢復產品庫存失敗', error, {
          module: 'OrderInventoryManager',
          action: 'restoreInventory',
          metadata: { productId: item.productId, quantity: item.quantity },
        })
      }
    }
  }

  /**
   * 驗證產品庫存是否足夠
   */
  static async validateInventory(productId: string, requestedQuantity: number): Promise<void> {
    const product = await this.getProductById(productId)

    if (!product) {
      throw new NotFoundError(`產品不存在: ${productId}`)
    }

    if (product.inventory < requestedQuantity) {
      throw new Error(`產品庫存不足: ${product.name}`)
    }
  }
}
