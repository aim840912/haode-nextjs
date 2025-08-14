export interface Review {
  id: string
  customerName: string
  customerEmail?: string
  rating: number // 1-5 星級評分
  title: string
  content: string
  photos?: string[] // 照片 URL 陣列
  productId?: string // 關聯的產品 ID
  category: 'product' | 'farm-tour' | 'general' // 評價分類
  isApproved: boolean // 是否通過審核
  isFeatured: boolean // 是否為精選評價
  adminReply?: string // 管理員回覆
  adminReplyAt?: string // 管理員回覆時間
  createdAt: string
  updatedAt: string
}

export interface ReviewSubmission {
  customerName: string
  customerEmail?: string
  rating: number
  title: string
  content: string
  photos?: string[]
  productId?: string
  category: 'product' | 'farm-tour' | 'general'
}

export interface ReviewService {
  getReviews(options?: {
    approved?: boolean
    featured?: boolean
    category?: string
    productId?: string
    limit?: number
    offset?: number
  }): Promise<Review[]>
  addReview(review: ReviewSubmission): Promise<Review>
  updateReview(id: string, updates: Partial<Review>): Promise<Review>
  deleteReview(id: string): Promise<void>
  getReviewById(id: string): Promise<Review | null>
  approveReview(id: string): Promise<Review>
  featureReview(id: string, featured: boolean): Promise<Review>
  addAdminReply(id: string, reply: string): Promise<Review>
  getReviewStats(): Promise<{
    total: number
    approved: number
    pending: number
    averageRating: number
  }>
}