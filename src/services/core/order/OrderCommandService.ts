/**
 * 訂單命令服務
 * 負責所有寫入操作（建立、更新、刪除）
 */

import { ValidationError, NotFoundError, ErrorFactory } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import { AbstractSupabaseService } from '@/services/base/abstract-supabase-service'
import { Order, OrderItem, OrderStatus, CreateOrderRequest, ShippingAddress } from '@/types/order'
import type { CreateOrderDTO, UpdateOrderDTO } from '@/types/service-dto.types'
import type { OrderQueryService } from './OrderQueryService'

export class OrderCommandService extends AbstractSupabaseService<
  Order,
  CreateOrderDTO,
  UpdateOrderDTO
> {
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
   * 建立新訂單
   */
  async createOrder(
    userId: string,
    orderData: CreateOrderRequest,
    queryService: OrderQueryService
  ): Promise<Order> {
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
        const product = await queryService.getProductById(item.productId)
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
        .from(this.orderItemsTable)
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
        module: 'OrderCommandService',
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
  async cancelOrder(
    orderId: string,
    userId: string,
    queryService: OrderQueryService,
    reason?: string
  ): Promise<void> {
    if (!orderId || !userId) {
      throw new ValidationError('訂單 ID 和使用者 ID 不能為空')
    }

    const timer = dbLogger.timer('取消訂單')

    try {
      // 檢查訂單是否存在且屬於該使用者
      const order = await queryService.getOrderById(orderId, userId)
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
        module: 'OrderCommandService',
        action: 'cancelOrder',
        metadata: { orderId, userId, reason },
      })
    } catch (error) {
      timer.end()
      this.handleError(error, 'cancelOrder', { orderId, userId })
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
        module: 'OrderCommandService',
        action: 'updateOrderStatus',
        metadata: { orderId, status, notes },
      })
    } catch (error) {
      timer.end()
      this.handleError(error, 'updateOrderStatus', { orderId, status })
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
      await this.update(orderId, updates)

      // 重新取得更新後的訂單
      const client = this.getClient()
      const { data, error } = await client.from('orders').select('*').eq('id', orderId).single()

      if (error) {
        this.handleError(error, 'updateOrder:fetch', { orderId })
      }

      const order = this.orderFromDB(data as any)

      timer.end({ metadata: { orderId } })

      dbLogger.info('更新訂單成功', {
        module: 'OrderCommandService',
        action: 'updateOrder',
        metadata: { orderId, updates: Object.keys(updates) },
      })

      return order
    } catch (error) {
      timer.end()
      this.handleError(error, 'updateOrder', { orderId })
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
          module: 'OrderCommandService',
          action: 'generateOrderNumber',
        })
      }

      return data
    } catch (error) {
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'OrderCommandService',
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
    const client = this.getClient(true)

    for (const item of items) {
      const { error } = await client.rpc('update_product_inventory', {
        product_id: item.productId,
        quantity_change: -item.quantity, // 減少庫存
      })

      if (error) {
        dbLogger.error('更新產品庫存失敗', error, {
          module: 'OrderCommandService',
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
          module: 'OrderCommandService',
          action: 'restoreProductInventory',
          metadata: { productId: item.productId, quantity: item.quantity },
        })
      }
    }
  }

  // 資料轉換方法
  private orderFromDB(record: any): Order {
    return {
      id: record.id,
      orderNumber: record.order_number,
      userId: record.user_id,
      status: record.status,
      items: [],
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

  private orderItemFromDB(record: any): OrderItem {
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
