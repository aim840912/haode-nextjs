/**
 * InquiryCreateService 測試
 *
 * 測試詢問單建立服務的所有功能:
 * - 產品詢價建立
 * - 農場參觀詢問建立
 * - 資料驗證
 * - 錯誤處理
 * - 交易回滾
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ValidationError } from '@/lib/errors'
import { InquiryCreateService } from '../InquiryCreateService'
import { CreateInquiryRequest } from '@/types/inquiry'

// ============================================================================
// Mock Setup
// ============================================================================

import {
  mockSingle,
  mockInsert,
  mockDelete,
  mockEq,
  mockFrom,
  resetAllMocks,
} from './inquiry-create-test-setup'

// 取得 mocked 驗證函數用於設置錯誤
import { validateCreateInquiryRequest } from '../../inquiry-validation'

describe('InquiryCreateService', () => {
  let service: InquiryCreateService

  beforeEach(() => {
    service = new InquiryCreateService()
    resetAllMocks()
  })

  describe('createInquiry - 產品詢價', () => {
    it('應該成功建立產品詢價單（含項目）', async () => {
      // Arrange
      const userId = 'user-123'
      const requestData: CreateInquiryRequest = {
        customer_name: '測試客戶',
        customer_email: 'test@example.com',
        customer_phone: '0912345678',
        inquiry_type: 'product',
        items: [
          {
            product_id: 'product-1',
            product_name: '有機蔬菜',
            product_category: '蔬菜',
            quantity: 10,
            unit_price: 100,
            notes: '備註',
          },
        ],
      }

      const mockInquiryData = {
        id: 'inquiry-1',
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
      }

      const mockItemsData = [
        {
          id: 'item-1',
          inquiry_id: 'inquiry-1',
          product_id: 'product-1',
          product_name: '有機蔬菜',
          product_category: '蔬菜',
          quantity: 10,
          unit_price: 100,
          total_price: 1000,
          notes: '備註',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      // Mock insert().select().single() for inquiry
      mockSingle.mockResolvedValueOnce({
        data: mockInquiryData,
        error: null,
      })

      // Mock insert().select() for inquiry_items
      let callCount = 0
      mockFrom.mockImplementation((table: string) => {
        callCount++
        if (callCount === 1) {
          // 第一次調用：inquiries 表
          return {
            insert: () => ({
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: mockInquiryData,
                    error: null,
                  }),
              }),
            }),
          }
        } else {
          // 第二次調用：inquiry_items 表
          return {
            insert: () => ({
              select: () =>
                Promise.resolve({
                  data: mockItemsData,
                  error: null,
                }),
            }),
          }
        }
      })

      // Act
      const result = await service.createInquiry(userId, requestData)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe('inquiry-1')
      expect(result.customerName).toBe('測試客戶')
      expect(result.inquiryType).toBe('product')
      expect(result.totalEstimatedAmount).toBe(1000)
      expect(result.items).toHaveLength(1)
      expect(result.items[0].productName).toBe('有機蔬菜')
      expect(result.items[0].quantity).toBe(10)
      expect(result.items[0].totalPrice).toBe(1000)
    })

    it('應該成功建立產品詢價單（無單價，總金額為 null）', async () => {
      // Arrange
      const userId = 'user-123'
      const requestData: CreateInquiryRequest = {
        customer_name: '測試客戶',
        customer_email: 'test@example.com',
        inquiry_type: 'product',
        items: [
          {
            product_id: 'product-1',
            product_name: '有機蔬菜',
            product_category: '蔬菜',
            quantity: 10,
          },
        ],
      }

      const mockInquiryData = {
        id: 'inquiry-1',
        user_id: userId,
        customer_name: '測試客戶',
        customer_email: 'test@example.com',
        customer_phone: null,
        inquiry_type: 'product',
        notes: null,
        delivery_address: null,
        preferred_delivery_date: null,
        total_estimated_amount: null,
        status: 'pending',
        is_read: false,
        is_replied: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const mockItemsData = [
        {
          id: 'item-1',
          inquiry_id: 'inquiry-1',
          product_id: 'product-1',
          product_name: '有機蔬菜',
          product_category: '蔬菜',
          quantity: 10,
          unit_price: null,
          total_price: null,
          notes: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            insert: () => ({
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: mockInquiryData,
                    error: null,
                  }),
              }),
            }),
          }
        } else {
          return {
            insert: () => ({
              select: () =>
                Promise.resolve({
                  data: mockItemsData,
                  error: null,
                }),
            }),
          }
        }
      })

      // Act
      const result = await service.createInquiry(userId, requestData)

      // Assert
      expect(result.totalEstimatedAmount).toBeNull()
      expect(result.items[0].totalPrice).toBeNull()
    })

    it('應該拋出 ValidationError 當客戶姓名為空', async () => {
      // Arrange
      const userId = 'user-123'
      const requestData: CreateInquiryRequest = {
        customer_name: '',
        customer_email: 'test@example.com',
        inquiry_type: 'product',
        items: [{ product_id: 'p1', product_name: '產品', product_category: '分類', quantity: 1 }],
      }

      // Mock 驗證函數拋出錯誤
      vi.mocked(validateCreateInquiryRequest).mockImplementationOnce(() => {
        throw new ValidationError('客戶姓名不能為空')
      })

      // Act & Assert
      await expect(service.createInquiry(userId, requestData)).rejects.toThrow(ValidationError)
      await expect(service.createInquiry(userId, requestData)).rejects.toThrow('客戶姓名不能為空')
    })

    it('應該拋出 ValidationError 當 Email 格式不正確', async () => {
      // Arrange
      const userId = 'user-123'
      const requestData: CreateInquiryRequest = {
        customer_name: '測試客戶',
        customer_email: 'invalid-email',
        inquiry_type: 'product',
        items: [{ product_id: 'p1', product_name: '產品', product_category: '分類', quantity: 1 }],
      }

      vi.mocked(validateCreateInquiryRequest).mockImplementationOnce(() => {
        throw new ValidationError('Email格式不正確')
      })

      // Act & Assert
      await expect(service.createInquiry(userId, requestData)).rejects.toThrow(ValidationError)
      await expect(service.createInquiry(userId, requestData)).rejects.toThrow('Email格式不正確')
    })

    it('應該拋出 ValidationError 當產品詢價無項目', async () => {
      // Arrange
      const userId = 'user-123'
      const requestData: CreateInquiryRequest = {
        customer_name: '測試客戶',
        customer_email: 'test@example.com',
        inquiry_type: 'product',
        items: [],
      }

      vi.mocked(validateCreateInquiryRequest).mockImplementationOnce(() => {
        throw new ValidationError('產品詢價必須包含至少一個項目')
      })

      // Act & Assert
      await expect(service.createInquiry(userId, requestData)).rejects.toThrow(ValidationError)
      await expect(service.createInquiry(userId, requestData)).rejects.toThrow(
        '產品詢價必須包含至少一個項目'
      )
    })

    it('應該拋出 ValidationError 當產品數量 <= 0', async () => {
      // Arrange
      const userId = 'user-123'
      const requestData: CreateInquiryRequest = {
        customer_name: '測試客戶',
        customer_email: 'test@example.com',
        inquiry_type: 'product',
        items: [{ product_id: 'p1', product_name: '產品', product_category: '分類', quantity: 0 }],
      }

      vi.mocked(validateCreateInquiryRequest).mockImplementationOnce(() => {
        throw new ValidationError('第 1 項產品數量必須大於0')
      })

      // Act & Assert
      await expect(service.createInquiry(userId, requestData)).rejects.toThrow(ValidationError)
      await expect(service.createInquiry(userId, requestData)).rejects.toThrow(
        '第 1 項產品數量必須大於0'
      )
    })

    it('應該處理資料庫插入錯誤 (inquiry)', async () => {
      // Arrange
      const userId = 'user-123'
      const requestData: CreateInquiryRequest = {
        customer_name: '測試客戶',
        customer_email: 'test@example.com',
        inquiry_type: 'product',
        items: [{ product_id: 'p1', product_name: '產品', product_category: '分類', quantity: 1 }],
      }

      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      // Act & Assert
      await expect(service.createInquiry(userId, requestData)).rejects.toThrow()
    })

    it('應該回滾詢問單當項目插入失敗', async () => {
      // Arrange
      const userId = 'user-123'
      const requestData: CreateInquiryRequest = {
        customer_name: '測試客戶',
        customer_email: 'test@example.com',
        inquiry_type: 'product',
        items: [{ product_id: 'p1', product_name: '產品', product_category: '分類', quantity: 1 }],
      }

      const mockInquiryData = {
        id: 'inquiry-1',
        user_id: userId,
        customer_name: '測試客戶',
        customer_email: 'test@example.com',
        customer_phone: null,
        inquiry_type: 'product',
        notes: null,
        delivery_address: null,
        preferred_delivery_date: null,
        total_estimated_amount: null,
        status: 'pending',
        is_read: false,
        is_replied: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // 第一次：成功建立 inquiry
          return {
            insert: () => ({
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: mockInquiryData,
                    error: null,
                  }),
              }),
            }),
          }
        } else if (callCount === 2) {
          // 第二次：失敗建立 inquiry_items
          return {
            insert: () => ({
              select: () =>
                Promise.resolve({
                  data: null,
                  error: { code: 'DB_ERROR', message: 'Items insert failed' },
                }),
            }),
          }
        } else {
          // 第三次：delete rollback
          return {
            delete: () => ({
              eq: () =>
                Promise.resolve({
                  data: null,
                  error: null,
                }),
            }),
          }
        }
      })

      // Act & Assert
      await expect(service.createInquiry(userId, requestData)).rejects.toThrow()

      // 驗證調用了 delete 來回滾
      expect(mockFrom).toHaveBeenCalledTimes(3)
      expect(mockFrom).toHaveBeenNthCalledWith(3, 'inquiries')
    })
  })

  describe('createInquiry - 農場參觀', () => {
    it('應該成功建立農場參觀詢問（無項目）', async () => {
      // Arrange
      const userId = 'user-123'
      const requestData: CreateInquiryRequest = {
        customer_name: '測試客戶',
        customer_email: 'test@example.com',
        inquiry_type: 'farm_tour',
        activity_title: '親子農場體驗',
        visit_date: '2024-12-01',
        visitor_count: '20',
        notes: '希望安排導覽',
      }

      const mockInquiryData = {
        id: 'inquiry-2',
        user_id: userId,
        customer_name: '測試客戶',
        customer_email: 'test@example.com',
        customer_phone: null,
        inquiry_type: 'farm_tour',
        notes: JSON.stringify({
          activity_title: '親子農場體驗',
          visit_date: '2024-12-01',
          visitor_count: '20',
        }),
        delivery_address: null,
        preferred_delivery_date: null,
        total_estimated_amount: null,
        status: 'pending',
        is_read: false,
        is_replied: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSingle.mockResolvedValueOnce({
        data: mockInquiryData,
        error: null,
      })

      // Act
      const result = await service.createInquiry(userId, requestData)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe('inquiry-2')
      expect(result.inquiryType).toBe('farm_tour')
      expect(result.totalEstimatedAmount).toBeNull()
      expect(result.items).toEqual([])
    })

    it('應該拋出 ValidationError 當農場參觀缺少活動標題', async () => {
      // Arrange
      const userId = 'user-123'
      const requestData: CreateInquiryRequest = {
        customer_name: '測試客戶',
        customer_email: 'test@example.com',
        inquiry_type: 'farm_tour',
        activity_title: '',
        visit_date: '2024-12-01',
        visitor_count: '20',
      }

      vi.mocked(validateCreateInquiryRequest).mockImplementationOnce(() => {
        throw new ValidationError('活動標題不能為空')
      })

      // Act & Assert
      await expect(service.createInquiry(userId, requestData)).rejects.toThrow(ValidationError)
      await expect(service.createInquiry(userId, requestData)).rejects.toThrow('活動標題不能為空')
    })

    it('應該拋出 ValidationError 當農場參觀缺少參觀日期', async () => {
      // Arrange
      const userId = 'user-123'
      const requestData: CreateInquiryRequest = {
        customer_name: '測試客戶',
        customer_email: 'test@example.com',
        inquiry_type: 'farm_tour',
        activity_title: '親子農場體驗',
        visit_date: '',
        visitor_count: '20',
      }

      vi.mocked(validateCreateInquiryRequest).mockImplementationOnce(() => {
        throw new ValidationError('參觀日期不能為空')
      })

      // Act & Assert
      await expect(service.createInquiry(userId, requestData)).rejects.toThrow(ValidationError)
      await expect(service.createInquiry(userId, requestData)).rejects.toThrow('參觀日期不能為空')
    })
  })
})
