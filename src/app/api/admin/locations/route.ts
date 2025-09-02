import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-auth'
import { LocationSchemas } from '@/lib/validation-schemas'
import { ValidationError } from '@/lib/errors'
import { success, created } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/error-handler'
import { apiLogger } from '@/lib/logger'
import { z } from 'zod'
import {
  checkAdminPermission,
  createAuthErrorResponse,
  checkRateLimit,
} from '@/lib/admin-auth-middleware'

// 刪除參數 Schema
const AdminLocationDeleteSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID 必須是有效的數字'),
})

/**
 * GET /api/admin/locations - 取得所有地點（管理員專用）
 */
async function handleGET(request: NextRequest) {
  // Rate limiting
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(`admin-locations-${clientIp}`, 30, 60000)) {
    throw new ValidationError('請求過於頻繁，請稍後再試')
  }

  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  apiLogger.info('管理員查詢所有地點', {
    metadata: { adminAccess: true, clientInfo: authResult.metadata },
  })

  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  const { data, error } = await supabaseAdmin
    .from('locations')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error

  return success({ locations: data || [] }, '查詢成功')
}

/**
 * POST /api/admin/locations - 新增地點（管理員專用）
 */
async function handlePOST(request: NextRequest) {
  // Rate limiting
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(`admin-locations-${clientIp}`, 30, 60000)) {
    throw new ValidationError('請求過於頻繁，請稍後再試')
  }

  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  // 解析並驗證請求資料
  const body = await request.json()
  const result = LocationSchemas.create.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('管理員新增地點', {
    metadata: {
      adminAccess: true,
      locationName: result.data.name,
    },
  })

  // 轉換資料格式（camelCase -> snake_case）
  const dbLocation = {
    name: result.data.name,
    title: result.data.title,
    address: result.data.address,
    landmark: result.data.landmark || null,
    phone: result.data.phone || null,
    line_id: result.data.lineId || null,
    hours: result.data.hours || null,
    closed_days: result.data.closedDays || null,
    parking: result.data.parking || null,
    public_transport: result.data.publicTransport || null,
    features: result.data.features || [],
    specialties: result.data.specialties || [],
    coordinates: result.data.coordinates || null,
    image: result.data.image || null,
    is_main: result.data.isMain || false,
  }

  const { data, error } = await supabaseAdmin
    .from('locations')
    .insert([dbLocation])
    .select()
    .single()

  if (error) throw error

  return created(data, '地點建立成功')
}

/**
 * PUT /api/admin/locations - 更新地點（管理員專用）
 */
async function handlePUT(request: NextRequest) {
  // Rate limiting
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(`admin-locations-${clientIp}`, 30, 60000)) {
    throw new ValidationError('請求過於頻繁，請稍後再試')
  }

  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  // 解析並驗證請求資料
  const { id, ...locationData } = await request.json()

  if (!id) {
    throw new ValidationError('Location ID is required')
  }

  // 驗證數字 ID 格式
  const idResult = AdminLocationDeleteSchema.safeParse({ id })
  if (!idResult.success) {
    const errors = idResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`ID 驗證失敗: ${errors}`)
  }

  // 驗證更新資料
  const result = LocationSchemas.update.safeParse(locationData)
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('管理員更新地點', {
    metadata: {
      adminAccess: true,
      locationId: id,
      changes: Object.keys(result.data),
    },
  })

  // 轉換資料格式（camelCase -> snake_case）
  const dbLocation: Record<string, unknown> = {}

  if (result.data.name !== undefined) dbLocation.name = result.data.name
  if (result.data.title !== undefined) dbLocation.title = result.data.title
  if (result.data.address !== undefined) dbLocation.address = result.data.address
  if (result.data.landmark !== undefined) dbLocation.landmark = result.data.landmark
  if (result.data.phone !== undefined) dbLocation.phone = result.data.phone
  if (result.data.lineId !== undefined) dbLocation.line_id = result.data.lineId
  if (result.data.hours !== undefined) dbLocation.hours = result.data.hours
  if (result.data.closedDays !== undefined) dbLocation.closed_days = result.data.closedDays
  if (result.data.parking !== undefined) dbLocation.parking = result.data.parking
  if (result.data.publicTransport !== undefined)
    dbLocation.public_transport = result.data.publicTransport
  if (result.data.features !== undefined) dbLocation.features = result.data.features
  if (result.data.specialties !== undefined) dbLocation.specialties = result.data.specialties
  if (result.data.coordinates !== undefined) dbLocation.coordinates = result.data.coordinates
  if (result.data.image !== undefined) dbLocation.image = result.data.image
  if (result.data.isMain !== undefined) dbLocation.is_main = result.data.isMain

  dbLocation.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('locations')
    .update(dbLocation)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return success(data, '地點更新成功')
}

/**
 * DELETE /api/admin/locations - 刪除地點（管理員專用）
 */
async function handleDELETE(request: NextRequest) {
  // Rate limiting
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(`admin-locations-${clientIp}`, 30, 60000)) {
    throw new ValidationError('請求過於頻繁，請稍後再試')
  }

  // 驗證管理員權限
  const authResult = await checkAdminPermission(request)
  if (!authResult.isValid) {
    return createAuthErrorResponse(authResult)
  }

  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    throw new ValidationError('Location ID is required')
  }

  // 驗證數字 ID 格式
  const result = AdminLocationDeleteSchema.safeParse({ id })
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`ID 驗證失敗: ${errors}`)
  }

  apiLogger.info('管理員刪除地點', {
    metadata: {
      adminAccess: true,
      locationId: id,
    },
  })

  const { error } = await supabaseAdmin.from('locations').delete().eq('id', id)

  if (error) throw error

  return success({ id }, '地點刪除成功')
}

// 導出處理器
export const GET = withErrorHandler(handleGET, {
  module: 'AdminLocationAPI',
  enableAuditLog: false,
})

export const POST = withErrorHandler(handlePOST, {
  module: 'AdminLocationAPI',
  enableAuditLog: true,
})

export const PUT = withErrorHandler(handlePUT, {
  module: 'AdminLocationAPI',
  enableAuditLog: true,
})

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'AdminLocationAPI',
  enableAuditLog: true,
})
