/**
 * Inquiries Server Actions 測試
 *
 * 測試詢價單相關 Server Actions:
 * - createInquiryAction - 建立詢價單 (需要登入)
 * - createGuestInquiryAction - 建立訪客詢價單 (公開)
 * - updateInquiryStatusAction - 更新詢價單狀態 (管理員)
 * - deleteInquiryAction - 刪除詢價單 (管理員)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createInquiryAction,
  createGuestInquiryAction,
  updateInquiryStatusAction,
  deleteInquiryAction,
} from '../inquiries'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

const hoistedMocks = vi.hoisted(() => {
  const mockRequireAuth = vi.fn()
  const mockRequireAdmin = vi.fn()
  const mockSuccess = vi.fn()
  const mockError = vi.fn()
  const mockValidationError = vi.fn()
  const mockLogCreate = vi.fn()
  const mockLogStatusChange = vi.fn()
  const mockRevalidatePath = vi.fn()
  const mockRecordInquirySubmit = vi.fn()

  const mockApiLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }

  const mockInquiryService = {
    createInquiry: vi.fn(),
    getInquiryByIdForAdmin: vi.fn(),
    deleteInquiry: vi.fn(),
  }

  const mockCreateServerSupabaseClient = vi.fn()
  const mockSupabaseFrom = vi.fn()
  const mockSupabaseUpdate = vi.fn()
  const mockSupabaseEq = vi.fn()
  const mockSupabaseSelect = vi.fn()
  const mockSupabaseSingle = vi.fn()

  return {
    mockRequireAuth,
    mockRequireAdmin,
    mockSuccess,
    mockError,
    mockValidationError,
    mockLogCreate,
    mockLogStatusChange,
    mockRevalidatePath,
    mockRecordInquirySubmit,
    mockApiLogger,
    mockInquiryService,
    mockCreateServerSupabaseClient,
    mockSupabaseFrom,
    mockSupabaseUpdate,
    mockSupabaseEq,
    mockSupabaseSelect,
    mockSupabaseSingle,
  }
})

export const {
  mockRequireAuth,
  mockRequireAdmin,
  mockSuccess,
  mockError,
  mockValidationError,
  mockLogCreate,
  mockLogStatusChange,
  mockRevalidatePath,
  mockRecordInquirySubmit,
  mockApiLogger,
  mockInquiryService,
  mockCreateServerSupabaseClient,
  mockSupabaseFrom,
  mockSupabaseUpdate,
  mockSupabaseEq,
  mockSupabaseSelect,
  mockSupabaseSingle,
} = hoistedMocks

// ============================================================================
// Vi.mock calls at module top-level (required for Vitest 4.0)
// ============================================================================

vi.mock('@/lib/server', () => ({
  requireAuth: hoistedMocks.mockRequireAuth,
  requireAdmin: hoistedMocks.mockRequireAdmin,
  success: hoistedMocks.mockSuccess,
  error: hoistedMocks.mockError,
  validationError: hoistedMocks.mockValidationError,
  logCreate: hoistedMocks.mockLogCreate,
  logStatusChange: hoistedMocks.mockLogStatusChange,
}))

vi.mock('@/lib/logger', () => ({
  apiLogger: hoistedMocks.mockApiLogger,
}))

vi.mock('@/services/core/inquiry/InquiryService', () => ({
  inquiryService: hoistedMocks.mockInquiryService,
}))

vi.mock('next/cache', () => ({
  revalidatePath: hoistedMocks.mockRevalidatePath,
}))

vi.mock('@/lib/metrics', () => ({
  recordInquirySubmit: hoistedMocks.mockRecordInquirySubmit,
}))

vi.mock('@/lib/database/supabase-server', () => ({
  createServerSupabaseClient: hoistedMocks.mockCreateServerSupabaseClient,
}))

// ============================================================================
// Test Data
// ============================================================================

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
}

const mockAdmin = {
  id: 'admin-123',
  email: 'admin@example.com',
  role: 'admin',
}

const mockInquiry = {
  id: 'inquiry-123',
  user_id: 'user-123',
  customer_name: '測試用戶',
  customer_email: 'test@example.com',
  customer_phone: '0912345678',
  inquiry_type: 'product',
  status: 'pending',
  is_read: false,
  is_replied: false,
  total_estimated_amount: 5000,
  notes: '測試詢價',
  inquiry_items: [
    {
      id: 'item-1',
      product_id: 'product-123',
      product_name: '測試商品',
      quantity: 2,
      unit_price: 1000,
      total_price: 2000,
    },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const validInquiryData = {
  customer_name: '測試用戶',
  customer_email: 'test@example.com',
  customer_phone: '0912345678',
  inquiry_type: 'product',
  notes: '測試詢價',
  items: [
    {
      product_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      product_name: '測試商品',
      quantity: 2,
      unit_price: 1000,
    },
  ],
}

const validGuestInquiryData = {
  customer_name: '訪客用戶',
  customer_email: 'guest@example.com',
  customer_phone: '0987654321',
  inquiry_type: 'product',
  notes: '訪客詢價測試',
  items: [
    {
      product_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      product_name: '測試商品',
      quantity: 1,
      unit_price: 1500,
    },
  ],
}

const validStatusUpdateData = {
  is_read: true,
}

// ============================================================================
// Helper Functions
// ============================================================================

function resetAllMocks() {
  vi.clearAllMocks()

  // 設定預設的 mock 回傳值
  mockRequireAuth.mockResolvedValue(mockUser)
  mockRequireAdmin.mockResolvedValue(mockAdmin)
  mockSuccess.mockImplementation((data, message) => ({
    success: true,
    data,
    message,
  }))
  mockError.mockImplementation(err => ({
    success: false,
    error: { message: err instanceof Error ? err.message : String(err) },
  }))
  mockValidationError.mockImplementation(zodError => ({
    success: false,
    error: {
      message: '驗證失敗',
      details: zodError.errors,
    },
  }))
  mockLogCreate.mockResolvedValue(undefined)
  mockLogStatusChange.mockResolvedValue(undefined)
  mockRevalidatePath.mockReturnValue(undefined)
  mockRecordInquirySubmit.mockReturnValue(undefined)
}

function setupSupabaseMockChain(returnValue: any) {
  mockSupabaseSingle.mockResolvedValue(returnValue)
  mockSupabaseSelect.mockReturnValue({
    single: mockSupabaseSingle,
  })
  mockSupabaseEq.mockReturnValue({
    select: mockSupabaseSelect,
  })
  mockSupabaseUpdate.mockReturnValue({
    eq: mockSupabaseEq,
  })
  mockSupabaseFrom.mockReturnValue({
    update: mockSupabaseUpdate,
  })
  mockCreateServerSupabaseClient.mockResolvedValue({
    from: mockSupabaseFrom,
  })
}

// ============================================================================
// Tests - createInquiryAction
// ============================================================================

describe('createInquiryAction', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('成功場景', () => {
    it('應該成功建立詢價單', async () => {
      // Arrange
      mockInquiryService.createInquiry.mockResolvedValue(mockInquiry)

      // Act
      await createInquiryAction(validInquiryData)

      // Assert
      expect(mockRequireAuth).toHaveBeenCalledTimes(1)
      expect(mockInquiryService.createInquiry).toHaveBeenCalledWith(mockUser.id, validInquiryData)
      expect(mockRecordInquirySubmit).toHaveBeenCalledWith(
        validInquiryData.inquiry_type,
        mockUser.id
      )
      expect(mockLogCreate).toHaveBeenCalledWith(mockUser, 'inquiry', mockInquiry.id, {
        newData: {
          customer_name: mockInquiry.customer_name,
          customer_email: mockInquiry.customer_email,
          total_estimated_amount: mockInquiry.total_estimated_amount,
          items_count: mockInquiry.inquiry_items?.length,
        },
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/inquiries')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/inquiries')
      expect(mockSuccess).toHaveBeenCalledWith(mockInquiry, '詢價單建立成功')
    })

    it('應該記錄 API 日誌', async () => {
      // Arrange
      mockInquiryService.createInquiry.mockResolvedValue(mockInquiry)

      // Act
      await createInquiryAction(validInquiryData)

      // Assert
      expect(mockApiLogger.info).toHaveBeenCalledWith('建立詢價單', {
        metadata: {
          userId: mockUser.id,
          userEmail: mockUser.email,
          inquiryType: validInquiryData.inquiry_type,
          itemsCount: validInquiryData.items.length,
        },
      })
    })

    it('應該處理沒有 inquiry_items 的詢價單', async () => {
      // Arrange
      const inquiryWithoutItems = {
        ...mockInquiry,
        inquiry_items: undefined, // 資料庫可能返回 undefined
      }
      mockInquiryService.createInquiry.mockResolvedValue(inquiryWithoutItems)

      // Act
      await createInquiryAction(validInquiryData)

      // Assert
      expect(mockLogCreate).toHaveBeenCalledWith(mockUser, 'inquiry', inquiryWithoutItems.id, {
        newData: expect.objectContaining({
          items_count: 0,
        }),
      })
      expect(mockSuccess).toHaveBeenCalledWith(inquiryWithoutItems, '詢價單建立成功')
    })
  })

  describe('驗證失敗場景', () => {
    it('應該拒絕無效的 inquiry_type', async () => {
      // Arrange
      const invalidData = {
        ...validInquiryData,
        inquiry_type: 'invalid_type',
      }

      // Act
      await createInquiryAction(invalidData)

      // Assert
      expect(mockValidationError).toHaveBeenCalledWith(expect.any(Object))
      expect(mockInquiryService.createInquiry).not.toHaveBeenCalled()
    })

    it('應該拒絕缺少必填欄位的資料', async () => {
      // Arrange
      const invalidData = {
        customer_name: '',
        customer_email: 'test@example.com',
      }

      // Act
      await createInquiryAction(invalidData)

      // Assert
      expect(mockValidationError).toHaveBeenCalledWith(expect.any(Object))
      expect(mockInquiryService.createInquiry).not.toHaveBeenCalled()
    })
  })

  describe('認證失敗場景', () => {
    it('應該拒絕未登入的用戶', async () => {
      // Arrange
      const authError = new Error('未登入')
      mockRequireAuth.mockRejectedValue(authError)

      // Act
      await createInquiryAction(validInquiryData)

      // Assert
      expect(mockError).toHaveBeenCalledWith(authError)
      expect(mockInquiryService.createInquiry).not.toHaveBeenCalled()
    })
  })

  describe('服務層錯誤場景', () => {
    it('應該處理服務層拋出的錯誤', async () => {
      // Arrange
      const serviceError = new Error('資料庫錯誤')
      mockInquiryService.createInquiry.mockRejectedValue(serviceError)

      // Act
      await createInquiryAction(validInquiryData)

      // Assert
      expect(mockError).toHaveBeenCalledWith(serviceError)
      expect(mockLogCreate).not.toHaveBeenCalled()
    })
  })
})

// ============================================================================
// Tests - createGuestInquiryAction
// ============================================================================

describe('createGuestInquiryAction', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('成功場景', () => {
    it('應該成功建立訪客詢價單', async () => {
      // Arrange
      const guestInquiry = {
        ...mockInquiry,
        user_id: '00000000-0000-0000-0000-000000000000',
        customer_name: validGuestInquiryData.customer_name,
        customer_email: validGuestInquiryData.customer_email,
      }
      mockInquiryService.createInquiry.mockResolvedValue(guestInquiry)

      // Act
      await createGuestInquiryAction(validGuestInquiryData)

      // Assert
      expect(mockInquiryService.createInquiry).toHaveBeenCalledWith(
        '00000000-0000-0000-0000-000000000000',
        expect.objectContaining({
          customer_name: validGuestInquiryData.customer_name,
          customer_email: validGuestInquiryData.customer_email,
          items: validGuestInquiryData.items,
          notes: expect.stringContaining('【訪客詢價】'),
        })
      )
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/inquiries')
      expect(mockSuccess).toHaveBeenCalledWith(
        {
          id: guestInquiry.id,
          status: guestInquiry.status,
          customer_name: guestInquiry.customer_name,
        },
        '詢價已送出,我們會儘快回覆您'
      )
    })

    it('應該在 notes 中加入訪客標記', async () => {
      // Arrange
      const guestInquiry = { ...mockInquiry }
      mockInquiryService.createInquiry.mockResolvedValue(guestInquiry)

      // Act
      await createGuestInquiryAction(validGuestInquiryData)

      // Assert
      const createCall = mockInquiryService.createInquiry.mock.calls[0]
      const notesArg = createCall[1].notes

      expect(notesArg).toContain('【訪客詢價】')
      expect(notesArg).toContain(validGuestInquiryData.notes)
      expect(notesArg).toContain(validGuestInquiryData.customer_email)
      expect(notesArg).toContain(validGuestInquiryData.customer_phone)
    })

    it('應該記錄訪客詢價日誌', async () => {
      // Arrange
      mockInquiryService.createInquiry.mockResolvedValue(mockInquiry)

      // Act
      await createGuestInquiryAction(validGuestInquiryData)

      // Assert
      expect(mockApiLogger.info).toHaveBeenCalledTimes(2)
      expect(mockApiLogger.info).toHaveBeenNthCalledWith(1, '建立訪客詢價單', {
        metadata: {
          customerEmail: validGuestInquiryData.customer_email,
          customerName: validGuestInquiryData.customer_name,
          inquiryType: validGuestInquiryData.inquiry_type,
          itemsCount: validGuestInquiryData.items.length,
        },
      })
      expect(mockApiLogger.info).toHaveBeenNthCalledWith(2, '訪客詢價單建立成功', {
        metadata: {
          inquiryId: mockInquiry.id,
          customerEmail: validGuestInquiryData.customer_email,
        },
      })
    })

    it('應該不要求認證（公開操作）', async () => {
      // Arrange
      mockInquiryService.createInquiry.mockResolvedValue(mockInquiry)

      // Act
      await createGuestInquiryAction(validGuestInquiryData)

      // Assert
      expect(mockRequireAuth).not.toHaveBeenCalled()
      expect(mockRequireAdmin).not.toHaveBeenCalled()
    })

    it('應該返回有限的資料（不包含敏感資訊）', async () => {
      // Arrange
      const fullInquiry = {
        ...mockInquiry,
        customer_phone: '0987654321',
        notes: '敏感資訊',
        total_estimated_amount: 5000,
      }
      mockInquiryService.createInquiry.mockResolvedValue(fullInquiry)

      // Act
      const result = await createGuestInquiryAction(validGuestInquiryData)

      // Assert
      if (result.success) {
        expect(result.data).toEqual({
          id: fullInquiry.id,
          status: fullInquiry.status,
          customer_name: fullInquiry.customer_name,
        })
        // 確認不包含敏感資訊
        expect(result.data).not.toHaveProperty('customer_phone')
        expect(result.data).not.toHaveProperty('notes')
        expect(result.data).not.toHaveProperty('total_estimated_amount')
      }
    })
  })

  describe('驗證失敗場景', () => {
    it('應該拒絕缺少必填欄位', async () => {
      // Arrange
      const invalidData = {
        customer_name: '',
        customer_email: 'guest@example.com',
      }

      // Act
      await createGuestInquiryAction(invalidData)

      // Assert
      expect(mockValidationError).toHaveBeenCalledWith(expect.any(Object))
      expect(mockInquiryService.createInquiry).not.toHaveBeenCalled()
    })

    it('應該拒絕無效的 email 格式', async () => {
      // Arrange
      const invalidData = {
        ...validGuestInquiryData,
        customer_email: 'invalid-email',
      }

      // Act
      await createGuestInquiryAction(invalidData)

      // Assert
      expect(mockValidationError).toHaveBeenCalledWith(expect.any(Object))
      expect(mockInquiryService.createInquiry).not.toHaveBeenCalled()
    })
  })

  describe('服務層錯誤場景', () => {
    it('應該處理建立失敗', async () => {
      // Arrange
      const serviceError = new Error('建立失敗')
      mockInquiryService.createInquiry.mockRejectedValue(serviceError)

      // Act
      await createGuestInquiryAction(validGuestInquiryData)

      // Assert
      expect(mockError).toHaveBeenCalledWith(serviceError)
    })
  })
})

// ============================================================================
// Tests - updateInquiryStatusAction
// ============================================================================

describe('updateInquiryStatusAction', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('成功場景', () => {
    it('應該成功更新詢價單狀態', async () => {
      // Arrange
      mockInquiryService.getInquiryByIdForAdmin.mockResolvedValue(mockInquiry)
      const updatedInquiry = { ...mockInquiry, is_read: true }
      setupSupabaseMockChain({ data: updatedInquiry, error: null })

      // Act
      await updateInquiryStatusAction('inquiry-123', validStatusUpdateData)

      // Assert
      expect(mockRequireAdmin).toHaveBeenCalledTimes(1)
      expect(mockInquiryService.getInquiryByIdForAdmin).toHaveBeenCalledWith('inquiry-123')
      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_read: true,
        })
      )
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/inquiries')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/inquiries/inquiry-123')
      expect(mockSuccess).toHaveBeenCalledWith(updatedInquiry, '詢價單更新成功')
    })

    it('應該在標記已讀時設定 read_at', async () => {
      // Arrange
      mockInquiryService.getInquiryByIdForAdmin.mockResolvedValue(mockInquiry)
      setupSupabaseMockChain({ data: mockInquiry, error: null })

      // Act
      await updateInquiryStatusAction('inquiry-123', { is_read: true })

      // Assert
      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_read: true,
          read_at: expect.any(String),
        })
      )
    })

    it('應該在標記已回覆時設定 replied_at 和 replied_by', async () => {
      // Arrange
      mockInquiryService.getInquiryByIdForAdmin.mockResolvedValue(mockInquiry)
      setupSupabaseMockChain({ data: mockInquiry, error: null })

      // Act
      await updateInquiryStatusAction('inquiry-123', { is_replied: true })

      // Assert
      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_replied: true,
          replied_at: expect.any(String),
          replied_by: mockAdmin.id,
        })
      )
    })

    it('應該記錄審計日誌', async () => {
      // Arrange
      mockInquiryService.getInquiryByIdForAdmin.mockResolvedValue(mockInquiry)
      setupSupabaseMockChain({ data: mockInquiry, error: null })

      // Act
      await updateInquiryStatusAction('inquiry-123', { is_read: true })

      // Assert
      expect(mockLogStatusChange).toHaveBeenCalledWith(
        mockAdmin,
        'inquiry',
        'inquiry-123',
        expect.objectContaining({
          previousData: expect.any(Object),
          newData: expect.any(Object),
          metadata: expect.objectContaining({
            customer_name: mockInquiry.customer_name,
            customer_email: mockInquiry.customer_email,
            is_read_changed: true,
          }),
        })
      )
    })
  })

  describe('驗證失敗場景', () => {
    it('應該拒絕無效的狀態更新資料', async () => {
      // Arrange
      const invalidData = {
        invalid_field: 'invalid_value',
      }

      // Act
      await updateInquiryStatusAction('inquiry-123', invalidData)

      // Assert
      expect(mockValidationError).toHaveBeenCalledWith(expect.any(Object))
      expect(mockInquiryService.getInquiryByIdForAdmin).not.toHaveBeenCalled()
    })
  })

  describe('權限檢查場景', () => {
    it('應該拒絕非管理員用戶', async () => {
      // Arrange
      const authError = new Error('權限不足')
      mockRequireAdmin.mockRejectedValue(authError)

      // Act
      await updateInquiryStatusAction('inquiry-123', validStatusUpdateData)

      // Assert
      expect(mockError).toHaveBeenCalledWith(authError)
      expect(mockInquiryService.getInquiryByIdForAdmin).not.toHaveBeenCalled()
    })
  })

  describe('詢價單不存在場景', () => {
    it('應該處理詢價單不存在的情況', async () => {
      // Arrange
      mockInquiryService.getInquiryByIdForAdmin.mockResolvedValue(null)

      // Act
      await updateInquiryStatusAction('inquiry-123', validStatusUpdateData)

      // Assert
      expect(mockError).toHaveBeenCalledWith(expect.any(Error))
      expect(mockSupabaseUpdate).not.toHaveBeenCalled()
    })
  })

  describe('資料庫錯誤場景', () => {
    it('應該處理 Supabase 更新失敗', async () => {
      // Arrange
      mockInquiryService.getInquiryByIdForAdmin.mockResolvedValue(mockInquiry)
      const dbError = new Error('資料庫更新失敗')
      setupSupabaseMockChain({ data: null, error: dbError })

      // Act
      await updateInquiryStatusAction('inquiry-123', validStatusUpdateData)

      // Assert
      expect(mockError).toHaveBeenCalledWith(dbError)
      expect(mockLogStatusChange).not.toHaveBeenCalled()
    })
  })
})

// ============================================================================
// Tests - deleteInquiryAction
// ============================================================================

describe('deleteInquiryAction', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('成功場景', () => {
    it('應該成功刪除詢價單', async () => {
      // Arrange
      mockInquiryService.getInquiryByIdForAdmin.mockResolvedValue(mockInquiry)
      mockInquiryService.deleteInquiry.mockResolvedValue(undefined)

      // Act
      await deleteInquiryAction('inquiry-123')

      // Assert
      expect(mockRequireAdmin).toHaveBeenCalledTimes(1)
      expect(mockInquiryService.getInquiryByIdForAdmin).toHaveBeenCalledWith('inquiry-123')
      expect(mockInquiryService.deleteInquiry).toHaveBeenCalledWith('inquiry-123')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/inquiries')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/inquiries/inquiry-123')
      expect(mockSuccess).toHaveBeenCalledWith({ id: 'inquiry-123' }, '詢價單刪除成功')
    })

    it('應該記錄 API 日誌', async () => {
      // Arrange
      mockInquiryService.getInquiryByIdForAdmin.mockResolvedValue(mockInquiry)
      mockInquiryService.deleteInquiry.mockResolvedValue(undefined)

      // Act
      await deleteInquiryAction('inquiry-123')

      // Assert
      expect(mockApiLogger.info).toHaveBeenCalledWith('刪除詢價單', {
        metadata: {
          userId: mockAdmin.id,
          inquiryId: 'inquiry-123',
          adminEmail: mockAdmin.email,
        },
      })
    })
  })

  describe('權限檢查場景', () => {
    it('應該拒絕非管理員用戶', async () => {
      // Arrange
      const authError = new Error('權限不足')
      mockRequireAdmin.mockRejectedValue(authError)

      // Act
      await deleteInquiryAction('inquiry-123')

      // Assert
      expect(mockError).toHaveBeenCalledWith(authError)
      expect(mockInquiryService.deleteInquiry).not.toHaveBeenCalled()
    })
  })

  describe('詢價單不存在場景', () => {
    it('應該處理詢價單不存在的情況', async () => {
      // Arrange
      mockInquiryService.getInquiryByIdForAdmin.mockResolvedValue(null)

      // Act
      await deleteInquiryAction('inquiry-123')

      // Assert
      expect(mockError).toHaveBeenCalledWith(expect.any(Error))
      expect(mockInquiryService.deleteInquiry).not.toHaveBeenCalled()
    })
  })

  describe('服務層錯誤場景', () => {
    it('應該處理刪除失敗', async () => {
      // Arrange
      mockInquiryService.getInquiryByIdForAdmin.mockResolvedValue(mockInquiry)
      const serviceError = new Error('刪除失敗')
      mockInquiryService.deleteInquiry.mockRejectedValue(serviceError)

      // Act
      await deleteInquiryAction('inquiry-123')

      // Assert
      expect(mockError).toHaveBeenCalledWith(serviceError)
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })
})
