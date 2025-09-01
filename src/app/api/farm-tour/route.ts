import { NextRequest } from 'next/server'
import { getFarmTourService } from '@/services/serviceFactory'
import { withErrorHandler } from '@/lib/error-handler'
import { success, created } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'

// GET - 獲取所有農場體驗活動
async function handleGET() {
  const farmTourService = await getFarmTourService()
  const activities = await farmTourService.getAll()
  return success(activities, '農場體驗活動清單取得成功')
}

// POST - 新增農場體驗活動
async function handlePOST(request: NextRequest) {
  // 基本驗證請求體
  const body = await request.json()
  
  if (!body || typeof body !== 'object') {
    throw new ValidationError('請求資料格式錯誤')
  }
  
  // 檢查必要欄位
  if (!body.title || typeof body.title !== 'string') {
    throw new ValidationError('活動標題為必填欄位')
  }

  const farmTourService = await getFarmTourService()
  const newActivity = await farmTourService.create(body)
  return created(newActivity, '農場體驗活動建立成功')
}

// 導出處理器 - 套用錯誤處理中間件
export const GET = withErrorHandler(handleGET, {
  module: 'FarmTourAPI',
  enableAuditLog: false
})

export const POST = withErrorHandler(handlePOST, {
  module: 'FarmTourAPI',
  enableAuditLog: true
})