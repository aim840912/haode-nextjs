/**
 * 訂單服務
 * 整合查詢和命令操作
 *
 * 重構後:
 * - 移除重複的錯誤處理和計時邏輯 (使用 ServiceDecorators)
 * - 拆分輔助函數到 utils/ 模組
 * - 使用 QueryBuilder 統一分頁查詢
 * - 保持單一 Service 入口,降低檔案複雜度
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { ValidationError, NotFoundError, ErrorFactory } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import { Order, OrderItem, OrderStatus, OrderSummary, CreateOrderRequest } from '@/types/order'
import { orderFromDB, orderItemFromDB, generateOrderNumber } from './orderMappers'
import type { OrderRecord, OrderItemRecord } from './types'

// 工具模組
import { OrderCalculator } from './utils/OrderCalculator'
import { OrderInventoryManager } from './utils/OrderInventoryManager'
import { OrderItemsLoader } from './utils/OrderItemsLoader'
import { withServiceOperation, withServiceOperationLogged } from '../utils/ServiceDecorators'
import { QueryBuilder } from '../utils/QueryBuilder'

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

    return withServiceOperation(
      {
        module: 'OrderService',
        action: '取得使用者訂單',
        context: { userId, limit, offset },
      },
      async () => {
        // 使用 QueryBuilder 簡化分頁查詢
        const { data: ordersData, total } = await QueryBuilder.paginate<OrderRecord>({
          tableName: this.tableName,
          filters: { user_id: userId },
          orderBy: { column: 'created_at', ascending: false },
          limit,
          offset,
        })

        const orders = ordersData.map(record => orderFromDB(record))

        // 批次載入所有訂單的項目（解決 N+1 問題）
        const orderIds = orders.map(order => order.id)
        const itemsByOrderId = await OrderItemsLoader.loadBatch(orderIds)

        // 關聯訂單項目
        OrderItemsLoader.assignItemsToOrders(orders, itemsByOrderId)

        return { orders, total }
      }
    )
  }

  /**
   * 取得單一訂單詳情（含驗證使用者權限）
   */
  async getOrderById(orderId: string, userId: string): Promise<Order | null> {
    if (!orderId || !userId) {
      throw new ValidationError('訂單 ID 和使用者 ID 不能為空')
    }

    return withServiceOperation(
      {
        module: 'OrderService',
        action: '取得訂單詳情',
        context: { orderId, userId },
      },
      async () => {
        const data = await QueryBuilder.findOne<OrderRecord>(this.tableName, {
          id: orderId,
          user_id: userId,
        })

        if (!data) {
          return null
        }

        const order = orderFromDB(data)
        order.items = await OrderItemsLoader.loadByOrderId(orderId)

        return order
      }
    )
  }

  /**
   * 管理員：取得所有訂單
   */
  async getAllOrders(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ orders: Order[]; total: number }> {
    return withServiceOperation(
      {
        module: 'OrderService',
        action: '取得所有訂單',
        context: { limit, offset },
      },
      async () => {
        const { data: ordersData, total } = await QueryBuilder.paginate<OrderRecord>({
          tableName: this.tableName,
          orderBy: { column: 'created_at', ascending: false },
          limit,
          offset,
        })

        const orders = ordersData.map(record => orderFromDB(record))

        // 批次載入所有訂單的項目
        const orderIds = orders.map(order => order.id)
        const itemsByOrderId = await OrderItemsLoader.loadBatch(orderIds)

        OrderItemsLoader.assignItemsToOrders(orders, itemsByOrderId)

        return { orders, total }
      }
    )
  }

  /**
   * 取得訂單統計
   */
  async getOrderSummary(): Promise<OrderSummary> {
    return withServiceOperation(
      {
        module: 'OrderService',
        action: '取得訂單統計',
      },
      async () => {
        const client = getAdmin()
        const { data, error } = await client.from('order_summary_view').select('*').single()

        if (error) {
          throw ErrorFactory.fromSupabaseError(error, {
            module: 'OrderService',
            action: 'getOrderSummary',
          })
        }

        // 處理空數據，返回預設值 0
        if (!data) {
          return {
            totalOrders: 0,
            totalAmount: 0,
            pendingOrders: 0,
            processingOrders: 0,
            deliveredOrders: 0,
          }
        }

        return {
          totalOrders: data.total_orders || 0,
          totalAmount: Number(data.total_amount || 0),
          pendingOrders: data.pending_orders || 0,
          processingOrders: data.processing_orders || 0,
          deliveredOrders: data.delivered_orders || 0,
        }
      }
    )
  }

  /**
   * 根據 ID 取得訂單（管理員用，不驗證使用者）
   */
  async findById(orderId: string): Promise<Order | null> {
    return withServiceOperation(
      {
        module: 'OrderService',
        action: '根據 ID 取得訂單',
        context: { orderId },
      },
      async () => {
        const data = await QueryBuilder.findOne<OrderRecord>(this.tableName, {
          id: orderId,
        })

        if (!data) {
          return null
        }

        const order = orderFromDB(data)
        order.items = await OrderItemsLoader.loadByOrderId(orderId)

        return order
      }
    )
  }

  // ==================== 命令方法 (Command) ====================

  /**
   * 建立新訂單
   */
  async createOrder(userId: string, orderData: CreateOrderRequest): Promise<Order> {
    if (!userId || !orderData.items || orderData.items.length === 0) {
      throw new ValidationError('使用者 ID 和訂單項目不能為空')
    }

    return withServiceOperationLogged(
      {
        module: 'OrderService',
        action: '建立訂單',
        context: { userId },
      },
      async () => {
        // 生成訂單編號
        const orderNumber = await generateOrderNumber()

        // 計算訂單金額
        let subtotal = 0
        const orderItems: Partial<OrderItem>[] = []

        // 驗證產品並計算金額
        for (const item of orderData.items) {
          const product = await OrderInventoryManager.getProductById(item.productId)
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

        // 計算運費和稅費 (使用 OrderCalculator)
        const shippingFee = OrderCalculator.calculateShippingFee(
          orderItems as OrderItem[],
          orderData.shippingAddress
        )
        const tax = OrderCalculator.calculateTax(subtotal)
        const totalAmount = OrderCalculator.calculateTotal(subtotal, shippingFee, tax)

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

        // 更新產品庫存 (使用 OrderInventoryManager)
        await OrderInventoryManager.updateInventory(orderData.items)

        const order = orderFromDB(orderData_result as any)
        order.items = itemsData.map(item => orderItemFromDB(item as any))

        return order
      },
      '建立訂單成功'
    )
  }

  /**
   * 取消訂單
   */
  async cancelOrder(orderId: string, userId: string, reason?: string): Promise<void> {
    if (!orderId || !userId) {
      throw new ValidationError('訂單 ID 和使用者 ID 不能為空')
    }

    return withServiceOperationLogged(
      {
        module: 'OrderService',
        action: '取消訂單',
        context: { orderId, userId, reason },
      },
      async () => {
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

        // 恢復產品庫存 (使用 OrderInventoryManager)
        await OrderInventoryManager.restoreInventory(order.items)
      },
      '取消訂單成功'
    )
  }

  /**
   * 管理員：更新訂單狀態
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<void> {
    if (!orderId || !status) {
      throw new ValidationError('訂單 ID 和狀態不能為空')
    }

    return withServiceOperationLogged(
      {
        module: 'OrderService',
        action: '更新訂單狀態',
        context: { orderId, status, notes },
      },
      async () => {
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
      },
      '更新訂單狀態成功'
    )
  }

  /**
   * 更新訂單（通用方法）
   */
  async updateOrder(orderId: string, updates: Partial<Order>): Promise<Order> {
    if (!orderId) {
      throw new ValidationError('訂單 ID 不能為空')
    }

    return withServiceOperationLogged(
      {
        module: 'OrderService',
        action: '更新訂單',
        context: { orderId, updates: Object.keys(updates) },
      },
      async () => {
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

        return orderFromDB(data as any)
      },
      '更新訂單成功'
    )
  }
}

// 建立並匯出服務實例
export const orderService = new OrderService()
