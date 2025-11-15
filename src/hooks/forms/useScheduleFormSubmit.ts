import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/feedback/Toast'
import { logger } from '@/lib/logger'

interface FormData {
  title: string
  location: string
  date: string
  contact: string
  products: string[]
  [key: string]: any
}

interface TimeRange {
  startTime: string
  endTime: string
}

export function useScheduleFormSubmit(
  scheduleId: string,
  formatTimeRange: (start: string, end: string) => string
) {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (
    e: React.FormEvent,
    formData: FormData,
    timeRange: TimeRange,
    validateForm: () => boolean
  ) => {
    e.preventDefault()

    // 執行完整表單驗證
    const isValid = validateForm()
    if (!isValid) {
      toast.warning('表單驗證失敗', '請檢查並填寫所有必填欄位', [
        {
          label: '知道了',
          onClick: () => {},
          variant: 'primary',
        },
      ])
      return
    }

    setLoading(true)

    // 顯示載入提示
    const loadingToastId = toast.loading('更新中', '正在儲存行程資料...')

    try {
      const formattedTime = formatTimeRange(timeRange.startTime, timeRange.endTime)
      const submitData = {
        ...formData,
        time: formattedTime,
      }

      const response = await fetch(`/api/schedule/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      // 移除載入提示
      toast.removeToast(loadingToastId)

      if (response.ok) {
        // 顯示成功提示
        toast.success('更新成功！', '行程資料已成功更新，即將返回列表頁面')

        // 延遲跳轉讓用戶看到成功訊息
        setTimeout(() => {
          router.push('/admin/schedule')
        }, 1500)
      } else {
        // 解析錯誤響應
        const errorData = await response.json().catch(() => null)
        const errorMessage =
          errorData?.error?.message ||
          errorData?.message ||
          errorData?.error ||
          '更新失敗，請稍後再試'
        const displayMessage =
          typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)

        // 針對驗證錯誤提供更詳細的訊息
        if (response.status === 400) {
          toast.error('資料驗證失敗', displayMessage, [
            {
              label: '查看錯誤',
              onClick: () => {
                logger.error('行程編輯頁驗證錯誤', new Error(displayMessage), {
                  module: 'EditSchedulePage',
                  action: 'handleValidationError',
                  metadata: { scheduleId, errorMessage: displayMessage },
                })
              },
              variant: 'secondary',
            },
          ])
        } else {
          toast.error(`更新失敗 (${response.status})`, displayMessage)
        }

        logger.error(
          'Failed to update schedule:',
          new Error(`HTTP ${response.status}: ${displayMessage}`)
        )
      }
    } catch (error) {
      // 移除載入提示
      toast.removeToast(loadingToastId)

      const errorMsg = error instanceof Error ? error.message : '未知錯誤'
      toast.error('更新失敗', `網路錯誤：${errorMsg}。請檢查網路連線後重試。`)

      logger.error(
        'Error updating schedule:',
        error instanceof Error ? error : new Error('Unknown error')
      )
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    handleSubmit,
  }
}
