/**
 * 詢價單 Server Actions
 *
 * 提供詢價單管理的 Server Actions:
 * - createInquiryAction - 建立詢價單 (需要登入)
 * - createGuestInquiryAction - 建立訪客詢價單 (無需登入)
 * - updateInquiryAction - 更新詢價單 (需要登入)
 * - deleteInquiryAction - 刪除詢價單 (僅管理員)
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'
import { NotFoundError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import {
  requireAuth,
  requireAdmin,
  success,
  error,
  validationError,
  logCreate,
  logStatusChange,
} from '@/lib/server'
import { InquirySchemas } from '@/lib/validation'
import { inquiryService } from '@/services/core/inquiry/InquiryService'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// 訪客詢價使用的系統 user_id (全零 UUID)
const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000'

/**
 * 建立詢價單
 *
 * 需要登入的用戶才能使用
 * 建立後會記錄業務指標和審計日誌
 *
 * @param data - 詢價單資料
 * @returns ActionResponse 包含建立的詢價單資訊
 *
 * @example
 * ```tsx
 * import { createInquiryAction } from '@/app/actions/inquiries'
 *
 * function InquiryForm() {
 *   const [isPending, startTransition] = useTransition()
 *
 *   const handleSubmit = async (formData) => {
 *     startTransition(async () => {
 *       const result = await createInquiryAction({
 *         inquiry_type: 'product',
 *         items: [...],
 *         customer_name: formData.get('name'),
 *         customer_email: formData.get('email'),
 *         notes: formData.get('notes')
 *       })
 *
 *       if (result.success) {
 *         toast.success(result.message)
 *         router.push(`/inquiries/${result.data.id}`)
 *       }
 *     })
 *   }
 * }
 * ```
 */
export async function createInquiryAction(data: unknown) {
  try {
    // 1. 認證檢查
    const user = await requireAuth()

    // 2. 驗證輸入資料
    const result = InquirySchemas.create.safeParse(data)

    if (!result.success) {
      return validationError(result.error)
    }

    // 3. 記錄建立詢價單操作
    apiLogger.info('建立詢價單', {
      metadata: {
        userId: user.id,
        userEmail: user.email,
        inquiryType: result.data.inquiry_type,
        itemsCount: result.data.items?.length || 0,
      },
    })

    // 4. 建立詢價單
    const inquiry = await inquiryService.createInquiry(user.id, result.data)

    // 5. 記錄業務指標
    const { recordInquirySubmit } = await import('@/lib/metrics')
    recordInquirySubmit(result.data.inquiry_type || '一般詢問', user.id)

    // 6. 審計日誌
    await logCreate(user, 'inquiry', inquiry.id, {
      newData: {
        customer_name: inquiry.customer_name,
        customer_email: inquiry.customer_email,
        total_estimated_amount: inquiry.total_estimated_amount,
        items_count: inquiry.inquiry_items?.length || 0,
      },
    })

    // 7. Revalidation
    revalidatePath('/inquiries') // 用戶詢價列表
    revalidatePath('/admin/inquiries') // 管理員看板

    // 8. 返回成功回應
    return success(inquiry, '詢價單建立成功')
  } catch (err) {
    return error(err)
  }
}

/**
 * 建立訪客詢價單
 *
 * 公開 Server Action,不需要登入即可使用
 * 訪客詢價會使用特殊的系統 user_id,並在 notes 中標記
 *
 * @param data - 訪客詢價資料
 * @returns ActionResponse 包含建立的詢價單基本資訊
 *
 * @example
 * ```tsx
 * // 在客戶端元件中使用
 * import { createGuestInquiryAction } from '@/app/actions/inquiries'
 *
 * function GuestInquiryForm() {
 *   const [isPending, startTransition] = useTransition()
 *
 *   const handleSubmit = async (formData) => {
 *     startTransition(async () => {
 *       const result = await createGuestInquiryAction({
 *         customer_name: formData.get('name'),
 *         customer_email: formData.get('email'),
 *         customer_phone: formData.get('phone'),
 *         inquiry_type: 'product',
 *         items: [...],
 *         notes: formData.get('notes')
 *       })
 *
 *       if (result.success) {
 *         toast.success(result.message)
 *         router.push('/inquiry-confirmation')
 *       } else {
 *         toast.error(result.error.message)
 *       }
 *     })
 *   }
 *
 *   return <form onSubmit={handleSubmit}>...</form>
 * }
 * ```
 */
