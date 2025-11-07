/**
 * @api {post} /api/admin/locations/create-with-images 建立門市（含圖片）
 * @apiName CreateLocationWithImages
 * @apiGroup AdminLocations
 * @apiPermission admin
 * @apiDescription 事務式建立門市，支援 Base64 圖片上傳或已上傳圖片 URL
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { created } from '@/lib/api-response'
import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { unifiedImageService } from '@/services/infrastructure/unified-image-service'

const LocationWithImagesSchema = z.object({
  location: z.object({
    id: z.string().uuid('門市 ID 必須是有效的 UUID'),
    name: z.string().min(1, '門市名稱不能為空').max(100, '門市名稱過長'),
    title: z.string().min(1, '完整標題不能為空').max(200, '完整標題過長'),
    address: z.string().min(1, '門市地址不能為空').max(255, '門市地址過長'),
    landmark: z.string().max(255, '地標說明過長').default(''),
    phone: z.string().min(1, '電話號碼不能為空').max(50, '電話號碼過長'),
    lineId: z.string().max(100, 'LINE ID 過長').default(''),
    hours: z.string().min(1, '營業時間不能為空').max(100, '營業時間過長'),
    closedDays: z.string().max(100, '公休日說明過長').default(''),
    parking: z.string().max(255, '停車資訊過長').default(''),
    publicTransport: z.string().max(255, '大眾運輸資訊過長').default(''),
    features: z.array(z.string()).default([]),
    specialties: z.array(z.string()).default([]),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    isMain: z.boolean().default(false),
  }),
  image: z
    .object({
      // 支援記憶體模式（Base64）或已上傳模式（URL）
      base64Data: z.string().optional(),
      fileName: z.string().optional(),
      url: z.string().url('圖片 URL 格式不正確').optional(),
      alt: z.string().max(255, '圖片替代文字過長').optional(),
      size: z.enum(['thumbnail', 'medium', 'large']).default('medium'),
      file_size: z.number().int().positive('檔案大小必須為正整數').optional(),
    })
    .refine(
      data => {
        // 必須是記憶體模式（有 base64Data 和 fileName）或已上傳模式（有 url）
        const hasMemoryData = data.base64Data && data.fileName
        const hasUploadedData = data.url
        return hasMemoryData || hasUploadedData
      },
      {
        message: '圖片必須提供 Base64資料+檔名（記憶體模式）或 URL（已上傳模式）',
      }
    )
    .nullable()
    .optional(),
})

async function handlePOST(request: NextRequest, user: User) {
  const timer = apiLogger.timer('事務式建立門市')

  apiLogger.info('收到事務式建立門市請求', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
    },
  })

  const body = await request.json()

  const validation = LocationWithImagesSchema.safeParse(body)

  if (!validation.success) {
    const errors = validation.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')

    apiLogger.warn('門市資料驗證失敗', {
      metadata: {
        errors: validation.error.issues,
        userId: user.id,
      },
    })

    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  const { location, image } = validation.data

  apiLogger.info('開始事務式建立門市', {
    metadata: {
      locationId: location.id,
      locationName: location.name,
      hasImage: !!image,
      userId: user.id,
      userEmail: user.email,
    },
  })

  // 處理圖片上傳（如果有）
  let imageUrl = ''
  if (image && image.base64Data && image.fileName) {
    apiLogger.info('處理記憶體模式圖片', {
      metadata: {
        fileName: image.fileName,
        size: image.size,
        locationId: location.id,
      },
    })

    try {
      // 將 Base64 轉換為 File 物件
      const base64Response = await fetch(image.base64Data)
      const blob = await base64Response.blob()
      const file = new File([blob], image.fileName, { type: blob.type })

      // 使用統一圖片服務上傳
      const uploadResult = await unifiedImageService.uploadImage(
        file,
        'locations',
        location.id,
        image.size || 'medium',
        0
      )

      imageUrl = uploadResult.url

      apiLogger.info('記憶體模式圖片上傳成功', {
        metadata: {
          fileName: image.fileName,
          uploadedUrl: uploadResult.url,
          uploadedPath: uploadResult.path,
          locationId: location.id,
        },
      })
    } catch (uploadError) {
      apiLogger.error('記憶體模式圖片上傳失敗', uploadError as Error, {
        metadata: {
          fileName: image.fileName,
          locationId: location.id,
        },
      })
      throw new Error(`圖片上傳失敗：${image.fileName}`)
    }
  } else if (image && image.url) {
    // 已上傳模式：直接使用現有的 URL
    imageUrl = image.url
  }

  // 準備門市資料
  const locationData = {
    id: location.id,
    name: location.name,
    title: location.title,
    address: location.address,
    landmark: location.landmark || '',
    phone: location.phone,
    line_id: location.lineId || '',
    hours: location.hours,
    closed_days: location.closedDays || '',
    parking: location.parking || '',
    public_transport: location.publicTransport || '',
    features: location.features,
    specialties: location.specialties,
    coordinates: location.coordinates,
    image: imageUrl,
    is_main: location.isMain,
  }

  apiLogger.info('即將插入門市資料', {
    metadata: {
      locationId: location.id,
      locationName: location.name,
      hasImage: !!imageUrl,
    },
  })

  // 插入門市資料
  const supabase = getSupabaseAdmin()

  if (!supabase) {
    apiLogger.error('Supabase admin client 未配置', new Error('Missing admin client'), {
      metadata: { userId: user.id },
    })
    throw new Error('系統設定錯誤，請聯繫管理員')
  }

  const { data: insertedLocation, error: insertError } = await supabase
    .from('locations')
    .insert(locationData)
    .select()
    .single()

  if (insertError) {
    const errorObj = new Error(insertError.message)
    apiLogger.error('門市資料插入失敗', errorObj, {
      metadata: {
        locationId: location.id,
        errorCode: insertError.code,
        errorMessage: insertError.message,
        userId: user.id,
      },
    })

    // 如果圖片已上傳但資料插入失敗，嘗試清理圖片
    if (imageUrl && image?.base64Data) {
      try {
        await unifiedImageService.deleteImage(imageUrl)
        apiLogger.info('已清理上傳失敗的圖片', {
          metadata: { imageUrl, locationId: location.id },
        })
      } catch (cleanupError) {
        apiLogger.warn('清理圖片失敗', {
          metadata: { imageUrl, error: String(cleanupError) },
        })
      }
    }

    throw errorObj
  }

  const duration = timer.end({
    metadata: {
      locationId: location.id,
      hasImage: !!imageUrl,
    },
  })

  apiLogger.info('門市建立成功', {
    metadata: {
      locationId: location.id,
      locationName: location.name,
      hasImage: !!imageUrl,
      duration: `${duration}ms`,
      userId: user.id,
      userEmail: user.email,
    },
  })

  return created(
    {
      location: insertedLocation,
      meta: {
        locationId: location.id,
        hasImage: !!imageUrl,
        totalDuration: `${duration}ms`,
      },
    },
    '門市建立成功'
  )
}

export const POST = withAdminAndError(handlePOST, {
  module: 'CreateLocationWithImagesAPI',
  enableAuditLog: true,
})
