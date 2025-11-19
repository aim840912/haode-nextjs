/**
 * GET /api/products/categories 測試
 *
 * 測試產品分類API:
 * - 返回所有唯一分類
 * - 合併預設分類
 * - 處理空資料情況
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from './route'
import type { Product } from '@/types/product'
import { NextRequest } from 'next/server'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

const hoistedMocks = vi.hoisted(() => {
  const mockGetProducts = vi.fn()
  const mockGetDefaultCategories = vi.fn()

  return {
    mockGetProducts,
    mockGetDefaultCategories,
  }
})

export const { mockGetProducts, mockGetDefaultCategories } = hoistedMocks

// ============================================================================
// Vi.mock calls at module top-level (required for Vitest 4.0)
// ============================================================================

vi.mock('@/services/core/product/productService', () => ({
  adminProductService: {
    getProducts: hoistedMocks.mockGetProducts,
  },
}))

vi.mock('@/constants/productCategories', () => ({
  getDefaultCategories: hoistedMocks.mockGetDefaultCategories,
}))

// ============================================================================
// Test Data
// ============================================================================

const createMockProduct = (id: string, category: string): Partial<Product> => ({
  id,
  name: `產品 ${id}`,
  category,
  price: 100,
  // 其他欄位可以省略
})

const defaultCategories = ['季節水果', '有機蔬菜']

// ============================================================================
// Test Suites
// ============================================================================

describe('GET /api/products/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetDefaultCategories.mockReturnValue(defaultCategories)
  })

  // ==========================================================================
  // 成功案例
  // ==========================================================================

  it('應該返回所有唯一分類（合併預設分類）', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/products/categories')
    const mockProducts: Partial<Product>[] = [
      createMockProduct('1', '季節水果'),
      createMockProduct('2', '有機蔬菜'),
      createMockProduct('3', '農特產品'),
      createMockProduct('4', '季節水果'), // 重複分類
    ]
    mockGetProducts.mockResolvedValueOnce(mockProducts)

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(['季節水果', '有機蔬菜', '農特產品']) // 已排序和去重
    expect(data.message).toBe('成功取得產品分類')
  })

  it('應該過濾空字串和純空格分類', async () => {
    // Arrange
    const mockProducts: Partial<Product>[] = [
      createMockProduct('1', '季節水果'),
      createMockProduct('2', ''), // 空字串
      createMockProduct('3', '   '), // 純空格
      createMockProduct('4', '有機蔬菜'),
    ]
    mockGetProducts.mockResolvedValueOnce(mockProducts)

    // Act
    const request = new NextRequest('http://localhost:3000/api/products/categories')
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(data.data).toEqual(['季節水果', '有機蔬菜'])
    expect(data.data).not.toContain('')
    expect(data.data).not.toContain('   ')
  })

  it('應該返回排序後的分類列表', async () => {
    // Arrange
    const mockProducts: Partial<Product>[] = [
      createMockProduct('1', '蔬菜'),
      createMockProduct('2', '水果'),
      createMockProduct('3', '穀物'),
    ]
    mockGetProducts.mockResolvedValueOnce(mockProducts)

    // Act
    const request = new NextRequest('http://localhost:3000/api/products/categories')
    const response = await GET(request)
    const data = await response.json()

    // Assert - 包含預設分類(季節水果、有機蔬菜) + 現有分類,按字典序排序
    expect(data.data).toEqual(['季節水果', '有機蔬菜', '水果', '穀物', '蔬菜'])
  })

  it('應該合併現有分類和預設分類', async () => {
    // Arrange
    const mockProducts: Partial<Product>[] = [
      createMockProduct('1', '農特產品'),
      createMockProduct('2', '手工藝品'),
    ]
    mockGetProducts.mockResolvedValueOnce(mockProducts)

    // Act
    const request = new NextRequest('http://localhost:3000/api/products/categories')
    const response = await GET(request)
    const data = await response.json()

    // Assert
    // 應包含預設分類（季節水果、有機蔬菜）+ 現有分類（農特產品、手工藝品）
    expect(data.data).toContain('季節水果')
    expect(data.data).toContain('有機蔬菜')
    expect(data.data).toContain('農特產品')
    expect(data.data).toContain('手工藝品')
  })

  it('應該返回預設分類當沒有任何產品', async () => {
    // Arrange
    mockGetProducts.mockResolvedValueOnce([])

    // Act
    const request = new NextRequest('http://localhost:3000/api/products/categories')
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(defaultCategories)
    expect(data.message).toBe('成功取得產品分類（使用預設分類）')
  })

  it('應該返回預設分類當所有產品分類都為空', async () => {
    // Arrange
    const mockProducts: Partial<Product>[] = [
      createMockProduct('1', ''),
      createMockProduct('2', '   '),
      createMockProduct('3', ''),
    ]
    mockGetProducts.mockResolvedValueOnce(mockProducts)

    // Act
    const request = new NextRequest('http://localhost:3000/api/products/categories')
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(data.data).toEqual(defaultCategories)
    expect(data.message).toBe('成功取得產品分類（使用預設分類）')
  })

  it('應該去除重複的預設分類', async () => {
    // Arrange - 現有分類已包含預設分類
    const mockProducts: Partial<Product>[] = [
      createMockProduct('1', '季節水果'), // 預設分類之一
      createMockProduct('2', '有機蔬菜'), // 預設分類之一
      createMockProduct('3', '農特產品'),
    ]
    mockGetProducts.mockResolvedValueOnce(mockProducts)

    // Act
    const request = new NextRequest('http://localhost:3000/api/products/categories')
    const response = await GET(request)
    const data = await response.json()

    // Assert - 每個分類只出現一次
    const fruitCount = data.data.filter((cat: string) => cat === '季節水果').length
    const veggieCount = data.data.filter((cat: string) => cat === '有機蔬菜').length

    expect(fruitCount).toBe(1)
    expect(veggieCount).toBe(1)
  })

  // ==========================================================================
  // 錯誤處理
  // ==========================================================================

  it('應該處理 adminProductService 拋出的錯誤', async () => {
    // Arrange
    mockGetProducts.mockRejectedValueOnce(new Error('資料庫連線失敗'))

    // Act
    const request = new NextRequest('http://localhost:3000/api/products/categories')
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('資料庫連線失敗')
  })

  it('應該處理 getDefaultCategories 拋出的錯誤', async () => {
    // Arrange
    mockGetProducts.mockResolvedValueOnce([])
    mockGetDefaultCategories.mockImplementationOnce(() => {
      throw new Error('無法載入預設分類')
    })

    // Act
    const request = new NextRequest('http://localhost:3000/api/products/categories')
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('無法載入預設分類')
  })
})
