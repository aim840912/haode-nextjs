/**
 * @api {post} /api/admin/products/create-with-images 建立產品（含圖片）
 * @apiName CreateProductWithImages
 * @apiGroup AdminProducts
 * @apiPermission admin
 * @apiDescription 事務式建立產品，支援 Base64 圖片上傳或已上傳圖片 URL（最多 10 張）
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { created } from '@/lib/api-response'
import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { unifiedImageService } from '@/services/infrastructure/unified-image-service'

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
      z
        .object({
          // 支援兩種模式：已上傳模式（有 url/path）或記憶體模式（有 base64Data）
          url: z.string().url('圖片 URL 格式不正確').optional(),
          path: z.string().min(1, '圖片路徑不能為空').optional(),
          base64Data: z.string().optional(), // 記憶體模式：Base64 編碼的圖片資料
          fileName: z.string().optional(), // 記憶體模式：原始檔案名稱
          alt: z.string().max(255, '圖片替代文字過長').optional(),
          position: z.number().int().min(0, '圖片位置不能為負').optional(),
          size: z.enum(['thumbnail', 'medium', 'large']).default('medium'),
          width: z.number().int().positive('圖片寬度必須為正整數').optional(),
          height: z.number().int().positive('圖片高度必須為正整數').optional(),
          file_size: z.number().int().positive('檔案大小必須為正整數').optional(),
        })
        .refine(
          data => {
            // 必須是已上傳模式（有 url 和 path）或記憶體模式（有 base64Data 和 fileName）
            const hasUploadedData = data.url && data.path
            const hasMemoryData = data.base64Data && data.fileName
            return hasUploadedData || hasMemoryData
          },
          {
            message: '圖片必須提供 URL+路徑（已上傳模式）或 Base64資料+檔名（記憶體模式）',
          }
        )
    )
    .max(10, '最多只能上傳 10 張圖片')
    .default([]),
})

async function handlePOST(request: NextRequest, user: User) {
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

  // 處理記憶體模式的圖片：將 Base64 資料上傳到 Supabase
  const processedImages = []
  for (const imageData of images) {
    if (imageData.base64Data && imageData.fileName) {
      // 記憶體模式：需要先上傳圖片
      apiLogger.info('處理記憶體模式圖片', {
        metadata: {
          fileName: imageData.fileName,
          size: imageData.size,
          productId: product.id,
        },
      })

      try {
        // 將 Base64 轉換為 File 物件
        const base64Response = await fetch(imageData.base64Data)
        const blob = await base64Response.blob()
        const file = new File([blob], imageData.fileName, { type: blob.type })

        // 使用統一圖片服務上傳
        const uploadResult = await unifiedImageService.uploadImage(
          file,
          'products',
          product.id,
          imageData.size || 'medium',
          imageData.position || 0
        )

        // 轉換為資料庫期望的格式
        processedImages.push({
          url: uploadResult.url, // 使用統一圖片服務返回的 url
          path: uploadResult.path, // 使用統一圖片服務返回的 path
          alt: imageData.alt || '',
          position: imageData.position || 0,
          size: imageData.size || 'medium',
          width: imageData.width,
          height: imageData.height,
          file_size: imageData.file_size || file.size,
        })

        apiLogger.info('記憶體模式圖片上傳成功', {
          metadata: {
            fileName: imageData.fileName,
            uploadedUrl: uploadResult.url,
            uploadedPath: uploadResult.path,
            productId: product.id,
          },
        })
      } catch (uploadError) {
        apiLogger.error('記憶體模式圖片上傳失敗', uploadError as Error, {
          metadata: {
            fileName: imageData.fileName,
            productId: product.id,
          },
        })
        throw new Error(`圖片上傳失敗：${imageData.fileName}`)
      }
    } else if (imageData.url && imageData.path) {
      // 已上傳模式：直接使用現有的 URL 和路徑
      processedImages.push({
        url: imageData.url,
        path: imageData.path,
        alt: imageData.alt || '',
        position: imageData.position || 0,
        size: imageData.size || 'medium',
        width: imageData.width,
        height: imageData.height,
        file_size: imageData.file_size,
      })
    }
  }

  const supabase = getSupabaseAdmin()

  if (!supabase) {
    apiLogger.error('Supabase admin client 未配置', new Error('Missing admin client'), {
      metadata: { userId: user.id },
    })
    throw new Error('系統設定錯誤，請聯繫管理員')
  }

  // 除錯：記錄傳遞給 RPC 函數的資料
  apiLogger.info('即將調用 RPC 函數', {
    metadata: {
      productId: product.id,
      processedImagesCount: processedImages.length,
      processedImages: processedImages.map(img => ({
        url: img.url,
        path: img.path,
        hasUrl: !!img.url,
        hasPath: !!img.path,
        urlType: typeof img.url,
        pathType: typeof img.path,
      })),
    },
  })

  // @ts-expect-error - Supabase RPC 函數未在類型定義中，但在資料庫中已定義
  const result = await supabase.rpc('create_product_with_images', {
    product_data: product,
    images_data: processedImages,
  })

  type RpcResponse = {
    success: boolean
    error?: string
    error_code?: string
    error_details?: unknown
    message?: string
    data?: {
      product: unknown
      images: unknown[]
    }
    meta?: {
      executionTime?: string
    }
  }

  const { data, error } = result as {
    data: RpcResponse | null
    error: { code: string; message: string } | null
  }

  if (error) {
    const errorObj = new Error(error.message)
    apiLogger.error('PostgreSQL 函數執行失敗', errorObj, {
      metadata: {
        productId: product.id,
        function: 'create_product_with_images',
        errorCode: error.code,
        errorMessage: error.message,
        userId: user.id,
      },
    })
    throw errorObj
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
      imageCount: processedImages.length,
      executionTime: data.meta?.executionTime,
    },
  })

  apiLogger.info('產品建立成功', {
    metadata: {
      productId: product.id,
      productName: product.name,
      imageCount: processedImages.length,
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
        imageCount: processedImages.length,
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
