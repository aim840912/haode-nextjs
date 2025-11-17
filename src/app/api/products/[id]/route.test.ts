import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from './route'

// Mock ProductService
vi.mock('@/services/core/product/productService', () => ({
  productService: {
    getProductById: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}))

// Mock UnifiedImageService
vi.mock('@/services/infrastructure/unified-image-service', () => ({
  unifiedImageService: {
    deleteEntityImages: vi.fn(),
  },
}))

// Mock UnifiedCacheManager
vi.mock('@/lib/cache/unified-cache-manager', () => ({
  UnifiedCacheManager: {
    deletePattern: vi.fn(),
  },
}))

// Mock metrics
vi.mock('@/lib/metrics', () => ({
  recordProductView: vi.fn(),
}))

// Mock 錯誤處理中間件
vi.mock('@/lib/middleware/error-handler', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/middleware/error-handler')>()

  const { ValidationError, NotFoundError } = await import('@/lib/errors')
  const { NextResponse } = await import('next/server')

  return {
    ...actual,
    withErrorHandler: (handler: any) => {
      return async (request: NextRequest, context?: unknown) => {
        try {
          return await handler(request, context)
        } catch (error) {
          if (error instanceof ValidationError) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'VALIDATION_FAILED',
                  message: error.message,
                },
              },
              { status: 400 }
            )
          }
          if (error instanceof NotFoundError) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: error.message,
                },
              },
              { status: 404 }
            )
          }
          throw error
        }
      }
    },
  }
})

// Mock 管理員認證中間件
vi.mock('@/lib/middleware/api-middleware', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/middleware/api-middleware')>()

  const { AuthorizationError, ValidationError, NotFoundError } = await import('@/lib/errors')
  const { NextResponse } = await import('next/server')

  return {
    ...actual,
    withAdminAndError: (handler: any) => {
      return async (request: NextRequest, context?: unknown) => {
        try {
          const mockAdminUser = {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'admin',
            isAdmin: true,
          }
          return await handler(request, mockAdminUser, context)
        } catch (error) {
          if (error instanceof ValidationError) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'VALIDATION_FAILED',
                  message: error.message,
                },
              },
              { status: 400 }
            )
          }
          if (error instanceof AuthorizationError) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'FORBIDDEN',
                  message: error.message,
                },
              },
              { status: 403 }
            )
          }
          if (error instanceof NotFoundError) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: error.message,
                },
              },
              { status: 404 }
            )
          }
          throw error
        }
      }
    },
  }
})

// Import after mock
import { productService } from '@/services/core/product/productService'
import { unifiedImageService } from '@/services/infrastructure/unified-image-service'
import { UnifiedCacheManager } from '@/lib/cache/unified-cache-manager'
import { recordProductView } from '@/lib/metrics'

const mockGetProductById = productService.getProductById as ReturnType<typeof vi.fn>
const mockUpdateProduct = productService.updateProduct as ReturnType<typeof vi.fn>
const mockDeleteProduct = productService.deleteProduct as ReturnType<typeof vi.fn>
const mockDeleteEntityImages = unifiedImageService.deleteEntityImages as ReturnType<typeof vi.fn>
const mockDeletePattern = UnifiedCacheManager.deletePattern as ReturnType<typeof vi.fn>
const mockRecordProductView = recordProductView as ReturnType<typeof vi.fn>

// UUID 測試常數
const VALID_PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440000'
const INVALID_PRODUCT_ID = 'invalid-uuid'
const NONEXISTENT_PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440999'

// Helper function to create context
function createContext(id: string) {
  return {
    params: Promise.resolve({ id }),
  }
}

describe('GET /api/products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該返回 200 且取得產品詳情（公開 API）', async () => {
    const mockProduct = {
      id: VALID_PRODUCT_ID,
      name: '有機草莓',
      description: '新鮮有機草莓',
      price: 300,
      priceUnit: '斤',
      unitQuantity: 1,
      category: '季節水果',
      productImages: [],
      inventory: 100,
      isActive: true,
      createdAt: '2025-01-07T00:00:00Z',
      updatedAt: '2025-01-07T00:00:00Z',
    }

    mockGetProductById.mockResolvedValue(mockProduct)

    const request = new NextRequest(`http://localhost/api/products/${VALID_PRODUCT_ID}`)
    const context = createContext(VALID_PRODUCT_ID)

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe(VALID_PRODUCT_ID)
    expect(data.data.name).toBe('有機草莓')
    expect(data.message).toContain('查詢成功')

    // 驗證呼叫 service
    expect(mockGetProductById).toHaveBeenCalledWith(VALID_PRODUCT_ID)

    // 驗證記錄產品瀏覽指標
    expect(mockRecordProductView).toHaveBeenCalledWith(VALID_PRODUCT_ID)
  })

  it('應該返回 404 當產品不存在', async () => {
    mockGetProductById.mockResolvedValue(null)

    const request = new NextRequest(`http://localhost/api/products/${NONEXISTENT_PRODUCT_ID}`)
    const context = createContext(NONEXISTENT_PRODUCT_ID)

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('產品不存在')
    expect(data.error.code).toBe('NOT_FOUND')
  })

  it('應該返回 400 當 ID 格式錯誤', async () => {
    const request = new NextRequest(`http://localhost/api/products/${INVALID_PRODUCT_ID}`)
    const context = createContext(INVALID_PRODUCT_ID)

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('參數驗證失敗')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })
})

