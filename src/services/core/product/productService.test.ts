import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProductService } from './productService'
import { NotFoundError, ValidationError } from '@/lib/errors'
import type { CreateProductData, UpdateProductData, Product } from '@/types/product'

// Use vi.hoisted() for mock setup
const {
  mockSupabaseClient,
  mockFrom,
  mockSelect,
  mockEq,
  mockSingle,
  mockInsert,
  mockUpdate,
  mockDelete,
  mockOrder,
} = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockDelete = vi.fn()
  const mockOrder = vi.fn()
  const mockFrom = vi.fn()

  // Setup chain methods
  mockSelect.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
  })

  mockEq.mockReturnValue({
    single: mockSingle,
    order: mockOrder,
  })

  mockOrder.mockReturnValue({
    data: null,
    error: null,
  })

  mockInsert.mockReturnValue({
    select: vi.fn(() => ({
      single: mockSingle,
    })),
  })

  mockUpdate.mockReturnValue({
    eq: vi.fn(() => ({
      select: vi.fn(() => ({
        single: mockSingle,
      })),
    })),
  })

  mockDelete.mockReturnValue({
    eq: mockEq,
  })

  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  })

  const mockSupabaseClient = {
    from: mockFrom,
  }

  return {
    mockSupabaseClient,
    mockFrom,
    mockSelect,
    mockEq,
    mockSingle,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockOrder,
  }
})

// Mock Supabase client
vi.mock('@/lib/database/supabase-server', () => ({
  createServiceSupabaseClient: vi.fn(() => mockSupabaseClient),
}))

// Mock ProductImageService
vi.mock('./productImageService', () => ({
  ProductImageService: {
    getProductImages: vi.fn(() => Promise.resolve([])),
  },
}))

// Mock logger
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

