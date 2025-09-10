/**
 * 訂單服務 - 基於 Supabase
 *
 * 提供完整的訂單管理功能：
 * - 使用者訂單 CRUD 操作
 * - 管理員訂單管理
 * - 訂單統計和報表
 * - 訂單狀態追蹤
 */

import { AbstractSupabaseService, DataTransformer } from '@/lib/abstract-supabase-service'
import {
  Order,
  OrderItem,
  OrderService as IOrderService,
  CreateOrderRequest,
  OrderSummary,
  OrderStatus,
  OrderFilters,
  OrderListResponse,
  ShippingAddress,
} from '@/types/order'
import { PaginatedResult, QueryOptions } from '@/lib/base-service'
import { dbLogger } from '@/lib/logger'
import { ValidationError, NotFoundError, ErrorFactory } from '@/lib/errors'

/**
 * 資料庫記錄類型定義
 */
interface OrderRecord {
  id: string
  order_number: string
  user_id: string
  status: OrderStatus
  subtotal: number
  shipping_fee: number
  tax: number
  total_amount: number
  shipping_address: Record<string, any>
  payment_method?: string
  payment_status?: string
  payment_id?: string
  notes?: string
  estimated_delivery_date?: string
  actual_delivery_date?: string
  tracking_number?: string
  created_at: string
  updated_at: string
}

interface OrderItemRecord {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_image?: string
  quantity: number
  unit_price: number
  price_unit?: string
  unit_quantity?: number
  subtotal: number
  created_at: string
  updated_at: string
}

/**
 * 訂單資料轉換器
 */
export class OrderTransformer implements DataTransformer<Order, OrderRecord> {
  transform(record: OrderRecord): Order {
    return this.fromDB(record)
  }

