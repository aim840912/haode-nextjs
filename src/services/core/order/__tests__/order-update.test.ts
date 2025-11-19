/**
 * OrderService 更新訂單測試
 *
 * 測試更新相關方法:
 * - updateOrder (通用更新)
 * - updateOrderStatus (狀態更新)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ValidationError } from '@/lib/errors'
import type { Order, OrderStatus } from '@/types/order'
import { OrderService } from '../OrderService'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

const hoistedMocks = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockSelect = vi.fn()
  const mockUpdate = vi.fn()
  const mockEq = vi.fn()
  const mockFrom = vi.fn()

  const mockSupabaseClient = {
    from: mockFrom,
  }

  return {
    mockSingle,
    mockSelect,
    mockUpdate,
    mockEq,
    mockFrom,
    mockSupabaseClient,
  }
})

const { mockSingle, mockSelect, mockUpdate, mockEq, mockFrom, mockSupabaseClient } = hoistedMocks

// ============================================================================
// Vi.mock calls
// ============================================================================

vi.mock('@/lib/database/supabase-auth', () => ({
  getSupabaseAdmin: vi.fn(() => hoistedMocks.mockSupabaseClient),
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

// ============================================================================
// Mock Chain Setup
// ============================================================================

function setupMockChains() {
  // select().eq().single() 鏈（用於 updateOrder 查詢更新後的資料）
  mockSelect.mockReturnValue({
    eq: mockEq,
  })

  mockEq.mockReturnValue({
    single: mockSingle,
    eq: mockEq, // 支援多次 eq
  })

  // update().eq() 鏈
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
}

// ============================================================================
// Tests
// ============================================================================

describe('OrderService - updateOrder', () => {
  let service: OrderService

  beforeEach(() => {
    service = new OrderService()
    resetAllMocks()
  })

  describe('成功場景', () => {
    it('應該成功更新訂單', async () => {
      // Arrange
      const mockOrderData = {
        id: 'order-1',
        order_number: 'ORD-001',
        user_id: 'user-1',
        status: 'pending',
        subtotal: 1000,
        shipping_fee: 100,
        tax: 50,
        total_amount: 1150,
        notes: '更新後的備註',
        created_at: '2025-01-18T00:00:00Z',
        updated_at: '2025-01-18T00:00:00Z',
      }

      // update().eq() 返回成功
      mockEq.mockResolvedValueOnce({ data: null, error: null })
      // select().eq().single() 返回更新後的資料
      mockSingle.mockResolvedValueOnce({ data: mockOrderData, error: null })

      const updates: Partial<Order> = {
        notes: '更新後的備註',
      }

      // Act
      const result = await service.updateOrder('order-1', updates)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe('order-1')
      expect(result.notes).toBe('更新後的備註')
      expect(mockUpdate).toHaveBeenCalledWith(updates)
    })

    it('應該能更新多個欄位', async () => {
      // Arrange
      const mockOrderData = {
        id: 'order-1',
        order_number: 'ORD-001',
        user_id: 'user-1',
        status: 'pending',
        subtotal: 1000,
        shipping_fee: 100,
        tax: 50,
        total_amount: 1150,
        notes: '新備註',
        shipping_address: {
          recipientName: '新收件人',
          phone: '0987654321',
          city: '台中市',
          district: '西屯區',
          street: '新地址456號',
        },
        created_at: '2025-01-18T00:00:00Z',
        updated_at: '2025-01-18T00:00:00Z',
      }

      mockEq.mockResolvedValueOnce({ data: null, error: null })
      mockSingle.mockResolvedValueOnce({ data: mockOrderData, error: null })

      const updates: Partial<Order> = {
        notes: '新備註',
        shippingAddress: {
          name: '新收件人',
          phone: '0987654321',
          city: '台中市',
          street: '新地址456號',
          postalCode: '407',
          country: '台灣',
        },
      }

      // Act
      const result = await service.updateOrder('order-1', updates)

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(updates)
      expect(result.notes).toBe('新備註')
    })
  })

  describe('驗證錯誤', () => {
    it('應該拋出錯誤當 orderId 為空', async () => {
      // Arrange
      const updates: Partial<Order> = { notes: '測試' }

      // Act & Assert
      await expect(service.updateOrder('', updates)).rejects.toThrow(ValidationError)
      await expect(service.updateOrder('', updates)).rejects.toThrow('訂單 ID 不能為空')
    })
  })

  describe('資料庫錯誤處理', () => {
    it('應該拋出錯誤當更新失敗', async () => {
      // Arrange
      mockEq.mockResolvedValue({
        data: null,
        error: { code: 'PGRST123', message: 'Update failed' },
      })

      const updates: Partial<Order> = { notes: '測試' }

      // Act & Assert
      await expect(service.updateOrder('order-1', updates)).rejects.toThrow()
    })
  })
})

describe('OrderService - updateOrderStatus', () => {
  let service: OrderService

  beforeEach(() => {
    service = new OrderService()
    resetAllMocks()
  })

  describe('成功場景', () => {
    it('應該成功更新訂單狀態', async () => {
      // Arrange
      mockEq.mockResolvedValue({ data: null, error: null })

      // Act
      await service.updateOrderStatus('order-1', 'processing')

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'processing',
        notes: undefined,
      })
      expect(mockEq).toHaveBeenCalledWith('id', 'order-1')
    })

    it('應該成功更新狀態並加入備註', async () => {
      // Arrange
      mockEq.mockResolvedValue({ data: null, error: null })

      // Act
      await service.updateOrderStatus('order-1', 'cancelled', '客戶要求取消')

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'cancelled',
        notes: '客戶要求取消',
      })
    })

    it('應該在狀態變更為 delivered 時設定實際送達日期', async () => {
      // Arrange
      mockEq.mockResolvedValue({ data: null, error: null })

      // Mock Date
      const mockDate = '2025-01-18'
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(`${mockDate}T10:30:00.000Z`)

      // Act
      await service.updateOrderStatus('order-1', 'delivered')

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'delivered',
          actual_delivery_date: mockDate,
        })
      )

      // Cleanup
      vi.restoreAllMocks()
    })

    it('應該支援所有有效的訂單狀態', async () => {
      // Arrange
      mockEq.mockResolvedValue({ data: null, error: null })

      const validStatuses: OrderStatus[] = [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ]

      // Act & Assert
      for (const status of validStatuses) {
        await expect(service.updateOrderStatus('order-1', status)).resolves.not.toThrow()
      }

      expect(mockUpdate).toHaveBeenCalledTimes(validStatuses.length)
    })
  })

  describe('驗證錯誤', () => {
    it('應該拋出錯誤當 orderId 為空', async () => {
      // Act & Assert
      await expect(service.updateOrderStatus('', 'processing')).rejects.toThrow(ValidationError)
      await expect(service.updateOrderStatus('', 'processing')).rejects.toThrow(
        '訂單 ID 和狀態不能為空'
      )
    })

    it('應該拋出錯誤當 status 為空', async () => {
      // Act & Assert
      await expect(service.updateOrderStatus('order-1', '' as OrderStatus)).rejects.toThrow(
        ValidationError
      )
    })
  })

  describe('資料庫錯誤處理', () => {
    it('應該拋出錯誤當狀態更新失敗', async () => {
      // Arrange
      mockEq.mockResolvedValue({
        data: null,
        error: { code: 'PGRST123', message: 'Status update failed' },
      })

      // Act & Assert
      await expect(service.updateOrderStatus('order-1', 'processing')).rejects.toThrow()
    })
  })
})
