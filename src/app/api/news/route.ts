import { NextRequest, NextResponse } from 'next/server'
import { newsService } from '@/services/newsService'

export async function GET() {
  try {
    const news = await newsService.getNews()
    return NextResponse.json(news)
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newsItem = await newsService.addNews(body)
    return NextResponse.json(newsItem, { status: 201 })
  } catch (error) {
    console.error('Error creating news:', error)
    return NextResponse.json(
      { error: 'Failed to create news' },
      { status: 500 }
    )
  }
}