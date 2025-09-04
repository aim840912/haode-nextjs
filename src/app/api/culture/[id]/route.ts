import { NextRequest } from 'next/server'
import { getCultureService } from '@/services/serviceFactory'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/error-handler'
import { success } from '@/lib/api-response'
import { NotFoundError, ValidationError } from '@/lib/errors'

async function handleGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  apiLogger.info('開始查詢文化典藏項目', {
    module: 'Culture',
    action: 'GET',
    metadata: { id },
  })

  if (!id) {
    throw new ValidationError('ID 參數為必需')
  }

  const cultureService = await getCultureService()
  const cultureItem = await cultureService.getCultureItemById(id)

  if (!cultureItem) {
    apiLogger.warn('文化典藏項目不存在', {
      module: 'Culture',
      action: 'GET',
      metadata: { id },
    })
    throw new NotFoundError('文化典藏項目不存在')
  }

  apiLogger.info('文化典藏項目查詢成功', {
    module: 'Culture',
    action: 'GET',
    metadata: { id, title: cultureItem.title },
  })

  return success(cultureItem, '查詢成功')
}

async function handlePUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  apiLogger.info('開始更新文化典藏項目', {
    module: 'Culture',
    action: 'PUT',
    metadata: { id },
  })

  if (!id) {
    throw new ValidationError('ID 參數為必需')
  }

  const cultureService = await getCultureService()

  // 檢查是否為 FormData（包含檔案上傳）
  const contentType = request.headers.get('content-type') || ''
  let itemData: Record<string, unknown>

  if (contentType.includes('multipart/form-data')) {
    // 處理 FormData
    const formData = await request.formData()

    itemData = {
      title: formData.get('title') as string,
      subtitle: formData.get('subtitle') as string,
      description: formData.get('description') as string,
      height: formData.get('height') as string,
      imageUrl: (formData.get('imageUrl') as string) || undefined,
    }

    // 處理上傳的圖片檔案
    const imageFile = formData.get('imageFile') as File
    if (imageFile && imageFile.size > 0) {
      itemData.imageFile = imageFile
      apiLogger.debug('更新收到圖片檔案', {
        action: 'PUT /api/culture/[id]',
        module: 'Culture',
        metadata: {
          fileName: imageFile.name,
          fileSize: `${(imageFile.size / 1024 / 1024).toFixed(2)}MB`,
        },
      })
    }

    apiLogger.debug('更新 FormData 解析結果', {
      action: 'PUT /api/culture/[id]',
      module: 'Culture',
      metadata: {
        ...itemData,
        imageFile: itemData.imageFile ? `File: ${itemData.imageFile.name}` : undefined,
      },
    })
  } else {
    // 處理 JSON（向後相容）
    itemData = await request.json()
    apiLogger.debug('更新 JSON 資料', {
      action: 'PUT /api/culture/[id]',
      module: 'Culture',
      metadata: itemData,
    })
  }

  const cultureItem = await cultureService.updateCultureItem(id, itemData)

  apiLogger.info('文化典藏項目更新成功', {
    module: 'Culture',
    action: 'PUT',
    metadata: { id, title: cultureItem.title },
  })

  return success(cultureItem, '更新成功')
}

async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  apiLogger.info('開始刪除文化典藏項目', {
    module: 'Culture',
    action: 'DELETE',
    metadata: { id },
  })

  if (!id) {
    throw new ValidationError('ID 參數為必需')
  }

  const cultureService = await getCultureService()
  await cultureService.deleteCultureItem(id)

  apiLogger.info('文化典藏項目刪除成功', {
    module: 'Culture',
    action: 'DELETE',
    metadata: { id },
  })

  return success({ success: true }, '刪除成功')
}

// 導出使用 withErrorHandler 中間件的處理器
export const GET = withErrorHandler(handleGET, { module: 'Culture' })
export const PUT = withErrorHandler(handlePUT, { module: 'Culture' })
export const DELETE = withErrorHandler(handleDELETE, { module: 'Culture' })
