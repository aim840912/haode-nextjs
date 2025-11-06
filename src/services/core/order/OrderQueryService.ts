/**
 * 訂單查詢服務
 * 負責所有讀取操作
 */

import { ValidationError, ErrorFactory } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import { AbstractSupabaseService } from '@/services/base/abstract-supabase-service'
import { Order, OrderItem, OrderSummary } from '@/types/order'
import type { OrderRecord, OrderItemRecord } from './types'

export class OrderQueryService extends AbstractSupabaseService<Order, any, any> {
  private readonly orderItemsTable = 'order_items'

  constructor() {
    super({
      tableName: 'orders',
      useAdminClient: true,
      enableCache: false,
      enableAuditLog: true,
    })
  }

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
      // 取得總數
      const countQuery = this.createQuery()
      const { count, error: countError } = await countQuery
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (countError) {
        this.handleError(countError, 'getUserOrders:count', { userId, limit, offset })
      }

      // 取得訂單資料
      const dataQuery = this.createQuery()
      const { data: ordersData, error: dataError } = await dataQuery
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (dataError) {
        this.handleError(dataError, 'getUserOrders:data', { userId, limit, offset })
      }

      const orders = (ordersData || []).map(record => this.orderFromDB(record as any))

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
      this.handleError(error, 'getUserOrders', { userId, limit, offset })
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
      const query = this.createQuery()
      const { data, error } = await query
        .select('*')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          timer.end()
          return null
        }
        this.handleError(error, 'getOrderById', { orderId, userId })
      }

      const order = this.orderFromDB(data as any)
      order.items = await this.getOrderItems(orderId)

      timer.end({ metadata: { orderId, userId, found: true } })
      return order
    } catch (error) {
      timer.end()
      this.handleError(error, 'getOrderById', { orderId, userId })
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
      const result = await this.findAllPaginated({
        page: Math.floor(offset / limit) + 1,
        limit,
        sortBy: 'created_at',
        sortOrder: 'desc',
      })

      // 為每個訂單載入項目
      for (const order of result.items) {
        order.items = await this.getOrderItems(order.id)
      }

      timer.end({ metadata: { orderCount: result.items.length, total: result.total } })

      return {
        orders: result.items,
        total: result.total,
      }
    } catch (error) {
      timer.end()
      this.handleError(error, 'getAllOrders', { limit, offset })
    }
  }

  /**
   * 取得訂單統計
   */
  async getOrderSummary(): Promise<OrderSummary> {
    const timer = dbLogger.timer('取得訂單統計')

    try {
      const client = this.getClient()
      const { data, error } = await client.from('order_summary_view').select('*').single()

      if (error) {
        this.handleError(error, 'getOrderSummary')
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
      this.handleError(error, 'getOrderSummary')
    }
  }

  /**
   * 取得訂單項目
   */
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const client = this.getClient()
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

    return (data || []).map(item => this.orderItemFromDB(item as any))
  }

  /**
   * 取得產品詳情（簡化版）
   */
  async getProductById(productId: string): Promise<any> {
    const client = this.getClient()
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
      const query = this.createQuery()
      const { data, error } = await query.select('*').eq('id', orderId).single()

      if (error) {
        if (error.code === 'PGRST116') {
          timer.end()
          return null
        }
        this.handleError(error, 'findById', { orderId })
      }

      const order = this.orderFromDB(data as any)
      order.items = await this.getOrderItems(orderId)

      timer.end({ metadata: { orderId, found: true } })
      return order
    } catch (error) {
      timer.end()
      this.handleError(error, 'findById', { orderId })
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
