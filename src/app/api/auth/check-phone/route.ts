import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { getSupabaseServer } from '@/lib/supabase-auth'

async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')

  // 驗證手機號碼參數
  if (!phone) {
    throw new ValidationError('請提供手機號碼')
  }

  // 驗證手機號碼格式
  const cleanPhone = phone.replace(/[-\s]/g, '')
  if (!/^09\d{8}$/.test(cleanPhone)) {
    throw new ValidationError('請輸入有效的台灣手機號碼（09開頭，10位數字）')
  }

  const supabase = getSupabaseServer()
  
  // 檢查手機號碼是否已被使用
  const { data: existingProfile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', cleanPhone)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 是 "not found" 錯誤，這是我們預期的
    throw new Error('檢查手機號碼時發生錯誤')
  }

  const isAvailable = !existingProfile

  return success({
    phone: cleanPhone,
    available: isAvailable,
    message: isAvailable 
      ? '此手機號碼可以使用' 
      : '此手機號碼已被註冊'
  }, '手機號碼檢查完成')
}

export const GET = withErrorHandler(handleGET, {
  module: 'CheckPhoneAPI',
  enableAuditLog: false // 不需要為這種查詢記錄審計日誌
})