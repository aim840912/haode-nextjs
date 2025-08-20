import { Review, ReviewSubmission, ReviewService } from '@/types/review'
import { supabase, supabaseAdmin } from '@/lib/supabase-auth'

export class SupabaseReviewService implements ReviewService {
  async getReviews(options: {
    approved?: boolean
    featured?: boolean
    category?: string
    productId?: string
    limit?: number
    offset?: number
  } = {}): Promise<Review[]> {
    try {
      let query = supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })

      if (options.approved !== undefined) {
        query = query.eq('is_approved', options.approved)
      }
      if (options.featured !== undefined) {
        query = query.eq('is_featured', options.featured)
      }
      if (options.category) {
        query = query.eq('category', options.category)
      }
      if (options.productId) {
        query = query.eq('product_id', options.productId)
      }
      if (options.limit) {
        query = query.limit(options.limit)
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching reviews:', error)
        throw new Error('Failed to fetch reviews')
      }

      return data?.map(this.transformFromDB) || []
    } catch (error) {
      console.error('Error in getReviews:', error)
      return []
    }
  }

  async getReviewById(id: string): Promise<Review | null> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      return this.transformFromDB(data)
    } catch (error) {
      console.error('Error fetching review by id:', error)
      return null
    }
  }

  async addReview(reviewData: ReviewSubmission): Promise<Review> {
    const insertData = {
      customer_name: reviewData.customerName,
      customer_email: reviewData.customerEmail,
      rating: reviewData.rating,
      title: reviewData.title,
      comment: reviewData.content,
      photos: reviewData.photos || [],
      product_id: reviewData.productId,
      category: reviewData.category,
      is_approved: false, // 預設需要審核
      is_featured: false
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('Error adding review:', error)
      throw new Error('Failed to add review')
    }

    return this.transformFromDB(data)
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<Review> {
    const dbUpdateData: Record<string, any> = {}

    if (updates.customerName !== undefined) dbUpdateData.customer_name = updates.customerName
    if (updates.customerEmail !== undefined) dbUpdateData.customer_email = updates.customerEmail
    if (updates.rating !== undefined) dbUpdateData.rating = updates.rating
    if (updates.title !== undefined) dbUpdateData.title = updates.title
    if (updates.content !== undefined) dbUpdateData.comment = updates.content
    if (updates.photos !== undefined) dbUpdateData.photos = updates.photos
    if (updates.productId !== undefined) dbUpdateData.product_id = updates.productId
    if (updates.category !== undefined) dbUpdateData.category = updates.category
    if (updates.isApproved !== undefined) dbUpdateData.is_approved = updates.isApproved
    if (updates.isFeatured !== undefined) dbUpdateData.is_featured = updates.isFeatured
    if (updates.adminReply !== undefined) dbUpdateData.admin_reply = updates.adminReply
    if (updates.adminReplyAt !== undefined) dbUpdateData.admin_reply_at = updates.adminReplyAt

    const { data, error } = await supabaseAdmin!
      .from('reviews')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating review:', error)
      throw new Error('Failed to update review')
    }

    if (!data) throw new Error('Review not found')
    return this.transformFromDB(data)
  }

  async deleteReview(id: string): Promise<void> {
    const { error } = await supabaseAdmin!
      .from('reviews')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting review:', error)
      throw new Error('Failed to delete review')
    }
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
    try {
      // 獲取總數和審核狀態統計
      const { data: totalData, error: totalError } = await supabase
        .from('reviews')
        .select('id, is_approved, rating')

      if (totalError) throw totalError

      const total = totalData?.length || 0
      const approved = totalData?.filter(r => r.is_approved).length || 0
      const pending = total - approved
      
      // 計算平均評分（只計算已審核的）
      const approvedRatings = totalData?.filter((r: any) => r.is_approved).map((r: any) => r.rating) || []
      const averageRating = approvedRatings.length > 0 
        ? approvedRatings.reduce((sum: number, rating: number) => sum + rating, 0) / approvedRatings.length 
        : 0

      return {
        total,
        approved,
        pending,
        averageRating: Math.round(averageRating * 10) / 10 // 保留一位小數
      }
    } catch (error) {
      console.error('Error getting review stats:', error)
      return { total: 0, approved: 0, pending: 0, averageRating: 0 }
    }
  }

  private transformFromDB(dbReview: Record<string, any>): Review {
    return {
      id: dbReview.id,
      customerName: dbReview.customer_name,
      customerEmail: dbReview.customer_email,
      rating: dbReview.rating,
      title: dbReview.title || '客戶評價',
      content: dbReview.comment,
      photos: dbReview.photos || [],
      productId: dbReview.product_id,
      category: dbReview.category,
      isApproved: dbReview.is_approved,
      isFeatured: dbReview.is_featured || false,
      adminReply: dbReview.admin_reply,
      adminReplyAt: dbReview.admin_reply_at,
      createdAt: dbReview.created_at,
      updatedAt: dbReview.updated_at
    }
  }
}

export const supabaseReviewService = new SupabaseReviewService()