import { NextRequest, NextResponse } from 'next/server'
import { scheduleService } from '@/services/scheduleService'

export async function GET() {
  try {
    const schedule = await scheduleService.getSchedule()
    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const scheduleItem = await scheduleService.addSchedule(body)
    return NextResponse.json(scheduleItem, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}