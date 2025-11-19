/**
 * ProductImageService 測試
 *
 * 測試產品圖片服務的所有功能:
 * - 查詢操作 (getProductImages, getImageById, getMainImage)
 * - 建立操作 (createProductImage, createProductImages)
 * - 更新操作 (updateProductImage)
 * - 刪除操作 (deleteProductImage, clearProductImages)
 * - 排序操作 (reorderImages, setPrimaryImage)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotFoundError, ValidationError, DatabaseError } from '@/lib/errors'
import type { ProductImage } from '@/types/product'
import { ProductImageService } from '../productImageService'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

const hoistedMocks = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockMaybeSingle = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockDelete = vi.fn()
  const mockOrder = vi.fn()
  const mockFrom = vi.fn()

  const mockSupabaseClient = {
    from: mockFrom,
  }

  return {
    mockSingle,
    mockMaybeSingle,
    mockEq,
    mockSelect,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockOrder,
    mockFrom,
    mockSupabaseClient,
  }
})

export const {
  mockSingle,
  mockMaybeSingle,
  mockEq,
  mockSelect,
  mockInsert,
  mockUpdate,
  mockDelete,
  mockOrder,
  mockFrom,
  mockSupabaseClient,
} = hoistedMocks

// ============================================================================
// Vi.mock calls at module top-level (required for Vitest 4.0)
// ============================================================================

vi.mock('@/lib/database/supabase-auth', () => ({
  getSupabaseAdmin: () => hoistedMocks.mockSupabaseClient,
}))

vi.mock('@/lib/logger', () => ({
  dbLogger: {
    timer: vi.fn(() => ({
      end: vi.fn(),
    })),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

// ============================================================================
// Test Data
// ============================================================================

const MOCK_PRODUCT_ID = 'product-123'
const MOCK_IMAGE_ID = 'image-456'

const mockImageRow = {
  id: MOCK_IMAGE_ID,
  module: 'products',
  entity_id: MOCK_PRODUCT_ID,
  storage_url: 'https://r2.example.com/image.jpg',
  file_path: 'products/image.jpg',
  alt_text: '測試圖片',
  display_position: 0,
  size: 'medium',
  metadata: { width: 800, height: 600, file_size: 102400 },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockImage: ProductImage = {
  id: MOCK_IMAGE_ID,
  module: 'products',
  entity_id: MOCK_PRODUCT_ID,
  storage_url: 'https://r2.example.com/image.jpg',
  file_path: 'products/image.jpg',
  alt_text: '測試圖片',
  display_position: 0,
  size: 'medium',
  width: 800,
  height: 600,
  file_size: 102400,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 設定 Mock 鏈式調用結構
 */
function setupMockChains() {
  // select() 鏈: select().eq().eq().order()
  mockSelect.mockReturnValue({
    eq: mockEq,
  })

  mockEq.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
    order: mockOrder,
  })

  mockOrder.mockReturnValue({
    data: [],
    error: null,
  })

  mockSingle.mockReturnValue({
    data: null,
    error: null,
  })

  mockMaybeSingle.mockReturnValue({
    data: null,
    error: null,
  })

  // insert() 鏈: insert().select().single()
  mockInsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: mockSingle,
      data: null,
      error: null,
    }),
    data: null,
    error: null,
  })

  // update() 鏈: update().eq().select().single()
  mockUpdate.mockReturnValue({
    eq: mockEq,
  })

  // delete() 鏈: delete().eq()
  mockDelete.mockReturnValue({
    eq: mockEq,
  })

  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  })
}

/**
 * 重置所有 Mocks
 */
function resetAllMocks() {
  vi.clearAllMocks()
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  })
  setupMockChains()
}

// ============================================================================
// Tests
// ============================================================================

