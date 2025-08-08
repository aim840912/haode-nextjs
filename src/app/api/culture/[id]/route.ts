import { NextRequest, NextResponse } from 'next/server'
import { cultureService } from '@/services/cultureService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cultureItem = await cultureService.getCultureItemById(params.id)
    if (!cultureItem) {
      return NextResponse.json(
        { error: 'Culture item not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(cultureItem)
  } catch (error) {
    console.error('Error fetching culture item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch culture item' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const cultureItem = await cultureService.updateCultureItem(params.id, body)
    return NextResponse.json(cultureItem)
  } catch (error) {
    console.error('Error updating culture item:', error)
    return NextResponse.json(
      { error: 'Failed to update culture item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await cultureService.deleteCultureItem(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting culture item:', error)
    return NextResponse.json(
      { error: 'Failed to delete culture item' },
      { status: 500 }
    )
  }
}