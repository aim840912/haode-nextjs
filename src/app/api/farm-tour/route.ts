import { NextRequest, NextResponse } from 'next/server'
import { getFarmTourService } from '@/services/serviceFactory'

// GET - 獲取所有農場體驗活動
export async function GET() {
  try {
    const farmTourService = await getFarmTourService()
    const activities = await farmTourService.getAll()
    return NextResponse.json(activities)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

// POST - 新增農場體驗活動
export async function POST(request: NextRequest) {
  try {
    const farmTourService = await getFarmTourService()
    const body = await request.json()
    const newActivity = await farmTourService.create(body)
    return NextResponse.json(newActivity, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}