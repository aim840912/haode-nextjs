import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-auth'
import { Location } from '@/types/location'
import { 
  checkAdminPermission, 
  createAuthErrorResponse,
  checkRateLimit 
} from '@/lib/admin-auth-middleware'

// GET - 取得所有地點
export async function GET(request: NextRequest) {
  // Rate limiting
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(`admin-locations-${clientIp}`, 30, 60000)) {
    return NextResponse.json(
      { error: '請求過於頻繁，請稍後再試' },
      { status: 429 }
    )
  }

  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ locations: data || [] })
  } catch (error) {
    console.error('Error fetching all locations:', error)
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }
}

// POST - 新增地點
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(`admin-locations-${clientIp}`, 30, 60000)) {
    return NextResponse.json(
      { error: '請求過於頻繁，請稍後再試' },
      { status: 429 }
    )
  }

  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })
    }

    const locationData = await request.json()

    // 轉換資料格式
    const dbLocation = {
      name: locationData.name,
      title: locationData.title,
      address: locationData.address,
      landmark: locationData.landmark || null,
      phone: locationData.phone || null,
      line_id: locationData.lineId || null,
      hours: locationData.hours || null,
      closed_days: locationData.closedDays || null,
      parking: locationData.parking || null,
      public_transport: locationData.publicTransport || null,
      features: locationData.features || [],
      specialties: locationData.specialties || [],
      coordinates: locationData.coordinates || null,
      image: locationData.image || null,
      is_main: locationData.isMain || false
    }

    const { data, error } = await supabaseAdmin
      .from('locations')
      .insert([dbLocation])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ location: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 })
  }
}

// PUT - 更新地點
export async function PUT(request: NextRequest) {
  // Rate limiting
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(`admin-locations-${clientIp}`, 30, 60000)) {
    return NextResponse.json(
      { error: '請求過於頻繁，請稍後再試' },
      { status: 429 }
    )
  }

  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })
    }

    const { id, ...locationData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 })
    }

    // 轉換資料格式
    const dbLocation: Record<string, unknown> = {}
    
    if (locationData.name !== undefined) dbLocation.name = locationData.name
    if (locationData.title !== undefined) dbLocation.title = locationData.title
    if (locationData.address !== undefined) dbLocation.address = locationData.address
    if (locationData.landmark !== undefined) dbLocation.landmark = locationData.landmark
    if (locationData.phone !== undefined) dbLocation.phone = locationData.phone
    if (locationData.lineId !== undefined) dbLocation.line_id = locationData.lineId
    if (locationData.hours !== undefined) dbLocation.hours = locationData.hours
    if (locationData.closedDays !== undefined) dbLocation.closed_days = locationData.closedDays
    if (locationData.parking !== undefined) dbLocation.parking = locationData.parking
    if (locationData.publicTransport !== undefined) dbLocation.public_transport = locationData.publicTransport
    if (locationData.features !== undefined) dbLocation.features = locationData.features
    if (locationData.specialties !== undefined) dbLocation.specialties = locationData.specialties
    if (locationData.coordinates !== undefined) dbLocation.coordinates = locationData.coordinates
    if (locationData.image !== undefined) dbLocation.image = locationData.image
    if (locationData.isMain !== undefined) dbLocation.is_main = locationData.isMain

    dbLocation.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('locations')
      .update(dbLocation)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ location: data })
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
  }
}

// DELETE - 刪除地點
export async function DELETE(request: NextRequest) {
  // Rate limiting
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(`admin-locations-${clientIp}`, 30, 60000)) {
    return NextResponse.json(
      { error: '請求過於頻繁，請稍後再試' },
      { status: 429 }
    )
  }

  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('locations')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Location deleted successfully' })
  } catch (error) {
    console.error('Error deleting location:', error)
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 })
  }
}