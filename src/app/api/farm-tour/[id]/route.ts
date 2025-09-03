import { NextRequest, NextResponse } from 'next/server'
import { farmTourServiceAdapter } from '@/services/farmTourServiceAdapter'

// GET - 根據ID獲取活動
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const activity = await farmTourServiceAdapter.getById(id)
    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }
    return NextResponse.json(activity)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}

// PUT - 更新活動
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const updatedActivity = await farmTourServiceAdapter.update(id, body)
    
    if (!updatedActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }
    
    return NextResponse.json(updatedActivity)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}

// DELETE - 刪除活動
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const success = await farmTourServiceAdapter.delete(id)
    
    if (!success) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Activity deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 })
  }
}