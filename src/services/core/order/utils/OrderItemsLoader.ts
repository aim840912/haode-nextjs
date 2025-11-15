/**
 * 訂單項目載入工具
 * 負責批次載入訂單項目,解決 N+1 查詢問題
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { ErrorFactory } from '@/lib/errors'
import { orderItemFromDB } from '../orderMappers'
import type { OrderItem } from '@/types/order'
import type { OrderItemRecord } from '../types'

const getAdmin = () => {
  const client = getSupabaseAdmin()
  if (!client) {
    throw new Error('Supabase admin client not initialized')
  }
  return client
}

export class OrderItemsLoader {
  private static readonly ORDER_ITEMS_TABLE = 'order_items'

  /**
   * 取得單一訂單的項目
   */
  static async loadByOrderId(orderId: string): Promise<OrderItem[]> {
    const client = getAdmin()
    const { data, error } = await client
      .from(this.ORDER_ITEMS_TABLE)
      .select('*')
      .eq('order_id', orderId)

    if (error) {
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'OrderItemsLoader',
        action: 'loadByOrderId',
        context: { orderId },
      })
    }

    return (data || []).map(item => orderItemFromDB(item as OrderItemRecord))
  }

  /**
   * 批次取得多個訂單的項目（解決 N+1 查詢問題）
   */
  static async loadBatch(orderIds: string[]): Promise<Map<string, OrderItem[]>> {
    if (orderIds.length === 0) {
      return new Map()
    }

    const client = getAdmin()
    const { data, error } = await client
      .from(this.ORDER_ITEMS_TABLE)
      .select('*')
      .in('order_id', orderIds)

    if (error) {
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'OrderItemsLoader',
        action: 'loadBatch',
        context: { orderIds },
      })
    }

    // 將項目按 order_id 分組
    const itemsByOrderId = new Map<string, OrderItem[]>()
    for (const record of data || []) {
      const item = orderItemFromDB(record as OrderItemRecord)
      const orderId = record.order_id
      if (!itemsByOrderId.has(orderId)) {
        itemsByOrderId.set(orderId, [])
      }
      itemsByOrderId.get(orderId)!.push(item)
    }

    return itemsByOrderId
  }

  /**
   * 關聯訂單項目到訂單列表
   */
  static assignItemsToOrders<T extends { id: string; items?: OrderItem[] }>(
    orders: T[],
    itemsByOrderId: Map<string, OrderItem[]>
  ): void {
    for (const order of orders) {
      order.items = itemsByOrderId.get(order.id) || []
    }
  }
}
