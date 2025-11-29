/**
 * 農場導覽 Server Actions
 *
 * 提供農場導覽管理的 Server Actions:
 * - deleteFarmTourAction - 刪除農場體驗活動 (僅管理員)
 * - updateFarmTourAction - 更新農場體驗活動 (僅管理員)
 * - toggleFarmTourAvailabilityAction - 切換開放狀態 (僅管理員)
 * - createFarmTourAction - 建立農場體驗活動 (僅管理員)
 */

'use server'

import { revalidatePath } from 'next/cache'
import { NotFoundError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { requireAdmin, success, error, logCreate, logUpdate, logDelete } from '@/lib/server'
import { farmTourService } from '@/services/core/content/farmTourService'
import type { FarmTourActivity } from '@/types/farmTour'

/**
 * 刪除農場體驗活動
 *
 * 僅限管理員操作，會同時刪除相關圖片
 *
 * @param activityId - 活動 ID
 * @returns ActionResponse 包含刪除結果
 */
export async function deleteFarmTourAction(activityId: string) {
  try {
    // 1. 管理員權限檢查
    const admin = await requireAdmin()

    // 2. 取得活動資料（用於審計日誌）
    const activity = await farmTourService.getById(activityId)

    if (!activity) {
      throw new NotFoundError('找不到農場體驗活動')
    }

    // 3. 記錄操作
    apiLogger.info('刪除農場體驗活動', {
      metadata: {
        adminId: admin.id,
        adminEmail: admin.email,
        activityId,
        activityTitle: activity.title,
      },
    })

    // 4. 執行刪除（Service 會同時處理相關圖片）
    await farmTourService.delete(activityId)

    // 5. 審計日誌
    await logDelete(admin, 'farm_tour', activityId, {
      previousData: {
        title: activity.title,
        start_month: activity.start_month,
        end_month: activity.end_month,
        available: activity.available,
      },
    })

    // 6. Revalidation
    revalidatePath('/farm-tour')
    revalidatePath('/admin/farm-tour')

    // 7. 返回成功回應
    return success({ id: activityId }, '農場體驗活動刪除成功')
  } catch (err) {
    return error(err)
  }
}

/**
 * 更新農場體驗活動
 *
 * 僅限管理員操作
 *
 * @param activityId - 活動 ID
 * @param data - 更新資料
 * @returns ActionResponse 包含更新後的活動
 */
export async function updateFarmTourAction(
  activityId: string,
  data: Partial<Omit<FarmTourActivity, 'id' | 'createdAt'>>
) {
  try {
    // 1. 管理員權限檢查
    const admin = await requireAdmin()

    // 2. 取得當前活動（用於審計日誌）
    const currentActivity = await farmTourService.getById(activityId)

    if (!currentActivity) {
      throw new NotFoundError('找不到農場體驗活動')
    }

    // 3. 記錄操作
    apiLogger.info('更新農場體驗活動', {
      metadata: {
        adminId: admin.id,
        activityId,
        changes: Object.keys(data),
      },
    })

    // 4. 更新活動
    const updatedActivity = await farmTourService.update(activityId, data)

    if (!updatedActivity) {
      throw new NotFoundError('更新失敗：找不到農場體驗活動')
    }

    // 5. 審計日誌
    await logUpdate(admin, 'farm_tour', activityId, {
      previousData: {
        title: currentActivity.title,
        available: currentActivity.available,
        price: currentActivity.price,
      },
      newData: {
        title: updatedActivity.title,
        available: updatedActivity.available,
        price: updatedActivity.price,
      },
    })

    // 6. Revalidation
    revalidatePath('/farm-tour')
    revalidatePath(`/farm-tour/${activityId}`)
    revalidatePath('/admin/farm-tour')

    // 7. 返回成功回應
    return success(updatedActivity, '農場體驗活動更新成功')
  } catch (err) {
    return error(err)
  }
}

/**
 * 切換農場體驗活動開放狀態
 *
 * 便利 Action，用於快速切換活動的 available 狀態
 *
 * @param activityId - 活動 ID
 * @param available - 新的開放狀態
 * @returns ActionResponse 包含更新後的活動
 */
export async function toggleFarmTourAvailabilityAction(activityId: string, available: boolean) {
  try {
    // 1. 管理員權限檢查
    const admin = await requireAdmin()

    // 2. 取得當前活動
    const currentActivity = await farmTourService.getById(activityId)

    if (!currentActivity) {
      throw new NotFoundError('找不到農場體驗活動')
    }

    const actionText = available ? '開放預約' : '暫停開放'

    // 3. 記錄操作
    apiLogger.info(`農場體驗活動${actionText}`, {
      metadata: {
        adminId: admin.id,
        activityId,
        activityTitle: currentActivity.title,
        previousState: currentActivity.available,
        newState: available,
      },
    })

    // 4. 更新活動狀態
    const updatedActivity = await farmTourService.update(activityId, { available })

    if (!updatedActivity) {
      throw new NotFoundError('更新失敗')
    }

    // 5. 審計日誌
    await logUpdate(admin, 'farm_tour', activityId, {
      previousData: { available: currentActivity.available },
      newData: { available },
      metadata: { action: actionText },
    })

    // 6. Revalidation
    revalidatePath('/farm-tour')
    revalidatePath('/admin/farm-tour')

    // 7. 返回成功回應
    return success(updatedActivity, `活動已${actionText}`)
  } catch (err) {
    return error(err)
  }
}

/**
 * 建立農場體驗活動
 *
 * 僅限管理員操作
 *
 * @param data - 活動資料
 * @returns ActionResponse 包含建立的活動
 */
export async function createFarmTourAction(
  data: Omit<FarmTourActivity, 'createdAt' | 'updatedAt'> & { id?: string }
) {
  try {
    // 1. 管理員權限檢查
    const admin = await requireAdmin()

    // 2. 記錄操作
    apiLogger.info('建立農場體驗活動', {
      metadata: {
        adminId: admin.id,
        adminEmail: admin.email,
        activityTitle: data.title,
        startMonth: data.start_month,
        endMonth: data.end_month,
      },
    })

    // 3. 建立活動
    const activity = await farmTourService.create(data)

    // 4. 審計日誌
    await logCreate(admin, 'farm_tour', activity.id, {
      newData: {
        title: activity.title,
        start_month: activity.start_month,
        end_month: activity.end_month,
        price: activity.price,
        available: activity.available,
      },
    })

    // 5. Revalidation
    revalidatePath('/farm-tour')
    revalidatePath('/admin/farm-tour')

    // 6. 返回成功回應
    return success(activity, '農場體驗活動建立成功')
  } catch (err) {
    return error(err)
  }
}
