/**
 * 訂單查詢服務
 * 負責所有讀取操作
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { ValidationError, ErrorFactory } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import { Order, OrderItem, OrderSummary } from '@/types/order'
import { orderFromDB, orderItemFromDB } from './orderMappers'
import type { OrderRecord, OrderItemRecord } from './types'

const getAdmin = () => {
  const client = getSupabaseAdmin()
  if (!client) {
    throw new Error('Supabase admin client not initialized')
  }
  return client
}

export class OrderQueryService {
  private readonly orderItemsTable = 'order_items'
  private readonly tableName = 'orders'

  /**
   * 取得使用者的訂單列表（含分頁）
   */
  async getUserOrders(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ orders: Order[]; total: number }> {
    if (!userId) {
      throw new ValidationError('使用者 ID 不能為空')
    }

    const timer = dbLogger.timer('取得使用者訂單')

    try {
      const client = getAdmin()

      // 取得總數
      const { count, error: countError } = await client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (countError) {
        throw ErrorFactory.fromSupabaseError(countError, {
          module: 'OrderQueryService',
          action: 'getUserOrders:count',
          context: { userId, limit, offset },
        })
      }

      // 取得訂單資料
      const { data: ordersData, error: dataError } = await client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (dataError) {
        throw ErrorFactory.fromSupabaseError(dataError, {
          module: 'OrderQueryService',
          action: 'getUserOrders:data',
          context: { userId, limit, offset },
        })
      }

      const orders = (ordersData || []).map(record => orderFromDB(record as OrderRecord))

      // 批次載入所有訂單的項目（解決 N+1 問題）
      const orderIds = orders.map(order => order.id)
      const itemsByOrderId = await this.getOrderItemsBatch(orderIds)

      // 將項目關聯到對應的訂單
      for (const order of orders) {
        order.items = itemsByOrderId.get(order.id) || []
      }

      timer.end({ metadata: { userId, orderCount: orders.length, total: count } })

      return {
        orders,
        total: count || 0,
      }
    } catch (error) {
      timer.end()
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'OrderQueryService',
        action: 'getUserOrders',
        context: { userId, limit, offset },
      })
    }
  }

  /**
   * 取得單一訂單詳情（含驗證使用者權限）
   */
  async getOrderById(orderId: string, userId: string): Promise<Order | null> {
    if (!orderId || !userId) {
      throw new ValidationError('訂單 ID 和使用者 ID 不能為空')
    }

    const timer = dbLogger.timer('取得訂單詳情')

    try {
      const client = getAdmin()
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          timer.end()
          return null
        }
        throw ErrorFactory.fromSupabaseError(error, {
          module: 'OrderQueryService',
          action: 'getOrderById',
          context: { orderId, userId },
        })
      }

      const order = orderFromDB(data as OrderRecord)
      order.items = await this.getOrderItems(orderId)

      timer.end({ metadata: { orderId, userId, found: true } })
      return order
    } catch (error) {
      timer.end()
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'OrderQueryService',
        action: 'getOrderById',
        context: { orderId, userId },
      })
    }
  }

  /**
   * 管理員：取得所有訂單
   */
  async getAllOrders(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ orders: Order[]; total: number }> {
    const timer = dbLogger.timer('取得所有訂單')

    try {
      const client = getAdmin()

      // 取得總數
      const { count, error: countError } = await client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })

      if (countError) {
        throw ErrorFactory.fromSupabaseError(countError, {
          module: 'OrderQueryService',
          action: 'getAllOrders:count',
          context: { limit, offset },
        })
      }

      // 取得訂單資料
      const { data: ordersData, error: dataError } = await client
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (dataError) {
        throw ErrorFactory.fromSupabaseError(dataError, {
          module: 'OrderQueryService',
          action: 'getAllOrders:data',
          context: { limit, offset },
        })
      }

      const orders = (ordersData || []).map(record => orderFromDB(record as OrderRecord))

      // 批次載入所有訂單的項目（解決 N+1 問題）
      const orderIds = orders.map(order => order.id)
      const itemsByOrderId = await this.getOrderItemsBatch(orderIds)

      // 將項目關聯到對應的訂單
      for (const order of orders) {
        order.items = itemsByOrderId.get(order.id) || []
      }

      timer.end({ metadata: { orderCount: orders.length, total: count } })

      return {
        orders,
        total: count || 0,
      }
    } catch (error) {
      timer.end()
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'OrderQueryService',
        action: 'getAllOrders',
        context: { limit, offset },
      })
    }
  }

  /**
   * 取得訂單統計
   */
  async getOrderSummary(): Promise<OrderSummary> {
    const timer = dbLogger.timer('取得訂單統計')

    try {
      const client = getAdmin()
      const { data, error } = await client.from('order_summary_view').select('*').single()

      if (error) {
        throw ErrorFactory.fromSupabaseError(error, {
          module: 'OrderQueryService',
          action: 'getOrderSummary',
        })
      }

      timer.end()

      return {
        totalOrders: data.total_orders || 0,
        totalAmount: Number(data.total_amount || 0),
        pendingOrders: data.pending_orders || 0,
        processingOrders: data.processing_orders || 0,
        deliveredOrders: data.delivered_orders || 0,
      }
    } catch (error) {
      timer.end()
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'OrderQueryService',
        action: 'getOrderSummary',
      })
    }
  }

  /**
   * 取得訂單項目
   */
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const client = getAdmin()
    const { data, error } = await client
      .from(this.orderItemsTable)
      .select('*')
      .eq('order_id', orderId)

    if (error) {
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'OrderQueryService',
        action: 'getOrderItems',
        context: { orderId },
      })
    }

    return (data || []).map(item => orderItemFromDB(item as OrderItemRecord))
  }

  /**
   * 批次取得多個訂單的項目（解決 N+1 查詢問題）
   * @private
   */
  private async getOrderItemsBatch(orderIds: string[]): Promise<Map<string, OrderItem[]>> {
    if (orderIds.length === 0) {
      return new Map()
    }

    const client = getAdmin()
    const { data, error } = await client
      .from(this.orderItemsTable)
      .select('*')
      .in('order_id', orderIds)

    if (error) {
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'OrderQueryService',
        action: 'getOrderItemsBatch',
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
   * 取得產品詳情（簡化版）
   */
  async getProductById(productId: string): Promise<any> {
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
        module: 'OrderQueryService',
        action: 'getProductById',
        context: { productId },
      })
    }

    return data
  }

  /**
   * 根據 ID 取得訂單（管理員用，不驗證使用者）
   */
  async findById(orderId: string): Promise<Order | null> {
    const timer = dbLogger.timer('根據 ID 取得訂單')

    try {
      const client = getAdmin()
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          timer.end()
          return null
        }
        throw ErrorFactory.fromSupabaseError(error, {
          module: 'OrderQueryService',
          action: 'findById',
          context: { orderId },
        })
      }

      const order = orderFromDB(data as OrderRecord)
      order.items = await this.getOrderItems(orderId)

      timer.end({ metadata: { orderId, found: true } })
      return order
    } catch (error) {
      timer.end()
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'OrderQueryService',
        action: 'findById',
        context: { orderId },
      })
    }
  }
}

// 建立並匯出服務實例
export const orderQueryService = new OrderQueryService()
