import { Review, ReviewSubmission, ReviewService } from '@/types/review'

// 模擬資料庫存儲
const reviews: Review[] = [
  {
    id: '1',
    customerName: '陳小華',
    customerEmail: 'chen@example.com',
    rating: 5,
    title: '紅肉李超級甜美！',
    content: '從豪德農場買的紅肉李真的太好吃了！果肉飽滿多汁，甜度剛好，而且包裝很用心。下次一定會再購買，也推薦朋友來買！',
    photos: ['/images/reviews/review-1.jpg'],
    productId: '1',
    category: 'product',
    isApproved: true,
    isFeatured: true,
    adminReply: '謝謝您的支持！我們會繼續堅持品質，為顧客提供最好的農產品。',
    adminReplyAt: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    customerName: '林媽媽',
    rating: 5,
    title: '農場體驗很棒！',
    content: '帶孩子去豪德觀光果園體驗採果，小朋友玩得很開心！導覽員很專業，讓我們了解了很多農業知識。環境很乾淨，風景也很美。',
    photos: ['/images/reviews/review-2.jpg', '/images/reviews/review-2-2.jpg'],
    category: 'farm-tour',
    isApproved: true,
    isFeatured: true,
    createdAt: '2024-01-12T09:15:00Z',
    updatedAt: '2024-01-12T09:15:00Z'
  },
  {
    id: '3',
    customerName: '王先生',
    rating: 4,
    title: '咖啡品質不錯',
    content: '在逢甲夜市豪德攤位買的咖啡豆，香氣很棒，烘焙程度適中。價格合理，老闆人很親切，會詳細介紹產品特色。',
    productId: '2',
    category: 'product',
    isApproved: true,
    isFeatured: false,
    createdAt: '2024-01-10T16:45:00Z',
    updatedAt: '2024-01-10T16:45:00Z'
  },
  {
    id: '4',
    customerName: '張小姐',
    rating: 5,
    title: '服務態度超讚！',
    content: '第一次來豪德茶業，店員非常專業地介紹各種茶葉特色，讓我學到很多。買回家泡給家人喝，大家都很喜歡！',
    category: 'general',
    isApproved: true,
    isFeatured: false,
    createdAt: '2024-01-08T11:20:00Z',
    updatedAt: '2024-01-08T11:20:00Z'
  },
  {
    id: '5',
    customerName: '李大哥',
    rating: 3,
    title: '包裝可以更用心',
    content: '產品品質還不錯，但是包裝有點簡陋，建議可以更精美一些。',
    productId: '1',
    category: 'product',
    isApproved: false, // 待審核
    isFeatured: false,
    createdAt: '2024-01-16T08:30:00Z',
    updatedAt: '2024-01-16T08:30:00Z'
  }
]

class ReviewServiceImpl implements ReviewService {
  async getReviews(options: {
    approved?: boolean
    featured?: boolean
    category?: string
    productId?: string
    limit?: number
    offset?: number
  } = {}): Promise<Review[]> {
    let filtered = [...reviews]

    // 篩選條件
    if (options.approved !== undefined) {
      filtered = filtered.filter(r => r.isApproved === options.approved)
    }
    if (options.featured !== undefined) {
      filtered = filtered.filter(r => r.isFeatured === options.featured)
    }
    if (options.category) {
      filtered = filtered.filter(r => r.category === options.category)
    }
    if (options.productId) {
      filtered = filtered.filter(r => r.productId === options.productId)
    }

    // 排序：精選在前，然後按時間倒序
    filtered.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1
      if (!a.isFeatured && b.isFeatured) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // 分頁
    const offset = options.offset || 0
    const limit = options.limit || filtered.length
    return filtered.slice(offset, offset + limit)
  }

  async addReview(reviewData: ReviewSubmission): Promise<Review> {
    const newReview: Review = {
      id: String(reviews.length + 1),
      ...reviewData,
      isApproved: false, // 預設需要審核
      isFeatured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    reviews.push(newReview)
    return newReview
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<Review> {
    const index = reviews.findIndex(r => r.id === id)
    if (index === -1) {
      throw new Error('Review not found')
    }
    
    reviews[index] = {
      ...reviews[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    return reviews[index]
  }

  async deleteReview(id: string): Promise<void> {
    const index = reviews.findIndex(r => r.id === id)
    if (index === -1) {
      throw new Error('Review not found')
    }
    reviews.splice(index, 1)
  }

  async getReviewById(id: string): Promise<Review | null> {
    return reviews.find(r => r.id === id) || null
  }

  async approveReview(id: string): Promise<Review> {
    return this.updateReview(id, { isApproved: true })
  }

  async featureReview(id: string, featured: boolean): Promise<Review> {
    return this.updateReview(id, { isFeatured: featured })
  }

  async addAdminReply(id: string, reply: string): Promise<Review> {
    return this.updateReview(id, {
      adminReply: reply,
      adminReplyAt: new Date().toISOString()
    })
  }

  async getReviewStats(): Promise<{
    total: number
    approved: number
    pending: number
    averageRating: number
  }> {
    const total = reviews.length
    const approved = reviews.filter(r => r.isApproved).length
    const pending = total - approved
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return {
      total,
      approved,
      pending,
      averageRating: Math.round(averageRating * 10) / 10
    }
  }
}

export const reviewService = new ReviewServiceImpl()