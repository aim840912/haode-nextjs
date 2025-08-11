import { NextRequest, NextResponse } from 'next/server'
import { scheduleService } from '@/services/scheduleService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const scheduleItem = await scheduleService.getScheduleById(id)
    if (!scheduleItem) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(scheduleItem)
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
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
    const scheduleItem = await scheduleService.updateSchedule(id, body)
    return NextResponse.json(scheduleItem)
  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule' },
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
    await scheduleService.deleteSchedule(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
}