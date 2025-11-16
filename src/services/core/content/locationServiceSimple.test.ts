/**
 * LocationServiceSimple 測試套件
 *
 * 測試範圍：
 * - Query Methods: getLocations(), getLocationById()
 * - Command Methods: addLocation(), updateLocation(), deleteLocation()
 * - Data Transformation: transformFromDB(), transformToDB()
 * - Validation: validatePhoneNumber()
 * - Error Handling: ValidationError, NotFoundError, DatabaseError
 * - Health Check: getHealthStatus()
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LocationServiceSimple } from './locationServiceSimple'
import type { Location } from '@/types/location'

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

// Mock logger
vi.mock('@/lib/logger', () => ({
  dbLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock UnifiedImageService
vi.mock('@/services/infrastructure/unified-image-service', () => ({
  UnifiedImageService: {
    getInstance: vi.fn(() => ({
      validateImageUrl: vi.fn(),
    })),
  },
}))

// ============================================================================
// Test Data
// ============================================================================

const mockLocationRecord = {
  id: 'location-123',
  name: 'haude-main',
  title: '豪德製茶所總店',
  address: '嘉義縣梅山鄉太和村一鄰八號',
  landmark: '太和風景區入口',
  phone: '05-2561843',
  line_id: '@haudetea',
  hours: '08:00-18:00',
  closed_days: '週一',
  parking: '免費停車場',
  public_transport: '搭乘公車至太和站',
  features: ['有機認證', '現場試飲', '產地導覽'],
  specialties: ['高山烏龍茶', '蜜香紅茶'],
  coordinates: {
    lat: 23.5833,
    lng: 120.6833,
  },
  image: '/images/locations/main-store.jpg',
  is_main: true,
  created_at: '2025-11-01T00:00:00Z',
  updated_at: '2025-11-01T00:00:00Z',
}

const mockLocation: Location = {
  id: 'location-123',
  name: 'haude-main',
  title: '豪德製茶所總店',
  address: '嘉義縣梅山鄉太和村一鄰八號',
  landmark: '太和風景區入口',
  phone: '05-2561843',
  lineId: '@haudetea',
  hours: '08:00-18:00',
  closedDays: '週一',
  parking: '免費停車場',
  publicTransport: '搭乘公車至太和站',
  features: ['有機認證', '現場試飲', '產地導覽'],
  specialties: ['高山烏龍茶', '蜜香紅茶'],
  coordinates: {
    lat: 23.5833,
    lng: 120.6833,
  },
  image: '/images/locations/main-store.jpg',
  isMain: true,
  createdAt: '2025-11-01T00:00:00Z',
  updatedAt: '2025-11-01T00:00:00Z',
}

// ============================================================================
// Test Suite
// ============================================================================

describe('LocationServiceSimple', () => {
  let service: LocationServiceSimple

  beforeEach(() => {
    vi.clearAllMocks()
    service = new LocationServiceSimple()
  })

  // ==========================================================================
  // Query Methods
  // ==========================================================================

  describe('getLocations', () => {
    it('應該成功取得所有地點並按建立時間排序', async () => {
      const locations = [mockLocationRecord]
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ order: mockOrder })
      mockOrder.mockResolvedValue({ data: locations, error: null })

      const result = await service.getLocations()

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: mockLocation.id,
        title: mockLocation.title,
        address: mockLocation.address,
      })
      expect(mockFrom).toHaveBeenCalledWith('locations')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true })
    })

    it('應該返回空陣列當沒有地點時', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ order: mockOrder })
      mockOrder.mockResolvedValue({ data: [], error: null })

      const result = await service.getLocations()

      expect(result).toEqual([])
    })

    it('應該拋出錯誤當資料庫查詢失敗', async () => {
      const dbError = { code: 'PGRST301', message: 'Database error' }
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ order: mockOrder })
      mockOrder.mockResolvedValue({ data: null, error: dbError })

      await expect(service.getLocations()).rejects.toThrow()
    })
  })

  describe('getLocationById', () => {
    it('應該成功根據 ID 取得地點', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: mockLocationRecord, error: null })

      const result = await service.getLocationById('location-123')

      expect(result).toMatchObject({
        id: mockLocation.id,
        title: mockLocation.title,
      })
      expect(mockEq).toHaveBeenCalledWith('id', 'location-123')
    })

    it('應該返回 null 當地點不存在', async () => {
      const notFoundError = { code: 'PGRST116', message: 'Not found' }
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: null, error: notFoundError })

      const result = await service.getLocationById('non-existent-id')

      expect(result).toBeNull()
    })

    it('應該拋出 ValidationError 當 ID 為空', async () => {
      await expect(service.getLocationById('')).rejects.toThrow('地點 ID 必須為非空字串')
    })
  })

  // ==========================================================================
  // Command Methods - Create
  // ==========================================================================

  describe('addLocation', () => {
    const newLocationData = {
      name: 'haude-branch',
      title: '豪德製茶所分店',
      address: '台中市西屯區逢甲路',
      landmark: '逢甲夜市旁',
      phone: '04-12345678',
      lineId: '@haudetea2',
      hours: '10:00-20:00',
      closedDays: '無',
      parking: '路邊停車',
      publicTransport: '搭乘公車至逢甲站',
      features: ['現場試飲'],
      specialties: ['烏龍茶'],
      coordinates: {
        lat: 24.1833,
        lng: 120.6333,
      },
      image: '/images/locations/branch.jpg',
      isMain: false,
    }

    it('應該成功新增地點', async () => {
      mockFrom.mockReturnValue({ insert: mockInsert })
      mockInsert.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: mockLocationRecord, error: null })

      const result = await service.addLocation(newLocationData)

      expect(result).toMatchObject({
        title: mockLocation.title,
        address: mockLocation.address,
      })
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          name: newLocationData.name,
          title: newLocationData.title,
          address: newLocationData.address,
        }),
      ])
    })

    it('應該拋出 ValidationError 當名稱為空', async () => {
      await expect(service.addLocation({ ...newLocationData, name: '' })).rejects.toThrow(
        '地點名稱不能為空'
      )
    })

    it('應該拋出 ValidationError 當地址為空', async () => {
      await expect(service.addLocation({ ...newLocationData, address: '' })).rejects.toThrow(
        '地址不能為空'
      )
    })

    it('應該拋出 ValidationError 當電話為空', async () => {
      await expect(service.addLocation({ ...newLocationData, phone: '' })).rejects.toThrow(
        '電話號碼不能為空'
      )
    })

    it('應該拋出 ValidationError 當電話過長', async () => {
      const longPhone = '1'.repeat(21)
      await expect(service.addLocation({ ...newLocationData, phone: longPhone })).rejects.toThrow(
        '電話號碼過長'
      )
    })

    it('應該拋出 ValidationError 當電話過短', async () => {
      await expect(service.addLocation({ ...newLocationData, phone: '123' })).rejects.toThrow(
        '電話號碼過短'
      )
    })

    it('應該拋出 ValidationError 當電話格式不正確', async () => {
      await expect(
        service.addLocation({ ...newLocationData, phone: 'invalid-phone' })
      ).rejects.toThrow('電話號碼格式不正確')
    })

    it('應該正確轉換 snake_case 欄位', async () => {
      const dataWithCamelCase = {
        ...newLocationData,
        lineId: '@test',
        closedDays: '週二',
        publicTransport: '公車',
        isMain: true,
      }

      mockFrom.mockReturnValue({ insert: mockInsert })
      mockInsert.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: mockLocationRecord, error: null })

      await service.addLocation(dataWithCamelCase)

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          line_id: '@test',
          closed_days: '週二',
          public_transport: '公車',
          is_main: true,
        }),
      ])
    })
  })

  // ==========================================================================
  // Command Methods - Update
  // ==========================================================================

  describe('updateLocation', () => {
    it('應該成功更新地點', async () => {
      const updateData = { title: '更新後的標題', phone: '04-87654321' }

      mockFrom.mockReturnValue({ update: mockUpdate })
      mockUpdate.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({
        data: { ...mockLocationRecord, ...updateData },
        error: null,
      })

      const result = await service.updateLocation('location-123', updateData)

      expect(result.title).toBe('更新後的標題')
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '更新後的標題',
          phone: '04-87654321',
        })
      )
    })

    it('應該拋出 ValidationError 當 ID 為空', async () => {
      await expect(service.updateLocation('', { title: '新標題' })).rejects.toThrow(
        '地點 ID 必須為非空字串'
      )
    })

    it('應該拋出 NotFoundError 當地點不存在', async () => {
      mockFrom.mockReturnValue({ update: mockUpdate })
      mockUpdate.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: null, error: null })

      await expect(service.updateLocation('non-existent-id', { title: '新標題' })).rejects.toThrow(
        '地點 non-existent-id 不存在'
      )
    })

    it('應該驗證更新的電話號碼格式', async () => {
      await expect(service.updateLocation('location-123', { phone: 'invalid' })).rejects.toThrow(
        '電話號碼過短'
      )
    })

    it('應該只更新提供的欄位', async () => {
      const partialUpdate = { hours: '09:00-19:00' }

      mockFrom.mockReturnValue({ update: mockUpdate })
      mockUpdate.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: mockLocationRecord, error: null })

      await service.updateLocation('location-123', partialUpdate)

      expect(mockUpdate).toHaveBeenCalledWith({ hours: '09:00-19:00' })
    })
  })

  // ==========================================================================
  // Command Methods - Delete
  // ==========================================================================

  describe('deleteLocation', () => {
    it('應該成功刪除地點', async () => {
      // Mock getLocationById (內部調用)
      mockFrom
        .mockReturnValueOnce({ select: mockSelect }) // 第一次調用: getLocationById
        .mockReturnValueOnce({ delete: mockDelete }) // 第二次調用: delete

      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq
        .mockReturnValueOnce({ single: mockSingle }) // getLocationById 的 eq
        .mockResolvedValueOnce({ error: null }) // delete 的 eq

      mockSingle.mockResolvedValue({ data: mockLocationRecord, error: null })
      mockDelete.mockReturnValue({ eq: mockEq })

      await service.deleteLocation('location-123')

      expect(mockFrom).toHaveBeenCalledWith('locations')
      expect(mockEq).toHaveBeenCalledWith('id', 'location-123')
    })

    it('應該拋出 ValidationError 當 ID 為空', async () => {
      await expect(service.deleteLocation('')).rejects.toThrow('地點 ID 必須為非空字串')
    })

    it('應該拋出錯誤當資料庫刪除失敗', async () => {
      const dbError = { code: 'PGRST301', message: 'Database error' }
      mockFrom.mockReturnValue({ delete: mockDelete })
      mockDelete.mockReturnValue({ eq: mockEq })
      mockEq.mockResolvedValue({ error: dbError })

      await expect(service.deleteLocation('location-123')).rejects.toThrow()
    })
  })

  // ==========================================================================
  // Data Transformation
  // ==========================================================================

  describe('Data Transformation', () => {
    it('應該正確轉換資料庫記錄為 Location (camelCase)', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: mockLocationRecord, error: null })

      const result = await service.getLocationById('location-123')

      expect(result).toMatchObject({
        lineId: mockLocationRecord.line_id,
        closedDays: mockLocationRecord.closed_days,
        publicTransport: mockLocationRecord.public_transport,
        isMain: mockLocationRecord.is_main,
        createdAt: mockLocationRecord.created_at,
        updatedAt: mockLocationRecord.updated_at,
      })
    })

    it('應該正確處理 coordinates 物件', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: mockLocationRecord, error: null })

      const result = await service.getLocationById('location-123')

      expect(result?.coordinates).toEqual({
        lat: 23.5833,
        lng: 120.6833,
      })
    })

    it('應該正確處理 features 和 specialties 陣列', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: mockLocationRecord, error: null })

      const result = await service.getLocationById('location-123')

      expect(result?.features).toEqual(['有機認證', '現場試飲', '產地導覽'])
      expect(result?.specialties).toEqual(['高山烏龍茶', '蜜香紅茶'])
    })
  })

  // ==========================================================================
  // Phone Validation
  // ==========================================================================

  describe('Phone Validation', () => {
    const validPhones = [
      '02-12345678', // 台北市話
      '04-12345678', // 台中市話
      '0912-345-678', // 手機
      '0912345678', // 手機無分隔
      '(02)1234-5678', // 括號格式
    ]

    validPhones.forEach(phone => {
      it(`應該接受有效的電話號碼: ${phone}`, async () => {
        mockFrom.mockReturnValue({ insert: mockInsert })
        mockInsert.mockReturnValue({ select: mockSelect })
        mockSelect.mockReturnValue({ single: mockSingle })
        mockSingle.mockResolvedValue({ data: mockLocationRecord, error: null })

        const newLocationData = {
          name: 'test',
          title: '測試地點',
          address: '測試地址',
          landmark: '測試地標',
          phone,
          lineId: '@test',
          hours: '09:00-18:00',
          closedDays: '無',
          parking: '有',
          publicTransport: '公車',
          features: [],
          specialties: [],
          coordinates: { lat: 25.033, lng: 121.5654 },
          image: '/test.jpg',
          isMain: false,
        }

        await expect(service.addLocation(newLocationData)).resolves.toBeDefined()
      })
    })

    const invalidPhones = ['abc', '123', '12345678901234567890123456789'] // 太長

    invalidPhones.forEach(phone => {
      it(`應該拒絕無效的電話號碼: ${phone}`, async () => {
        const newLocationData = {
          name: 'test',
          title: '測試地點',
          address: '測試地址',
          landmark: '測試地標',
          phone,
          lineId: '@test',
          hours: '09:00-18:00',
          closedDays: '無',
          parking: '有',
          publicTransport: '公車',
          features: [],
          specialties: [],
          coordinates: { lat: 0, lng: 0 },
          image: '/test.jpg',
          isMain: false,
        }

        await expect(service.addLocation(newLocationData)).rejects.toThrow()
      })
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
        module: 'LocationService',
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
