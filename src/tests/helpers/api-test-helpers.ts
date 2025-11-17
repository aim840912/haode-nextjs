/**
 * API 測試工具函數
 * 提供共用的 Mock 和測試工具，避免重複代碼
 */

import { vi } from 'vitest'

/**
 * 建立 Supabase Mock 客戶端
 * 用於模擬資料庫操作
 */
export function createSupabaseMock() {
  const mockSingle = vi.fn()
  const mockEq = vi.fn(() => ({ single: mockSingle }))
  const mockSelect = vi.fn(() => ({ eq: mockEq }))
  const mockFrom = vi.fn(() => ({ select: mockSelect }))
  const mockInsert = vi.fn(() => ({ select: mockSelect }))
  const mockUpdate = vi.fn(() => ({ eq: mockEq }))
  const mockDelete = vi.fn(() => ({ eq: mockEq }))

  return {
    from: mockFrom,
    mockFrom,
    mockSelect,
    mockEq,
    mockSingle,
    mockInsert,
    mockUpdate,
    mockDelete,
  }
}

/**
 * 建立認證中間件 Mock
 * 用於模擬使用者認證狀態
 */
export function createAuthMock() {
  const mockGetUser = vi.fn()
  const mockSignOut = vi.fn()
  const mockGetSession = vi.fn()

  return {
    auth: {
      getUser: mockGetUser,
      signOut: mockSignOut,
      getSession: mockGetSession,
    },
    mockGetUser,
    mockSignOut,
    mockGetSession,
  }
}

/**
 * 建立模擬的已認證使用者
 */
export function createMockUser(overrides?: {
  id?: string
  email?: string
  role?: string
  phone?: string
}) {
  return {
    id: overrides?.id || 'user-123',
    email: overrides?.email || 'test@example.com',
    role: overrides?.role || 'user',
    phone: overrides?.phone || '0912345678',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }
}

/**
 * 建立模擬的管理員使用者
 */
export function createMockAdmin(overrides?: { id?: string; email?: string }) {
  return createMockUser({
    ...overrides,
    role: 'admin',
  })
}

/**
 * 建立成功的 Supabase 回應
 */
export function createSuccessResponse<T>(data: T) {
  return {
    data,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK',
  }
}

/**
 * 建立錯誤的 Supabase 回應
 */
export function createErrorResponse(code: string, message: string, status: number = 500) {
  return {
    data: null,
    error: { code, message } as any,
    count: null,
    status,
    statusText: status === 500 ? 'Internal Server Error' : 'Error',
  }
}

/**
 * 建立「未找到」的 Supabase 回應
 */
export function createNotFoundResponse() {
  return {
    data: null,
    error: { code: 'PGRST116' } as any,
    count: null,
    status: 404,
    statusText: 'Not Found',
  }
}

/**
 * 模擬 Next.js Request
 * 簡化測試中建立 NextRequest 的過程
 */
export function createMockRequest(
  url: string,
  options?: {
    method?: string
    body?: any
    headers?: Record<string, string>
  }
) {
  const { method = 'GET', body, headers = {} } = options || {}

  const request = new Request(url, {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  })

  return request as any // NextRequest 類型
}

/**
 * 解析回應 JSON
 * 簡化測試中解析回應的過程
 */
export async function parseResponse(response: Response) {
  const data = await response.json()
  return {
    status: response.status,
    data,
  }
}

/**
 * 驗證成功回應的輔助函數
 */
export function expectSuccessResponse(
  response: { status: number; data: any },
  expectedStatus: number = 200
) {
  expect(response.status).toBe(expectedStatus)
  expect(response.data.success).toBe(true)
  expect(response.data.data).toBeDefined()
}

/**
 * 驗證錯誤回應的輔助函數
 */
export function expectErrorResponse(
  response: { status: number; data: any },
  expectedStatus: number,
  errorCode?: string
) {
  expect(response.status).toBe(expectedStatus)
  expect(response.data.success).toBe(false)
  expect(response.data.error).toBeDefined()
  if (errorCode) {
    expect(response.data.error.code).toBe(errorCode)
  }
}
