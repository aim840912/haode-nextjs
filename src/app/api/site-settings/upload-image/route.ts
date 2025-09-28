/**
 * 網站設定圖片上傳 API
 * POST: 上傳圖片到 Supabase Storage
 */

import { NextRequest } from 'next/server'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { apiLogger } from '@/lib/logger'

/**
 * POST /api/site-settings/upload-image
 * 上傳圖片並返回 URL
 */
async function handlePOST(req: NextRequest, user: User) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    throw new ValidationError('請選擇要上傳的圖片')
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new ValidationError('圖片大小不能超過 5MB')
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError('只支援 JPG、PNG、WebP 和 GIF 格式')
  }

  apiLogger.info('開始上傳網站設定圖片', {
    module: 'SiteSettingsUploadAPI',
    action: 'uploadImage',
    metadata: {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    },
  })

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    throw new Error('Supabase client 初始化失敗')
  }

  const timestamp = Date.now()
  const fileExt = file.name.split('.').pop()
  const fileName = `site-settings-${timestamp}.${fileExt}`
  const filePath = `site-settings/${fileName}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { data, error } = await supabase.storage.from('images').upload(filePath, buffer, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    apiLogger.error('圖片上傳失敗', error, {
      module: 'SiteSettingsUploadAPI',
      action: 'uploadImage',
      metadata: { fileName, error: error.message },
    })
    throw new Error(`圖片上傳失敗: ${error.message}`)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('images').getPublicUrl(data.path)

  apiLogger.info('圖片上傳成功', {
    module: 'SiteSettingsUploadAPI',
    action: 'uploadImage',
    metadata: {
      fileName,
      filePath: data.path,
      publicUrl,
    },
  })

  return success(
    {
      url: publicUrl,
      path: data.path,
      fileName,
    },
    '圖片上傳成功'
  )
}

export const POST = withAdminAndError(handlePOST, {
  module: 'SiteSettingsUploadAPI',
  enableAuditLog: true,
})