describe('ProductImageService', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  // ==========================================================================
  // 查詢操作
  // ==========================================================================

  describe('getProductImages()', () => {
    it('應該成功查詢產品的所有圖片', async () => {
      // Arrange
      const mockImages = [mockImageRow, { ...mockImageRow, id: 'image-789', display_position: 1 }]
      mockOrder.mockResolvedValueOnce({
        data: mockImages,
        error: null,
      })

      // Act
      const result = await ProductImageService.getProductImages(MOCK_PRODUCT_ID)

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        id: MOCK_IMAGE_ID,
        entity_id: MOCK_PRODUCT_ID,
        storage_url: 'https://r2.example.com/image.jpg',
      })
      expect(mockFrom).toHaveBeenCalledWith('images')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('module', 'products')
      expect(mockEq).toHaveBeenCalledWith('entity_id', MOCK_PRODUCT_ID)
      expect(mockOrder).toHaveBeenCalledWith('display_position', { ascending: true })
    })

    it('應該返回空陣列當產品沒有圖片', async () => {
      // Arrange
      mockOrder.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      // Act
      const result = await ProductImageService.getProductImages(MOCK_PRODUCT_ID)

      // Assert
      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('應該處理資料庫錯誤', async () => {
      // Arrange
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: '500' },
      })

      // Act & Assert
      await expect(ProductImageService.getProductImages(MOCK_PRODUCT_ID)).rejects.toThrow()
    })
  })

  describe('getImageById()', () => {
    it('應該成功查詢單張圖片', async () => {
      // Arrange
      mockSingle.mockResolvedValueOnce({
        data: mockImageRow,
        error: null,
      })

      // Act
      const result = await ProductImageService.getImageById(MOCK_IMAGE_ID)

      // Assert
      expect(result).toMatchObject({
        id: MOCK_IMAGE_ID,
        storage_url: 'https://r2.example.com/image.jpg',
      })
      expect(mockFrom).toHaveBeenCalledWith('images')
      expect(mockEq).toHaveBeenCalledWith('id', MOCK_IMAGE_ID)
      expect(mockSingle).toHaveBeenCalled()
    })

    it('應該返回 null 當圖片不存在 (PGRST116)', async () => {
      // Arrange
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      // Act
      const result = await ProductImageService.getImageById('non-existent')

      // Assert
      expect(result).toBeNull()
    })

    it('應該拋出錯誤當遇到其他資料庫錯誤', async () => {
      // Arrange
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: '500', message: 'Database error' },
      })

      // Act & Assert
      await expect(ProductImageService.getImageById(MOCK_IMAGE_ID)).rejects.toThrow()
    })
  })

  describe('getMainImage()', () => {
    it('應該成功查詢主圖 (display_position = 0)', async () => {
      // Arrange
      mockMaybeSingle.mockResolvedValueOnce({
        data: mockImageRow,
        error: null,
      })

      // Act
      const result = await ProductImageService.getMainImage(MOCK_PRODUCT_ID)

      // Assert
      expect(result).toMatchObject({
        id: MOCK_IMAGE_ID,
        display_position: 0,
      })
      expect(mockEq).toHaveBeenCalledWith('entity_id', MOCK_PRODUCT_ID)
      expect(mockEq).toHaveBeenCalledWith('display_position', 0)
      expect(mockMaybeSingle).toHaveBeenCalled()
    })

    it('應該返回 null 當沒有主圖', async () => {
      // Arrange
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // Act
      const result = await ProductImageService.getMainImage(MOCK_PRODUCT_ID)

      // Assert
      expect(result).toBeNull()
    })

    it('應該處理資料庫錯誤', async () => {
      // Arrange
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: '500' },
      })

      // Act & Assert
      await expect(ProductImageService.getMainImage(MOCK_PRODUCT_ID)).rejects.toThrow()
    })
  })

  // ==========================================================================
  // 建立操作
  // ==========================================================================

  describe('createProductImage()', () => {
    it('應該成功建立單張圖片', async () => {
      // Arrange
      const createData = {
        product_id: MOCK_PRODUCT_ID,
        storage_url: 'https://r2.example.com/new-image.jpg',
        file_path: 'products/new-image.jpg',
        alt_text: '新圖片',
        display_position: 1,
      }

      const mockInsertChain = {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockImageRow, ...createData, id: 'new-image-id' },
            error: null,
          }),
        }),
      }
      mockInsert.mockReturnValueOnce(mockInsertChain)

      // Act
      const result = await ProductImageService.createProductImage(createData)

      // Assert
      expect(result).toMatchObject({
        entity_id: MOCK_PRODUCT_ID,
        storage_url: 'https://r2.example.com/new-image.jpg',
      })
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'products',
          entity_id: MOCK_PRODUCT_ID,
          storage_url: createData.storage_url,
          file_path: createData.file_path,
        })
      )
    })

    it('應該拋出 ValidationError 當缺少必填欄位', async () => {
      // Arrange
      const invalidData = {
        product_id: '', // 缺少
        storage_url: 'https://r2.example.com/image.jpg',
        file_path: 'products/image.jpg',
      }

      // Act & Assert
      // ErrorFactory 會將 ValidationError 包裝成 DatabaseError
      await expect(ProductImageService.createProductImage(invalidData)).rejects.toThrow(
        DatabaseError
      )
    })

    it('應該使用預設值 (position=0, size=medium)', async () => {
      // Arrange
      const createData = {
        product_id: MOCK_PRODUCT_ID,
        storage_url: 'https://r2.example.com/image.jpg',
        file_path: 'products/image.jpg',
      }

      const mockInsertChain = {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockImageRow,
            error: null,
          }),
        }),
      }
      mockInsert.mockReturnValueOnce(mockInsertChain)

      // Act
      await ProductImageService.createProductImage(createData)

      // Assert
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          display_position: 0, // 預設值
          size: 'medium', // 預設值
        })
      )
    })
  })

  describe('createProductImages()', () => {
    it('應該成功批次建立多張圖片', async () => {
      // Arrange
      const imagesData = [
        {
          product_id: MOCK_PRODUCT_ID,
          storage_url: 'https://r2.example.com/image1.jpg',
          file_path: 'products/image1.jpg',
        },
        {
          product_id: MOCK_PRODUCT_ID,
          storage_url: 'https://r2.example.com/image2.jpg',
          file_path: 'products/image2.jpg',
        },
      ]

      const mockInsertChain = {
        select: vi.fn().mockResolvedValue({
          data: [
            { ...mockImageRow, id: 'img1', display_position: 0 },
            { ...mockImageRow, id: 'img2', display_position: 1 },
          ],
          error: null,
        }),
      }
      mockInsert.mockReturnValueOnce(mockInsertChain)

      // Act
      const result = await ProductImageService.createProductImages(imagesData)

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0].display_position).toBe(0)
      expect(result[1].display_position).toBe(1)
    })

    it('應該返回空陣列當輸入為空', async () => {
      // Act
      const result = await ProductImageService.createProductImages([])

      // Assert
      expect(result).toEqual([])
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('應該拋出 ValidationError 當有圖片缺少必填欄位', async () => {
      // Arrange
      const invalidData = [
        {
          product_id: MOCK_PRODUCT_ID,
          storage_url: 'https://r2.example.com/image1.jpg',
          file_path: 'products/image1.jpg',
        },
        {
          product_id: '', // 缺少
          storage_url: 'https://r2.example.com/image2.jpg',
          file_path: 'products/image2.jpg',
        },
      ]

      // Act & Assert
      // ErrorFactory 會將 ValidationError 包裝成 DatabaseError
      await expect(ProductImageService.createProductImages(invalidData)).rejects.toThrow(
        DatabaseError
      )
    })

    it('應該為每張圖片設定遞增的 position（當未指定時）', async () => {
      // Arrange
      const imagesData = [
        {
          product_id: MOCK_PRODUCT_ID,
          storage_url: 'https://r2.example.com/image1.jpg',
          file_path: 'products/image1.jpg',
        },
        {
          product_id: MOCK_PRODUCT_ID,
          storage_url: 'https://r2.example.com/image2.jpg',
          file_path: 'products/image2.jpg',
        },
        {
          product_id: MOCK_PRODUCT_ID,
          storage_url: 'https://r2.example.com/image3.jpg',
          file_path: 'products/image3.jpg',
        },
      ]

      const mockInsertChain = {
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }
      mockInsert.mockReturnValueOnce(mockInsertChain)

      // Act
      await ProductImageService.createProductImages(imagesData)

      // Assert
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ display_position: 0 }),
          expect.objectContaining({ display_position: 1 }),
          expect.objectContaining({ display_position: 2 }),
        ])
      )
    })
  })

  // ==========================================================================
  // 更新操作
  // ==========================================================================

  describe('updateProductImage()', () => {
    it('應該成功更新圖片', async () => {
      // Arrange
      const updateData = {
        alt_text: '更新後的描述',
        display_position: 2,
      }

      // Mock getImageById (檢查圖片存在)
      mockSingle.mockResolvedValueOnce({
        data: mockImageRow,
        error: null,
      })

      // Mock update operation
      const mockUpdateChain = {
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockImageRow, ...updateData },
              error: null,
            }),
          }),
        }),
      }
      mockUpdate.mockReturnValueOnce(mockUpdateChain)

      // Act
      const result = await ProductImageService.updateProductImage(MOCK_IMAGE_ID, updateData)

      // Assert
      expect(result.alt_text).toBe('更新後的描述')
      expect(result.display_position).toBe(2)
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('應該拋出 NotFoundError 當圖片不存在', async () => {
      // Arrange
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      // Act & Assert
      // ErrorFactory 會將 NotFoundError 包裝成 DatabaseError
      await expect(
        ProductImageService.updateProductImage('non-existent', { alt_text: '測試' })
      ).rejects.toThrow(DatabaseError)
    })

    it('應該正確處理 metadata 更新 (width, height, file_size)', async () => {
      // Arrange
      const updateData = {
        width: 1920,
        height: 1080,
        file_size: 204800,
      }

      mockSingle.mockResolvedValueOnce({
        data: mockImageRow,
        error: null,
      })

      const mockUpdateChain = {
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockImageRow,
              error: null,
            }),
          }),
        }),
      }
      mockUpdate.mockReturnValueOnce(mockUpdateChain)

      // Act
      await ProductImageService.updateProductImage(MOCK_IMAGE_ID, updateData)

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            width: 1920,
            height: 1080,
            file_size: 204800,
          },
        })
      )
    })
  })

  // ==========================================================================
  // 刪除操作
  // ==========================================================================

  describe('deleteProductImage()', () => {
    it('應該成功刪除圖片', async () => {
      // Arrange
      mockSingle.mockResolvedValueOnce({
        data: mockImageRow,
        error: null,
      })

      const mockDeleteChain = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }
      mockDelete.mockReturnValueOnce(mockDeleteChain)

      // Act
      await ProductImageService.deleteProductImage(MOCK_IMAGE_ID)

      // Assert
      expect(mockDelete).toHaveBeenCalled()
      expect(mockDeleteChain.eq).toHaveBeenCalledWith('id', MOCK_IMAGE_ID)
    })

    it('應該拋出 NotFoundError 當圖片不存在', async () => {
      // Arrange
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      // Act & Assert
      // ErrorFactory 會將 NotFoundError 包裝成 DatabaseError
      await expect(ProductImageService.deleteProductImage('non-existent')).rejects.toThrow(
        DatabaseError
      )
    })

    it('應該處理刪除時的資料庫錯誤', async () => {
      // Arrange
      mockSingle.mockResolvedValueOnce({
        data: mockImageRow,
        error: null,
      })

      const mockDeleteChain = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '500', message: 'Database error' },
        }),
      }
      mockDelete.mockReturnValueOnce(mockDeleteChain)

      // Act & Assert
      await expect(ProductImageService.deleteProductImage(MOCK_IMAGE_ID)).rejects.toThrow()
    })
  })

  describe('clearProductImages()', () => {
    it('應該成功清除產品的所有圖片', async () => {
      // Arrange - Mock getProductImages 返回圖片列表
      mockOrder.mockResolvedValueOnce({
        data: [mockImageRow, { ...mockImageRow, id: 'image-2' }],
        error: null,
      })

      const mockSecondEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      })

      const mockDeleteChain = {
        eq: vi.fn().mockReturnValue({
          eq: mockSecondEq,
        }),
      }
      mockDelete.mockReturnValueOnce(mockDeleteChain)

      // Act
      await ProductImageService.clearProductImages(MOCK_PRODUCT_ID)

      // Assert
      expect(mockDelete).toHaveBeenCalled()
      expect(mockDeleteChain.eq).toHaveBeenCalledWith('module', 'products')
      expect(mockSecondEq).toHaveBeenCalledWith('entity_id', MOCK_PRODUCT_ID)
    })

    it('應該成功處理沒有圖片的產品', async () => {
      // Arrange
      mockOrder.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const mockDeleteChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }
      mockDelete.mockReturnValueOnce(mockDeleteChain)

      // Act
      await ProductImageService.clearProductImages(MOCK_PRODUCT_ID)

      // Assert
      expect(mockDelete).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // 排序操作
  // ==========================================================================

  describe('reorderImages()', () => {
    it('應該成功重新排序圖片', async () => {
      // Arrange
      const imageOrders = [
        { id: 'image-1', position: 2 },
        { id: 'image-2', position: 0 },
        { id: 'image-3', position: 1 },
      ]

      const mockUpdateChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }

      mockUpdate.mockReturnValue(mockUpdateChain)

      // Act
      await ProductImageService.reorderImages(MOCK_PRODUCT_ID, imageOrders)

      // Assert
      expect(mockUpdate).toHaveBeenCalledTimes(3)
      expect(mockUpdate).toHaveBeenCalledWith({ display_position: 2 })
      expect(mockUpdate).toHaveBeenCalledWith({ display_position: 0 })
      expect(mockUpdate).toHaveBeenCalledWith({ display_position: 1 })
    })

    it('應該處理空的排序列表', async () => {
      // Act
      await ProductImageService.reorderImages(MOCK_PRODUCT_ID, [])

      // Assert
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('應該處理排序時的資料庫錯誤', async () => {
      // Arrange
      const imageOrders = [{ id: 'image-1', position: 0 }]

      const mockUpdateChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '500', message: 'Database error' },
            }),
          }),
        }),
      }
      mockUpdate.mockReturnValueOnce(mockUpdateChain)

      // Act & Assert
      await expect(
        ProductImageService.reorderImages(MOCK_PRODUCT_ID, imageOrders)
      ).rejects.toThrow()
    })
  })

  describe('setPrimaryImage()', () => {
    it('應該成功設定主圖並交換位置', async () => {
      // Arrange
      const targetImageRow = { ...mockImageRow, id: 'target-image', display_position: 3 }

      // Mock getImageById (驗證圖片存在)
      mockSingle.mockResolvedValueOnce({
        data: targetImageRow,
        error: null,
      })

      // Mock 查詢當前主圖
      mockMaybeSingle.mockResolvedValueOnce({
        data: { ...mockImageRow, id: 'current-primary', display_position: 0 },
        error: null,
      })

      // Mock 兩次 update 操作
      const mockUpdateChain1 = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }
      const mockUpdateChain2 = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }
      mockUpdate.mockReturnValueOnce(mockUpdateChain1).mockReturnValueOnce(mockUpdateChain2)

      // Act
      await ProductImageService.setPrimaryImage(MOCK_PRODUCT_ID, 'target-image')

      // Assert
      expect(mockUpdate).toHaveBeenCalledTimes(2)
      // 原主圖移到 target 的位置 (3)
      expect(mockUpdate).toHaveBeenNthCalledWith(1, { display_position: 3 })
      // target 移到主圖位置 (0)
      expect(mockUpdate).toHaveBeenNthCalledWith(2, { display_position: 0 })
    })

    it('應該拋出 NotFoundError 當圖片不存在', async () => {
      // Arrange
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      // Act & Assert
      // ErrorFactory 會將 NotFoundError 包裝成 DatabaseError
      await expect(
        ProductImageService.setPrimaryImage(MOCK_PRODUCT_ID, 'non-existent')
      ).rejects.toThrow(DatabaseError)
    })

    it('應該拋出 ValidationError 當圖片不屬於指定產品', async () => {
      // Arrange
      const wrongProductImage = { ...mockImageRow, entity_id: 'wrong-product-id' }
      mockSingle.mockResolvedValueOnce({
        data: wrongProductImage,
        error: null,
      })

      // Act & Assert
      // ErrorFactory 會將 ValidationError 包裝成 DatabaseError
      await expect(
        ProductImageService.setPrimaryImage(MOCK_PRODUCT_ID, MOCK_IMAGE_ID)
      ).rejects.toThrow(DatabaseError)
    })

    it('應該處理沒有當前主圖的情況', async () => {
      // Arrange
      const targetImageRow = { ...mockImageRow, id: 'target-image', display_position: 2 }

      mockSingle.mockResolvedValueOnce({
        data: targetImageRow,
        error: null,
      })

      // 沒有當前主圖
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const mockUpdateChain = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }
      mockUpdate.mockReturnValueOnce(mockUpdateChain)

      // Act
      await ProductImageService.setPrimaryImage(MOCK_PRODUCT_ID, 'target-image')

      // Assert
      // 只更新 target 為主圖，不需要交換
      expect(mockUpdate).toHaveBeenCalledTimes(1)
      expect(mockUpdate).toHaveBeenCalledWith({ display_position: 0 })
    })
  })

  // ==========================================================================
  // 服務實例化和導出
  // ==========================================================================

  describe('服務實例化和導出', () => {
    it('應該正確導出 ProductImageService 類別', () => {
      expect(ProductImageService).toBeDefined()
      expect(typeof ProductImageService.getProductImages).toBe('function')
      expect(typeof ProductImageService.createProductImage).toBe('function')
      expect(typeof ProductImageService.updateProductImage).toBe('function')
      expect(typeof ProductImageService.deleteProductImage).toBe('function')
      expect(typeof ProductImageService.reorderImages).toBe('function')
    })
  })
})
