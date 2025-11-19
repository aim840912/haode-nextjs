/**
 * SiteSettingsService 測試
 *
 * 測試網站設定服務的所有功能:
 * - CRUD 操作 (getAll, getByKey, getByKeys, create, update, delete)
 * - Upsert 操作 (upsert)
 * - 錯誤處理和驗證
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SiteSettingsService } from './siteSettingsService'
import { NotFoundError, ValidationError, DatabaseError } from '@/lib/errors'
import type { SiteSetting, SiteSettingInput, SiteSettingUpdate } from '@/types/siteSettings'

// ============================================================================
// Mock Setup
// ============================================================================

const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockIn = vi.fn()
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
    in: mockIn,
    order: mockOrder,
    single: mockSingle,
  })

  mockEq.mockReturnValue({
    single: mockSingle,
    select: vi.fn().mockReturnValue({
      single: mockSingle,
    }),
  })

  mockOrder.mockReturnValue({
    data: [],
    error: null,
  })

  mockInsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: mockSingle,
    }),
  })

  mockUpdate.mockReturnValue({
    eq: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    }),
  })

  mockDelete.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
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
    timer: vi.fn(() => ({
      end: vi.fn(),
    })),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('SiteSettingsService', () => {
  let service: SiteSettingsService

  const mockSettingData: SiteSetting = {
    key: 'homepage_banner_image',
    value: 'https://example.com/banner.jpg',
    type: 'image',
    description: '首頁橫幅圖片',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setupMockChains()
    service = new SiteSettingsService()
  })

  // ==========================================================================
  // getAll
  // ==========================================================================
  describe('getAll', () => {
    it('應該成功取得所有網站設定', async () => {
      const mockSettings: SiteSetting[] = [
        mockSettingData,
        {
          key: 'site_title',
          value: '測試網站',
          type: 'string',
          description: '網站標題',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        },
      ]

      mockOrder.mockResolvedValueOnce({
        data: mockSettings,
        error: null,
      })

      const result = await service.getAll()

      expect(result).toHaveLength(2)
      expect(result[0].key).toBe('homepage_banner_image')
      expect(result[1].key).toBe('site_title')
      expect(mockFrom).toHaveBeenCalledWith('site_settings')
      expect(mockOrder).toHaveBeenCalledWith('key', { ascending: true })
    })

    it('應該返回空陣列當沒有設定', async () => {
      mockOrder.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const result = await service.getAll()

      expect(result).toEqual([])
    })

    it('應該處理資料庫查詢錯誤', async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      await expect(service.getAll()).rejects.toThrow()
    })
  })

  // ==========================================================================
  // getByKey
  // ==========================================================================
  describe('getByKey', () => {
    it('應該成功取得單一設定', async () => {
      mockSingle.mockResolvedValueOnce({
        data: mockSettingData,
        error: null,
      })

      const result = await service.getByKey('homepage_banner_image')

      expect(result).not.toBeNull()
      expect(result?.key).toBe('homepage_banner_image')
      expect(result?.value).toBe('https://example.com/banner.jpg')
    })

    it('應該返回 null 當設定不存在 (PGRST116)', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await service.getByKey('non_existent_key')

      expect(result).toBeNull()
    })

    it('應該處理資料庫查詢錯誤', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      await expect(service.getByKey('homepage_banner_image')).rejects.toThrow()
    })
  })

  // ==========================================================================
  // getByKeys
  // ==========================================================================
  describe('getByKeys', () => {
    it('應該成功批次取得多個設定', async () => {
      const mockSettings: SiteSetting[] = [
        mockSettingData,
        {
          key: 'site_title',
          value: '測試網站',
          type: 'string',
          description: '網站標題',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        },
      ]

      mockIn.mockResolvedValueOnce({
        data: mockSettings,
        error: null,
      })

      const result = await service.getByKeys(['homepage_banner_image', 'site_title'])

      expect(Object.keys(result)).toHaveLength(2)
      expect(result['homepage_banner_image']).toBeDefined()
      expect(result['site_title']).toBeDefined()
      expect(result['homepage_banner_image'].value).toBe('https://example.com/banner.jpg')
    })

    it('應該返回空物件當沒有找到設定', async () => {
      mockIn.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const result = await service.getByKeys(['non_existent'])

      expect(result).toEqual({})
    })

    it('應該處理資料庫查詢錯誤', async () => {
      mockIn.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      await expect(service.getByKeys(['homepage_banner_image'])).rejects.toThrow()
    })
  })

  // ==========================================================================
  // create
  // ==========================================================================
  describe('create', () => {
    it('應該成功建立新設定', async () => {
      const createData: SiteSettingInput = {
        key: 'new_setting',
        value: 'new_value',
        type: 'string',
        description: '新設定',
      }

      const createdSetting: SiteSetting = {
        ...createData,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      }

      mockSingle.mockResolvedValueOnce({
        data: createdSetting,
        error: null,
      })

      const result = await service.create(createData)

      expect(result.key).toBe('new_setting')
      expect(result.value).toBe('new_value')
      expect(mockInsert).toHaveBeenCalled()
    })

    it('應該在設定鍵為空時拋出 ValidationError', async () => {
      const invalidData: SiteSettingInput = {
        key: '',
        value: 'test',
        type: 'string',
      }

      await expect(service.create(invalidData)).rejects.toThrow(ValidationError)
      await expect(service.create(invalidData)).rejects.toThrow('設定鍵不能為空')
    })

    it('應該處理資料庫插入錯誤', async () => {
      const createData: SiteSettingInput = {
        key: 'test_key',
        value: 'test_value',
        type: 'string',
      }

      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Insert failed' },
      })

      await expect(service.create(createData)).rejects.toThrow()
    })
  })

  // ==========================================================================
  // update
  // ==========================================================================
  describe('update', () => {
    it('應該成功更新設定', async () => {
      const updateData: SiteSettingUpdate = {
        value: 'https://example.com/new-banner.jpg',
        description: '更新後的橫幅圖片',
      }

      const updatedSetting: SiteSetting = {
        ...mockSettingData,
        value: 'https://example.com/new-banner.jpg',
        description: '更新後的橫幅圖片',
        updated_at: '2025-01-15T11:00:00Z',
      }

      // Mock getByKey (檢查設定是否存在)
      mockSingle.mockResolvedValueOnce({
        data: mockSettingData,
        error: null,
      })

      // Mock update
      mockSingle.mockResolvedValueOnce({
        data: updatedSetting,
        error: null,
      })

      const result = await service.update('homepage_banner_image', updateData)

      expect(result.value).toBe('https://example.com/new-banner.jpg')
      expect(result.description).toBe('更新後的橫幅圖片')
    })

    it('應該在設定不存在時拋出 NotFoundError', async () => {
      const updateData: SiteSettingUpdate = {
        value: 'new_value',
      }

      // Mock getByKey 返回 null
      const mockGetByKeyChain = {
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      }

      mockSelect.mockReturnValueOnce(mockGetByKeyChain)

      await expect(service.update('non_existent_key', updateData)).rejects.toThrow(NotFoundError)
      await expect(service.update('non_existent_key', updateData)).rejects.toThrow(
        '找不到設定鍵: non_existent_key'
      )
    })

    it('應該處理資料庫更新錯誤', async () => {
      const updateData: SiteSettingUpdate = {
        value: 'new_value',
      }

      // Mock getByKey 成功
      mockSingle.mockResolvedValueOnce({
        data: mockSettingData,
        error: null,
      })

      // Mock update 失敗
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Update failed' },
      })

      await expect(service.update('homepage_banner_image', updateData)).rejects.toThrow()
    })
  })

  // ==========================================================================
  // upsert
  // ==========================================================================
  describe('upsert', () => {
    it('應該更新現有設定', async () => {
      const upsertData: SiteSettingUpdate = {
        value: 'https://example.com/new-banner.jpg',
        description: '更新後的橫幅',
      }

      const updatedSetting: SiteSetting = {
        ...mockSettingData,
        value: 'https://example.com/new-banner.jpg',
        description: '更新後的橫幅',
      }

      // Mock getByKey (設定存在)
      mockSingle.mockResolvedValueOnce({
        data: mockSettingData,
        error: null,
      })

      // Mock getByKey again for update
      mockSingle.mockResolvedValueOnce({
        data: mockSettingData,
        error: null,
      })

      // Mock update
      mockSingle.mockResolvedValueOnce({
        data: updatedSetting,
        error: null,
      })

      const result = await service.upsert('homepage_banner_image', upsertData)

      expect(result.value).toBe('https://example.com/new-banner.jpg')
    })

    it('應該建立新設定當設定不存在', async () => {
      const upsertData: SiteSettingUpdate & { type?: string } = {
        value: 'new_value',
        type: 'string',
        description: '新設定',
      }

      const createdSetting: SiteSetting = {
        key: 'new_key',
        value: 'new_value',
        type: 'string',
        description: '新設定',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      }

      // Mock getByKey (設定不存在)
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Mock create
      mockSingle.mockResolvedValueOnce({
        data: createdSetting,
        error: null,
      })

      const result = await service.upsert('new_key', upsertData)

      expect(result.key).toBe('new_key')
      expect(result.value).toBe('new_value')
    })
  })

  // ==========================================================================
  // delete
  // ==========================================================================
  describe('delete', () => {
    it('應該成功刪除設定', async () => {
      // Mock getByKey (檢查設定是否存在)
      mockSingle.mockResolvedValueOnce({
        data: mockSettingData,
        error: null,
      })

      const result = await service.delete('homepage_banner_image')

      expect(result).toBe(true)
      expect(mockDelete).toHaveBeenCalled()
    })

    it('應該在設定不存在時拋出 NotFoundError', async () => {
      // Mock getByKey 返回 null
      const mockGetByKeyChain = {
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      }

      mockSelect.mockReturnValueOnce(mockGetByKeyChain)

      await expect(service.delete('non_existent_key')).rejects.toThrow(NotFoundError)
      await expect(service.delete('non_existent_key')).rejects.toThrow(
        '找不到設定鍵: non_existent_key'
      )
    })

    it('應該處理資料庫刪除錯誤', async () => {
      // Mock getByKey 成功
      mockSingle.mockResolvedValueOnce({
        data: mockSettingData,
        error: null,
      })

      // Mock delete 失敗
      mockDelete.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({
          error: { code: 'DB_ERROR', message: 'Delete failed' },
        }),
      })

      await expect(service.delete('homepage_banner_image')).rejects.toThrow()
    })
  })
})
