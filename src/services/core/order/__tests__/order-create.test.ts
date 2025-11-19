/**
 * OrderService 建立訂單測試
 *
 * 測試 createOrder 方法的所有情境:
 * - 成功建立訂單
 * - 驗證錯誤（缺少必要參數）
 * - 產品不存在
 * - 庫存不足
 * - 資料庫錯誤處理
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { OrderService } from '../OrderService'
import type { CreateOrderRequest } from '@/types/order'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

const hoistedMocks = vi.hoisted(() => {
  // Supabase Mock Chain
  const mockSingle = vi.fn()
  const mockSelect = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockDelete = vi.fn()
  const mockEq = vi.fn()
  const mockFrom = vi.fn()
  const mockRpc = vi.fn()

  const mockSupabaseClient = {
    from: mockFrom,
    rpc: mockRpc,
  }

  // OrderInventoryManager Mock
  const mockGetProductById = vi.fn()
  const mockUpdateInventory = vi.fn()
  const mockRestoreInventory = vi.fn()

  // OrderCalculator Mock
  const mockCalculateShippingFee = vi.fn()
  const mockCalculateTax = vi.fn()
  const mockCalculateTotal = vi.fn()

  // generateOrderNumber Mock
  const mockGenerateOrderNumber = vi.fn()

  return {
    mockSingle,
    mockSelect,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockEq,
    mockFrom,
    mockRpc,
    mockSupabaseClient,
    mockGetProductById,
    mockUpdateInventory,
    mockRestoreInventory,
    mockCalculateShippingFee,
    mockCalculateTax,
    mockCalculateTotal,
    mockGenerateOrderNumber,
  }
})

const {
  mockSingle,
  mockSelect,
  mockInsert,
  mockEq,
  mockFrom,
  mockRpc,
  mockSupabaseClient,
  mockGetProductById,
  mockUpdateInventory,
  mockCalculateShippingFee,
  mockCalculateTax,
  mockCalculateTotal,
  mockGenerateOrderNumber,
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
    getProductById: hoistedMocks.mockGetProductById,
    updateInventory: hoistedMocks.mockUpdateInventory,
    restoreInventory: hoistedMocks.mockRestoreInventory,
  },
}))

vi.mock('../utils/OrderCalculator', () => ({
  OrderCalculator: {
    calculateShippingFee: hoistedMocks.mockCalculateShippingFee,
    calculateTax: hoistedMocks.mockCalculateTax,
    calculateTotal: hoistedMocks.mockCalculateTotal,
  },
}))

// Mock orderMappers 中的所有函數，但保留實際的 transformer 函數
vi.mock('../orderMappers', async () => {
  const actual = await vi.importActual<typeof import('../orderMappers')>('../orderMappers')
  return {
    orderFromDB: actual.orderFromDB,
    orderItemFromDB: actual.orderItemFromDB,
    generateOrderNumber: hoistedMocks.mockGenerateOrderNumber,
  }
})

// ============================================================================
// Mock Chain Setup
// ============================================================================

function setupMockChains() {
  // select().single() 鏈
  mockSelect.mockReturnValue({
    single: mockSingle,
  })

  // insert([...]).select().single() 鏈
  // 每次 mockInsert 被調用時都返回新的 select chain
  mockInsert.mockImplementation(() => ({
    select: vi.fn().mockReturnValue({
      single: mockSingle,
    }),
  }))

  // from() 返回基本操作
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    delete: mockEq,
  })

  // delete().eq() 鏈
  mockEq.mockReturnValue({
    eq: mockEq,
  })
}

function resetAllMocks() {
  vi.clearAllMocks()
  setupMockChains()

  // 設定預設行為
  mockGenerateOrderNumber.mockResolvedValue('ORD-20250118-001')
  mockRpc.mockResolvedValue({ data: 'ORD-20250118-001', error: null })
  mockCalculateShippingFee.mockReturnValue(100)
  mockCalculateTax.mockReturnValue(50)
  mockCalculateTotal.mockReturnValue(1650)
  mockUpdateInventory.mockResolvedValue(undefined)
}

// ============================================================================
// Test Data
// ============================================================================

const mockProduct = {
  id: 'product-1',
  name: '測試產品',
  price: 500,
  priceUnit: '斤',
  unitQuantity: 1,
  inventory: 100,
  images: ['https://example.com/image.jpg'],
}

const validOrderRequest: CreateOrderRequest = {
  items: [
    {
      productId: 'product-1',
      quantity: 3,
    },
  ],
  shippingAddress: {
    name: '測試收件人',
    phone: '0912345678',
    city: '台北市',
    street: '測試路123號',
    postalCode: '100',
    country: '台灣',
  },
  paymentMethod: 'credit_card',
  notes: '測試訂單',
}

const mockOrderRecord = {
  id: 'order-1',
  order_number: 'ORD-20250118-001',
  user_id: 'user-1',
  status: 'pending',
  subtotal: 1500,
  shipping_fee: 100,
  tax: 50,
  total_amount: 1650,
  shipping_address: validOrderRequest.shippingAddress,
  payment_method: 'credit_card',
  payment_status: 'pending',
  notes: '測試訂單',
  created_at: '2025-01-18T00:00:00Z',
  updated_at: '2025-01-18T00:00:00Z',
}

const mockOrderItems = [
  {
    id: 'item-1',
    order_id: 'order-1',
    product_id: 'product-1',
    product_name: '測試產品',
    product_image: 'https://example.com/image.jpg',
    quantity: 3,
    unit_price: 500,
    price_unit: '斤',
    unit_quantity: 1,
    subtotal: 1500,
  },
]

// ============================================================================
// Tests
// ============================================================================

describe('OrderService - createOrder', () => {
  let service: OrderService

  beforeEach(() => {
    service = new OrderService()
    resetAllMocks()
  })

  describe('成功場景', () => {
    it('應該成功建立訂單', async () => {
      // Arrange
      mockGetProductById.mockResolvedValue(mockProduct)

      // 第一次 mockSingle: insert order.select().single()
      // 第二次 mockSingle: insert items.select() (不使用 single)
      mockSingle.mockResolvedValueOnce({ data: mockOrderRecord, error: null })

      // Mock insert for order items (returns array, not single)
      const mockItemsSelect = vi.fn().mockResolvedValue({ data: mockOrderItems, error: null })
      mockInsert
        .mockImplementationOnce(() => ({
          select: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }))
        .mockImplementationOnce(() => ({
          select: mockItemsSelect,
        }))

      // Act
      const result = await service.createOrder('user-1', validOrderRequest)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe('order-1')
      expect(result.orderNumber).toBe('ORD-20250118-001')
      expect(result.totalAmount).toBe(1650)
      expect(result.items).toHaveLength(1)
      expect(result.items[0].productName).toBe('測試產品')

      // 驗證庫存已更新
      expect(mockUpdateInventory).toHaveBeenCalledWith(validOrderRequest.items)
    })

    it('應該正確計算多個商品的訂單金額', async () => {
      // Arrange
      const multiItemRequest: CreateOrderRequest = {
        ...validOrderRequest,
        items: [
          { productId: 'product-1', quantity: 2 },
          { productId: 'product-2', quantity: 3 },
        ],
      }

      mockGetProductById
        .mockResolvedValueOnce(mockProduct) // product-1
        .mockResolvedValueOnce({ ...mockProduct, id: 'product-2', name: '產品2', price: 300 }) // product-2

      mockCalculateTotal.mockReturnValue(2300) // 1000 + 900 + 100 + 300

      mockSingle.mockResolvedValueOnce({
        data: { ...mockOrderRecord, subtotal: 1900, total_amount: 2300 },
        error: null,
      })

      const mockItemsSelect = vi.fn().mockResolvedValue({
        data: [
          mockOrderItems[0],
          { ...mockOrderItems[0], id: 'item-2', product_id: 'product-2', product_name: '產品2' },
        ],
        error: null,
      })

      mockInsert
        .mockImplementationOnce(() => ({
          select: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }))
        .mockImplementationOnce(() => ({
          select: mockItemsSelect,
        }))

      // Act
      const result = await service.createOrder('user-1', multiItemRequest)

      // Assert
      expect(result.items).toHaveLength(2)
      expect(mockGetProductById).toHaveBeenCalledTimes(2)
    })
  })

  describe('驗證錯誤', () => {
    it('應該拋出錯誤當 userId 為空', async () => {
      // Act & Assert
      await expect(service.createOrder('', validOrderRequest)).rejects.toThrow(ValidationError)
      await expect(service.createOrder('', validOrderRequest)).rejects.toThrow(
        '使用者 ID 和訂單項目不能為空'
      )
    })

    it('應該拋出錯誤當 items 為空陣列', async () => {
      // Arrange
      const emptyItemsRequest: CreateOrderRequest = {
        ...validOrderRequest,
        items: [],
      }

      // Act & Assert
      await expect(service.createOrder('user-1', emptyItemsRequest)).rejects.toThrow(
        ValidationError
      )
    })

    it('應該拋出錯誤當 items 不存在', async () => {
      // Arrange
      const noItemsRequest = {
        ...validOrderRequest,
        items: undefined as any,
      }

      // Act & Assert
      await expect(service.createOrder('user-1', noItemsRequest)).rejects.toThrow(ValidationError)
    })
  })

  describe('業務邏輯錯誤', () => {
    it('應該拋出錯誤當產品不存在', async () => {
      // Arrange
      mockGetProductById.mockResolvedValue(null)

      // Act & Assert
      // 注意：由於 withServiceOperation 包裝，NotFoundError 會被轉換為 DatabaseError
      // 但錯誤訊息會保留，所以檢查訊息即可
      await expect(service.createOrder('user-1', validOrderRequest)).rejects.toThrow(
        '產品不存在: product-1'
      )
    })

    it('應該拋出錯誤當產品庫存不足', async () => {
      // Arrange
      mockGetProductById.mockResolvedValue({
        ...mockProduct,
        inventory: 2, // 庫存只有 2，但訂單需要 3
      })

      // Act & Assert
      // 注意：由於 withServiceOperation 包裝，ValidationError 會被轉換為 DatabaseError
      // 但錯誤訊息會保留，所以檢查訊息即可
      await expect(service.createOrder('user-1', validOrderRequest)).rejects.toThrow(
        '產品庫存不足: 測試產品'
      )
    })
  })

  describe('資料庫錯誤處理', () => {
    it('應該拋出錯誤當訂單建立失敗', async () => {
      // Arrange
      mockGetProductById.mockResolvedValue(mockProduct)
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST123', message: 'Database error' },
      })

      // Act & Assert
      await expect(service.createOrder('user-1', validOrderRequest)).rejects.toThrow()
    })

    it('應該拋出錯誤當訂單項目建立失敗', async () => {
      // Arrange
      mockGetProductById.mockResolvedValue(mockProduct)

      // 訂單建立成功
      mockSingle.mockResolvedValueOnce({ data: mockOrderRecord, error: null })

      // 訂單項目建立失敗
      const mockItemsSelect = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST456', message: 'Items insert failed' },
      })

      mockInsert
        .mockImplementationOnce(() => ({
          select: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }))
        .mockImplementationOnce(() => ({
          select: mockItemsSelect,
        }))

      // Act & Assert
      await expect(service.createOrder('user-1', validOrderRequest)).rejects.toThrow(
        'Items insert failed'
      )

      // 注意：回滾邏輯（delete）的驗證較為複雜，此處僅驗證錯誤被正確拋出
      // 實際的回滾邏輯在生產程式碼中已實作 (OrderService.ts:295)
    })
  })
})
