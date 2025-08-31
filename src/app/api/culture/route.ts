import { NextRequest, NextResponse } from 'next/server'
import { getCultureService } from '@/services/serviceFactory'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/error-handler'
import { success, created, handleApiError } from '@/lib/api-response'
import { ErrorFactory } from '@/lib/errors'

async function handleGET() {
  const cultureService = await getCultureService()
  const cultureItems = await cultureService.getCultureItems()
  
  apiLogger.info('文化典藏項目列表取得成功', {
    action: 'GET /api/culture',
    module: 'Culture',
    metadata: { count: cultureItems.length }
  })
  
  return success(cultureItems, '文化典藏項目取得成功')
}

export const GET = withErrorHandler(handleGET, {
  module: 'Culture',
  enableAuditLog: false
})

async function handlePOST(request: NextRequest) {
  const cultureService = await getCultureService()
  
  // 檢查是否為 FormData（包含檔案上傳）
  const contentType = request.headers.get('content-type') || '';
  let itemData: any;
  
  if (contentType.includes('multipart/form-data')) {
    // 處理 FormData
    const formData = await request.formData()
    
    itemData = {
      title: formData.get('title') as string,
      subtitle: formData.get('subtitle') as string,
      description: formData.get('description') as string,
      height: formData.get('height') as string,
      imageUrl: formData.get('imageUrl') as string || undefined,
    }
    
    // 處理上傳的圖片檔案
    const imageFile = formData.get('imageFile') as File
    if (imageFile && imageFile.size > 0) {
      itemData.imageFile = imageFile
      apiLogger.debug('收到圖片檔案', {
        action: 'POST /api/culture',
        module: 'Culture',
        metadata: {
          fileName: imageFile.name,
          fileSize: `${(imageFile.size / 1024 / 1024).toFixed(2)}MB`
        }
      })
    }
    
    apiLogger.debug('FormData 解析結果', {
      action: 'POST /api/culture',
      module: 'Culture',
      metadata: {
        ...itemData,
        imageFile: itemData.imageFile ? `File: ${itemData.imageFile.name}` : undefined
      }
    })
  } else {
    // 處理 JSON（向後相容）
    itemData = await request.json()
    apiLogger.debug('JSON 資料', {
      action: 'POST /api/culture',
      module: 'Culture',
      metadata: itemData
    })
  }
  
  // 驗證必要欄位
  if (!itemData.title || !itemData.description) {
    throw ErrorFactory.createValidationError('標題和描述為必填欄位')
  }
  
  const cultureItem = await cultureService.addCultureItem(itemData)
  apiLogger.info('文化典藏項目建立成功', {
    action: 'POST /api/culture',
    module: 'Culture',
    metadata: { id: cultureItem.id, title: cultureItem.title }
  })
  
  return created(cultureItem, '文化典藏項目建立成功')
}

export const POST = withErrorHandler(handlePOST, {
  module: 'Culture',
  enableAuditLog: true,
  errorTransformer: (error: Error) => {
    // 針對文化典藏的特定錯誤轉換
    if (error.message.includes('duplicate')) {
      return ErrorFactory.createValidationError('此項目已存在')
    }
    return ErrorFactory.fromError(error, { module: 'Culture' })
  }
})