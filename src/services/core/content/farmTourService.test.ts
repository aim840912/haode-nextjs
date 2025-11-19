/**
 * FarmTourService 測試套件
 *
 * 測試覆蓋:
 * - Query Methods: getAll(), getById()
 * - Command Methods: create(), update(), delete()
 * - Data Transformation: snake_case ↔ camelCase
 * - Validation: title validation
 * - Health Check: getHealthStatus()
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ValidationError, NotFoundError, DatabaseError } from '@/lib/errors'
import { FarmTourService } from './farmTourService'

// ==========================================================================
// Mock Setup
// ==========================================================================

const {
  mockSupabaseAdmin,
  mockFrom,
  mockSelect,
  mockEq,
  mockSingle,
  mockOrder,
  mockInsert,
  mockUpdate,
  mockDelete,
  mockLimit,
} = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockOrder = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockDelete = vi.fn()
  const mockLimit = vi.fn()
  const mockFrom = vi.fn()

  // 設定 mock 鏈
  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle, order: mockOrder, limit: mockLimit })
  mockEq.mockReturnValue({ single: mockSingle, select: mockSelect })
  mockOrder.mockReturnValue({ eq: mockEq, single: mockSingle })
  mockInsert.mockReturnValue({ select: mockSelect })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockDelete.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  })

  const mockSupabaseAdmin = {
    from: mockFrom,
  }

  return {
    mockSupabaseAdmin,
    mockFrom,
    mockSelect,
    mockEq,
    mockSingle,
    mockOrder,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockLimit,
  }
})

// Mock Supabase
vi.mock('@/lib/database/supabase-auth', () => ({
  getSupabaseAdmin: vi.fn(() => mockSupabaseAdmin),
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  dbLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    timer: vi.fn(() => ({
      end: vi.fn(),
    })),
  },
}))

// Mock UnifiedImageService
vi.mock('@/services/infrastructure/unified-image-service', () => ({
  UnifiedImageService: vi.fn(() => ({
    deleteEntityImages: vi.fn().mockResolvedValue(0),
  })),
}))

// ==========================================================================
// Test Data
// ==========================================================================

const mockFarmTourRecord = {
  id: 'tour-123',
  title: '採草莓體驗',
  start_month: 12,
  end_month: 4,
  price: 300,
  activities: ['採草莓', '品嚐草莓'],
  note: '需提前預約',
  image: '/images/strawberry.jpg',
  available: true,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
}

describe('FarmTourService', () => {
  let service: FarmTourService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new FarmTourService()
  })

  // ==========================================================================
  // Query Methods
  // ==========================================================================

  describe('getAll', () => {
    it('應該成功取得所有農場體驗活動並按建立時間排序', async () => {
      const mockRecords = [mockFarmTourRecord]

      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ order: mockOrder })
      mockOrder.mockResolvedValue({ data: mockRecords, error: null })

      const result = await service.getAll()

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'tour-123',
        title: '採草莓體驗',
        start_month: 12,
        end_month: 4,
        price: 300,
        activities: ['採草莓', '品嚐草莓'],
      })
      expect(mockFrom).toHaveBeenCalledWith('farm_tour')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('應該返回空陣列當沒有活動時', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ order: mockOrder })
      mockOrder.mockResolvedValue({ data: [], error: null })

      const result = await service.getAll()

      expect(result).toEqual([])
    })

    it('應該拋出錯誤當資料庫查詢失敗', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ order: mockOrder })
      mockOrder.mockResolvedValue({ data: null, error: { message: 'DB Error' } })

      await expect(service.getAll()).rejects.toThrow(DatabaseError)
    })
  })

  describe('getById', () => {
    it('應該成功根據 ID 取得農場體驗活動', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: mockFarmTourRecord, error: null })

      const result = await service.getById('tour-123')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('tour-123')
      expect(result?.title).toBe('採草莓體驗')
      expect(mockEq).toHaveBeenCalledWith('id', 'tour-123')
    })

    it('應該返回 null 當活動不存在 (PGRST116)', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })

      const result = await service.getById('non-existent-id')

      expect(result).toBeNull()
    })

    it('應該拋出錯誤當資料庫查詢失敗', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: null, error: { message: 'DB Error' } })

      await expect(service.getById('tour-123')).rejects.toThrow(DatabaseError)
    })
  })

  // ==========================================================================
  // Command Methods - Create
  // ==========================================================================

  describe('create', () => {
    it('應該成功建立新的農場體驗活動', async () => {
      const newActivity = {
        id: 'new-tour',
        title: '採番茄體驗',
        start_month: 5,
        end_month: 9,
        price: 250,
        activities: ['採番茄'],
        note: '',
        image: '/images/tomato.jpg',
        available: true,
      }

      mockFrom.mockReturnValue({ insert: mockInsert })
      mockInsert.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({
        data: {
          ...newActivity,
          created_at: '2025-01-16T00:00:00.000Z',
          updated_at: '2025-01-16T00:00:00.000Z',
        },
        error: null,
      })

      const result = await service.create(newActivity)

      expect(result.id).toBe('new-tour')
      expect(result.title).toBe('採番茄體驗')
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'new-tour',
          title: '採番茄體驗',
          start_month: 5,
          end_month: 9,
        }),
      ])
    })

    it('應該拋出 ValidationError 當標題為空', async () => {
      const invalidActivity = {
        id: 'test-id',
        title: '',
        start_month: 5,
        end_month: 9,
        price: 0,
        activities: [],
        note: '',
        image: '',
        available: true,
      }

      await expect(service.create(invalidActivity)).rejects.toThrow('活動標題不能為空')
    })

    it('應該拋出 ValidationError 當標題只有空白', async () => {
      const invalidActivity = {
        id: 'test-id',
        title: '   ',
        start_month: 5,
        end_month: 9,
        price: 0,
        activities: [],
        note: '',
        image: '',
        available: true,
      }

      await expect(service.create(invalidActivity)).rejects.toThrow('活動標題不能為空')
    })

    it('應該正確處理選填欄位預設值', async () => {
      const minimalActivity = {
        title: '最小活動',
        start_month: 1,
        end_month: 12,
        image: '/image.jpg',
        available: true,
      }

      mockFrom.mockReturnValue({ insert: mockInsert })
      mockInsert.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({
        data: {
          ...minimalActivity,
          price: 0,
          activities: [],
          note: '',
          created_at: '2025-01-16T00:00:00.000Z',
          updated_at: '2025-01-16T00:00:00.000Z',
        },
        error: null,
      })

      const result = await service.create(minimalActivity as any)

      expect(result.price).toBe(0)
      expect(result.activities).toEqual([])
      expect(result.note).toBe('')
    })

    it('應該拋出錯誤當資料庫插入失敗', async () => {
      const newActivity = {
        id: 'test-id',
        title: '測試活動',
        start_month: 1,
        end_month: 12,
        price: 0,
        activities: [],
        note: '',
        image: '',
        available: true,
      }

      mockFrom.mockReturnValue({ insert: mockInsert })
      mockInsert.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Insert failed' } })

      await expect(service.create(newActivity)).rejects.toThrow(DatabaseError)
    })
  })

  // ==========================================================================
  // Command Methods - Update
  // ==========================================================================

  describe('update', () => {
    it('應該成功更新農場體驗活動', async () => {
      // Mock getById (內部調用)
      mockFrom
        .mockReturnValueOnce({ select: mockSelect }) // getById
        .mockReturnValueOnce({ update: mockUpdate }) // update

      mockSelect
        .mockReturnValueOnce({ eq: mockEq }) // getById 的 select
        .mockReturnValueOnce({ single: mockSingle }) // update 的 select

      mockEq
        .mockReturnValueOnce({ single: mockSingle }) // getById 的 eq
        .mockReturnValueOnce({ select: mockSelect }) // update 的 eq

      mockSingle
        .mockResolvedValueOnce({ data: mockFarmTourRecord, error: null }) // getById
        .mockResolvedValueOnce({
          data: { ...mockFarmTourRecord, title: '新標題' },
          error: null,
        }) // update select

      mockUpdate.mockReturnValue({ eq: mockEq })

      const result = await service.update('tour-123', { title: '新標題' })

      expect(result).not.toBeNull()
      expect(result?.title).toBe('新標題')
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '新標題',
          updated_at: expect.any(String),
        })
      )
    })

    it('應該拋出 NotFoundError 當活動不存在', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })

      await expect(service.update('non-existent-id', { title: '新標題' })).rejects.toThrow(
        '找不到 ID 為 non-existent-id 的農場體驗活動'
      )
    })

    it('應該只更新提供的欄位', async () => {
      const partialUpdate = { price: 500 }

      mockFrom
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate })

      mockSelect.mockReturnValueOnce({ eq: mockEq }).mockReturnValueOnce({ single: mockSingle })

      mockEq.mockReturnValueOnce({ single: mockSingle }).mockReturnValueOnce({ select: mockSelect })

      mockSingle
        .mockResolvedValueOnce({ data: mockFarmTourRecord, error: null })
        .mockResolvedValueOnce({
          data: { ...mockFarmTourRecord, price: 500 },
          error: null,
        })

      mockUpdate.mockReturnValue({ eq: mockEq })

      const result = await service.update('tour-123', partialUpdate)

      expect(result?.price).toBe(500)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          price: 500,
          updated_at: expect.any(String),
        })
      )
    })

    it('應該拋出錯誤當資料庫更新失敗', async () => {
      mockFrom
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate })

      mockSelect.mockReturnValueOnce({ eq: mockEq }).mockReturnValueOnce({ single: mockSingle })

      mockEq.mockReturnValueOnce({ single: mockSingle }).mockReturnValueOnce({ select: mockSelect })

      mockSingle
        .mockResolvedValueOnce({ data: mockFarmTourRecord, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Update failed' } })

      mockUpdate.mockReturnValue({ eq: mockEq })

      await expect(service.update('tour-123', { title: '新標題' })).rejects.toThrow(DatabaseError)
    })
  })

  // ==========================================================================
  // Command Methods - Delete
  // ==========================================================================

  describe('delete', () => {
    it('應該成功刪除農場體驗活動', async () => {
      // Mock getById (內部調用)
      mockFrom
        .mockReturnValueOnce({ select: mockSelect }) // getById
        .mockReturnValueOnce({ delete: mockDelete }) // delete

      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq
        .mockReturnValueOnce({ single: mockSingle }) // getById 的 eq
        .mockResolvedValueOnce({ error: null }) // delete 的 eq

      mockSingle.mockResolvedValue({ data: mockFarmTourRecord, error: null })
      mockDelete.mockReturnValue({ eq: mockEq })

      const result = await service.delete('tour-123')

      expect(result).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith('farm_tour')
      expect(mockEq).toHaveBeenCalledWith('id', 'tour-123')
    })

    it('應該拋出 NotFoundError 當活動不存在', async () => {
      mockFrom.mockReturnValueOnce({ select: mockSelect })
      mockSelect.mockReturnValueOnce({ eq: mockEq })
      mockEq.mockReturnValueOnce({ single: mockSingle })
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })

      await expect(service.delete('non-existent-id')).rejects.toThrow(
        '找不到 ID 為 non-existent-id 的農場體驗活動'
      )
    })

    it('應該拋出錯誤當資料庫刪除失敗', async () => {
      mockFrom
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ delete: mockDelete })

      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq
        .mockReturnValueOnce({ single: mockSingle })
        .mockResolvedValueOnce({ error: { message: 'Delete failed' } })

      mockSingle.mockResolvedValue({ data: mockFarmTourRecord, error: null })
      mockDelete.mockReturnValue({ eq: mockEq })

      await expect(service.delete('tour-123')).rejects.toThrow(DatabaseError)
    })
  })

  // ==========================================================================
  // Data Transformation
  // ==========================================================================

  describe('Data Transformation', () => {
    it('應該正確轉換資料庫記錄為 FarmTourActivity (camelCase)', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: mockFarmTourRecord, error: null })

      const result = await service.getById('tour-123')

      expect(result).toMatchObject({
        id: 'tour-123',
        title: '採草莓體驗',
        start_month: 12,
        end_month: 4,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      })
    })

    it('應該正確處理 activities 陣列', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: mockFarmTourRecord, error: null })

      const result = await service.getById('tour-123')

      expect(result?.activities).toEqual(['採草莓', '品嚐草莓'])
      expect(Array.isArray(result?.activities)).toBe(true)
    })

    it('應該正確處理空值和預設值', async () => {
      const recordWithNulls = {
        ...mockFarmTourRecord,
        price: null,
        activities: null,
        note: null,
      }

      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: recordWithNulls, error: null })

      const result = await service.getById('tour-123')

      expect(result?.price).toBe(0)
      expect(result?.activities).toEqual([])
      expect(result?.note).toBe('')
    })
  })

  // ==========================================================================
  // Health Check
  // ==========================================================================

  describe('getHealthStatus', () => {
    it('應該返回 healthy 狀態當資料庫連線正常', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ limit: mockLimit })
      mockLimit.mockResolvedValue({ error: null })

      const result = await service.getHealthStatus()

      expect(result.status).toBe('healthy')
      expect(result.details.databaseConnected).toBe(true)
      expect(result.details.tableName).toBe('farm_tour')
      expect(result.timestamp).toBeDefined()
    })

    it('應該返回 unhealthy 狀態當資料庫連線失敗', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ limit: mockLimit })
      mockLimit.mockResolvedValue({ error: { message: 'Connection failed' } })

      const result = await service.getHealthStatus()

      expect(result.status).toBe('unhealthy')
      expect(result.details.databaseConnected).toBe(false)
      expect(result.details.error).toBeDefined()
    })
  })
})