  fromDB(record: OrderRecord): Order {
    return {
      id: record.id,
      orderNumber: record.order_number,
      userId: record.user_id,
      status: record.status,
      items: [], // 將由服務層單獨載入
      subtotal: Number(record.subtotal),
      shippingFee: Number(record.shipping_fee),
      tax: Number(record.tax),
      totalAmount: Number(record.total_amount),
      shippingAddress: record.shipping_address as ShippingAddress,
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

  toDB(order: Order): OrderRecord {
    return {
      id: order.id,
      order_number: order.orderNumber,
      user_id: order.userId,
      status: order.status,
      subtotal: order.subtotal,
      shipping_fee: order.shippingFee,
      tax: order.tax,
      total_amount: order.totalAmount,
      shipping_address: order.shippingAddress as any,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      payment_id: order.paymentId,
      notes: order.notes,
      estimated_delivery_date: order.estimatedDeliveryDate,
      actual_delivery_date: order.actualDeliveryDate,
      tracking_number: order.trackingNumber,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    }
  }

  reverseTransform(order: Order): OrderRecord {
    return this.toDB(order)
  }
}

/**
 * 訂單項目資料轉換器
 */
export class OrderItemTransformer implements DataTransformer<OrderItem, OrderItemRecord> {
  transform(record: OrderItemRecord): OrderItem {
    return this.fromDB(record)
  }

  fromDB(record: OrderItemRecord): OrderItem {
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

  toDB(item: OrderItem): OrderItemRecord {
    return {
      id: item.id,
      order_id: item.orderId,
      product_id: item.productId,
      product_name: item.productName,
      product_image: item.productImage,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      price_unit: item.priceUnit,
      unit_quantity: item.unitQuantity,
      subtotal: item.subtotal,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    }
  }

  reverseTransform(item: OrderItem): OrderItemRecord {
    return this.toDB(item)
  }
}

/**
 * 訂單服務實作
 */
export class OrderService
  extends AbstractSupabaseService<Order, CreateOrderRequest, Partial<Order>>
  implements IOrderService
{
  private readonly orderItemService: AbstractSupabaseService<
    OrderItem,
    Partial<OrderItem>,
    Partial<OrderItem>
  >

  constructor() {
    super({
      tableName: 'orders',
      useAdminClient: true,
      enableCache: false,
      enableAuditLog: true,
    })

    // 建立訂單項目服務
    this.orderItemService = new (class extends AbstractSupabaseService<
      OrderItem,
      Partial<OrderItem>,
      Partial<OrderItem>
    > {
      constructor() {
        super({
          tableName: 'order_items',
          useAdminClient: true,
          enableCache: false,
          enableAuditLog: true,
        })
      }
    })()
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
        shipping_address: orderData.shippingAddress,
        payment_method: orderData.paymentMethod,
        payment_status: 'pending',
        notes: orderData.notes,
      }

      const client = this.getClient(true)
      const { data: orderData_result, error: orderError } = await client
        .from('orders')
        .insert([orderRecord])
        .select()
        .single()

      if (orderError) {
        this.handleError(orderError, 'createOrder', { userId, orderNumber })
      }

      // 建立訂單項目
      const orderItemsWithOrderId = orderItems.map(item => ({
        ...item,
        order_id: orderData_result.id,
      }))

      const { data: itemsData, error: itemsError } = await client
        .from('order_items')
        .insert(orderItemsWithOrderId)
        .select()

      if (itemsError) {
        // 回滾訂單
        await client.from('orders').delete().eq('id', orderData_result.id)
        this.handleError(itemsError, 'createOrder:items', { orderId: orderData_result.id })
      }

      // 更新產品庫存
      await this.updateProductInventory(orderData.items)

      const order = this.orderFromDB(orderData_result as any)
      order.items = itemsData.map(item => this.orderItemFromDB(item as any))

      timer.end({ metadata: { orderId: order.id, orderNumber, totalAmount } })

      dbLogger.info('建立訂單成功', {
        module: 'OrderService',
        action: 'createOrder',
        metadata: { orderId: order.id, userId, orderNumber, totalAmount },
      })

      return order
    } catch (error) {
      timer.end()
      this.handleError(error, 'createOrder', { userId })
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
      this.handleError(error, 'cancelOrder', { orderId, userId })
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
   * 管理員：更新訂單狀態
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<void> {
    if (!orderId || !status) {
      throw new ValidationError('訂單 ID 和狀態不能為空')
    }

    const timer = dbLogger.timer('更新訂單狀態')

    try {
      const updateData: Partial<Order> = {
        status,
        notes: notes ? notes : undefined,
      }

      // 如果狀態是已送達，設定實際送達日期
      if (status === 'delivered') {
        updateData.actualDeliveryDate = new Date().toISOString().split('T')[0]
      }

      await this.update(orderId, updateData)

      timer.end({ metadata: { orderId, status, notes } })

      dbLogger.info('更新訂單狀態成功', {
        module: 'OrderService',
        action: 'updateOrderStatus',
        metadata: { orderId, status, notes },
      })
    } catch (error) {
      timer.end()
      this.handleError(error, 'updateOrderStatus', { orderId, status })
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
   * 生成訂單編號
   */
  async generateOrderNumber(): Promise<string> {
    try {
      const client = this.getClient()
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
  calculateTax(subtotal: number): number {
    // 台灣目前食品類商品免營業稅
    // 這裡預留稅費計算邏輯
    return 0
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
      shippingAddress: record.shipping_address as ShippingAddress,
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

  // 私有方法

  /**
   * 取得訂單項目
   */
  private async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const query = this.orderItemService['createQuery']()
    const { data, error } = await query.select('*').eq('order_id', orderId)

    if (error) {
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'OrderService',
        action: 'getOrderItems',
        context: { orderId },
      })
    }

    return (data || []).map(item => this.orderItemFromDB(item as any))
  }

  /**
   * 取得產品詳情（簡化版）
   */
  private async getProductById(productId: string): Promise<any> {
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
        module: 'OrderService',
        action: 'getProductById',
        context: { productId },
      })
    }

    return data
  }

  /**
   * 更新產品庫存
   */
  private async updateProductInventory(
    items: { productId: string; quantity: number }[]
  ): Promise<void> {
    const client = this.getClient(true)

    for (const item of items) {
      const { error } = await client.rpc('update_product_inventory', {
        product_id: item.productId,
        quantity_change: -item.quantity, // 減少庫存
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
    const client = this.getClient(true)

    for (const item of items) {
      const { error } = await client.rpc('update_product_inventory', {
        product_id: item.productId,
        quantity_change: item.quantity, // 增加庫存
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

// 匯出服務實例
export const orderService = new OrderService()
