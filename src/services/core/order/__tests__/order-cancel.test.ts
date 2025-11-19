/**
 * OrderService 取消訂單測試
 *
 * 測試 cancelOrder 方法的所有情境:
 * - 成功取消訂單
 * - 驗證錯誤
 * - 訂單不存在或無權限
 * - 訂單狀態不允許取消
 * - 庫存恢復
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ValidationError, NotFoundError } from '@/lib/errors'
import type { Order } from '@/types/order'
import { QueryBuilder } from '../../utils/QueryBuilder'
import { OrderService } from '../OrderService'
import { OrderItemsLoader } from '../utils/OrderItemsLoader'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

const hoistedMocks = vi.hoisted(() => {
  // Supabase Mock Chain
  const mockSingle = vi.fn()
  const mockSelect = vi.fn()
  const mockUpdate = vi.fn()
  const mockIn = vi.fn()
  const mockEq = vi.fn()
  const mockFrom = vi.fn()

  const mockSupabaseClient = {
    from: mockFrom,
  }

  // OrderInventoryManager Mock
  const mockRestoreInventory = vi.fn()

  return {
    mockSingle,
    mockSelect,
    mockUpdate,
    mockIn,
    mockEq,
    mockFrom,
    mockSupabaseClient,
    mockRestoreInventory,
  }
})

const {
  mockSingle,
  mockSelect,
  mockUpdate,
  mockIn,
  mockEq,
  mockFrom,
  mockSupabaseClient,
  mockRestoreInventory,
} = hoistedMocks

// ============================================================================
// Vi.mock calls
// ============================================================================

vi.mock('@/lib/database/supabase-auth', () => ({
  getSupabaseAdmin: vi.fn(() => hoistedMocks.mockSupabaseClient),
}))

vi.mock('../../utils/QueryBuilder', () => ({
  QueryBuilder: {
    findOne: vi.fn(),
    paginate: vi.fn(),
  },
}))

vi.mock('../utils/OrderItemsLoader', () => ({
  OrderItemsLoader: {
    loadByOrderId: vi.fn(),
    loadBatch: vi.fn(),
    assignItemsToOrders: vi.fn(),
  },
}))

vi.mock('@/lib/logger', () => ({
  dbLogger: {
    timer: vi.fn(() => ({
      end: vi.fn(),
    })),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('../utils/OrderInventoryManager', () => ({
  OrderInventoryManager: {
    restoreInventory: hoistedMocks.mockRestoreInventory,
  },
}))

// ============================================================================
// Mock Chain Setup
// ============================================================================

function setupMockChains() {
  // select().eq().eq().single() 鏈 (getOrderById)
  mockSelect.mockReturnValue({
    eq: mockEq,
    in: mockIn,
  })

  mockEq.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
  })

  // update().eq() 鏈 (updateOrderStatus)
  mockUpdate.mockReturnValue({
    eq: mockEq,
  })

  mockFrom.mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
  })
}

function resetAllMocks() {
  vi.clearAllMocks()
  setupMockChains()
  mockRestoreInventory.mockResolvedValue(undefined)
}

// ============================================================================
// Test Data
// ============================================================================

const mockOrderRecord = {
  id: 'order-1',
  order_number: 'ORD-20250118-001',
  user_id: 'user-1',
  status: 'pending',
  subtotal: 1500,
  shipping_fee: 100,
  tax: 50,
  total_amount: 1650,
  created_at: '2025-01-18T00:00:00Z',
  updated_at: '2025-01-18T00:00:00Z',
}

const mockOrderItems = [
  {
    id: 'item-1',
    order_id: 'order-1',
    product_id: 'product-1',
    product_name: '測試產品',
    quantity: 3,
    unit_price: 500,
    subtotal: 1500,
  },
]

// ============================================================================
// Tests
// ============================================================================

describe('OrderService - cancelOrder', () => {
  let service: OrderService

  beforeEach(() => {
    service = new OrderService()
    resetAllMocks()
  })

  describe('成功場景', () => {
    it('應該成功取消 pending 狀態的訂單', async () => {
      // Arrange
      // Mock getOrderById (使用 QueryBuilder.findOne)
      const mockOrder = {
        id: 'order-1',
        order_number: 'ORD-001',
        user_id: 'user-1',
        status: 'pending',
        subtotal: 1500,
        shipping_fee: 100,
        tax: 50,
        total_amount: 1650,
        created_at: '2025-01-18T00:00:00Z',
        updated_at: '2025-01-18T00:00:00Z',
      }
      ;(QueryBuilder.findOne as any).mockResolvedValue(mockOrder)
      ;(OrderItemsLoader.loadByOrderId as any).mockResolvedValue(mockOrderItems)

      // Mock updateOrderStatus
      mockEq.mockResolvedValueOnce({ data: null, error: null })

      // Act
      await service.cancelOrder('order-1', 'user-1', '客戶要求取消')

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'cancelled',
        notes: '客戶要求取消',
      })
      expect(mockRestoreInventory).toHaveBeenCalledWith(mockOrderItems)
    })

    it('應該成功取消 confirmed 狀態的訂單', async () => {
      // Arrange
      const confirmedOrder = {
        ...mockOrderRecord,
        status: 'confirmed',
      }
      ;(QueryBuilder.findOne as any).mockResolvedValue(confirmedOrder)
      ;(OrderItemsLoader.loadByOrderId as any).mockResolvedValue(mockOrderItems)
      mockEq.mockResolvedValueOnce({ data: null, error: null })

      // Act
      await service.cancelOrder('order-1', 'user-1')

      // Assert
      expect(mockRestoreInventory).toHaveBeenCalled()
    })

    it('應該在沒有備註的情況下取消訂單', async () => {
      // Arrange
      ;(QueryBuilder.findOne as any).mockResolvedValue(mockOrderRecord)
      ;(OrderItemsLoader.loadByOrderId as any).mockResolvedValue(mockOrderItems)
      mockEq.mockResolvedValueOnce({ data: null, error: null })

      // Act
      await service.cancelOrder('order-1', 'user-1')

      // Assert - 應該調用 updateOrderStatus 且 notes 為 undefined
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'cancelled',
        notes: undefined,
      })
    })
  })

  describe('驗證錯誤', () => {
    it('應該拋出錯誤當 orderId 為空', async () => {
      // Act & Assert
      await expect(service.cancelOrder('', 'user-1')).rejects.toThrow(ValidationError)
      await expect(service.cancelOrder('', 'user-1')).rejects.toThrow(
        '訂單 ID 和使用者 ID 不能為空'
      )
    })

    it('應該拋出錯誤當 userId 為空', async () => {
      // Act & Assert
      await expect(service.cancelOrder('order-1', '')).rejects.toThrow(ValidationError)
      await expect(service.cancelOrder('order-1', '')).rejects.toThrow(
        '訂單 ID 和使用者 ID 不能為空'
      )
    })
  })

  describe('業務邏輯錯誤', () => {
    it('應該拋出錯誤當訂單不存在', async () => {
      // Arrange
      ;(QueryBuilder.findOne as any).mockResolvedValue(null)

      // Act & Assert
      // 注意：由於 withServiceOperation 包裝，NotFoundError 會被轉換為 DatabaseError
      await expect(service.cancelOrder('order-999', 'user-1')).rejects.toThrow('訂單不存在或無權限')
    })

    it('應該拋出錯誤當訂單不屬於該使用者', async () => {
      // Arrange - getOrderById 因為 user_id 不匹配返回 null
      ;(QueryBuilder.findOne as any).mockResolvedValue(null)

      // Act & Assert
      await expect(service.cancelOrder('order-1', 'wrong-user')).rejects.toThrow(
        '訂單不存在或無權限'
      )
    })

    it('應該拋出錯誤當訂單狀態為 processing（不允許取消）', async () => {
      // Arrange
      const processingOrder = { ...mockOrderRecord, status: 'processing' }
      ;(QueryBuilder.findOne as any).mockResolvedValue(processingOrder)
      ;(OrderItemsLoader.loadByOrderId as any).mockResolvedValue(mockOrderItems)

      // Act & Assert
      await expect(service.cancelOrder('order-1', 'user-1')).rejects.toThrow('此訂單狀態無法取消')

      // 確保沒有恢復庫存
      expect(mockRestoreInventory).not.toHaveBeenCalled()
    })

    it('應該拋出錯誤當訂單狀態為 shipped（不允許取消）', async () => {
      // Arrange
      const shippedOrder = { ...mockOrderRecord, status: 'shipped' }
      ;(QueryBuilder.findOne as any).mockResolvedValue(shippedOrder)
      ;(OrderItemsLoader.loadByOrderId as any).mockResolvedValue(mockOrderItems)

      // Act & Assert
      await expect(service.cancelOrder('order-1', 'user-1')).rejects.toThrow('此訂單狀態無法取消')
      expect(mockRestoreInventory).not.toHaveBeenCalled()
    })

    it('應該拋出錯誤當訂單狀態為 delivered（不允許取消）', async () => {
      // Arrange
      const deliveredOrder = { ...mockOrderRecord, status: 'delivered' }
      ;(QueryBuilder.findOne as any).mockResolvedValue(deliveredOrder)
      ;(OrderItemsLoader.loadByOrderId as any).mockResolvedValue(mockOrderItems)

      // Act & Assert
      await expect(service.cancelOrder('order-1', 'user-1')).rejects.toThrow('此訂單狀態無法取消')
      expect(mockRestoreInventory).not.toHaveBeenCalled()
    })

    it('應該拋出錯誤當訂單已經是 cancelled 狀態', async () => {
      // Arrange
      const cancelledOrder = { ...mockOrderRecord, status: 'cancelled' }
      ;(QueryBuilder.findOne as any).mockResolvedValue(cancelledOrder)
      ;(OrderItemsLoader.loadByOrderId as any).mockResolvedValue(mockOrderItems)

      // Act & Assert
      await expect(service.cancelOrder('order-1', 'user-1')).rejects.toThrow('此訂單狀態無法取消')
      expect(mockRestoreInventory).not.toHaveBeenCalled()
    })
  })

  describe('資料庫錯誤處理', () => {
    it('應該拋出錯誤當更新訂單狀態失敗', async () => {
      // Arrange
      ;(QueryBuilder.findOne as any).mockResolvedValue(mockOrderRecord)
      ;(OrderItemsLoader.loadByOrderId as any).mockResolvedValue(mockOrderItems)

      mockEq.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST123', message: 'Update failed' },
      })

      // Act & Assert
      await expect(service.cancelOrder('order-1', 'user-1')).rejects.toThrow()
    })
  })
})
