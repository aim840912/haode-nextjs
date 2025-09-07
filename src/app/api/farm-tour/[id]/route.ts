import { NextRequest } from 'next/server'
import { farmTourServiceAdapter } from '@/services/farmTourServiceAdapter'
import { withErrorHandler } from '@/lib/error-handler'
import { NotFoundError } from '@/lib/errors'
import { success } from '@/lib/api-response'

// GET - 根據ID獲取活動
async function handleGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const activity = await farmTourServiceAdapter.getById(id)

  if (!activity) {
    throw new NotFoundError('Activity not found')
  }

  return success(activity, '成功取得農場參觀活動')
}

export const GET = withErrorHandler(handleGET, {
  module: 'FarmTourDetail',
  enableAuditLog: false,
})

// PUT - 更新活動
async function handlePUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const updatedActivity = await farmTourServiceAdapter.update(id, body)

  if (!updatedActivity) {
    throw new NotFoundError('Activity not found')
  }

  return success(updatedActivity, '農場參觀活動已成功更新')
}

export const PUT = withErrorHandler(handlePUT, {
  module: 'FarmTourDetail',
  enableAuditLog: true,
})

// DELETE - 刪除活動
async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await farmTourServiceAdapter.delete(id)

  if (!result) {
    throw new NotFoundError('Activity not found')
  }

  return success({ deleted: true }, '農場參觀活動已成功刪除')
}

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'FarmTourDetail',
  enableAuditLog: true,
})
