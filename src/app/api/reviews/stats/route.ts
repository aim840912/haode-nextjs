import { NextResponse } from 'next/server'
import { reviewService } from '@/services/reviewService'

export async function GET() {
  try {
    const stats = await reviewService.getReviewStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching review stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review stats' },
      { status: 500 }
    )
  }
}