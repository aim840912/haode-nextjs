import { NextRequest, NextResponse } from 'next/server'
import { cultureService } from '@/services/cultureService'

export async function GET() {
  try {
    const cultureItems = await cultureService.getCultureItems()
    return NextResponse.json(cultureItems)
  } catch (error) {
    console.error('Error fetching culture items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch culture items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const cultureItem = await cultureService.addCultureItem(body)
    return NextResponse.json(cultureItem, { status: 201 })
  } catch (error) {
    console.error('Error creating culture item:', error)
    return NextResponse.json(
      { error: 'Failed to create culture item' },
      { status: 500 }
    )
  }
}