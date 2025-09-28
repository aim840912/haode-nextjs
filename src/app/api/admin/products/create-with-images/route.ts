import { NextRequest } from 'next/server'
import { withAdminAndError } from '@/lib/middleware/api-middleware'
import { ValidationError } from '@/lib/errors'
import { created } from '@/lib/api-response'
import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { apiLogger } from '@/lib/logger'
import { z } from 'zod'

const ProductWithImagesSchema = z.object({
  product: z.object({
    id: z.string().uuid('產品 ID 必須是有效的 UUID'),
    name: z.string().min(1, '產品名稱不能為空').max(255, '產品名稱過長'),
    description: z.string().min(1, '產品描述不能為空'),
    category: z.string().min(1, '產品分類不能為空').max(100, '產品分類過長'),
    price: z.number().min(0, '價格不能為負數'),
    priceUnit: z.string().default('斤'),
    unitQuantity: z.number().int().positive('單位數量必須為正整數').default(1),
    inventory: z.number().int().min(0, '庫存不能為負數').default(0),
    isActive: z.boolean().default(true),
  }),
  images: z
    .array(
      z.object({
        url: z.string().url('圖片 URL 格式不正確'),
        path: z.string().min(1, '圖片路徑不能為空'),
        alt: z.string().max(255, '圖片替代文字過長').optional(),
        position: z.number().int().min(0, '圖片位置不能為負').optional(),
        size: z.enum(['thumbnail', 'medium', 'large']).default('medium'),
        width: z.number().int().positive('圖片寬度必須為正整數').optional(),
        height: z.number().int().positive('圖片高度必須為正整數').optional(),
        file_size: z.number().int().positive('檔案大小必須為正整數').optional(),
      })
    )
    .max(10, '最多只能上傳 10 張圖片')
    .default([]),
})

async function handlePOST(request: NextRequest, user: any) {
  const timer = apiLogger.timer('事務式建立產品')

  apiLogger.info('收到事務式建立產品請求', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
    },
  })

  const body = await request.json()

  const validation = ProductWithImagesSchema.safeParse(body)

  if (!validation.success) {
    const errors = validation.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')

    apiLogger.warn('產品資料驗證失敗', {
      metadata: {
        errors: validation.error.issues,
        userId: user.id,
      },
    })

    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  const { product, images } = validation.data

  apiLogger.info('開始事務式建立產品', {
    metadata: {
      productId: product.id,
      productName: product.name,
      imageCount: images.length,
      userId: user.id,
      userEmail: user.email,
    },
  })

  const supabase = getSupabaseAdmin()

  if (!supabase) {
    apiLogger.error('Supabase admin client 未配置', new Error('Missing admin client'), {
      metadata: { userId: user.id },
    })
    throw new Error('系統設定錯誤，請聯繫管理員')
  }

  // @ts-expect-error - Supabase RPC 函數未在類型定義中，但在資料庫中已定義
  const result = await supabase.rpc('create_product_with_images', {
    product_data: product,
    images_data: images,
  })

  const { data, error } = result as { data: any; error: any }

  if (error) {
    apiLogger.error('PostgreSQL 函數執行失敗', error, {
      metadata: {
        productId: product.id,
        function: 'create_product_with_images',
        errorCode: error.code,
        errorMessage: error.message,
        userId: user.id,
      },
    })
    throw error
  }

  if (!data) {
    apiLogger.error('PostgreSQL 函數未返回資料', new Error('No data returned'), {
      metadata: { productId: product.id, userId: user.id },
    })
    throw new Error('產品建立失敗：未返回資料')
  }

  if (!data.success) {
    apiLogger.error('產品建立失敗', new Error(data.error || '未知錯誤'), {
      metadata: {
        productId: product.id,
        errorCode: data.error_code,
        errorDetails: data.error_details,
        userId: user.id,
      },
    })
    throw new Error(data.error || '產品建立失敗')
  }

  const duration = timer.end({
    metadata: {
      productId: product.id,
      imageCount: images.length,
      executionTime: data.meta?.executionTime,
    },
  })

  apiLogger.info('產品建立成功', {
    metadata: {
      productId: product.id,
      productName: product.name,
      imageCount: images.length,
      duration: `${duration}ms`,
      executionTime: data.meta?.executionTime,
      userId: user.id,
      userEmail: user.email,
    },
  })

  return created(
    {
      product: data.data?.product,
      images: data.data?.images || [],
      meta: {
        productId: product.id,
        imageCount: images.length,
        executionTime: data.meta?.executionTime,
        totalDuration: `${duration}ms`,
      },
    },
    data.message || '產品建立成功'
  )
}

export const POST = withAdminAndError(handlePOST, {
  module: 'CreateProductWithImagesAPI',
  enableAuditLog: true,
})
