/**
 * 訂單服務
 * 整合查詢和命令操作
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { ValidationError, NotFoundError, ErrorFactory } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import {
  Order,
  OrderItem,
  OrderStatus,
  OrderSummary,
  CreateOrderRequest,
  ShippingAddress,
} from '@/types/order'
import { orderFromDB, orderItemFromDB } from './orderMappers'
import type { OrderRecord, OrderItemRecord } from './types'

const getAdmin = () => {
  const client = getSupabaseAdmin()
  if (!client) {
    throw new Error('Supabase admin client not initialized')
  }
  return client
}

export class OrderService {
  private readonly orderItemsTable = 'order_items'
  private readonly tableName = 'orders'

  // ==================== 查詢方法 (Query) ====================

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
          module: 'OrderService',
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
          module: 'OrderService',
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
        module: 'OrderService',
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
          module: 'OrderService',
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
        module: 'OrderService',
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
          module: 'OrderService',
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
          module: 'OrderService',
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
        module: 'OrderService',
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
          module: 'OrderService',
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
        module: 'OrderService',
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
        module: 'OrderService',
        action: 'getOrderItems',
        context: { orderId },
      })
    }

    return (data || []).map(item => orderItemFromDB(item as OrderItemRecord))
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
        module: 'OrderService',
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
          module: 'OrderService',
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
        module: 'OrderService',
        action: 'findById',
        context: { orderId },
      })
    }
  }

  // ==================== 命令方法 (Command) ====================

  /**
   * 建立新訂單
   */
  async createOrder(userId: string, orderData: CreateOrderRequest): Promise<Order> {
    if (!userId || !orderData.items || orderData.items.length === 0) {
      throw new ValidationError('使用者 ID 和訂單項目不能為空')
    }

    const timer = dbLogger.timer('建立訂單')

    try {
      // 生成訂單編號
      const orderNumber = await this.generateOrderNumber()

      // 計算訂單金額
      let subtotal = 0
      const orderItems: Partial<OrderItem>[] = []

      // 驗證產品並計算金額
      for (const item of orderData.items) {
        const product = await this.getProductById(item.productId)
        if (!product) {
          throw new NotFoundError(`產品不存在: ${item.productId}`)
        }

        if (product.inventory < item.quantity) {
          throw new ValidationError(`產品庫存不足: ${product.name}`)
        }

        const itemSubtotal = product.price * item.quantity
        subtotal += itemSubtotal

        orderItems.push({
          productId: item.productId,
          productName: product.name,
          productImage: product.images?.[0],
          quantity: item.quantity,
          unitPrice: product.price,
          priceUnit: product.priceUnit,
          unitQuantity: product.unitQuantity,
          subtotal: itemSubtotal,
        })
      }

      // 計算運費和稅費
      const shippingFee = await this.calculateShippingFee(
        orderItems as OrderItem[],
        orderData.shippingAddress
      )
      const tax = this.calculateTax(subtotal)
      const totalAmount = subtotal + shippingFee + tax

      // 建立訂單
      const orderRecord = {
        order_number: orderNumber,
        user_id: userId,
        status: 'pending' as OrderStatus,
        subtotal,
        shipping_fee: shippingFee,
        tax,
        total_amount: totalAmount,
        shipping_address: orderData.shippingAddress as any,
        payment_method: orderData.paymentMethod,
        payment_status: 'pending',
        notes: orderData.notes,
      }

      const client = getAdmin()
      const { data: orderData_result, error: orderError } = await client
        .from(this.tableName)
        .insert([orderRecord] as any)
        .select()
        .single()

      if (orderError) {
        throw ErrorFactory.fromSupabaseError(orderError, {
          module: 'OrderService',
          action: 'createOrder',
          context: { userId, orderNumber },
        })
      }

      // 建立訂單項目
      const orderItemsWithOrderId = orderItems.map(item => ({
        order_id: orderData_result.id,
        product_id: item.productId,
        product_name: item.productName,
        product_image: item.productImage,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        price_unit: item.priceUnit,
        unit_quantity: item.unitQuantity,
        subtotal: item.subtotal,
      }))

      const { data: itemsData, error: itemsError } = await client
        .from(this.orderItemsTable)
        .insert(orderItemsWithOrderId as any)
        .select()

      if (itemsError) {
        // 回滾訂單
        await client.from(this.tableName).delete().eq('id', orderData_result.id)
        throw ErrorFactory.fromSupabaseError(itemsError, {
          module: 'OrderService',
          action: 'createOrder:items',
          context: { orderId: orderData_result.id },
        })
      }

      // 更新產品庫存
      await this.updateProductInventory(orderData.items)

      const order = orderFromDB(orderData_result as any)
      order.items = itemsData.map(item => orderItemFromDB(item as any))

      timer.end({ metadata: { orderId: order.id, orderNumber, totalAmount } })

      dbLogger.info('建立訂單成功', {
        module: 'OrderService',
        action: 'createOrder',
        metadata: { orderId: order.id, userId, orderNumber, totalAmount },
      })

      return order
    } catch (error) {
      timer.end()
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'OrderService',
        action: 'createOrder',
        context: { userId },
      })
    }
  }

  /**
   * 取消訂單
   */
  async cancelOrder(orderId: string, userId: string, reason?: string): Promise<void> {
    if (!orderId || !userId) {
      throw new ValidationError('訂單 ID 和使用者 ID 不能為空')
    }

    const timer = dbLogger.timer('取消訂單')

    try {
      // 檢查訂單是否存在且屬於該使用者
      const order = await this.getOrderById(orderId, userId)
      if (!order) {
        throw new NotFoundError('訂單不存在或無權限')
      }

      // 檢查訂單狀態是否可以取消
      if (!['pending', 'confirmed'].includes(order.status)) {
        throw new ValidationError('此訂單狀態無法取消')
      }

      // 更新訂單狀態
      await this.updateOrderStatus(orderId, 'cancelled', reason)

      // 恢復產品庫存
      await this.restoreProductInventory(order.items)

      timer.end({ metadata: { orderId, userId } })

      dbLogger.info('取消訂單成功', {
        module: 'OrderService',
        action: 'cancelOrder',
        metadata: { orderId, userId, reason },
      })
    } catch (error) {
      timer.end()
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'OrderService',
        action: 'cancelOrder',
        context: { orderId, userId },
      })
    }
  }

  /**
   * 管理員：更新訂單狀態
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<void> {
    if (!orderId || !status) {
      throw new ValidationError('訂單 ID 和狀態不能為空')
    }

    const timer = dbLogger.timer('更新訂單狀態')

    try {
      const updateData: Record<string, any> = {
        status,
        notes: notes || undefined,
      }

      // 如果狀態是已送達，設定實際送達日期
      if (status === 'delivered') {
        updateData.actual_delivery_date = new Date().toISOString().split('T')[0]
      }

      const client = getAdmin()
      const { error } = await client.from(this.tableName).update(updateData).eq('id', orderId)

      if (error) {
        throw ErrorFactory.fromSupabaseError(error, {
          module: 'OrderService',
          action: 'updateOrderStatus',
          context: { orderId, status },
        })
      }

      timer.end({ metadata: { orderId, status, notes } })

      dbLogger.info('更新訂單狀態成功', {
        module: 'OrderService',
        action: 'updateOrderStatus',
        metadata: { orderId, status, notes },
      })
    } catch (error) {
      timer.end()
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'OrderService',
        action: 'updateOrderStatus',
        context: { orderId, status },
      })
    }
  }

  /**
   * 更新訂單（通用方法）
   */
  async updateOrder(orderId: string, updates: Partial<Order>): Promise<Order> {
    if (!orderId) {
      throw new ValidationError('訂單 ID 不能為空')
    }

    const timer = dbLogger.timer('更新訂單')

    try {
      const client = getAdmin()
      const { error: updateError } = await client
        .from(this.tableName)
        .update(updates)
        .eq('id', orderId)

      if (updateError) {
        throw ErrorFactory.fromSupabaseError(updateError, {
          module: 'OrderService',
          action: 'updateOrder:update',
          context: { orderId },
        })
      }

      // 重新取得更新後的訂單
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) {
        throw ErrorFactory.fromSupabaseError(error, {
          module: 'OrderService',
          action: 'updateOrder:fetch',
          context: { orderId },
        })
      }

      const order = orderFromDB(data as any)

      timer.end({ metadata: { orderId } })

      dbLogger.info('更新訂單成功', {
        module: 'OrderService',
        action: 'updateOrder',
        metadata: { orderId, updates: Object.keys(updates) },
      })

      return order
    } catch (error) {
      timer.end()
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'OrderService',
        action: 'updateOrder',
        context: { orderId },
      })
    }
  }

  // ==================== 輔助方法 (Private) ====================

  /**
   * 批次取得多個訂單的項目（解決 N+1 查詢問題）
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
        module: 'OrderService',
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
   * 生成訂單編號
   */
  async generateOrderNumber(): Promise<string> {
    try {
      const client = getAdmin()
      const { data, error } = await client.rpc('generate_order_number')

      if (error) {
        throw ErrorFactory.fromSupabaseError(error, {
          module: 'OrderService',
          action: 'generateOrderNumber',
        })
      }

      return data
    } catch (error) {
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'OrderService',
        action: 'generateOrderNumber',
      })
    }
  }

  /**
   * 計算運費
   */
  async calculateShippingFee(items: OrderItem[], address: ShippingAddress): Promise<number> {
    // 簡化的運費計算邏輯
    // 實際應用中可能需要根據地區、重量、體積等因素計算
    const baseShippingFee = 60 // 基本運費 60 元
    const freeShippingThreshold = 1000 // 滿 1000 元免運費

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)

    if (subtotal >= freeShippingThreshold) {
      return 0
    }

    // 偏遠地區加收運費
    const remoteAreas = ['離島', '山區']
    const isRemoteArea = remoteAreas.some(area => address.city.includes(area))

    return isRemoteArea ? baseShippingFee + 40 : baseShippingFee
  }

  /**
   * 計算稅費
   */
  calculateTax(_subtotal: number): number {
    // 台灣目前食品類商品免營業稅
    // 這裡預留稅費計算邏輯
    return 0
  }

  /**
   * 更新產品庫存
   */
  private async updateProductInventory(
    items: { productId: string; quantity: number }[]
  ): Promise<void> {
    const client = getAdmin()

    for (const item of items) {
      const { error } = await client.rpc('update_product_inventory', {
        p_product_id: item.productId,
        p_quantity_change: -item.quantity, // 減少庫存
      })

      if (error) {
        dbLogger.error('更新產品庫存失敗', error, {
          module: 'OrderService',
          action: 'updateProductInventory',
          metadata: { productId: item.productId, quantity: item.quantity },
        })
      }
    }
  }

  /**
   * 恢復產品庫存
   */
  private async restoreProductInventory(items: OrderItem[]): Promise<void> {
    const client = getAdmin()

    for (const item of items) {
      const { error } = await client.rpc('update_product_inventory', {
        p_product_id: item.productId,
        p_quantity_change: item.quantity, // 增加庫存
      })

      if (error) {
        dbLogger.error('恢復產品庫存失敗', error, {
          module: 'OrderService',
          action: 'restoreProductInventory',
          metadata: { productId: item.productId, quantity: item.quantity },
        })
      }
    }
  }
}

// 建立並匯出服務實例
export const orderService = new OrderService()
