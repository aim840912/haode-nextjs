import { NextRequest, NextResponse } from 'next/server'
import { locationService } from '@/services/locationService'

export async function GET() {
  try {
    const locations = await locationService.getLocations()
    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newLocation = await locationService.addLocation(body)
    return NextResponse.json(newLocation, { status: 201 })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}