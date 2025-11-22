/**
 * GET /api/inquiry-templates/[id] 測試
 * PUT /api/inquiry-templates/[id] 測試
 * DELETE /api/inquiry-templates/[id] 測試
 *
 * 測試詢價範本詳細 API:
 * - 取得單一範本
 * - 更新範本
 * - 刪除範本
 * - 權限驗證（僅能操作自己的範本）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PUT, DELETE } from './route'
import { NextRequest } from 'next/server'
import type { InquiryTemplate } from '@/types/inquiry-template'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

const hoistedMocks = vi.hoisted(() => {
  const mockGetTemplate = vi.fn()
  const mockUpdateTemplate = vi.fn()
  const mockDeleteTemplate = vi.fn()

  return {
    mockGetTemplate,
    mockUpdateTemplate,
    mockDeleteTemplate,
  }
})

export const { mockGetTemplate, mockUpdateTemplate, mockDeleteTemplate } = hoistedMocks

// ============================================================================
// Vi.mock calls at module top-level (required for Vitest 4.0)
// ============================================================================

vi.mock('@/services/core/inquiry/inquiryTemplateService', () => ({
  inquiryTemplateService: {
    getTemplate: hoistedMocks.mockGetTemplate,
    updateTemplate: hoistedMocks.mockUpdateTemplate,
    deleteTemplate: hoistedMocks.mockDeleteTemplate,
  },
}))

vi.mock('@/lib/middleware/api-middleware', () => ({
  withAuthAndError: (handler: any) => {
    return async (request: NextRequest, context?: unknown) => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }
      return handler(request, mockUser, context)
    }
  },
  User: {} as any,
}))

// ============================================================================
// Test Data
// ============================================================================

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
}

const mockTemplate: InquiryTemplate = {
  id: 'template-123',
  user_id: 'user-123',
  name: '測試範本',
  description: '範本描述',
  inquiry_type: 'product',
  customer_name: '測試客戶',
  customer_email: 'customer@example.com',
  customer_phone: '0912345678',
  delivery_address: '台北市信義區',
  notes: '測試備註',
  items: [
    {
      product_id: '550e8400-e29b-41d4-a716-446655440000',
      product_name: '有機蔬菜',
      product_category: '蔬菜',
      quantity: 10,
      unit_price: 100,
      notes: '新鮮',
    },
  ],
  is_active: true,
  is_favorite: false,
  usage_count: 5,
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-01-15T10:00:00Z',
}

// ============================================================================
// Test Suites
// ============================================================================

describe('GET /api/inquiry-templates/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // 成功案例
  // ==========================================================================

  it('應該成功取得範本詳細資料', async () => {
    // Arrange
    mockGetTemplate.mockResolvedValueOnce(mockTemplate)

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates/template-123')
    const context = { params: Promise.resolve({ id: 'template-123' }) }

    // Act
    const response = await GET(request, context)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('template-123')
    expect(data.data.name).toBe('測試範本')
    expect(data.message).toBe('範本查詢成功')
    expect(mockGetTemplate).toHaveBeenCalledWith('template-123', 'user-123')
  })

  // ==========================================================================
  // 錯誤處理
  // ==========================================================================

  it('應該返回 404 當範本不存在', async () => {
    // Arrange
    mockGetTemplate.mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates/non-existent')
    const context = { params: Promise.resolve({ id: 'non-existent' }) }

    // Act & Assert
    await expect(GET(request, context)).rejects.toThrow('範本不存在或無權限查看')
  })

  it('應該返回 404 當嘗試存取其他使用者的範本', async () => {
    // Arrange - Service 應該返回 null（權限檢查）
    mockGetTemplate.mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates/other-template')
    const context = { params: Promise.resolve({ id: 'other-template' }) }

    // Act & Assert
    await expect(GET(request, context)).rejects.toThrow('範本不存在或無權限查看')
  })
})

describe('PUT /api/inquiry-templates/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // 成功案例
  // ==========================================================================

  it('應該成功更新範本', async () => {
    // Arrange
    const updateData = {
      name: '更新後的範本名稱',
      description: '更新後的描述',
      is_favorite: true,
    }

    const updatedTemplate = {
      ...mockTemplate,
      ...updateData,
      updated_at: '2025-01-15T11:00:00Z',
    }

    mockUpdateTemplate.mockResolvedValueOnce(updatedTemplate)

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates/template-123', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
    const context = { params: Promise.resolve({ id: 'template-123' }) }

    // Act
    const response = await PUT(request, context)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('更新後的範本名稱')
    expect(data.data.is_favorite).toBe(true)
    expect(data.message).toBe('範本更新成功')
    expect(mockUpdateTemplate).toHaveBeenCalledWith('template-123', 'user-123', updateData)
  })

  it('應該成功更新範本項目', async () => {
    // Arrange
    const updateData = {
      items: [
        {
          product_id: '550e8400-e29b-41d4-a716-446655440001',
          product_name: '新產品',
          quantity: 20,
          unit_price: 150,
        },
      ],
    }

    const updatedTemplate = {
      ...mockTemplate,
      items: updateData.items,
      updated_at: '2025-01-15T11:00:00Z',
    }

    mockUpdateTemplate.mockResolvedValueOnce(updatedTemplate)

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates/template-123', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
    const context = { params: Promise.resolve({ id: 'template-123' }) }

    // Act
    const response = await PUT(request, context)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.data.items).toHaveLength(1)
    expect(data.data.items[0].product_name).toBe('新產品')
  })

  it('應該成功切換範本啟用狀態', async () => {
    // Arrange
    const updateData = {
      is_active: false,
    }

    const updatedTemplate = {
      ...mockTemplate,
      is_active: false,
    }

    mockUpdateTemplate.mockResolvedValueOnce(updatedTemplate)

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates/template-123', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
    const context = { params: Promise.resolve({ id: 'template-123' }) }

    // Act
    const response = await PUT(request, context)
    const data = await response.json()

    // Assert
    expect(data.data.is_active).toBe(false)
  })

  // ==========================================================================
  // 驗證錯誤
  // ==========================================================================

  it('應該返回 400 當 name 超過長度限制', async () => {
    // Arrange
    const invalidData = {
      name: 'A'.repeat(101), // 超過 100 字元
    }

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates/template-123', {
      method: 'PUT',
      body: JSON.stringify(invalidData),
    })
    const context = { params: Promise.resolve({ id: 'template-123' }) }

    // Act & Assert
    await expect(PUT(request, context)).rejects.toThrow('資料驗證失敗')
  })

  it('應該返回 400 當 email 格式錯誤', async () => {
    // Arrange
    const invalidData = {
      customer_email: 'invalid-email',
    }

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates/template-123', {
      method: 'PUT',
      body: JSON.stringify(invalidData),
    })
    const context = { params: Promise.resolve({ id: 'template-123' }) }

    // Act & Assert
    await expect(PUT(request, context)).rejects.toThrow('資料驗證失敗')
  })

  it('應該返回 400 當 items 超過最大數量', async () => {
    // Arrange
    const invalidData = {
      items: Array.from({ length: 21 }, (_, i) => ({
        product_id: `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`,
        product_name: `產品 ${i}`,
        quantity: 1,
      })),
    }

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates/template-123', {
      method: 'PUT',
      body: JSON.stringify(invalidData),
    })
    const context = { params: Promise.resolve({ id: 'template-123' }) }

    // Act & Assert
    await expect(PUT(request, context)).rejects.toThrow('資料驗證失敗')
  })

  // ==========================================================================
  // 錯誤處理
  // ==========================================================================

  it('應該處理範本不存在的錯誤', async () => {
    // Arrange
    const updateData = { name: '更新範本' }
    mockUpdateTemplate.mockRejectedValueOnce(new Error('範本不存在或無權限修改'))

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates/non-existent', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
    const context = { params: Promise.resolve({ id: 'non-existent' }) }

    // Act & Assert
    await expect(PUT(request, context)).rejects.toThrow('範本不存在或無權限修改')
  })
})

describe('DELETE /api/inquiry-templates/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // 成功案例
  // ==========================================================================

  it('應該成功刪除範本', async () => {
    // Arrange
    mockDeleteTemplate.mockResolvedValueOnce(undefined)

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates/template-123', {
      method: 'DELETE',
    })
    const context = { params: Promise.resolve({ id: 'template-123' }) }

    // Act
    const response = await DELETE(request, context)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toBeNull()
    expect(data.message).toBe('範本刪除成功')
    expect(mockDeleteTemplate).toHaveBeenCalledWith('template-123', 'user-123')
  })

  // ==========================================================================
  // 錯誤處理
  // ==========================================================================

  it('應該處理範本不存在的錯誤', async () => {
    // Arrange
    mockDeleteTemplate.mockRejectedValueOnce(new Error('範本不存在或無權限刪除'))

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates/non-existent', {
      method: 'DELETE',
    })
    const context = { params: Promise.resolve({ id: 'non-existent' }) }

    // Act & Assert
    await expect(DELETE(request, context)).rejects.toThrow('範本不存在或無權限刪除')
  })

  it('應該處理權限錯誤', async () => {
    // Arrange - 嘗試刪除其他使用者的範本
    mockDeleteTemplate.mockRejectedValueOnce(new Error('範本不存在或無權限刪除'))

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates/other-template', {
      method: 'DELETE',
    })
    const context = { params: Promise.resolve({ id: 'other-template' }) }

    // Act & Assert
    await expect(DELETE(request, context)).rejects.toThrow('範本不存在或無權限刪除')
  })
})
