import { NextRequest } from 'next/server'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { ValidationError } from '@/lib/errors'
import { created } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { unifiedImageService } from '@/services/infrastructure/unified-image-service'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/database/supabase-auth'

const FarmTourActivityWithImagesSchema = z.object({
  activity: z.object({
    id: z.string().uuid('活動 ID 必須是有效的 UUID'),
    start_month: z.number().int().min(1, '開始月份必須是 1-12').max(12, '開始月份必須是 1-12'),
    end_month: z.number().int().min(1, '結束月份必須是 1-12').max(12, '結束月份必須是 1-12'),
    title: z.string().min(1, '活動標題不能為空').max(100, '活動標題過長'),
    activities: z
      .array(z.string().max(50, '活動項目不能超過 50 字元'))
      .min(1, '至少要有一個活動項目'),
    price: z.number().min(0, '價格不能為負數').default(0),
    available: z.boolean().default(true),
    note: z.string().max(500, '備註不能超過 500 字元').default(''),
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
    ),
})

async function handlePOST(request: NextRequest, user: User) {
  const timer = apiLogger.timer('事務式建立農場體驗活動')

  apiLogger.info('收到事務式建立農場體驗活動請求', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
    },
  })

  const body = await request.json()

  const validation = FarmTourActivityWithImagesSchema.safeParse(body)

  if (!validation.success) {
    const errors = validation.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')

    apiLogger.warn('農場體驗活動資料驗證失敗', {
      metadata: {
        errors: validation.error.issues,
        userId: user.id,
      },
    })

    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  const { activity, image } = validation.data

  apiLogger.info('開始事務式建立農場體驗活動', {
    metadata: {
      activityId: activity.id,
      activityTitle: activity.title,
      hasImage: !!image,
      userId: user.id,
      userEmail: user.email,
    },
  })

  // 處理圖片上傳（必須有圖片）
  let imageUrl = ''
  if (image.base64Data && image.fileName) {
    apiLogger.info('處理記憶體模式圖片', {
      metadata: {
        fileName: image.fileName,
        size: image.size,
        activityId: activity.id,
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
        'farm-tour',
        activity.id,
        image.size || 'medium',
        0
      )

      imageUrl = uploadResult.url

      apiLogger.info('記憶體模式圖片上傳成功', {
        metadata: {
          fileName: image.fileName,
          uploadedUrl: uploadResult.url,
          uploadedPath: uploadResult.path,
          activityId: activity.id,
        },
      })
    } catch (uploadError) {
      apiLogger.error('記憶體模式圖片上傳失敗', uploadError as Error, {
        metadata: {
          fileName: image.fileName,
          activityId: activity.id,
        },
      })
      throw new Error(`圖片上傳失敗：${image.fileName}`)
    }
  } else if (image.url) {
    // 已上傳模式：直接使用現有的 URL
    imageUrl = image.url
  }

  if (!imageUrl) {
    throw new ValidationError('農場體驗活動必須包含圖片')
  }

  // 準備活動資料
  const activityData = {
    id: activity.id,
    start_month: activity.start_month,
    end_month: activity.end_month,
    title: activity.title,
    activities: activity.activities,
    price: activity.price,
    image: imageUrl,
    available: activity.available,
    note: activity.note || '',
  }

  apiLogger.info('即將插入農場體驗活動資料', {
    metadata: {
      activityId: activity.id,
      activityTitle: activity.title,
      imageUrl,
    },
  })

  // 插入活動資料
  const supabase = getSupabaseAdmin()

  if (!supabase) {
    apiLogger.error('Supabase admin client 未配置', new Error('Missing admin client'), {
      metadata: { userId: user.id },
    })
    throw new Error('系統設定錯誤，請聯繫管理員')
  }

  const { data: insertedActivity, error: insertError } = await supabase
    .from('farm_tour')
    .insert(activityData)
    .select()
    .single()

  if (insertError) {
    const errorObj = new Error(insertError.message)
    apiLogger.error('農場體驗活動資料插入失敗', errorObj, {
      metadata: {
        activityId: activity.id,
        errorCode: insertError.code,
        errorMessage: insertError.message,
        userId: user.id,
      },
    })

    // 如果圖片已上傳但資料插入失敗，嘗試清理圖片
    if (imageUrl && image.base64Data) {
      try {
        await unifiedImageService.deleteImage(imageUrl)
        apiLogger.info('已清理上傳失敗的圖片', {
          metadata: { imageUrl, activityId: activity.id },
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
      activityId: activity.id,
      imageUrl,
    },
  })

  apiLogger.info('農場體驗活動建立成功', {
    metadata: {
      activityId: activity.id,
      activityTitle: activity.title,
      imageUrl,
      duration: `${duration}ms`,
      userId: user.id,
      userEmail: user.email,
    },
  })

  return created(
    {
      activity: insertedActivity,
      meta: {
        activityId: activity.id,
        imageUrl,
        totalDuration: `${duration}ms`,
      },
    },
    '農場體驗活動建立成功'
  )
}

export const POST = withAdminAndError(handlePOST, {
  module: 'CreateFarmTourActivityWithImagesAPI',
  enableAuditLog: true,
})