export async function createGuestInquiryAction(data: unknown) {
  try {
    // 1. 驗證輸入資料 (無需認證 - 公開操作)
    const result = InquirySchemas.guest.safeParse(data)

    if (!result.success) {
      return validationError(result.error)
    }

    const guestData = result.data

    // 2. 記錄訪客詢價
    apiLogger.info('建立訪客詢價單', {
      metadata: {
        customerEmail: guestData.customer_email,
        customerName: guestData.customer_name,
        inquiryType: guestData.inquiry_type,
        itemsCount: guestData.items.length,
      },
    })

    // 3. 在 notes 中標記這是訪客詢價
    const guestNotes = [
      '【訪客詢價】',
      guestData.notes || '',
      `\n提交時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`,
      `聯絡 Email: ${guestData.customer_email}`,
      guestData.customer_phone ? `聯絡電話: ${guestData.customer_phone}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    // 4. 建立詢價單資料
    const inquiryData = {
      customer_name: guestData.customer_name,
      customer_email: guestData.customer_email,
      customer_phone: guestData.customer_phone,
      inquiry_type: guestData.inquiry_type,
      notes: guestNotes,
      delivery_address: guestData.delivery_address,
      preferred_delivery_date: guestData.preferred_delivery_date,
      items: guestData.items,
    }

    // 5. 使用特殊的訪客 user_id 建立詢價單
    const inquiry = await inquiryService.createInquiry(GUEST_USER_ID, inquiryData)

    // 6. 記錄成功
    apiLogger.info('訪客詢價單建立成功', {
      metadata: {
        inquiryId: inquiry.id,
        customerEmail: guestData.customer_email,
      },
    })

    // 7. Revalidation
    // 注意: 訪客詢價不需要 revalidate 用戶相關頁面
    // 但如果有管理員看板顯示最新詢價,可以 revalidate
    revalidatePath('/admin/inquiries')

    // 8. 返回成功回應 (不返回完整詢價資料,避免洩漏敏感資訊)
    return success(
      {
        id: inquiry.id,
        status: inquiry.status,
        customer_name: inquiry.customer_name,
      },
      '詢價已送出,我們會儘快回覆您'
    )

    // TODO: 後續可加入 Email 確認機制
    // await sendGuestInquiryConfirmation(guestData.customer_email, inquiry.id)
  } catch (err) {
    return error(err)
  }
}

/**
 * 更新詢價單狀態
 *
 * 僅限管理員操作,用於快速更新詢價單的狀態標記
 * 支援更新: is_read, is_replied, status
 *
 * @param inquiryId - 詢價單 ID
 * @param data - 更新資料
 * @returns ActionResponse 包含更新後的詢價單
 *
 * @example
 * ```tsx
 * import { updateInquiryStatusAction } from '@/app/actions/inquiries'
 *
 * function AdminInquiryActions({ inquiryId }) {
 *   const handleMarkAsRead = async () => {
 *     const result = await updateInquiryStatusAction(inquiryId, {
 *       is_read: true
 *     })
 *
 *     if (result.success) {
 *       toast.success(result.message)
 *     }
 *   }
 *
 *   return <button onClick={handleMarkAsRead}>標記已讀</button>
 * }
 * ```
 */
export async function updateInquiryStatusAction(inquiryId: string, data: unknown) {
  try {
    // 1. 管理員權限檢查
    const admin = await requireAdmin()

    // 2. 驗證輸入資料
    const result = InquirySchemas.statusUpdate.safeParse(data)

    if (!result.success) {
      return validationError(result.error)
    }

    // 3. 記錄更新操作
    apiLogger.info('更新詢價單狀態', {
      metadata: {
        userId: admin.id,
        inquiryId,
        changes: Object.keys(result.data),
      },
    })

    // 4. 取得當前詢價單
    const currentInquiry = await inquiryService.getInquiryByIdForAdmin(inquiryId)

    if (!currentInquiry) {
      throw new NotFoundError('找不到詢價單')
    }

    // 5. 準備更新資料
    const updateData: Record<string, unknown> = {}

    if (result.data.is_read !== undefined) {
      updateData.is_read = result.data.is_read
      if (result.data.is_read && !updateData.read_at) {
        updateData.read_at = new Date().toISOString()
      }
    }

    if (result.data.is_replied !== undefined) {
      updateData.is_replied = result.data.is_replied
      if (result.data.is_replied && !updateData.replied_at) {
        updateData.replied_at = new Date().toISOString()
        updateData.replied_by = admin.id
      }
    }

    if (result.data.status !== undefined) {
      updateData.status = result.data.status
    }

    // 6. 執行更新
    const supabase = await createServerSupabaseClient()
    const { data: updatedInquiry, error: updateError } = await (
      supabase as unknown as SupabaseClient<Database>
    )
      .from('inquiries')
      .update(updateData)
      .eq('id', inquiryId)
      .select(
        `
      *,
      inquiry_items (
        id, product_id, product_name, product_category, quantity,
        unit_price, total_price, notes, created_at
      )
    `
      )
      .single()

    if (updateError) throw updateError

    // 7. 審計日誌
    if (result.data.is_read !== undefined || result.data.is_replied !== undefined) {
      const previousStatus = `read:${currentInquiry.is_read},replied:${currentInquiry.is_replied}`
      const newStatus = `read:${updateData.is_read ?? currentInquiry.is_read},replied:${updateData.is_replied ?? currentInquiry.is_replied}`

      await logStatusChange(admin, 'inquiry', inquiryId, {
        previousData: { status: previousStatus },
        newData: { status: newStatus },
        metadata: {
          customer_name: currentInquiry.customer_name,
          customer_email: currentInquiry.customer_email,
          is_read_changed: result.data.is_read !== undefined,
          is_replied_changed: result.data.is_replied !== undefined,
        },
      })
    }

    // 8. Revalidation
    revalidatePath('/admin/inquiries') // 管理員詢價列表
    revalidatePath(`/admin/inquiries/${inquiryId}`) // 詢價詳情頁

    // 9. 返回成功回應
    return success(updatedInquiry, '詢價單更新成功')
  } catch (err) {
    return error(err)
  }
}

/**
 * 刪除詢價單
 *
 * 僅限管理員操作,會記錄完整審計日誌
 *
 * @param inquiryId - 詢價單 ID
 * @returns ActionResponse 包含刪除結果
 *
 * @example
 * ```tsx
 * // 在管理員元件中使用
 * import { deleteInquiryAction } from '@/app/actions/inquiries'
 *
 * function InquiryDeleteButton({ inquiryId }) {
 *   const [isPending, startTransition] = useTransition()
 *
 *   const handleDelete = async () => {
 *     if (!confirm('確定要刪除這個詢價單嗎?')) return
 *
 *     startTransition(async () => {
 *       const result = await deleteInquiryAction(inquiryId)
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
export async function deleteInquiryAction(inquiryId: string) {
  try {
    // 1. 管理員權限檢查
    const admin = await requireAdmin()

    // 2. 記錄刪除操作
    apiLogger.info('刪除詢價單', {
      metadata: {
        userId: admin.id,
        inquiryId,
        adminEmail: admin.email,
      },
    })

    // 3. 取得詢價單資料 (用於審計日誌)
    const inquiryToDelete = await inquiryService.getInquiryByIdForAdmin(inquiryId)

    if (!inquiryToDelete) {
      throw new NotFoundError('找不到詢價單')
    }

    // 4. 執行刪除
    await inquiryService.deleteInquiry(inquiryId)

    // 5. 審計日誌 (整合現有的 AuditLogger)
    // 注意: Server Actions 中的審計日誌可以使用 logDelete helper
    // 但這裡我們保持與原 API 相同的做法,使用 inquiryService 內建的審計功能

    // 6. Revalidation - 清除相關頁面快取
    revalidatePath('/admin/inquiries') // 管理員詢價列表
    revalidatePath(`/admin/inquiries/${inquiryId}`) // 詢價詳情頁

    // 7. 返回成功回應
    return success({ id: inquiryId }, '詢價單刪除成功')
  } catch (err) {
    return error(err)
  }
}
