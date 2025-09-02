import { NextRequest } from 'next/server'
import { getCultureService } from '@/services/serviceFactory'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/error-handler'
import { success, created } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { CultureSchemas } from '@/lib/validation-schemas'

async function handleGET() {
  const cultureService = await getCultureService()
  const cultureItems = await cultureService.getCultureItems()

  apiLogger.info('文化典藏項目列表取得成功', {
    action: 'GET /api/culture',
    module: 'Culture',
    metadata: { count: cultureItems.length },
  })

  return success(cultureItems, '文化典藏項目取得成功')
}

export const GET = withErrorHandler(handleGET, {
  module: 'CultureAPI',
  enableAuditLog: false,
})

async function handlePOST(request: NextRequest) {
  const cultureService = await getCultureService()

  // 檢查是否為 FormData（包含檔案上傳）
  const contentType = request.headers.get('content-type') || ''
  let itemData: Record<string, unknown>

  if (contentType.includes('multipart/form-data')) {
    // 處理 FormData
    const formData = await request.formData()

    itemData = {
      title: formData.get('title') as string,
      subtitle: (formData.get('subtitle') as string) || undefined,
      description: formData.get('description') as string,
      height: formData.get('height') as string,
      imageUrl: (formData.get('imageUrl') as string) || undefined,
    }

    // 處理上傳的圖片檔案
    const imageFile = formData.get('imageFile') as File
    if (imageFile && imageFile.size > 0) {
      itemData.imageFile = imageFile
      apiLogger.debug('收到圖片檔案', {
        metadata: {
          fileName: imageFile.name,
          fileSize: `${(imageFile.size / 1024 / 1024).toFixed(2)}MB`,
        },
      })
    }
  } else {
    // 處理 JSON（向後相容）
    itemData = await request.json()
  }

  // 使用 Zod 驗證資料
  const result = CultureSchemas.create.safeParse(itemData)
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('建立文化典藏項目', {
    metadata: {
      title: result.data.title,
      hasImageFile: !!result.data.imageFile,
      hasImageUrl: !!result.data.imageUrl,
    },
  })

  const cultureItem = await cultureService.addCultureItem(result.data)

  return created(cultureItem, '文化典藏項目建立成功')
}

export const POST = withErrorHandler(handlePOST, {
  module: 'CultureAPI',
  enableAuditLog: true,
})
