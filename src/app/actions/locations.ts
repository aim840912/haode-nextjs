/**
 * 門市據點管理 Server Actions
 *
 * 提供門市據點管理的 Server Actions:
 * - deleteLocationAction - 刪除門市 (僅管理員)
 * - createLocationAction - 建立門市 (僅管理員)
 * - updateLocationAction - 更新門市 (僅管理員)
 */

'use server'

import { revalidatePath } from 'next/cache'
import { NotFoundError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { requireAdmin, success, error, logCreate, logUpdate, logDelete } from '@/lib/server'
import { locationServiceSimple } from '@/services/core/content/locationServiceSimple'
import type { Location } from '@/types/location'

/**
 * 刪除門市據點
 *
 * 僅限管理員操作，會同時刪除相關圖片
 *
 * @param locationId - 門市 ID
 * @returns ActionResponse 包含刪除結果
 *
 * @example
 * ```tsx
 * import { deleteLocationAction } from '@/app/actions/locations'
 *
 * function DeleteButton({ locationId }) {
 *   const [isPending, startTransition] = useTransition()
 *
 *   const handleDelete = async () => {
 *     if (!confirm('確定要刪除此門市嗎？')) return
 *
 *     startTransition(async () => {
 *       const result = await deleteLocationAction(locationId)
 *
 *       if (result.success) {
 *         toast.success(result.message)
 *       } else {
 *         toast.error(result.error.message)
 *       }
 *     })
 *   }
 *
 *   return (
 *     <button onClick={handleDelete} disabled={isPending}>
 *       {isPending ? '刪除中...' : '刪除'}
 *     </button>
 *   )
 * }
 * ```
 */
export async function deleteLocationAction(locationId: string) {
  try {
    // 1. 管理員權限檢查
    const admin = await requireAdmin()

    // 2. 取得門市資料（用於審計日誌）
    const location = await locationServiceSimple.getLocationById(locationId)

    if (!location) {
      throw new NotFoundError('找不到門市')
    }

    // 3. 記錄操作
    apiLogger.info('刪除門市據點', {
      metadata: {
        adminId: admin.id,
        adminEmail: admin.email,
        locationId,
        locationName: location.name,
      },
    })

    // 4. 執行刪除（Service 會同時處理相關圖片）
    await locationServiceSimple.deleteLocation(locationId)

    // 5. 審計日誌
    await logDelete(admin, 'location', locationId, {
      previousData: {
        name: location.name,
        title: location.title,
        address: location.address,
      },
    })

    // 6. Revalidation
    revalidatePath('/locations')
    revalidatePath('/admin/locations')

    // 7. 返回成功回應
    return success({ id: locationId }, '門市刪除成功')
  } catch (err) {
    return error(err)
  }
}

/**
 * 建立門市據點
 *
 * 僅限管理員操作
 *
 * @param data - 門市資料
 * @returns ActionResponse 包含建立的門市
 */
export async function createLocationAction(
  data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
) {
  try {
    // 1. 管理員權限檢查
    const admin = await requireAdmin()

    // 2. 記錄操作
    apiLogger.info('建立門市據點', {
      metadata: {
        adminId: admin.id,
        adminEmail: admin.email,
        locationName: data.name,
        address: data.address,
      },
    })

    // 3. 建立門市
    const location = await locationServiceSimple.addLocation(data)

    // 4. 審計日誌
    await logCreate(admin, 'location', location.id, {
      newData: {
        name: location.name,
        title: location.title,
        address: location.address,
        phone: location.phone,
      },
    })

    // 5. Revalidation
    revalidatePath('/locations')
    revalidatePath('/admin/locations')

    // 6. 返回成功回應
    return success(location, '門市建立成功')
  } catch (err) {
    return error(err)
  }
}

/**
 * 更新門市據點
 *
 * 僅限管理員操作
 *
 * @param locationId - 門市 ID
 * @param data - 更新資料
 * @returns ActionResponse 包含更新後的門市
 */
export async function updateLocationAction(
  locationId: string,
  data: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>
) {
  try {
    // 1. 管理員權限檢查
    const admin = await requireAdmin()

    // 2. 取得當前門市（用於審計日誌）
    const currentLocation = await locationServiceSimple.getLocationById(locationId)

    if (!currentLocation) {
      throw new NotFoundError('找不到門市')
    }

    // 3. 記錄操作
    apiLogger.info('更新門市據點', {
      metadata: {
        adminId: admin.id,
        locationId,
        changes: Object.keys(data),
      },
    })

    // 4. 更新門市
    const updatedLocation = await locationServiceSimple.updateLocation(locationId, data)

    // 5. 審計日誌
    await logUpdate(admin, 'location', locationId, {
      previousData: {
        name: currentLocation.name,
        address: currentLocation.address,
        phone: currentLocation.phone,
      },
      newData: {
        name: updatedLocation.name,
        address: updatedLocation.address,
        phone: updatedLocation.phone,
      },
    })

    // 6. Revalidation
    revalidatePath('/locations')
    revalidatePath(`/locations/${locationId}`)
    revalidatePath('/admin/locations')

    // 7. 返回成功回應
    return success(updatedLocation, '門市更新成功')
  } catch (err) {
    return error(err)
  }
}