describe('ProductService', () => {
  let service: ProductService

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mocks to default implementation
    mockSelect.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
      order: mockOrder,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
      order: mockOrder,
    })

    service = new ProductService()
  })

  // ==================== 查詢方法測試 (Query Methods) ====================

  describe('getProducts', () => {
    it('應該正確取得啟用的產品列表', async () => {
      const mockProductsData = [
        {
          id: 'product-1',
          name: '有機草莓',
          description: '新鮮有機草莓',
          category: '水果',
          price: 300,
          price_unit: '盒',
          unit_quantity: 1,
          stock: 100,
          reserved_stock: 10,
          is_active: true,
          is_on_sale: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'product-2',
          name: '有機藍莓',
          description: '新鮮有機藍莓',
          category: '水果',
          price: 400,
          price_unit: '盒',
          unit_quantity: 1,
          stock: 50,
          reserved_stock: 5,
          is_active: true,
          is_on_sale: true,
          sale_end_date: '2024-12-31',
          original_price: 500,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ]

      mockOrder.mockResolvedValueOnce({
        data: mockProductsData,
        error: null,
      })

      const result = await service.getProducts()

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('product-1')
      expect(result[0].name).toBe('有機草莓')
      expect(result[0].availableStock).toBe(90) // 100 - 10
      expect(result[1].isOnSale).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith('products')
      expect(mockEq).toHaveBeenCalledWith('is_active', true)
    })

    it('應該處理資料庫查詢錯誤', async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      await expect(service.getProducts()).rejects.toThrow()
    })

    it('應該處理空產品列表', async () => {
      mockOrder.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const result = await service.getProducts()

      expect(result).toEqual([])
    })
  })

  describe('getAllProducts', () => {
    it('應該取得所有產品（含下架）', async () => {
      const mockProductsData = [
        {
          id: 'product-1',
          name: '已下架產品',
          description: '測試描述',
          category: '測試',
          price: 100,
          stock: 0,
          reserved_stock: 0,
          is_active: false,
          is_on_sale: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      mockOrder.mockResolvedValueOnce({
        data: mockProductsData,
        error: null,
      })

      const result = await service.getAllProducts()

      expect(result).toHaveLength(1)
      expect(result[0].isActive).toBe(false)
      // getAllProducts 不應該有 is_active filter
      expect(mockEq).not.toHaveBeenCalled()
    })
  })

  describe('getProductById', () => {
    it('應該返回 null 當產品不存在 (PGRST116)', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await service.getProductById('non-existent-id')

      expect(result).toBeNull()
    })

    it('應該正確取得產品詳情', async () => {
      const mockProductData = {
        id: 'product-123',
        name: '有機草莓',
        description: '新鮮有機草莓',
        category: '水果',
        price: 300,
        price_unit: '盒',
        unit_quantity: 1,
        stock: 100,
        reserved_stock: 10,
        is_active: true,
        is_on_sale: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSingle.mockResolvedValueOnce({
        data: mockProductData,
        error: null,
      })

      const result = await service.getProductById('product-123')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('product-123')
      expect(result?.name).toBe('有機草莓')
      expect(result?.inventory).toBe(100)
      expect(result?.reservedStock).toBe(10)
      expect(result?.availableStock).toBe(90)
    })

    it('應該處理資料庫查詢錯誤', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      await expect(service.getProductById('product-123')).rejects.toThrow()
    })
  })

  // ==================== 命令方法測試 (Command Methods) ====================

  describe('addProduct', () => {
    it('應該成功新增產品', async () => {
      const createData: CreateProductData = {
        name: '新產品',
        description: '新產品描述',
        category: '水果',
        price: 200,
        priceUnit: '盒',
        unitQuantity: 1,
        inventory: 50,
        isActive: true,
        isOnSale: false,
      }

      const mockInsertedData = {
        id: 'new-product-id',
        ...createData,
        name: createData.name,
        description: createData.description,
        category: createData.category,
        price: createData.price,
        price_unit: createData.priceUnit,
        unit_quantity: createData.unitQuantity,
        stock: createData.inventory,
        reserved_stock: 0,
        is_active: createData.isActive,
        is_on_sale: createData.isOnSale,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSingle.mockResolvedValueOnce({
        data: mockInsertedData,
        error: null,
      })

      const result = await service.addProduct(createData)

      expect(result.id).toBe('new-product-id')
      expect(result.name).toBe('新產品')
      expect(result.price).toBe(200)
      expect(mockFrom).toHaveBeenCalledWith('products')
      expect(mockInsert).toHaveBeenCalled()
    })

    it('應該處理新增產品時的資料庫錯誤', async () => {
      const createData: CreateProductData = {
        name: '新產品',
        description: '描述',
        category: '水果',
        price: 200,
        inventory: 50,
        isActive: true,
        isOnSale: false,
      }

      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'Duplicate key' },
      })

      await expect(service.addProduct(createData)).rejects.toThrow()
    })
  })

  describe('updateProduct', () => {
    it('應該成功更新產品', async () => {
      const updateData: UpdateProductData = {
        name: '更新產品名稱',
        price: 350,
        isOnSale: true,
        saleEndDate: '2024-12-31',
        originalPrice: 400,
      }

      const mockUpdatedData = {
        id: 'product-123',
        name: '更新產品名稱',
        description: '原有描述',
        category: '水果',
        price: 350,
        price_unit: '盒',
        unit_quantity: 1,
        stock: 100,
        reserved_stock: 10,
        is_active: true,
        is_on_sale: true,
        sale_end_date: '2024-12-31',
        original_price: 400,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      }

      mockSingle.mockResolvedValueOnce({
        data: mockUpdatedData,
        error: null,
      })

      const result = await service.updateProduct('product-123', updateData)

      expect(result.id).toBe('product-123')
      expect(result.name).toBe('更新產品名稱')
      expect(result.price).toBe(350)
      expect(result.isOnSale).toBe(true)
      expect(result.originalPrice).toBe(400)
    })

    it('應該處理更新不存在的產品', async () => {
      const updateData: UpdateProductData = {
        price: 300,
      }

      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      await expect(service.updateProduct('non-existent-id', updateData)).rejects.toThrow()
    })
  })

  describe('deleteProduct', () => {
    it('應該成功刪除產品', async () => {
      mockEq.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await expect(service.deleteProduct('product-123')).resolves.not.toThrow()
      expect(mockFrom).toHaveBeenCalledWith('products')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', 'product-123')
    })

    it('應該處理刪除不存在的產品', async () => {
      mockEq.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      await expect(service.deleteProduct('non-existent-id')).rejects.toThrow()
    })

    it('應該處理刪除產品時的資料庫錯誤', async () => {
      mockEq.mockResolvedValueOnce({
        data: null,
        error: { code: '23503', message: 'Foreign key violation' },
      })

      await expect(service.deleteProduct('product-123')).rejects.toThrow()
    })
  })

  // ==================== 資料轉換測試 ====================

  describe('transformFromDB', () => {
    it('應該正確計算 availableStock', async () => {
      const mockProductData = {
        id: 'product-1',
        name: '測試產品',
        description: '描述',
        category: '分類',
        price: 100,
        stock: 100,
        reserved_stock: 30,
        is_active: true,
        is_on_sale: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSingle.mockResolvedValueOnce({
        data: mockProductData,
        error: null,
      })

      const result = await service.getProductById('product-1')

      expect(result?.inventory).toBe(100)
      expect(result?.reservedStock).toBe(30)
      expect(result?.availableStock).toBe(70) // 100 - 30
    })

    it('應該處理 null reserved_stock', async () => {
      const mockProductData = {
        id: 'product-1',
        name: '測試產品',
        description: '描述',
        category: '分類',
        price: 100,
        stock: 50,
        reserved_stock: null,
        is_active: true,
        is_on_sale: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSingle.mockResolvedValueOnce({
        data: mockProductData,
        error: null,
      })

      const result = await service.getProductById('product-1')

      expect(result?.reservedStock).toBe(0)
      expect(result?.availableStock).toBe(50)
    })
  })
})
