/**
 * ScheduleServiceSimple 測試套件
 *
 * 測試範圍：
 * - Query Methods: getSchedule(), getScheduleById()
 * - Command Methods: addSchedule(), updateSchedule(), deleteSchedule()
 * - Data Transformation: transformToScheduleItem(), transformToInsertData()
 * - Error Handling: ValidationError, NotFoundError, DatabaseError
 * - Health Check: getHealthStatus()
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScheduleServiceSimple } from './scheduleServiceSimple'
import type { ScheduleItem } from '@/types/schedule'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

const {
  mockSupabaseClient,
  mockSupabaseAdminClient,
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

  // Chain methods
  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle, order: mockOrder, limit: mockLimit })
  mockEq.mockReturnValue({ single: mockSingle, select: mockSelect })
  mockOrder.mockReturnValue({ eq: mockEq })
  mockInsert.mockReturnValue({ select: mockSelect })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockDelete.mockReturnValue({ eq: mockEq })

  const mockSupabaseClient = { from: mockFrom }
  const mockSupabaseAdminClient = { from: mockFrom }

  return {
    mockSupabaseClient,
    mockSupabaseAdminClient,
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

// Mock Supabase clients
vi.mock('@/lib/database/supabase-server', () => ({
  createServiceSupabaseClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('@/lib/database/supabase-auth', () => ({
  getSupabaseAdmin: vi.fn(() => mockSupabaseAdminClient),
}))

// Mock logger to avoid console output
vi.mock('@/lib/logger', () => ({
  dbLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// ============================================================================
// Test Data
// ============================================================================

const mockScheduleRecord = {
  id: 'schedule-123',
  title: '台中逢甲夜市擺攤',
  location: '台中市西屯區逢甲路',
  date: '2025-12-01',
  time: '18:00-22:00',
  status: 'upcoming',
  products: ['有機高山茶', '蜜香紅茶', '烏龍茶'],
  description: '逢甲夜市週末市集',
  contact: '0912-345-678',
  special_offer: '買二送一',
  weather_note: '注意防曬',
  created_at: '2025-11-01T00:00:00Z',
  updated_at: '2025-11-01T00:00:00Z',
}

const mockScheduleItem: ScheduleItem = {
  id: 'schedule-123',
  title: '台中逢甲夜市擺攤',
  location: '台中市西屯區逢甲路',
  date: '2025-12-01',
  time: '18:00-22:00',
  status: 'upcoming',
  products: ['有機高山茶', '蜜香紅茶', '烏龍茶'],
  description: '逢甲夜市週末市集',
  contact: '0912-345-678',
  specialOffer: '買二送一',
  weatherNote: '注意防曬',
  createdAt: '2025-11-01T00:00:00Z',
  updatedAt: '2025-11-01T00:00:00Z',
}

// ============================================================================
// Test Suite
// ============================================================================

describe('ScheduleServiceSimple', () => {
  let service: ScheduleServiceSimple

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ScheduleServiceSimple()
  })

  // ==========================================================================
  // Query Methods
  // ==========================================================================

  describe('getSchedule', () => {
    it('應該成功取得所有排程並按日期排序', async () => {
      const schedules = [mockScheduleRecord]
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ order: mockOrder })
      mockOrder.mockResolvedValue({ data: schedules, error: null })

      const result = await service.getSchedule()

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: mockScheduleItem.id,
        title: mockScheduleItem.title,
        location: mockScheduleItem.location,
      })
      expect(mockFrom).toHaveBeenCalledWith('schedule')
      expect(mockOrder).toHaveBeenCalledWith('date', { ascending: true })
    })

    it('應該返回空陣列當沒有排程時', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ order: mockOrder })
      mockOrder.mockResolvedValue({ data: [], error: null })

      const result = await service.getSchedule()

      expect(result).toEqual([])
    })

    it('應該拋出錯誤當資料庫查詢失敗', async () => {
      const dbError = { code: 'PGRST301', message: 'Database error' }
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ order: mockOrder })
      mockOrder.mockResolvedValue({ data: null, error: dbError })

      await expect(service.getSchedule()).rejects.toThrow()
    })
  })

  describe('getScheduleById', () => {
    it('應該成功根據 ID 取得排程', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: mockScheduleRecord, error: null })

      const result = await service.getScheduleById('schedule-123')

      expect(result).toMatchObject({
        id: mockScheduleItem.id,
        title: mockScheduleItem.title,
      })
      expect(mockEq).toHaveBeenCalledWith('id', 'schedule-123')
    })

    it('應該返回 null 當排程不存在', async () => {
      const notFoundError = { code: 'PGRST116', message: 'Not found' }
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: null, error: notFoundError })

      const result = await service.getScheduleById('non-existent-id')

      expect(result).toBeNull()
    })

    it('應該拋出 ValidationError 當 ID 為空', async () => {
      await expect(service.getScheduleById('')).rejects.toThrow('排程 ID 不能為空')
    })
  })

  // ==========================================================================
  // Command Methods - Create
  // ==========================================================================

  describe('addSchedule', () => {
    const newScheduleData = {
      title: '台北士林夜市擺攤',
      location: '台北市士林區',
      date: '2025-12-15',
      time: '17:00-21:00',
      status: 'upcoming' as const,
      products: ['高山烏龍茶'],
      description: '士林夜市假日市集',
      contact: '0912-345-678',
    }

    it('應該成功新增排程', async () => {
      mockFrom.mockReturnValue({ insert: mockInsert })
      mockInsert.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: mockScheduleRecord, error: null })

      const result = await service.addSchedule(newScheduleData)

      expect(result).toMatchObject({
        title: mockScheduleItem.title,
        location: mockScheduleItem.location,
      })
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          title: newScheduleData.title,
          location: newScheduleData.location,
          date: newScheduleData.date,
        }),
      ])
    })

    it('應該拋出 ValidationError 當標題為空', async () => {
      await expect(service.addSchedule({ ...newScheduleData, title: '' })).rejects.toThrow(
        '標題不能為空'
      )
    })

    it('應該拋出 ValidationError 當地點為空', async () => {
      await expect(service.addSchedule({ ...newScheduleData, location: '' })).rejects.toThrow(
        '地點不能為空'
      )
    })

    it('應該拋出 ValidationError 當日期為空', async () => {
      await expect(service.addSchedule({ ...newScheduleData, date: '' })).rejects.toThrow(
        '日期不能為空'
      )
    })

    it('應該正確轉換 specialOffer 和 weatherNote', async () => {
      const dataWithOptionalFields = {
        ...newScheduleData,
        specialOffer: '限時優惠',
        weatherNote: '記得帶傘',
      }

      mockFrom.mockReturnValue({ insert: mockInsert })
      mockInsert.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: mockScheduleRecord, error: null })

      await service.addSchedule(dataWithOptionalFields)

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          special_offer: '限時優惠',
          weather_note: '記得帶傘',
        }),
      ])
    })
  })

  // ==========================================================================
  // Command Methods - Update
  // ==========================================================================

  describe('updateSchedule', () => {
    it('應該成功更新排程', async () => {
      const updateData = { title: '更新後的標題', status: 'ongoing' as const }

      mockFrom.mockReturnValue({ update: mockUpdate })
      mockUpdate.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({
        data: { ...mockScheduleRecord, ...updateData },
        error: null,
      })

      const result = await service.updateSchedule('schedule-123', updateData)

      expect(result.title).toBe('更新後的標題')
      expect(result.status).toBe('ongoing')
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '更新後的標題',
          status: 'ongoing',
        })
      )
    })

    it('應該拋出 ValidationError 當 ID 為空', async () => {
      await expect(service.updateSchedule('', { title: '新標題' })).rejects.toThrow(
        '排程 ID 不能為空'
      )
    })

    it('應該拋出 NotFoundError 當排程不存在', async () => {
      mockFrom.mockReturnValue({ update: mockUpdate })
      mockUpdate.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: null, error: null })

      await expect(service.updateSchedule('non-existent-id', { title: '新標題' })).rejects.toThrow(
        '排程 non-existent-id 不存在'
      )
    })

    it('應該只更新提供的欄位', async () => {
      const partialUpdate = { status: 'completed' as const }

      mockFrom.mockReturnValue({ update: mockUpdate })
      mockUpdate.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: mockScheduleRecord, error: null })

      await service.updateSchedule('schedule-123', partialUpdate)

      expect(mockUpdate).toHaveBeenCalledWith({ status: 'completed' })
    })
  })

  // ==========================================================================
  // Command Methods - Delete
  // ==========================================================================

  describe('deleteSchedule', () => {
    it('應該成功刪除排程', async () => {
      mockFrom.mockReturnValue({ delete: mockDelete })
      mockDelete.mockReturnValue({ eq: mockEq })
      mockEq.mockResolvedValue({ error: null })

      await service.deleteSchedule('schedule-123')

      expect(mockFrom).toHaveBeenCalledWith('schedule')
      expect(mockEq).toHaveBeenCalledWith('id', 'schedule-123')
    })

    it('應該拋出 ValidationError 當 ID 為空', async () => {
      await expect(service.deleteSchedule('')).rejects.toThrow('排程 ID 不能為空')
    })

    it('應該拋出錯誤當資料庫刪除失敗', async () => {
      const dbError = { code: 'PGRST301', message: 'Database error' }
      mockFrom.mockReturnValue({ delete: mockDelete })
      mockDelete.mockReturnValue({ eq: mockEq })
      mockEq.mockResolvedValue({ error: dbError })

      await expect(service.deleteSchedule('schedule-123')).rejects.toThrow()
    })
  })

  // ==========================================================================
  // Data Transformation
  // ==========================================================================

  describe('Data Transformation', () => {
    it('應該正確轉換資料庫記錄為 ScheduleItem (camelCase)', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: mockScheduleRecord, error: null })

      const result = await service.getScheduleById('schedule-123')

      expect(result).toMatchObject({
        specialOffer: mockScheduleRecord.special_offer,
        weatherNote: mockScheduleRecord.weather_note,
        createdAt: mockScheduleRecord.created_at,
        updatedAt: mockScheduleRecord.updated_at,
      })
    })

    it('應該處理 null 值轉換為空字串或 undefined', async () => {
      const recordWithNulls = {
        ...mockScheduleRecord,
        time: null,
        description: null,
        contact: null,
        special_offer: null,
        weather_note: null,
      }

      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: recordWithNulls, error: null })

      const result = await service.getScheduleById('schedule-123')

      expect(result?.time).toBe('')
      expect(result?.description).toBe('')
      expect(result?.contact).toBe('')
      expect(result?.specialOffer).toBeUndefined()
      expect(result?.weatherNote).toBeUndefined()
    })

    it('應該處理無效的 status 值並預設為 upcoming', async () => {
      const recordWithInvalidStatus = {
        ...mockScheduleRecord,
        status: 'invalid-status',
      }

      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: recordWithInvalidStatus, error: null })

      const result = await service.getScheduleById('schedule-123')

      expect(result?.status).toBe('upcoming')
    })

    it('應該處理非陣列的 products 並轉換為空陣列', async () => {
      const recordWithInvalidProducts = {
        ...mockScheduleRecord,
        products: 'not-an-array',
      }

      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: recordWithInvalidProducts, error: null })

      const result = await service.getScheduleById('schedule-123')

      expect(result?.products).toEqual([])
    })
  })

  // ==========================================================================
  // Health Check
  // ==========================================================================

  describe('getHealthStatus', () => {
    it('應該返回 healthy 狀態當資料庫連線正常', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ limit: mockLimit })
      mockLimit.mockResolvedValue({ data: [], error: null })

      const result = await service.getHealthStatus()

      expect(result.status).toBe('healthy')
      expect(result.details).toMatchObject({
        module: 'ScheduleService',
        version: 'v2-simple',
        databaseConnected: true,
      })
    })

    it('應該返回 unhealthy 狀態當資料庫連線失敗', async () => {
      const dbError = { message: 'Connection failed' }
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ limit: mockLimit })
      mockLimit.mockResolvedValue({ data: null, error: dbError })

      const result = await service.getHealthStatus()

      expect(result.status).toBe('unhealthy')
      expect(result.details).toHaveProperty('error')
    })
  })
})
