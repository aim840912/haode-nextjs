/**
 * InquiryTemplateService 測試
 *
 * 測試詢價範本服務的所有功能:
 * - CRUD 操作 (listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate)
 * - 範本使用 (useTemplate)
 * - 統計資料 (getTemplateStats)
 * - 錯誤處理和驗證
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotFoundError, ValidationError } from '@/lib/errors'
import type {
  CreateInquiryTemplateRequest,
  UpdateInquiryTemplateRequest,
  InquiryTemplateQueryParams,
} from '@/types/inquiry-template'
import { InquiryTemplateService } from './inquiryTemplateService'

// ============================================================================
// Mock Setup
// ============================================================================

const mockSingle = vi.fn()
const mockRange = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockOrder = vi.fn()
const mockFrom = vi.fn()

// 設定鏈式調用結構
const setupMockChains = () => {
  mockSelect.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
  })

  mockEq.mockReturnValue({
    single: mockSingle,
    eq: mockEq,
    order: mockOrder,
  })

  mockOrder.mockReturnValue({
    range: mockRange,
  })

  mockInsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: mockSingle,
    }),
  })

  mockUpdate.mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    }),
  })

  mockDelete.mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  })

  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  })
}

const mockSupabaseClient = {
  from: mockFrom,
}

vi.mock('@/lib/database/supabase-auth', () => ({
  getSupabaseAdmin: vi.fn(() => mockSupabaseClient),
}))

vi.mock('@/lib/logger', () => ({
  dbLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

describe('InquiryTemplateService', () => {
  let service: InquiryTemplateService

  const mockTemplateData = {
    id: 'template-123',
    user_id: 'user-123',
    name: '測試範本',
    description: '測試範本描述',
    inquiry_type: 'product' as const,
    customer_name: '王小明',
    customer_email: 'test@example.com',
    customer_phone: '0912345678',
    delivery_address: '台北市中正區',
    preferred_delivery_date_pattern: null,
    notes: '測試備註',
    items: [
      {
        product_id: 'product-1',
        product_name: '測試產品',
        quantity: 2,
      },
    ],
    activity_title: null,
    visit_date_pattern: null,
    visitor_count: null,
    is_active: true,
    is_favorite: false,
    usage_count: 0,
    last_used_at: null,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setupMockChains()
    service = new InquiryTemplateService()
  })

  // ==========================================================================
  // listTemplates
  // ==========================================================================
  describe('listTemplates', () => {
    it('應該成功取得使用者的範本列表', async () => {
      const mockTemplates = [mockTemplateData]

      mockRange.mockResolvedValueOnce({
        data: mockTemplates,
        error: null,
      })

      const result = await service.listTemplates('user-123')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('template-123')
      expect(result[0].name).toBe('測試範本')
      expect(mockFrom).toHaveBeenCalledWith('inquiry_templates')
    })

    it('應該支援查詢參數過濾', async () => {
      mockRange.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const params: InquiryTemplateQueryParams = {
        inquiry_type: 'product',
        is_active: true,
        is_favorite: true,
        limit: 10,
        offset: 0,
      }

      await service.listTemplates('user-123', params)

      expect(mockEq).toHaveBeenCalled()
      expect(mockOrder).toHaveBeenCalled()
    })

    it('應該處理資料庫查詢錯誤', async () => {
      mockRange.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      await expect(service.listTemplates('user-123')).rejects.toThrow()
    })
  })

  // ==========================================================================
  // getTemplate
  // ==========================================================================
  describe('getTemplate', () => {
    it('應該成功取得單一範本', async () => {
      mockSingle.mockResolvedValueOnce({
        data: mockTemplateData,
        error: null,
      })

      const result = await service.getTemplate('template-123', 'user-123')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('template-123')
      expect(result?.name).toBe('測試範本')
    })

    it('應該返回 null 當範本不存在 (PGRST116)', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await service.getTemplate('non-existent', 'user-123')

      expect(result).toBeNull()
    })

    it('應該處理資料庫查詢錯誤', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      await expect(service.getTemplate('template-123', 'user-123')).rejects.toThrow()
    })
  })

  // ==========================================================================
  // createTemplate
  // ==========================================================================
  describe('createTemplate', () => {
    it('應該成功建立產品詢價範本', async () => {
      const createData: CreateInquiryTemplateRequest = {
        name: '新範本',
        description: '新範本描述',
        inquiry_type: 'product',
        customer_name: '王小明',
        customer_email: 'test@example.com',
        customer_phone: '0912345678',
        items: [
          {
            product_id: 'product-1',
            product_name: '測試產品',
            quantity: 2,
          },
        ],
      }

      mockSingle.mockResolvedValueOnce({
        data: mockTemplateData,
        error: null,
      })

      const result = await service.createTemplate('user-123', createData)

      expect(result.id).toBe('template-123')
      expect(result.name).toBe('測試範本')
      expect(mockInsert).toHaveBeenCalled()
    })

    it('應該成功建立農場參觀範本', async () => {
      const createData: CreateInquiryTemplateRequest = {
        name: '農場參觀範本',
        inquiry_type: 'farm_tour',
        customer_name: '李小華',
        customer_email: 'test2@example.com',
        customer_phone: '0987654321',
        activity_title: '農場參觀',
        visit_date_pattern: null,
        visitor_count: '10',
      }

      const farmTourTemplate = {
        ...mockTemplateData,
        id: 'template-456',
        inquiry_type: 'farm_tour' as const,
        activity_title: '農場參觀',
        visitor_count: '10',
      }

      mockSingle.mockResolvedValueOnce({
        data: farmTourTemplate,
        error: null,
      })

      const result = await service.createTemplate('user-123', createData)

      expect(result.id).toBe('template-456')
      expect(result.inquiry_type).toBe('farm_tour')
      expect(result.activity_title).toBe('農場參觀')
    })

    it('應該在範本名稱為空時拋出 ValidationError', async () => {
      const invalidData: CreateInquiryTemplateRequest = {
        name: '',
        inquiry_type: 'product',
      }

      await expect(service.createTemplate('user-123', invalidData)).rejects.toThrow(ValidationError)
      await expect(service.createTemplate('user-123', invalidData)).rejects.toThrow(
        '範本名稱不能為空'
      )
    })

    it('應該在詢價類型為空時拋出 ValidationError', async () => {
      const invalidData: any = {
        name: '測試範本',
        inquiry_type: '',
      }

      await expect(service.createTemplate('user-123', invalidData)).rejects.toThrow(ValidationError)
      await expect(service.createTemplate('user-123', invalidData)).rejects.toThrow(
        '詢價類型不能為空'
      )
    })

    it('應該處理資料庫插入錯誤', async () => {
      const createData: CreateInquiryTemplateRequest = {
        name: '測試範本',
        inquiry_type: 'product',
      }

      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Insert failed' },
      })

      await expect(service.createTemplate('user-123', createData)).rejects.toThrow()
    })
  })

  // ==========================================================================
  // updateTemplate
  // ==========================================================================
  describe('updateTemplate', () => {
    it('應該成功更新範本', async () => {
      const updateData: UpdateInquiryTemplateRequest = {
        name: '更新後的範本',
        description: '更新後的描述',
      }

      const updatedTemplate = {
        ...mockTemplateData,
        name: '更新後的範本',
        description: '更新後的描述',
      }

      // Mock getTemplate (檢查所有權)
      mockSingle.mockResolvedValueOnce({
        data: mockTemplateData,
        error: null,
      })

      // Mock update
      mockSingle.mockResolvedValueOnce({
        data: updatedTemplate,
        error: null,
      })

      const result = await service.updateTemplate('template-123', 'user-123', updateData)

      expect(result.name).toBe('更新後的範本')
      expect(result.description).toBe('更新後的描述')
    })

    it('應該在範本不存在時拋出 NotFoundError', async () => {
      const updateData: UpdateInquiryTemplateRequest = {
        name: '更新範本',
      }

      // Mock getTemplate 返回 null
      const mockGetTemplateChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      }

      mockSelect.mockReturnValueOnce(mockGetTemplateChain)

      await expect(service.updateTemplate('non-existent', 'user-123', updateData)).rejects.toThrow(
        NotFoundError
      )
      await expect(service.updateTemplate('non-existent', 'user-123', updateData)).rejects.toThrow(
        '範本不存在或無權限修改'
      )
    })

    it('應該處理資料庫更新錯誤', async () => {
      const updateData: UpdateInquiryTemplateRequest = {
        name: '更新範本',
      }

      // Mock getTemplate 成功
      mockSingle.mockResolvedValueOnce({
        data: mockTemplateData,
        error: null,
      })

      // Mock update 失敗
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Update failed' },
      })

      await expect(service.updateTemplate('template-123', 'user-123', updateData)).rejects.toThrow()
    })
  })

  // ==========================================================================
  // deleteTemplate
  // ==========================================================================
  describe('deleteTemplate', () => {
    it('應該成功刪除範本', async () => {
      // Mock getTemplate (檢查所有權)
      mockSingle.mockResolvedValueOnce({
        data: mockTemplateData,
        error: null,
      })

      await expect(service.deleteTemplate('template-123', 'user-123')).resolves.toBeUndefined()
    })

    it('應該在範本不存在時拋出 NotFoundError', async () => {
      // Mock getTemplate 返回 null
      const mockGetTemplateChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      }

      mockSelect.mockReturnValueOnce(mockGetTemplateChain)

      await expect(service.deleteTemplate('non-existent', 'user-123')).rejects.toThrow(
        NotFoundError
      )
      await expect(service.deleteTemplate('non-existent', 'user-123')).rejects.toThrow(
        '範本不存在或無權限刪除'
      )
    })
  })

  // ==========================================================================
  // useTemplate
  // ==========================================================================
  describe('useTemplate', () => {
    it('應該成功使用產品詢價範本並增加使用次數', async () => {
      // Mock getTemplate
      mockSingle.mockResolvedValueOnce({
        data: mockTemplateData,
        error: null,
      })

      const result = await service.useTemplate('template-123', 'user-123')

      expect(result.customer_name).toBe('王小明')
      expect(result.customer_email).toBe('test@example.com')
      expect(result.inquiry_type).toBe('product')
      expect(result.items).toHaveLength(1)
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('應該成功使用農場參觀範本', async () => {
      const farmTourTemplate = {
        ...mockTemplateData,
        inquiry_type: 'farm_tour' as const,
        activity_title: '農場參觀',
        visit_date_pattern: null,
        visitor_count: '10',
      }

      // Mock getTemplate
      mockSingle.mockResolvedValueOnce({
        data: farmTourTemplate,
        error: null,
      })

      const result = await service.useTemplate('template-456', 'user-123')

      expect(result.inquiry_type).toBe('farm_tour')
      expect(result.activity_title).toBe('農場參觀')
      expect(result.visitor_count).toBe('10')
      expect(result.visit_date).toBe('') // 日期需要使用者手動填入
    })

    it('應該在範本不存在時拋出 NotFoundError', async () => {
      // Mock getTemplate 返回 null
      const mockGetTemplateChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      }

      mockSelect.mockReturnValueOnce(mockGetTemplateChain)

      await expect(service.useTemplate('non-existent', 'user-123')).rejects.toThrow(NotFoundError)
      await expect(service.useTemplate('non-existent', 'user-123')).rejects.toThrow(
        '範本不存在或無權限使用'
      )
    })
  })

  // ==========================================================================
  // getTemplateStats
  // ==========================================================================
  describe('getTemplateStats', () => {
    it('應該成功取得範本統計資料', async () => {
      const mockStats = {
        user_id: 'user-123',
        total_templates: 5,
        active_templates: 4,
        favorite_templates: 2,
        total_usage_count: 15,
        avg_usage_count: 3,
        last_template_used_at: '2025-01-15T10:00:00Z',
        newest_template_created_at: '2025-01-14T10:00:00Z',
      }

      mockSingle.mockResolvedValueOnce({
        data: mockStats,
        error: null,
      })

      const result = await service.getTemplateStats('user-123')

      expect(result).not.toBeNull()
      expect(result?.total_templates).toBe(5)
      expect(result?.active_templates).toBe(4)
      expect(result?.favorite_templates).toBe(2)
    })

    it('應該返回 null 當使用者沒有任何範本 (PGRST116)', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await service.getTemplateStats('user-123')

      expect(result).toBeNull()
    })

    it('應該處理資料庫查詢錯誤', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      await expect(service.getTemplateStats('user-123')).rejects.toThrow()
    })
  })
})