describe('PUT /api/products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validUpdateData = {
    name: '有機草莓（更新）',
    price: 350,
  }

  it('應該返回 200 且更新產品（管理員）', async () => {
    const mockUpdatedProduct = {
      id: VALID_PRODUCT_ID,
      name: '有機草莓（更新）',
      price: 350,
      description: '新鮮有機草莓',
      priceUnit: '斤',
      unitQuantity: 1,
      category: '季節水果',
    }

    mockUpdateProduct.mockResolvedValue(mockUpdatedProduct)
    mockDeletePattern.mockResolvedValue(undefined)

    const request = new NextRequest(`http://localhost/api/products/${VALID_PRODUCT_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validUpdateData),
    })
    const context = createContext(VALID_PRODUCT_ID)

    const response = await PUT(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('有機草莓（更新）')
    expect(data.data.price).toBe(350)
    expect(data.message).toContain('產品更新成功')

    // 驗證呼叫 service
    expect(mockUpdateProduct).toHaveBeenCalledWith(VALID_PRODUCT_ID, validUpdateData)

    // 驗證清除快取
    expect(mockDeletePattern).toHaveBeenCalledWith('products:*')
  })

  it('應該返回 400 當資料驗證失敗', async () => {
    const invalidData = {
      price: -100, // 負數價格
    }

    const request = new NextRequest(`http://localhost/api/products/${VALID_PRODUCT_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData),
    })
    const context = createContext(VALID_PRODUCT_ID)

    const response = await PUT(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('資料驗證失敗')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當 ID 格式錯誤', async () => {
    const request = new NextRequest(`http://localhost/api/products/${INVALID_PRODUCT_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validUpdateData),
    })
    const context = createContext(INVALID_PRODUCT_ID)

    const response = await PUT(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('參數驗證失敗')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該在快取清除失敗時仍然成功更新', async () => {
    const mockUpdatedProduct = {
      id: VALID_PRODUCT_ID,
      name: '有機草莓（更新）',
      price: 350,
    }

    mockUpdateProduct.mockResolvedValue(mockUpdatedProduct)
    mockDeletePattern.mockRejectedValue(new Error('Cache service unavailable'))

    const request = new NextRequest(`http://localhost/api/products/${VALID_PRODUCT_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validUpdateData),
    })
    const context = createContext(VALID_PRODUCT_ID)

    const response = await PUT(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toContain('產品更新成功')
  })
})

describe('DELETE /api/products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該返回 200 且刪除產品（管理員）', async () => {
    mockDeleteEntityImages.mockResolvedValue(3) // 刪除 3 張圖片
    mockDeleteProduct.mockResolvedValue(undefined)
    mockDeletePattern.mockResolvedValue(undefined)

    const request = new NextRequest(`http://localhost/api/products/${VALID_PRODUCT_ID}`, {
      method: 'DELETE',
    })
    const context = createContext(VALID_PRODUCT_ID)

    const response = await DELETE(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe(VALID_PRODUCT_ID)
    expect(data.message).toContain('產品刪除成功')

    // 驗證呼叫圖片清理
    expect(mockDeleteEntityImages).toHaveBeenCalledWith('products', VALID_PRODUCT_ID)

    // 驗證呼叫產品刪除
    expect(mockDeleteProduct).toHaveBeenCalledWith(VALID_PRODUCT_ID)

    // 驗證清除快取
    expect(mockDeletePattern).toHaveBeenCalledWith('products:*')
  })

  it('應該返回 400 當 ID 格式錯誤', async () => {
    const request = new NextRequest(`http://localhost/api/products/${INVALID_PRODUCT_ID}`, {
      method: 'DELETE',
    })
    const context = createContext(INVALID_PRODUCT_ID)

    const response = await DELETE(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('參數驗證失敗')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該在圖片清理失敗時仍然成功刪除產品', async () => {
    mockDeleteEntityImages.mockRejectedValue(new Error('Storage service unavailable'))
    mockDeleteProduct.mockResolvedValue(undefined)
    mockDeletePattern.mockResolvedValue(undefined)

    const request = new NextRequest(`http://localhost/api/products/${VALID_PRODUCT_ID}`, {
      method: 'DELETE',
    })
    const context = createContext(VALID_PRODUCT_ID)

    const response = await DELETE(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toContain('產品刪除成功')

    // 驗證仍然呼叫產品刪除
    expect(mockDeleteProduct).toHaveBeenCalledWith(VALID_PRODUCT_ID)
  })
})
