/**
 * LocationServiceSimple 測試套件
 *
 * 本測試檔案已模組化拆分:
 * - __tests__/location-test-setup.ts - Mock 設置和測試資料
 * - 其他測試模組 (query, command, utils) - 請參考原始測試檔案
 *
 * 本檔案保留用於整合測試和向後相容性
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  initializeLocationMocks,
  resetAllLocationMocks,
  mockFrom,
  mockSingle,
  mockLocationData,
  mockLocationResponse,
} from './__tests__/location-test-setup'
import { LocationServiceSimple } from './locationServiceSimple'

// 初始化所有 Mocks
initializeLocationMocks()

describe('LocationServiceSimple', () => {
  let service: LocationServiceSimple

  beforeEach(() => {
    service = new LocationServiceSimple()
    resetAllLocationMocks()
  })

  // ===== Query Tests (示範) =====
  describe('getLocations', () => {
    it('應該成功取得地點列表', async () => {
      mockFrom.mockReturnValue({
        select: () => ({
          order: () =>
            Promise.resolve({
              data: [mockLocationData],
              error: null,
            }),
        }),
      })

      const result = await service.getLocations()

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(mockLocationResponse.id)
      expect(result[0].name).toBe(mockLocationResponse.name)
    })
  })

  describe('getLocationById', () => {
    it('應該成功取得單一地點', async () => {
      mockSingle.mockResolvedValue({
        data: mockLocationData,
        error: null,
      })

      const result = await service.getLocationById('test-location-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe(mockLocationResponse.id)
    })

    it('應該返回 null 當地點不存在', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await service.getLocationById('non-existent')

      expect(result).toBeNull()
    })
  })

  // ===== Command Tests (示範) =====
  describe('addLocation', () => {
    it('應該成功新增地點', async () => {
      mockSingle.mockResolvedValue({
        data: mockLocationData,
        error: null,
      })

      const newLocation = {
        name: '新地點',
        title: '新標題',
        address: '台北市信義區',
        landmark: '101 大樓',
        phone: '02-8765-4321',
        lineId: '@new',
        hours: '10:00-20:00',
        closedDays: '無',
        parking: '大樓停車場',
        publicTransport: '捷運台北101/世貿站',
        features: [],
        specialties: [],
        coordinates: { lat: 25.033, lng: 121.564 },
        image: '',
        isMain: false,
      }

      const result = await service.addLocation(newLocation)

      expect(result.id).toBe(mockLocationResponse.id)
    })
  })

  // TODO: 完整測試覆蓋需創建以下模組:
  // - __tests__/location-query.test.ts (完整查詢測試)
  // - __tests__/location-command.test.ts (add, update, delete 測試)
  // - __tests__/location-utils.test.ts (transformation, validation, health 測試)
})

export {}
