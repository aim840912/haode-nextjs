import { NextRequest } from 'next/server'
import { success, created } from '@/lib/api-response'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { DevNoteInput } from '@/types/devNote'

async function handleGET(request: NextRequest, _user: User) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')

  const supabase = await createServerSupabaseClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('dev_notes')
    .select('*')
    .order('created_at', { ascending: false })

  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)

  const { data, error } = await query

  if (error) throw error

  return success(data, '查詢成功')
}

async function handlePOST(request: NextRequest, user: User) {
  const body: DevNoteInput = await request.json()

  const supabase = await createServerSupabaseClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('dev_notes')
    .insert({
      ...body,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error

  return created(data, '建立成功')
}

export const GET = withAdminAndError(handleGET, {
  module: 'DevNotesAPI',
  enableAuditLog: false,
})

export const POST = withAdminAndError(handlePOST, {
  module: 'DevNotesAPI',
  enableAuditLog: true,
})
