/**
 * InquiryQueryService 測試
 *
 * 測試詢問單查詢服務的所有功能:
 * - 使用者詢問單查詢
 * - 管理員詢問單查詢
 * - 錯誤處理
 * - PGRST116 (未找到) 處理
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { InquiryQueryService } from '../InquiryQueryService'

// ============================================================================
// Mock Setup
// ============================================================================

import { mockSingle, mockEq, mockSelect, mockFrom, resetAllMocks } from './inquiry-query-test-setup'

describe('InquiryQueryService', () => {
  let service: InquiryQueryService

  beforeEach(() => {
    service = new InquiryQueryService()
    resetAllMocks()
  })

  describe('getUserInquiries', () => {
    it('應該成功取得使用者詢問單列表', async () => {
      // Arrange
      const userId = 'user-123'
      const mockData = [
        {
          id: 'inquiry-1',
          user_id: userId,
          customer_name: '測試客戶A',
          customer_email: 'testA@example.com',
          customer_phone: '0912345678',
          inquiry_type: 'product',
          notes: null,
          delivery_address: null,
          preferred_delivery_date: null,
          total_estimated_amount: 1000,
          status: 'pending',
          is_read: false,
          is_replied: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          inquiry_items: [
            {
              id: 'item-1',
              inquiry_id: 'inquiry-1',
              product_id: 'product-1',
              product_name: '產品A',
              quantity: 10,
            },
          ],
        },
        {
          id: 'inquiry-2',
          user_id: userId,
          customer_name: '測試客戶B',
          customer_email: 'testB@example.com',
          customer_phone: null,
          inquiry_type: 'farm_tour',
          notes: '{"activity_title":"參觀"}',
          delivery_address: null,
          preferred_delivery_date: null,
          total_estimated_amount: null,
          status: 'replied',
          is_read: true,
          is_replied: true,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          inquiry_items: [],
        },
      ]

      mockEq.mockResolvedValueOnce({
        data: mockData,
        error: null,
      })

      // Act
      const result = await service.getUserInquiries(userId)

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('inquiry-1')
      expect(result[0].customerName).toBe('測試客戶A')
      expect(result[0].inquiryType).toBe('product')
      expect(result[0].items).toHaveLength(1)
      expect(result[1].id).toBe('inquiry-2')
      expect(result[1].inquiryType).toBe('farm_tour')
      expect(result[1].items).toEqual([])
    })

    it('應該返回空陣列當使用者無詢問單', async () => {
      // Arrange
      const userId = 'user-123'

      mockEq.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      // Act
      const result = await service.getUserInquiries(userId)

      // Assert
      expect(result).toEqual([])
    })

    it('應該處理資料庫查詢錯誤', async () => {
      // Arrange
      const userId = 'user-123'

      mockEq.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      // Act & Assert
      await expect(service.getUserInquiries(userId)).rejects.toThrow()
    })
  })

  describe('getInquiryById', () => {
    it('應該成功取得使用者的特定詢問單', async () => {
      // Arrange
      const userId = 'user-123'
      const inquiryId = 'inquiry-1'
      const mockData = {
        id: inquiryId,
        user_id: userId,
        customer_name: '測試客戶',
        customer_email: 'test@example.com',
        customer_phone: '0912345678',
        inquiry_type: 'product',
        notes: null,
        delivery_address: null,
        preferred_delivery_date: null,
        total_estimated_amount: 1000,
        status: 'pending',
        is_read: false,
        is_replied: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        inquiry_items: [
          {
            id: 'item-1',
            inquiry_id: inquiryId,
            product_id: 'product-1',
            product_name: '產品A',
            quantity: 10,
          },
        ],
      }

      mockSingle.mockResolvedValueOnce({
        data: mockData,
        error: null,
      })

      // Act
      const result = await service.getInquiryById(userId, inquiryId)

      // Assert
      expect(result).not.toBeNull()
      expect(result?.id).toBe(inquiryId)
      expect(result?.userId).toBe(userId)
      expect(result?.customerName).toBe('測試客戶')
      expect(result?.items).toHaveLength(1)
    })

    it('應該返回 null 當詢問單不存在 (PGRST116)', async () => {
      // Arrange
      const userId = 'user-123'
      const inquiryId = 'inquiry-999'

      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Act
      const result = await service.getInquiryById(userId, inquiryId)

      // Assert
      expect(result).toBeNull()
    })

    it('應該處理資料庫查詢錯誤', async () => {
      // Arrange
      const userId = 'user-123'
      const inquiryId = 'inquiry-1'

      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      // Act & Assert
      await expect(service.getInquiryById(userId, inquiryId)).rejects.toThrow()
    })
  })

  describe('getAllInquiries', () => {
    it('應該成功取得所有詢問單（管理員）', async () => {
      // Arrange
      const mockData = [
        {
          id: 'inquiry-1',
          user_id: 'user-A',
          customer_name: '客戶A',
          customer_email: 'a@example.com',
          customer_phone: null,
          inquiry_type: 'product',
          notes: null,
          delivery_address: null,
          preferred_delivery_date: null,
          total_estimated_amount: 500,
          status: 'pending',
          is_read: false,
          is_replied: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          inquiry_items: [],
        },
        {
          id: 'inquiry-2',
          user_id: 'user-B',
          customer_name: '客戶B',
          customer_email: 'b@example.com',
          customer_phone: null,
          inquiry_type: 'farm_tour',
          notes: null,
          delivery_address: null,
          preferred_delivery_date: null,
          total_estimated_amount: null,
          status: 'replied',
          is_read: true,
          is_replied: true,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          inquiry_items: [],
        },
      ]

      mockSelect.mockResolvedValueOnce({
        data: mockData,
        error: null,
      })

      // Act
      const result = await service.getAllInquiries()

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('inquiry-1')
      expect(result[0].userId).toBe('user-A')
      expect(result[1].id).toBe('inquiry-2')
      expect(result[1].userId).toBe('user-B')
    })

    it('應該返回空陣列當無任何詢問單', async () => {
      // Arrange
      mockSelect.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      // Act
      const result = await service.getAllInquiries()

      // Assert
      expect(result).toEqual([])
    })

    it('應該處理資料庫查詢錯誤', async () => {
      // Arrange
      mockSelect.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      // Act & Assert
      await expect(service.getAllInquiries()).rejects.toThrow()
    })
  })

  describe('getInquiryByIdForAdmin', () => {
    it('應該成功取得特定詢問單（管理員）', async () => {
      // Arrange
      const inquiryId = 'inquiry-1'
      const mockData = {
        id: inquiryId,
        user_id: 'user-123',
        customer_name: '測試客戶',
        customer_email: 'test@example.com',
        customer_phone: null,
        inquiry_type: 'product',
        notes: null,
        delivery_address: null,
        preferred_delivery_date: null,
        total_estimated_amount: 2000,
        status: 'confirmed',
        is_read: true,
        is_replied: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        inquiry_items: [
          {
            id: 'item-1',
            inquiry_id: inquiryId,
            product_id: 'product-1',
            product_name: '產品A',
            quantity: 20,
          },
        ],
      }

      mockSingle.mockResolvedValueOnce({
        data: mockData,
        error: null,
      })

      // Act
      const result = await service.getInquiryByIdForAdmin(inquiryId)

      // Assert
      expect(result).not.toBeNull()
      expect(result?.id).toBe(inquiryId)
      expect(result?.userId).toBe('user-123')
      expect(result?.status).toBe('confirmed')
      expect(result?.items).toHaveLength(1)
    })

    it('應該返回 null 當詢問單不存在 (PGRST116)', async () => {
      // Arrange
      const inquiryId = 'inquiry-999'

      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Act
      const result = await service.getInquiryByIdForAdmin(inquiryId)

      // Assert
      expect(result).toBeNull()
    })

    it('應該處理資料庫查詢錯誤', async () => {
      // Arrange
      const inquiryId = 'inquiry-1'

      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      // Act & Assert
      await expect(service.getInquiryByIdForAdmin(inquiryId)).rejects.toThrow()
    })
  })
})
