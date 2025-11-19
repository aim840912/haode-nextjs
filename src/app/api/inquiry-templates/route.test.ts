/**
 * GET /api/inquiry-templates 測試
 * POST /api/inquiry-templates 測試
 *
 * 測試詢價範本 API:
 * - 列出使用者範本（帶查詢參數）
 * - 建立新範本（產品詢價和農場參觀）
 * - 驗證查詢參數和請求資料
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from './route'
import { NextRequest } from 'next/server'
import type { InquiryTemplate } from '@/types/inquiry-template'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

const hoistedMocks = vi.hoisted(() => {
  const mockListTemplates = vi.fn()
  const mockCreateTemplate = vi.fn()

  return {
    mockListTemplates,
    mockCreateTemplate,
  }
})

export const { mockListTemplates, mockCreateTemplate } = hoistedMocks

// ============================================================================
// Vi.mock calls at module top-level (required for Vitest 4.0)
// ============================================================================

vi.mock('@/services/core/inquiry/inquiryTemplateService', () => ({
  inquiryTemplateService: {
    listTemplates: hoistedMocks.mockListTemplates,
    createTemplate: hoistedMocks.mockCreateTemplate,
  },
}))

vi.mock('@/lib/middleware/api-middleware', () => ({
  withAuthAndError: (handler: any) => handler,
  User: {} as any,
}))

// ============================================================================
// Test Data
// ============================================================================

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
}

const createMockTemplate = (overrides?: Partial<InquiryTemplate>): InquiryTemplate => ({
  id: 'template-1',
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
      product_id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
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
  ...overrides,
})

// ============================================================================
// Test Suites
// ============================================================================

describe('GET /api/inquiry-templates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // 成功案例
  // ==========================================================================

  it('應該返回使用者的範本列表', async () => {
    // Arrange
    const mockTemplates = [createMockTemplate(), createMockTemplate({ id: 'template-2' })]
    mockListTemplates.mockResolvedValueOnce(mockTemplates)

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates')

    // Act
    const response = await GET(request, mockUser)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.templates).toHaveLength(2)
    expect(data.data.pagination.total).toBe(2)
    expect(data.message).toBe('範本列表查詢成功')
    expect(mockListTemplates).toHaveBeenCalledWith('user-123', {
      limit: 20,
      offset: 0,
      sort_by: 'created_at',
      sort_order: 'desc',
    })
  })

  it('應該支援查詢參數過濾', async () => {
    // Arrange
    const mockTemplates = [createMockTemplate({ inquiry_type: 'product', is_active: true })]
    mockListTemplates.mockResolvedValueOnce(mockTemplates)

    const request = new NextRequest(
      'http://localhost:3000/api/inquiry-templates?inquiry_type=product&is_active=true&is_favorite=false'
    )

    // Act
    const response = await GET(request, mockUser)
    const data = await response.json()

    // Assert
    expect(data.success).toBe(true)
    expect(mockListTemplates).toHaveBeenCalledWith('user-123', {
      inquiry_type: 'product',
      is_active: true,
      is_favorite: false,
      limit: 20,
      offset: 0,
      sort_by: 'created_at',
      sort_order: 'desc',
    })
  })

  it('應該支援分頁參數', async () => {
    // Arrange
    mockListTemplates.mockResolvedValueOnce([])

    const request = new NextRequest(
      'http://localhost:3000/api/inquiry-templates?limit=10&offset=20'
    )

    // Act
    const response = await GET(request, mockUser)
    const data = await response.json()

    // Assert
    expect(data.success).toBe(true)
    expect(mockListTemplates).toHaveBeenCalledWith('user-123', {
      limit: 10,
      offset: 20,
      sort_by: 'created_at',
      sort_order: 'desc',
    })
  })

  it('應該支援排序參數', async () => {
    // Arrange
    mockListTemplates.mockResolvedValueOnce([])

    const request = new NextRequest(
      'http://localhost:3000/api/inquiry-templates?sort_by=usage_count&sort_order=asc'
    )

    // Act
    const response = await GET(request, mockUser)
    const data = await response.json()

    // Assert
    expect(mockListTemplates).toHaveBeenCalledWith('user-123', {
      limit: 20,
      offset: 0,
      sort_by: 'usage_count',
      sort_order: 'asc',
    })
  })

  it('應該返回空列表當沒有範本', async () => {
    // Arrange
    mockListTemplates.mockResolvedValueOnce([])

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates')

    // Act
    const response = await GET(request, mockUser)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.data.templates).toEqual([])
    expect(data.data.pagination.total).toBe(0)
  })

  // ==========================================================================
  // 驗證錯誤
  // ==========================================================================

  it('應該返回 400 當 limit 超過最大值', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/inquiry-templates?limit=101')

    // Act & Assert
    await expect(GET(request, mockUser)).rejects.toThrow('查詢參數驗證失敗')
  })

  it('應該返回 400 當 inquiry_type 無效', async () => {
    // Arrange
    const request = new NextRequest(
      'http://localhost:3000/api/inquiry-templates?inquiry_type=invalid'
    )

    // Act & Assert
    await expect(GET(request, mockUser)).rejects.toThrow('查詢參數驗證失敗')
  })
})

describe('POST /api/inquiry-templates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // 成功案例
  // ==========================================================================

  it('應該成功建立產品詢價範本', async () => {
    // Arrange
    const createData = {
      name: '每週蔬菜訂單',
      description: '每週固定蔬菜訂單',
      inquiry_type: 'product',
      customer_name: '王小明',
      customer_email: 'wang@example.com',
      customer_phone: '0912345678',
      delivery_address: '台北市信義區',
      notes: '請提早通知',
      items: [
        {
          product_id: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID
          product_name: '有機高麗菜',
          product_category: '蔬菜',
          quantity: 5,
          unit_price: 80,
        },
      ],
    }

    const createdTemplate = createMockTemplate({
      ...createData,
      items: [
        {
          product_id: '550e8400-e29b-41d4-a716-446655440001',
          product_name: '有機高麗菜',
          product_category: '蔬菜',
          quantity: 5,
          unit_price: 80,
          notes: undefined,
        },
      ],
    })
    mockCreateTemplate.mockResolvedValueOnce(createdTemplate)

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates', {
      method: 'POST',
      body: JSON.stringify(createData),
    })

    // Act
    const response = await POST(request, mockUser)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('每週蔬菜訂單')
    expect(data.message).toBe('範本建立成功')
    expect(mockCreateTemplate).toHaveBeenCalledWith('user-123', createData)
  })

  it('應該成功建立農場參觀範本', async () => {
    // Arrange
    const createData = {
      name: '學校參觀範本',
      description: '學校團體參觀',
      inquiry_type: 'farm_tour',
      customer_name: '李老師',
      customer_email: 'lee@school.com',
      activity_title: '國小三年級農場體驗',
      visit_date_pattern: 'weekday',
      visitor_count: '30',
      notes: '需要導覽',
    }

    const createdTemplate = createMockTemplate({
      name: '學校參觀範本',
      description: '學校團體參觀',
      inquiry_type: 'farm_tour', // 正確設置為 farm_tour
      customer_name: '李老師',
      customer_email: 'lee@school.com',
      activity_title: '國小三年級農場體驗',
      visit_date_pattern: 'weekday',
      visitor_count: '30',
      notes: '需要導覽',
      items: undefined, // 農場參觀不需要 items
    })
    mockCreateTemplate.mockResolvedValueOnce(createdTemplate)

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates', {
      method: 'POST',
      body: JSON.stringify(createData),
    })

    // Act
    const response = await POST(request, mockUser)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.inquiry_type).toBe('farm_tour')
  })

  it('應該成功建立最小必填欄位的範本', async () => {
    // Arrange
    const minimalData = {
      name: '簡單範本',
      inquiry_type: 'product',
    }

    const createdTemplate = createMockTemplate(minimalData)
    mockCreateTemplate.mockResolvedValueOnce(createdTemplate)

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates', {
      method: 'POST',
      body: JSON.stringify(minimalData),
    })

    // Act
    const response = await POST(request, mockUser)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
  })

  // ==========================================================================
  // 驗證錯誤
  // ==========================================================================

  it('應該返回 400 當缺少必填欄位 name', async () => {
    // Arrange
    const invalidData = {
      inquiry_type: 'product',
      // 缺少 name
    }

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    })

    // Act & Assert
    await expect(POST(request, mockUser)).rejects.toThrow('資料驗證失敗')
  })

  it('應該返回 400 當缺少必填欄位 inquiry_type', async () => {
    // Arrange
    const invalidData = {
      name: '測試範本',
      // 缺少 inquiry_type
    }

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    })

    // Act & Assert
    await expect(POST(request, mockUser)).rejects.toThrow('資料驗證失敗')
  })

  it('應該返回 400 當 name 超過長度限制', async () => {
    // Arrange
    const invalidData = {
      name: 'A'.repeat(101), // 超過 100 字元
      inquiry_type: 'product',
    }

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    })

    // Act & Assert
    await expect(POST(request, mockUser)).rejects.toThrow('資料驗證失敗')
  })

  it('應該返回 400 當 email 格式錯誤', async () => {
    // Arrange
    const invalidData = {
      name: '測試範本',
      inquiry_type: 'product',
      customer_email: 'invalid-email', // 無效 email
    }

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    })

    // Act & Assert
    await expect(POST(request, mockUser)).rejects.toThrow('資料驗證失敗')
  })

  it('應該返回 400 當 items 超過最大數量', async () => {
    // Arrange
    const invalidData = {
      name: '測試範本',
      inquiry_type: 'product',
      items: Array.from({ length: 21 }, (_, i) => ({
        product_id: `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`, // Valid UUID
        product_name: `產品 ${i}`,
        quantity: 1,
      })),
    }

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    })

    // Act & Assert
    await expect(POST(request, mockUser)).rejects.toThrow('資料驗證失敗')
  })

  it('應該返回 400 當 inquiry_type 無效', async () => {
    // Arrange
    const invalidData = {
      name: '測試範本',
      inquiry_type: 'invalid_type',
    }

    const request = new NextRequest('http://localhost:3000/api/inquiry-templates', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    })

    // Act & Assert
    await expect(POST(request, mockUser)).rejects.toThrow('資料驗證失敗')
  })
})
