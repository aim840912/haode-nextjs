/**
 * 業務指標型別定義
 */
export interface BusinessMetrics {
  userActions: {
    pageViews: number
    productViews: number
    inquirySubmissions: number
    searchQueries: number
  }
  business: {
    newProducts: number
    totalInquiries: number
    farmTourBookings: number
  }
  performance: {
    apiResponseTime: number[]
    errorRate: number
    activeUsers: number
  }
  content: {
    popularProducts: Array<{ id: string; views: number }>
    searchTerms: Array<{ term: string; count: number }>
    inquiryCategories: Array<{ category: string; count: number }>
  }
}

/**
 * 錯誤統計型別定義
 */
export interface ErrorStats {
  totalErrors: number
  errorRate: number
  criticalErrors: number
  errorsByStatus: Record<string, number>
  topPatterns: Array<{ pattern: string; count: number }>
  recentErrors: Array<{
    message: string
    timestamp: string
    level: string
    count: number
  }>
}

/**
 * 效能統計型別定義
 */
export interface PerformanceStats {
  avgResponseTime: number
  maxResponseTime: number
  minResponseTime: number
  totalRequests: number
  limitRate: number
  requestsByHour: Array<{ hour: string; count: number }>
}
