/**
 * 網站設定 Server Actions
 *
 * 提供網站設定管理的 Server Actions:
 * - upsertSiteSettingAction - Upsert 單一設定 (僅管理員)
 * - upsertSiteSettingsBatchAction - 批次 Upsert 設定 (僅管理員)
 * - deleteSiteSettingAction - 刪除設定 (僅管理員)
 */

'use server'

import { revalidatePath } from 'next/cache'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { requireAdmin, success, error, logCreate, logUpdate } from '@/lib/server'
import { siteSettingsService } from '@/services/core/content/siteSettingsService'
import type { SiteSettingUpdate, SettingType } from '@/types/siteSettings'

/**
 * Upsert 單一網站設定
 *
 * 存在則更新，不存在則建立
 *
 * @param key - 設定鍵名
 * @param data - 設定資料
 * @returns ActionResponse 包含更新後的設定
 */
export async function upsertSiteSettingAction(
  key: string,
  data: SiteSettingUpdate & { type?: SettingType }
) {
  try {
    // 1. 管理員權限檢查
    const admin = await requireAdmin()

    // 2. 基本驗證
    if (!key?.trim()) {
      return error(new ValidationError('設定鍵 (key) 不能為空'))
    }

    if (!data.value) {
      return error(new ValidationError('設定值 (value) 不能為空'))
    }

    // 3. 取得當前設定（用於審計日誌）
    const currentSetting = await siteSettingsService.getByKey(key)
    const isNew = !currentSetting

    // 4. 記錄操作
    apiLogger.info(`${isNew ? '建立' : '更新'}網站設定`, {
      metadata: {
        adminId: admin.id,
        adminEmail: admin.email,
        key,
        isNew,
      },
    })

    // 5. 執行 Upsert
    const setting = await siteSettingsService.upsert(key, data)

    // 6. 審計日誌
    if (isNew) {
      await logCreate(admin, 'system_config', setting.id, {
        newData: {
          key: setting.key,
          type: setting.type,
        },
      })
    } else {
      await logUpdate(admin, 'system_config', setting.id, {
        previousData: { key: currentSetting.key },
        newData: { key: setting.key },
      })
    }

    // 7. Revalidation
    revalidatePath('/admin/site-settings')
    revalidatePath('/')
    revalidatePath('/farm-tour')

    // 8. 返回成功回應
    return success(setting, `設定${isNew ? '建立' : '更新'}成功`)
  } catch (err) {
    return error(err)
  }
}

/**
 * 批次 Upsert 網站設定
 *
 * 用於一次儲存多個設定，提高效率
 *
 * @param updates - 設定更新陣列
 * @returns ActionResponse 包含更新結果
 */
export async function upsertSiteSettingsBatchAction(
  updates: Array<{ key: string; value: string; type: SettingType }>
) {
  try {
    // 1. 管理員權限檢查
    const admin = await requireAdmin()

    // 2. 驗證
    if (!updates || updates.length === 0) {
      return error(new ValidationError('沒有要更新的設定'))
    }

    // 驗證每個設定
    for (const update of updates) {
      if (!update.key?.trim()) {
        return error(new ValidationError('設定鍵 (key) 不能為空'))
      }
      if (!update.value) {
        return error(new ValidationError(`設定 ${update.key} 的值不能為空`))
      }
    }

    // 3. 記錄操作
    apiLogger.info('批次更新網站設定', {
      metadata: {
        adminId: admin.id,
        adminEmail: admin.email,
        settingsCount: updates.length,
        keys: updates.map(u => u.key),
      },
    })

    // 4. 批次執行 Upsert
    const results = await Promise.all(
      updates.map(async update => {
        const setting = await siteSettingsService.upsert(update.key, {
          value: update.value,
          type: update.type,
        })
        return setting
      })
    )

    // 5. 審計日誌（批次操作記錄一次）
    await logUpdate(admin, 'system_config', 'batch', {
      previousData: { action: 'batch_upsert' },
      newData: { count: updates.length },
      metadata: {
        keysUpdated: updates.map(u => u.key),
      },
    })

    // 6. Revalidation
    revalidatePath('/admin/site-settings')
    revalidatePath('/')
    revalidatePath('/farm-tour')

    // 7. 返回成功回應
    return success(
      { updated: results.length, settings: results },
      `已成功儲存 ${results.length} 項設定`
    )
  } catch (err) {
    return error(err)
  }
}

/**
 * 刪除網站設定
 *
 * 僅限管理員操作
 *
 * @param key - 設定鍵名
 * @returns ActionResponse 包含刪除結果
 */
export async function deleteSiteSettingAction(key: string) {
  try {
    // 1. 管理員權限檢查
    const admin = await requireAdmin()

    // 2. 驗證
    if (!key?.trim()) {
      return error(new ValidationError('設定鍵 (key) 不能為空'))
    }

    // 3. 取得當前設定（用於審計日誌）
    const currentSetting = await siteSettingsService.getByKey(key)

    if (!currentSetting) {
      return error(new ValidationError('找不到該設定'))
    }

    // 4. 記錄操作
    apiLogger.info('刪除網站設定', {
      metadata: {
        adminId: admin.id,
        adminEmail: admin.email,
        key,
        settingId: currentSetting.id,
      },
    })

    // 5. 執行刪除
    await siteSettingsService.delete(key)

    // 6. Revalidation
    revalidatePath('/admin/site-settings')
    revalidatePath('/')
    revalidatePath('/farm-tour')

    // 7. 返回成功回應
    return success({ key }, '設定刪除成功')
  } catch (err) {
    return error(err)
  }
}
