/**
 * 網站設定 API
 * GET: 取得所有設定或指定 key 的設定
 * POST: 建立新設定（管理員）
 * PUT: 更新設定（管理員）
 * DELETE: 刪除設定（管理員）
 */

import { NextRequest } from 'next/server'
import { withAdminAndError, withOptionalAuthAndError, User } from '@/lib/middleware/api-middleware'
import { success, created } from '@/lib/api-response'
import { ValidationError, MethodNotAllowedError } from '@/lib/errors'
import { siteSettingsService } from '@/services/core/content/siteSettingsService'
import type { SiteSettingInput, SiteSettingUpdate } from '@/types/siteSettings'

/**
 * GET /api/site-settings
 * 取得所有設定或指定 key 的設定
 */
async function handleGET(req: NextRequest, _user: User | null) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  const keys = searchParams.get('keys')

  if (key) {
    const setting = await siteSettingsService.getByKey(key)
    return success(setting, '設定取得成功')
  }

  if (keys) {
    const keyArray = keys.split(',').map(k => k.trim())
    const settingsMap = await siteSettingsService.getByKeys(keyArray)
    // 將 Record 轉換為陣列，因為前端期望的是 SiteSetting[]
    const settings = Object.values(settingsMap)
    return success(settings, '批次設定取得成功')
  }

  const settings = await siteSettingsService.getAll()
  return success(settings, '所有設定取得成功')
}

export const GET = withOptionalAuthAndError(handleGET, { module: 'SiteSettingsAPI' })

/**
 * POST /api/site-settings
 * 建立新設定（管理員權限）
 */
async function handlePOST(req: NextRequest, _user: User) {
  const body = await req.json()

  if (!body.key?.trim()) {
    throw new ValidationError('設定鍵 (key) 為必填欄位')
  }

  if (!body.value) {
    throw new ValidationError('設定值 (value) 為必填欄位')
  }

  if (!body.type) {
    throw new ValidationError('設定類型 (type) 為必填欄位')
  }

  const input: SiteSettingInput = {
    key: body.key,
    value: body.value,
    type: body.type,
    description: body.description,
  }

  const setting = await siteSettingsService.create(input)
  return created(setting, '設定建立成功')
}

export const POST = withAdminAndError(handlePOST, {
  module: 'SiteSettingsAPI',
  enableAuditLog: true,
})

/**
 * PUT /api/site-settings
 * 更新設定（管理員權限）
 */
async function handlePUT(req: NextRequest, _user: User) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')

  if (!key) {
    throw new ValidationError('請提供設定鍵 (key)')
  }

  const body = await req.json()

  if (!body.value) {
    throw new ValidationError('設定值 (value) 為必填欄位')
  }

  const input: SiteSettingUpdate = {
    value: body.value,
    description: body.description,
  }

  const setting = await siteSettingsService.update(key, input)
  return success(setting, '設定更新成功')
}

export const PUT = withAdminAndError(handlePUT, { module: 'SiteSettingsAPI', enableAuditLog: true })

/**
 * DELETE /api/site-settings
 * 刪除設定（管理員權限）
 */
async function handleDELETE(req: NextRequest, _user: User) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')

  if (!key) {
    throw new ValidationError('請提供設定鍵 (key)')
  }

  await siteSettingsService.delete(key)
  return success({ deleted: true }, '設定刪除成功')
}

export const DELETE = withAdminAndError(handleDELETE, {
  module: 'SiteSettingsAPI',
  enableAuditLog: true,
})

/**
 * PATCH /api/site-settings
 * Upsert 設定（存在則更新，不存在則創建）（管理員權限）
 */
async function handlePATCH(req: NextRequest, _user: User) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')

  if (!key) {
    throw new ValidationError('請提供設定鍵 (key)')
  }

  const body = await req.json()

  if (!body.value) {
    throw new ValidationError('設定值 (value) 為必填欄位')
  }

  const input = {
    value: body.value,
    description: body.description,
    type: body.type,
  }

  const setting = await siteSettingsService.upsert(key, input)
  return success(setting, '設定已儲存')
}

export const PATCH = withAdminAndError(handlePATCH, {
  module: 'SiteSettingsAPI',
  enableAuditLog: true,
})
