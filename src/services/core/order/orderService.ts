/**
 * 訂單服務 - 重構版本
 * 使用 CQRS 模式，將查詢和命令職責分離
 * 主服務負責協調各子服務
 */

import { OrderService as IOrderService } from '@/types/order'
import type { Order, CreateOrderRequest, OrderSummary, OrderStatus } from '@/types/order'
import { OrderCommandService } from './OrderCommandService'
import { OrderQueryService } from './OrderQueryService'

/**
 * 訂單服務（協調器）
 * 組合查詢和命令服務，提供統一介面
 */
export class OrderService implements IOrderService {
  constructor(
    private queryService: OrderQueryService,
    private commandService: OrderCommandService
  ) {}

  // === 使用者端方法 ===

  /**
   * 建立新訂單
   */
  async createOrder(userId: string, orderData: CreateOrderRequest): Promise<Order> {
    return this.commandService.createOrder(userId, orderData, this.queryService)
  }

  /**
   * 取得使用者的訂單列表（含分頁）
   */
  async getUserOrders(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ orders: Order[]; total: number }> {
    return this.queryService.getUserOrders(userId, limit, offset)
  }

  /**
   * 取得單一訂單詳情（含驗證使用者權限）
   */
  async getOrderById(orderId: string, userId: string): Promise<Order | null> {
    return this.queryService.getOrderById(orderId, userId)
  }

  /**
   * 取消訂單
   */
  async cancelOrder(orderId: string, userId: string, reason?: string): Promise<void> {
    return this.commandService.cancelOrder(orderId, userId, this.queryService, reason)
  }

  // === 管理員端方法 ===

  /**
   * 管理員：取得所有訂單
   */
  async getAllOrders(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ orders: Order[]; total: number }> {
    return this.queryService.getAllOrders(limit, offset)
  }

  /**
   * 管理員：更新訂單狀態
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<void> {
    return this.commandService.updateOrderStatus(orderId, status, notes)
  }

  /**
   * 取得訂單統計
   */
  async getOrderSummary(): Promise<OrderSummary> {
    return this.queryService.getOrderSummary()
  }

  // === 額外工具方法 ===

  /**
   * 生成訂單編號
   */
  async generateOrderNumber(): Promise<string> {
    return this.commandService.generateOrderNumber()
  }

  /**
   * 計算運費
   */
  async calculateShippingFee(
    items: Order['items'],
    address: Order['shippingAddress']
  ): Promise<number> {
    return this.commandService.calculateShippingFee(items, address)
  }

  /**
   * 計算稅費
   */
  calculateTax(subtotal: number): number {
    return this.commandService.calculateTax(subtotal)
  }

  /**
   * 根據 ID 取得訂單（管理員用，不驗證使用者）
   */
  async findById(orderId: string): Promise<Order | null> {
    return this.queryService.findById(orderId)
  }

  /**
   * 更新訂單（通用方法）
   */
  async update(orderId: string, updates: Partial<Order>): Promise<Order> {
    return this.commandService.updateOrder(orderId, updates)
  }
}

// 建立並匯出服務實例
const queryService = new OrderQueryService()
const commandService = new OrderCommandService()

export const orderService = new OrderService(queryService, commandService)
