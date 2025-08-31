import { NextRequest, NextResponse } from 'next/server'
import { getCultureService } from '@/services/serviceFactory'
import { apiLogger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cultureService = await getCultureService()
    const cultureItem = await cultureService.getCultureItemById(id)
    if (!cultureItem) {
      return NextResponse.json(
        { error: 'Culture item not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(cultureItem)
  } catch (error) {
    const { id } = await params
    apiLogger.error('取得文化典藏項目失敗', error as Error, {
      action: 'GET /api/culture/[id]',
      module: 'Culture',
      metadata: { id }
    })
    return NextResponse.json(
      { error: 'Failed to fetch culture item' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
        apiLogger.debug('更新收到圖片檔案', {
          action: 'PUT /api/culture/[id]',
          module: 'Culture',
          metadata: {
            fileName: imageFile.name,
            fileSize: `${(imageFile.size / 1024 / 1024).toFixed(2)}MB`
          }
        })
      }
      
      apiLogger.debug('更新 FormData 解析結果', {
        action: 'PUT /api/culture/[id]',
        module: 'Culture',
        metadata: {
          ...itemData,
          imageFile: itemData.imageFile ? `File: ${itemData.imageFile.name}` : undefined
        }
      })
    } else {
      // 處理 JSON（向後相容）
      itemData = await request.json()
      apiLogger.debug('更新 JSON 資料', {
        action: 'PUT /api/culture/[id]',
        module: 'Culture',
        metadata: itemData
      })
    }
    
    const cultureItem = await cultureService.updateCultureItem(id, itemData)
    apiLogger.info('文化典藏項目更新成功', {
      action: 'PUT /api/culture/[id]',
      module: 'Culture',
      metadata: { id, title: cultureItem.title }
    })
    return NextResponse.json(cultureItem)
  } catch (error) {
    const { id } = await params
    apiLogger.error('更新文化典藏項目失敗', error as Error, {
      action: 'PUT /api/culture/[id]',
      module: 'Culture',
      metadata: { id }
    })
    return NextResponse.json(
      { error: 'Failed to update culture item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cultureService = await getCultureService()
    await cultureService.deleteCultureItem(id)
    apiLogger.info('文化典藏項目刪除成功', {
      action: 'DELETE /api/culture/[id]',
      module: 'Culture',
      metadata: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    const { id } = await params
    apiLogger.error('刪除文化典藏項目失敗', error as Error, {
      action: 'DELETE /api/culture/[id]',
      module: 'Culture',
      metadata: { id }
    })
    return NextResponse.json(
      { error: 'Failed to delete culture item' },
      { status: 500 }
    )
  }
}