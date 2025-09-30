import { useState, useCallback, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/database/supabase-auth'
import {
  InquiryWithItems,
  InquiryStatus,
  InquiryType,
  INQUIRY_STATUS_LABELS,
} from '@/types/inquiry'

interface InquiryStats {
  total: number
  unread: number
  unreplied: number
}

interface DetailedStats {
  summary: {
    total_inquiries: number
    unread_count: number
    unreplied_count: number
    read_rate: number
    reply_rate: number
    completion_rate: number
    cancellation_rate: number
    avg_response_time_hours: number
  }
  status_breakdown?: Record<
    InquiryStatus,
    {
      count: number
      total_amount: number
      percentage: number
    }
  >
  type_breakdown?: Record<
    InquiryType,
    {
      count: number
      total_amount: number
      percentage: number
    }
  >
  daily_trends: Array<{
    date: string
    total_inquiries: number
    replied_inquiries: number
    reply_rate: number
    total_amount?: number
  }>
  timeframe_days: number
}

interface UseInquiriesDataProps {
  userId: string | null
  statusFilter: InquiryStatus | 'all' | 'unread' | 'unreplied'
  typeFilter: InquiryType | 'all'
  csrfToken: string | null
  onSuccess?: (message: string, description: string) => void
  onError?: (message: string, description: string) => void
  onWarning?: (message: string, description: string) => void
}

export function useInquiriesData({
  userId,
  statusFilter,
  typeFilter,
  csrfToken,
  onSuccess,
  onError,
  onWarning,
}: UseInquiriesDataProps) {
  const [inquiries, setInquiries] = useState<InquiryWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inquiryStats, setInquiryStats] = useState<InquiryStats>({
    total: 0,
    unread: 0,
    unreplied: 0,
  })
  const [detailedStats, setDetailedStats] = useState<DetailedStats | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // 取得詳細統計資料
  const fetchDetailedStats = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('認證失敗')
      }

      const response = await fetch(
        `/api/inquiries/stats?timeframe=30&detail_level=full&admin_mode=true`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
          },
        }
      )

      const result = await response.json()

      if (response.ok && result.data) {
        const transformedData = {
          summary: result.data.summary,
          status_breakdown: result.data.status_breakdown,
          type_breakdown: result.data.type_breakdown,
          daily_trends: result.data.trends || result.data.recent_trends,
          timeframe_days: result.data.timeframe.days,
        }
        setDetailedStats(transformedData)
      }
    } catch (err) {
      logger.error(
        'Error fetching detailed stats:',
        err instanceof Error ? err : new Error('Unknown error')
      )
    }
  }, [csrfToken])

  // 標記為已讀
  const markAsRead = useCallback(
    async (inquiryId: string) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.access_token) {
          throw new Error('認證失敗')
        }

        const response = await fetch(`/api/inquiries/${inquiryId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
          },
          body: JSON.stringify({ is_read: true }),
        })

        const result = await response.json()

        if (!response.ok) {
          onError?.('標記失敗', result.error || '標記已讀時發生錯誤')
          return
        }

        // 更新本地狀態
        setInquiries(prevInquiries =>
          prevInquiries.map(inquiry =>
            inquiry.id === inquiryId
              ? { ...inquiry, is_read: true, read_at: new Date().toISOString() }
              : inquiry
          )
        )

        onSuccess?.('標記成功', '已標記為已讀')
      } catch (err) {
        logger.error(
          'Error marking as read:',
          err instanceof Error ? err : new Error('Unknown error')
        )
        onError?.('標記失敗', err instanceof Error ? err.message : '標記已讀時發生錯誤')
      }
    },
    [csrfToken, onSuccess, onError]
  )

  // 刪除詢問單
  const deleteInquiry = useCallback(
    async (inquiryId: string) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.access_token) {
          throw new Error('認證失敗')
        }

        const response = await fetch(`/api/inquiries/${inquiryId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
          },
        })

        const result = await response.json()

        if (!response.ok) {
          onError?.('刪除失敗', result.error || '刪除庫存查詢單時發生錯誤')
          return
        }

        // 更新本地狀態
        setInquiries(prevInquiries => prevInquiries.filter(inquiry => inquiry.id !== inquiryId))

        onSuccess?.('刪除成功', '庫存查詢單已成功刪除')
      } catch (err) {
        logger.error(
          'Error deleting inquiry:',
          err instanceof Error ? err : new Error('Unknown error')
        )
        onError?.('刪除失敗', err instanceof Error ? err.message : '刪除庫存查詢單時發生錯誤')
      }
    },
    [csrfToken, onSuccess, onError]
  )

  // 更新詢問單狀態
  const updateInquiryStatus = useCallback(
    async (inquiryId: string, newStatus: InquiryStatus) => {
      if (!userId) return

      setIsUpdatingStatus(true)

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.access_token) {
          throw new Error('認證失敗')
        }

        const response = await fetch(`/api/inquiries/${inquiryId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
          },
          body: JSON.stringify({ status: newStatus }),
        })

        const result = await response.json()

        if (!response.ok) {
          logger.info('狀態更新失敗:', result.error)

          if (result.error && result.error.includes('無法從')) {
            onWarning?.('無法更新狀態', result.error)
          } else {
            onError?.('更新失敗', result.error || '更新狀態時發生錯誤，請稍後再試')
          }
          return
        }

        // 更新本地狀態
        setInquiries(prevInquiries =>
          prevInquiries.map(inquiry =>
            inquiry.id === inquiryId
              ? { ...inquiry, status: newStatus, updated_at: new Date().toISOString() }
              : inquiry
          )
        )

        onSuccess?.('狀態更新成功', `詢問單狀態已更新為「${INQUIRY_STATUS_LABELS[newStatus]}」`)
      } catch (err) {
        logger.error(
          'Error updating status:',
          err instanceof Error ? err : new Error('Unknown error')
        )

        if (err instanceof Error && err.message.includes('無法從')) {
          onWarning?.('無法更新狀態', err.message)
        } else {
          onError?.(
            '更新失敗',
            err instanceof Error ? err.message : '更新狀態時發生錯誤，請稍後再試'
          )
        }
      } finally {
        setIsUpdatingStatus(false)
      }
    },
    [userId, csrfToken, onSuccess, onError, onWarning]
  )

  // 取得所有庫存查詢單
  const fetchInquiries = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('認證失敗')
      }

      const params = new URLSearchParams()
      params.append('admin', 'true')

      if (statusFilter === 'unread') {
        params.append('unread_only', 'true')
      } else if (statusFilter === 'unreplied') {
        params.append('unreplied_only', 'true')
      } else if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (typeFilter !== 'all') {
        params.append('inquiry_type', typeFilter)
      }

      params.append('sort_by', 'created_at')
      params.append('sort_order', 'desc')

      const response = await fetch(`/api/inquiries?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '取得庫存查詢單列表失敗')
      }

      const inquiriesData = result.data || []
      setInquiries(inquiriesData)

      // 計算統計資料
      const stats = {
        total: inquiriesData.length,
        unread: inquiriesData.filter((i: InquiryWithItems) => !i.is_read).length,
        unreplied: inquiriesData.filter(
          (i: InquiryWithItems) => !i.is_replied && i.status !== 'cancelled'
        ).length,
      }
      setInquiryStats(stats)
    } catch (err) {
      logger.error(
        'Error fetching inquiries:',
        err instanceof Error ? err : new Error('Unknown error')
      )
      setError(err instanceof Error ? err.message : '載入詢問單時發生錯誤')
    } finally {
      setIsLoading(false)
    }
  }, [userId, statusFilter, typeFilter, csrfToken])

  // 自動載入資料
  useEffect(() => {
    if (userId) {
      fetchInquiries()
    }
  }, [userId, fetchInquiries])

  useEffect(() => {
    if (userId) {
      fetchDetailedStats()
    }
  }, [userId, fetchDetailedStats])

  return {
    // 狀態
    inquiries,
    isLoading,
    error,
    inquiryStats,
    detailedStats,
    isUpdatingStatus,
    // 方法
    fetchInquiries,
    fetchDetailedStats,
    markAsRead,
    deleteInquiry,
    updateInquiryStatus,
    setInquiries,
  }
}
