/**
 * Orders Server Actions 測試
 *
 * 測試訂單相關 Server Actions:
 * - createOrderAction - 建立訂單
 * - cancelOrderAction - 取消訂單
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { createOrderAction, cancelOrderAction } from '../orders'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

const hoistedMocks = vi.hoisted(() => {
  const mockRequireAuth = vi.fn()
  const mockSuccess = vi.fn()
  const mockError = vi.fn()
  const mockValidationError = vi.fn()
  const mockLogCreate = vi.fn()
  const mockLogStatusChange = vi.fn()
  const mockRevalidatePath = vi.fn()

  const mockApiLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }

  const mockOrderService = {
    createOrder: vi.fn(),
    cancelOrder: vi.fn(),
    getOrderById: vi.fn(),
  }

  return {
    mockRequireAuth,
    mockSuccess,
    mockError,
    mockValidationError,
    mockLogCreate,
    mockLogStatusChange,
    mockRevalidatePath,
    mockApiLogger,
    mockOrderService,
  }
})

export const {
  mockRequireAuth,
  mockSuccess,
  mockError,
  mockValidationError,
  mockLogCreate,
  mockLogStatusChange,
  mockRevalidatePath,
  mockApiLogger,
  mockOrderService,
} = hoistedMocks

// ============================================================================
// Vi.mock calls at module top-level (required for Vitest 4.0)
// ============================================================================

vi.mock('@/lib/server', () => ({
  requireAuth: hoistedMocks.mockRequireAuth,
  success: hoistedMocks.mockSuccess,
  error: hoistedMocks.mockError,
  validationError: hoistedMocks.mockValidationError,
  logCreate: hoistedMocks.mockLogCreate,
  logStatusChange: hoistedMocks.mockLogStatusChange,
}))

vi.mock('@/lib/logger', () => ({
  apiLogger: hoistedMocks.mockApiLogger,
}))

vi.mock('@/services/core/order/OrderService', () => ({
  orderService: hoistedMocks.mockOrderService,
}))

vi.mock('next/cache', () => ({
  revalidatePath: hoistedMocks.mockRevalidatePath,
}))

// ============================================================================
// Test Data
// ============================================================================

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
}

const mockOrder = {
  id: 'order-123',
  orderNumber: 'ORD-20250117-001',
  userId: 'user-123',
  status: 'pending',
  totalAmount: 1500,
  items: [
    {
      id: 'item-1',
      productId: 'product-123',
      quantity: 2,
      unitPrice: 500,
      subtotal: 1000,
    },
    {
      id: 'item-2',
      productId: 'product-456',
      quantity: 1,
      unitPrice: 500,
      subtotal: 500,
    },
  ],
  shippingAddress: {
    name: '測試用戶',
    phone: '0912345678',
    street: '測試街道 123 號',
    city: '台北市',
    postalCode: '10001',
    country: '台灣',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const validCreateOrderData = {
  items: [
    {
      productId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      quantity: 2,
    },
  ],
  shippingAddress: {
    name: '測試用戶',
    phone: '0912345678',
    street: '測試街道 123 號',
    city: '台北市',
    postalCode: '10001',
    country: '台灣',
  },
  paymentMethod: 'credit_card',
  notes: '測試訂單',
}

const validCancelOrderData = {
  orderId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  reason: '不需要了',
}

// ============================================================================
// Helper Functions
// ============================================================================

function resetAllMocks() {
  vi.clearAllMocks()

  // 設定預設的 mock 回傳值
  mockRequireAuth.mockResolvedValue(mockUser)
  mockSuccess.mockImplementation((data, message) => ({
    success: true,
    data,
    message,
  }))
  mockError.mockImplementation(err => ({
    success: false,
    error: { message: err instanceof Error ? err.message : String(err) },
  }))
  mockValidationError.mockImplementation(zodError => ({
    success: false,
    error: {
      message: '驗證失敗',
      details: zodError.errors,
    },
  }))
  mockLogCreate.mockResolvedValue(undefined)
  mockLogStatusChange.mockResolvedValue(undefined)
  mockRevalidatePath.mockReturnValue(undefined)
}

// ============================================================================
// Tests - createOrderAction
// ============================================================================

describe('createOrderAction', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('成功場景', () => {
    it('應該成功建立訂單', async () => {
      // Arrange
      mockOrderService.createOrder.mockResolvedValue(mockOrder)

      // Act
      const result = await createOrderAction(validCreateOrderData)

      // Assert
      expect(mockRequireAuth).toHaveBeenCalledTimes(1)
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(mockUser.id, validCreateOrderData)
      expect(mockLogCreate).toHaveBeenCalledWith(mockUser, 'order', mockOrder.id, {
        newData: {
          orderNumber: mockOrder.orderNumber,
          totalAmount: mockOrder.totalAmount,
          itemsCount: validCreateOrderData.items.length,
          paymentMethod: validCreateOrderData.paymentMethod,
        },
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/orders')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/orders')
      expect(mockSuccess).toHaveBeenCalledWith(mockOrder, '訂單建立成功')
    })

    it('應該記錄 API 日誌', async () => {
      // Arrange
      mockOrderService.createOrder.mockResolvedValue(mockOrder)

      // Act
      await createOrderAction(validCreateOrderData)

      // Assert
      expect(mockApiLogger.info).toHaveBeenCalledTimes(2)
      expect(mockApiLogger.info).toHaveBeenNthCalledWith(1, '建立新訂單', {
        metadata: {
          userId: mockUser.id,
          userEmail: mockUser.email,
          itemCount: validCreateOrderData.items.length,
        },
      })
      expect(mockApiLogger.info).toHaveBeenNthCalledWith(2, '建立訂單成功', {
        metadata: {
          userId: mockUser.id,
          orderId: mockOrder.id,
          orderNumber: mockOrder.orderNumber,
          totalAmount: mockOrder.totalAmount,
        },
      })
    })

    it('應該處理沒有可選欄位的訂單', async () => {
      // Arrange
      const minimalOrderData = {
        items: [
          {
            productId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
            quantity: 1,
          },
        ],
        shippingAddress: {
          name: '測試用戶',
          phone: '0912345678',
          street: '測試街道 123 號',
          city: '台北市',
          postalCode: '10001',
          country: '台灣',
        },
      }
      mockOrderService.createOrder.mockResolvedValue({
        ...mockOrder,
        paymentMethod: undefined,
        notes: undefined,
      })

      // Act
      const result = await createOrderAction(minimalOrderData)

      // Assert
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(mockUser.id, minimalOrderData)
      expect(mockSuccess).toHaveBeenCalledWith(expect.any(Object), '訂單建立成功')
    })
  })

  describe('驗證失敗場景', () => {
    it('應該拒絕空的訂單項目陣列', async () => {
      // Arrange
      const invalidData = {
        ...validCreateOrderData,
        items: [],
      }

      // Act
      const result = await createOrderAction(invalidData)

      // Assert
      expect(mockValidationError).toHaveBeenCalledWith(expect.any(Object))
      expect(mockOrderService.createOrder).not.toHaveBeenCalled()
    })

    it('應該拒絕無效的產品 ID 格式', async () => {
      // Arrange
      const invalidData = {
        ...validCreateOrderData,
        items: [
          {
            productId: 'invalid-uuid',
            quantity: 1,
          },
        ],
      }

      // Act
      const result = await createOrderAction(invalidData)

      // Assert
      expect(mockValidationError).toHaveBeenCalledWith(expect.any(Object))
      expect(mockOrderService.createOrder).not.toHaveBeenCalled()
    })

    it('應該拒絕負數或零的數量', async () => {
      // Arrange
      const invalidData = {
        ...validCreateOrderData,
        items: [
          {
            productId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
            quantity: 0,
          },
        ],
      }

      // Act
      const result = await createOrderAction(invalidData)

      // Assert
      expect(mockValidationError).toHaveBeenCalledWith(expect.any(Object))
      expect(mockOrderService.createOrder).not.toHaveBeenCalled()
    })

    it('應該拒絕缺少必填欄位的配送地址', async () => {
      // Arrange
      const invalidData = {
        ...validCreateOrderData,
        shippingAddress: {
          name: '',
          phone: '0912345678',
          street: '測試街道 123 號',
          city: '台北市',
          postalCode: '10001',
          country: '台灣',
        },
      }

      // Act
      const result = await createOrderAction(invalidData)

      // Assert
      expect(mockValidationError).toHaveBeenCalledWith(expect.any(Object))
      expect(mockOrderService.createOrder).not.toHaveBeenCalled()
    })
  })

  describe('認證失敗場景', () => {
    it('應該拒絕未登入的用戶', async () => {
      // Arrange
      const authError = new Error('未登入')
      mockRequireAuth.mockRejectedValue(authError)

      // Act
      const result = await createOrderAction(validCreateOrderData)

      // Assert
      expect(mockError).toHaveBeenCalledWith(authError)
      expect(mockOrderService.createOrder).not.toHaveBeenCalled()
    })
  })

  describe('服務層錯誤場景', () => {
    it('應該處理服務層拋出的錯誤', async () => {
      // Arrange
      const serviceError = new Error('庫存不足')
      mockOrderService.createOrder.mockRejectedValue(serviceError)

      // Act
      const result = await createOrderAction(validCreateOrderData)

      // Assert
      expect(mockError).toHaveBeenCalledWith(serviceError)
      expect(mockLogCreate).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('應該處理審計日誌失敗的情況', async () => {
      // Arrange
      mockOrderService.createOrder.mockResolvedValue(mockOrder)
      const logError = new Error('審計日誌失敗')
      mockLogCreate.mockRejectedValue(logError)

      // Act
      const result = await createOrderAction(validCreateOrderData)

      // Assert
      expect(mockError).toHaveBeenCalledWith(logError)
    })
  })
})

// ============================================================================
// Tests - cancelOrderAction
// ============================================================================

describe('cancelOrderAction', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('成功場景', () => {
    it('應該成功取消訂單', async () => {
      // Arrange
      mockOrderService.getOrderById.mockResolvedValue(mockOrder)
      mockOrderService.cancelOrder.mockResolvedValue(undefined)

      // Act
      const result = await cancelOrderAction(validCancelOrderData)

      // Assert
      expect(mockRequireAuth).toHaveBeenCalledTimes(1)
      expect(mockOrderService.getOrderById).toHaveBeenCalledWith(
        validCancelOrderData.orderId,
        mockUser.id
      )
      expect(mockOrderService.cancelOrder).toHaveBeenCalledWith(
        validCancelOrderData.orderId,
        mockUser.id,
        validCancelOrderData.reason
      )
      expect(mockLogStatusChange).toHaveBeenCalledWith(
        mockUser,
        'order',
        validCancelOrderData.orderId,
        {
          previousData: {
            status: mockOrder.status,
          },
          newData: {
            status: 'cancelled',
          },
          metadata: {
            reason: validCancelOrderData.reason,
            orderNumber: mockOrder.orderNumber,
            totalAmount: mockOrder.totalAmount,
          },
        }
      )
      expect(mockRevalidatePath).toHaveBeenCalledWith('/orders')
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/orders/${validCancelOrderData.orderId}`)
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/orders')
      expect(mockSuccess).toHaveBeenCalledWith(null, '訂單已成功取消')
    })

    it('應該記錄 API 日誌', async () => {
      // Arrange
      mockOrderService.getOrderById.mockResolvedValue(mockOrder)
      mockOrderService.cancelOrder.mockResolvedValue(undefined)

      // Act
      await cancelOrderAction(validCancelOrderData)

      // Assert
      expect(mockApiLogger.info).toHaveBeenCalledTimes(2)
      expect(mockApiLogger.info).toHaveBeenNthCalledWith(1, '取消訂單', {
        metadata: {
          userId: mockUser.id,
          orderId: validCancelOrderData.orderId,
          reason: validCancelOrderData.reason,
        },
      })
      expect(mockApiLogger.info).toHaveBeenNthCalledWith(2, '取消訂單成功', {
        metadata: {
          userId: mockUser.id,
          orderId: validCancelOrderData.orderId,
          reason: validCancelOrderData.reason,
        },
      })
    })

    it('應該處理沒有取消原因的情況', async () => {
      // Arrange
      const dataWithoutReason = {
        orderId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      }
      mockOrderService.getOrderById.mockResolvedValue(mockOrder)
      mockOrderService.cancelOrder.mockResolvedValue(undefined)

      // Act
      const result = await cancelOrderAction(dataWithoutReason)

      // Assert
      expect(mockOrderService.cancelOrder).toHaveBeenCalledWith(
        dataWithoutReason.orderId,
        mockUser.id,
        undefined
      )
      expect(mockSuccess).toHaveBeenCalledWith(null, '訂單已成功取消')
    })
  })

  describe('驗證失敗場景', () => {
    it('應該拒絕無效的訂單 ID 格式', async () => {
      // Arrange
      const invalidData = {
        orderId: 'invalid-uuid',
        reason: '測試',
      }

      // Act
      const result = await cancelOrderAction(invalidData)

      // Assert
      expect(mockValidationError).toHaveBeenCalledWith(expect.any(Object))
      expect(mockOrderService.getOrderById).not.toHaveBeenCalled()
      expect(mockOrderService.cancelOrder).not.toHaveBeenCalled()
    })
  })

  describe('認證失敗場景', () => {
    it('應該拒絕未登入的用戶', async () => {
      // Arrange
      const authError = new Error('未登入')
      mockRequireAuth.mockRejectedValue(authError)

      // Act
      const result = await cancelOrderAction(validCancelOrderData)

      // Assert
      expect(mockError).toHaveBeenCalledWith(authError)
      expect(mockOrderService.cancelOrder).not.toHaveBeenCalled()
    })
  })

  describe('訂單不存在場景', () => {
    it('應該處理訂單不存在的情況', async () => {
      // Arrange
      mockOrderService.getOrderById.mockResolvedValue(null)

      // Act
      const result = await cancelOrderAction(validCancelOrderData)

      // Assert
      expect(mockError).toHaveBeenCalledWith(expect.any(Error))
      expect(mockOrderService.cancelOrder).not.toHaveBeenCalled()
      expect(mockLogStatusChange).not.toHaveBeenCalled()
    })

    it('應該處理無權限操作的情況（getOrderById 返回 null）', async () => {
      // Arrange
      mockOrderService.getOrderById.mockResolvedValue(null)

      // Act
      const result = await cancelOrderAction(validCancelOrderData)

      // Assert
      expect(mockError).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('服務層錯誤場景', () => {
    it('應該處理 getOrderById 失敗', async () => {
      // Arrange
      const serviceError = new Error('資料庫錯誤')
      mockOrderService.getOrderById.mockRejectedValue(serviceError)

      // Act
      const result = await cancelOrderAction(validCancelOrderData)

      // Assert
      expect(mockError).toHaveBeenCalledWith(serviceError)
      expect(mockOrderService.cancelOrder).not.toHaveBeenCalled()
    })

    it('應該處理 cancelOrder 失敗', async () => {
      // Arrange
      mockOrderService.getOrderById.mockResolvedValue(mockOrder)
      const serviceError = new Error('訂單狀態不允許取消')
      mockOrderService.cancelOrder.mockRejectedValue(serviceError)

      // Act
      const result = await cancelOrderAction(validCancelOrderData)

      // Assert
      expect(mockError).toHaveBeenCalledWith(serviceError)
      expect(mockLogStatusChange).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('應該處理審計日誌失敗的情況', async () => {
      // Arrange
      mockOrderService.getOrderById.mockResolvedValue(mockOrder)
      mockOrderService.cancelOrder.mockResolvedValue(undefined)
      const logError = new Error('審計日誌失敗')
      mockLogStatusChange.mockRejectedValue(logError)

      // Act
      const result = await cancelOrderAction(validCancelOrderData)

      // Assert
      expect(mockError).toHaveBeenCalledWith(logError)
    })
  })
})
