import { NextRequest, NextResponse } from 'next/server'
import { reviewService } from '@/services/reviewService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const approved = searchParams.get('approved')
    const featured = searchParams.get('featured')
    const category = searchParams.get('category')
    const productId = searchParams.get('productId')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const options = {
      ...(approved !== null && { approved: approved === 'true' }),
      ...(featured !== null && { featured: featured === 'true' }),
      ...(category && { category }),
      ...(productId && { productId }),
      ...(limit && { limit: parseInt(limit) }),
      ...(offset && { offset: parseInt(offset) })
    }

    const reviews = await reviewService.getReviews(options)
    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 基本驗證
    if (!body.customerName || !body.title || !body.content || !body.rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const review = await reviewService.addReview(body)
    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Error adding review:', error)
    return NextResponse.json(
      { error: 'Failed to add review' },
      { status: 500 }
    )
  }
}