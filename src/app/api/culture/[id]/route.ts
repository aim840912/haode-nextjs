import { NextRequest, NextResponse } from 'next/server'
import { getCultureService } from '@/services/serviceFactory'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cultureService = await getCultureService()
    const cultureItem = await cultureService.getCultureItemById(id)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const cultureService = await getCultureService()
    const cultureItem = await cultureService.updateCultureItem(id, body)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cultureService = await getCultureService()
    await cultureService.deleteCultureItem(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting culture item:', error)
    return NextResponse.json(
      { error: 'Failed to delete culture item' },
      { status: 500 }
    )
  }
}