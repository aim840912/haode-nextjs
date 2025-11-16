/**
 * Supabase Profile 操作
 * 提供使用者 Profile 的 CRUD 功能
 */

import { authLogger } from '@/lib/logger'
import { supabase } from './supabase-proxies'

export interface Profile {
  id: string
  name: string
  phone?: string
  address?: {
    street?: string
    city?: string
    postalCode?: string
    country?: string
  }
  role: 'customer' | 'admin'
  created_at: string
  updated_at: string
}

/**
 * 取得使用者 profile
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

  if (error) {
    authLogger.error('Failed to fetch user profile', new Error(error.message), {
      module: 'supabase-profile',
      action: 'getUserProfile',
      metadata: {
        userId,
        error: error.message,
        code: error.code,
      },
    })
    return null
  }

  return {
    ...data,
    phone: data.phone ?? undefined,
    address: data.address ?? undefined,
  } as Profile
}

/**
 * 建立或更新使用者 profile
 */
export async function upsertProfile(
  profile: Partial<Profile> & { id: string }
): Promise<Profile | null> {
  const { data, error } = await (supabase as any).from('profiles').upsert(profile).select().single()

  if (error) {
    authLogger.error('Failed to upsert user profile', new Error(error.message), {
      module: 'supabase-profile',
      action: 'upsertProfile',
      metadata: {
        userId: profile.id,
        error: error.message,
        code: error.code,
      },
    })
    return null
  }

  return data
}

/**
 * 更新使用者 profile
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    authLogger.error('Failed to update user profile', new Error(error.message), {
      module: 'supabase-profile',
      action: 'updateProfile',
      metadata: {
        userId,
        error: error.message,
        code: error.code,
      },
    })
    return null
  }

  return data
}
