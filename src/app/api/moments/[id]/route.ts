import { NextRequest } from 'next/server'
import { getMomentService } from '@/services/serviceFactory'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/error-handler'
import { success } from '@/lib/api-response'
import { NotFoundError, ValidationError } from '@/lib/errors'

async function handleGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  apiLogger.info('開始查詢精彩時刻項目', {
    module: 'Moments',
    action: 'GET',
    metadata: { id },
  })

  if (!id) {
    throw new ValidationError('ID 參數為必需')
  }

  const momentService = await getMomentService()
  const momentItem = await momentService.getMomentItemById(id)

  if (!momentItem) {
    apiLogger.warn('精彩時刻項目不存在', {
      module: 'Moments',
      action: 'GET',
      metadata: { id },
    })
    throw new NotFoundError('精彩時刻項目不存在')
  }

  apiLogger.info('精彩時刻項目查詢成功', {
    module: 'Moments',
    action: 'GET',
    metadata: { id, title: momentItem.title },
  })

  return success(momentItem, '查詢成功')
}

async function handlePUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  apiLogger.info('開始更新精彩時刻項目', {
    module: 'Moments',
    action: 'PUT',
    metadata: { id },
  })

  if (!id) {
    throw new ValidationError('ID 參數為必需')
  }

  const momentService = await getMomentService()

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
        action: 'PUT /api/moments/[id]',
        module: 'Moments',
        metadata: {
          fileName: imageFile.name,
          fileSize: `${(imageFile.size / 1024 / 1024).toFixed(2)}MB`,
        },
      })
    }

    apiLogger.debug('更新 FormData 解析結果', {
      action: 'PUT /api/moments/[id]',
      module: 'Moments',
      metadata: {
        ...itemData,
        imageFile: itemData.imageFile ? `File: ${(itemData.imageFile as File).name}` : undefined,
      },
    })
  } else {
    // 處理 JSON（向後相容）
    itemData = await request.json()
    apiLogger.debug('更新 JSON 資料', {
      action: 'PUT /api/moments/[id]',
      module: 'Moments',
      metadata: itemData,
    })
  }

  const momentItem = await momentService.updateMomentItem(id, itemData)

  apiLogger.info('精彩時刻項目更新成功', {
    module: 'Moments',
    action: 'PUT',
    metadata: { id, title: momentItem.title },
  })

  return success(momentItem, '更新成功')
}

async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  apiLogger.info('開始刪除精彩時刻項目', {
    module: 'Moments',
    action: 'DELETE',
    metadata: { id },
  })

  if (!id) {
    throw new ValidationError('ID 參數為必需')
  }

  const momentService = await getMomentService()
  await momentService.deleteMomentItem(id)

  apiLogger.info('精彩時刻項目刪除成功', {
    module: 'Moments',
    action: 'DELETE',
    metadata: { id },
  })

  return success({ success: true }, '刪除成功')
}

// 導出使用 withErrorHandler 中間件的處理器
export const GET = withErrorHandler(handleGET, { module: 'Moments' })
export const PUT = withErrorHandler(handlePUT, { module: 'Moments' })
export const DELETE = withErrorHandler(handleDELETE, { module: 'Moments' })
