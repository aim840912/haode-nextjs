/**
 * 訂單查詢服務
 * 負責所有讀取操作
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { ValidationError, ErrorFactory } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import { Order, OrderItem, OrderSummary } from '@/types/order'
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

      const orders = (ordersData || []).map(record => this.orderFromDB(record as OrderRecord))

      // 載入每個訂單的項目
      for (const order of orders) {
        order.items = await this.getOrderItems(order.id)
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

      const order = this.orderFromDB(data as OrderRecord)
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

      const orders = (ordersData || []).map(record => this.orderFromDB(record as OrderRecord))

      // 為每個訂單載入項目
      for (const order of orders) {
        order.items = await this.getOrderItems(order.id)
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

    return (data || []).map(item => this.orderItemFromDB(item as OrderItemRecord))
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

      const order = this.orderFromDB(data as OrderRecord)
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

  // 資料轉換方法
  private orderFromDB(record: OrderRecord): Order {
    return {
      id: record.id,
      orderNumber: record.order_number,
      userId: record.user_id,
      status: record.status,
      items: [], // 將由其他方法載入
      subtotal: Number(record.subtotal),
      shippingFee: Number(record.shipping_fee),
      tax: Number(record.tax),
      totalAmount: Number(record.total_amount),
      shippingAddress: record.shipping_address as any,
      paymentMethod: record.payment_method,
      paymentStatus: record.payment_status as any,
      paymentId: record.payment_id,
      notes: record.notes,
      estimatedDeliveryDate: record.estimated_delivery_date,
      actualDeliveryDate: record.actual_delivery_date,
      trackingNumber: record.tracking_number,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }
  }

  private orderItemFromDB(record: OrderItemRecord): OrderItem {
    return {
      id: record.id,
      orderId: record.order_id,
      productId: record.product_id,
      productName: record.product_name,
      productImage: record.product_image,
      quantity: record.quantity,
      unitPrice: Number(record.unit_price),
      priceUnit: record.price_unit,
      unitQuantity: record.unit_quantity,
      subtotal: Number(record.subtotal),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }
  }
}
