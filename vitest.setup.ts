import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// 每個測試後自動清理
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}))

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: (props: any) => props,
}))

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: (props: any) => props,
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Mock logger modules - 防止測試中嘗試真實的日誌記錄
const createMockLogger = () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
})

vi.mock('@/lib/logger', () => ({
  apiLogger: createMockLogger(),
  authLogger: createMockLogger(),
  cacheLogger: createMockLogger(),
  dbLogger: createMockLogger(),
  generalLogger: createMockLogger(),
}))

// Mock error-tracking module - 防止測試中嘗試真實的錯誤追蹤
vi.mock('@/lib/error-tracking', () => ({
  captureError: vi.fn(),
  captureFatalError: vi.fn(),
  captureWarning: vi.fn(),
  addBreadcrumb: vi.fn(),
  setUser: vi.fn(),
  startTransaction: vi.fn(() => ({
    name: 'test',
    operation: 'test',
    startTime: Date.now(),
    id: 'test-id',
    status: 'ok',
    setStatus: vi.fn(),
  })),
  finishTransaction: vi.fn(),
  isErrorTrackingAvailable: vi.fn(() => true),
  flushErrorTracking: vi.fn(() => Promise.resolve(true)),
}))

// Mock metrics module - 防止測試中嘗試真實的指標記錄
vi.mock('@/lib/metrics', () => ({
  recordApiRequest: vi.fn(),
  recordInquirySubmit: vi.fn(),
  recordMetric: vi.fn(),
}))
