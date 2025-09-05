'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { useAuth } from '@/lib/auth-context'
import AdminProtection from '@/components/AdminProtection'
import LoadingSpinner from '@/components/LoadingSpinner'
import { ComponentErrorBoundary } from '@/components/ErrorBoundary'
import { useToast } from '@/components/Toast'
import { useCSRFToken } from '@/hooks/useCSRFToken'
import { supabase } from '@/lib/supabase-auth'
import {
  InquiryWithItems,
  InquiryStatus,
  InquiryType,
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUS_COLORS,
  INQUIRY_TYPE_LABELS,
  INQUIRY_TYPE_COLORS,
  InquiryUtils,
} from '@/types/inquiry'
import { InquiryStatusFlowCompact } from '@/components/inquiry/InquiryStatusFlow'

function AdminInquiriesPage() {
  const { user } = useAuth()
  const { success, error: showError, warning } = useToast()
  const { token: csrfToken } = useCSRFToken()
  const [inquiries, setInquiries] = useState<InquiryWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all' | 'unread' | 'unreplied'>(
    'all'
  )
  const [typeFilter, setTypeFilter] = useState<InquiryType | 'all'>('all')
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryWithItems | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [inquiryStats, setInquiryStats] = useState<{
    total: number
    unread: number
    unreplied: number
  }>({ total: 0, unread: 0, unreplied: 0 })
  const [detailedStats, setDetailedStats] = useState<{
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
    status_breakdown: {
      pending: number
      quoted: number
      confirmed: number
      completed: number
      cancelled: number
    }
    daily_trends: Array<{
      date: string
      total_inquiries: number
      replied_inquiries: number
      reply_rate: number
    }>
    timeframe_days: number
  } | null>(null)

  // 取得詳細統計資料
  const fetchDetailedStats = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('認證失敗')
      }

      const response = await fetch(`/api/inquiries/stats?timeframe=30`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
      })

      const result = await response.json()

      if (response.ok) {
        setDetailedStats(result.data)
      }
    } catch (err) {
      logger.error(
        'Error fetching detailed stats:',
        err instanceof Error ? err : new Error('Unknown error')
      )
    }
  }

  // 標記庫存查詢單為已讀
  const markAsRead = async (inquiryId: string) => {
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
        showError('標記失敗', result.error || '標記已讀時發生錯誤')
        return
      }

      // 更新本地狀態
      setInquiries(
        inquiries.map(inquiry =>
          inquiry.id === inquiryId
            ? { ...inquiry, is_read: true, read_at: new Date().toISOString() }
            : inquiry
        )
      )

      success('標記成功', '已標記為已讀')
    } catch (err) {
      logger.error(
        'Error marking as read:',
        err instanceof Error ? err : new Error('Unknown error')
      )
      showError('標記失敗', err instanceof Error ? err.message : '標記已讀時發生錯誤')
    }
  }

  // 刪除庫存查詢單
  const deleteInquiry = async (inquiryId: string) => {
    // 確認對話框
    if (!confirm('確定要刪除這筆庫存查詢單嗎？此操作無法復原。')) {
      return
    }

    try {
      // 取得認證 token
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('認證失敗')
      }

      // 呼叫 DELETE API
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
      })

      const result = await response.json()

      if (!response.ok) {
        showError('刪除失敗', result.error || '刪除庫存查詢單時發生錯誤')
        return
      }

      // 更新本地狀態，移除已刪除的庫存查詢單
      setInquiries(inquiries.filter(inquiry => inquiry.id !== inquiryId))

      // 如果刪除的是當前選中的庫存查詢單，清除選中狀態
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry(null)
      }

      success('刪除成功', '庫存查詢單已成功刪除')
    } catch (err) {
      logger.error(
        'Error deleting inquiry:',
        err instanceof Error ? err : new Error('Unknown error')
      )
      showError('刪除失敗', err instanceof Error ? err.message : '刪除庫存查詢單時發生錯誤')
    }
  }

  // 取得所有庫存查詢單
  const fetchInquiries = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      // 取得認證 token
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('認證失敗')
      }

      // 建立查詢參數
      const params = new URLSearchParams()
      params.append('admin', 'true') // 管理員模式

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

      // 呼叫 API
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
  }

  // 更新詢問單狀態
  const updateInquiryStatus = async (inquiryId: string, newStatus: InquiryStatus) => {
    if (!user) return

    setIsUpdatingStatus(true)

    try {
      // 取得認證 token
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('認證失敗')
      }

      // 呼叫 API 更新狀態
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
        // 不要拋出錯誤，直接處理並顯示 Toast 通知
        logger.info('狀態更新失敗:', result.error)

        // 根據錯誤類型顯示不同的 Toast
        if (result.error && result.error.includes('無法從')) {
          warning('無法更新狀態', result.error)
        } else {
          showError('更新失敗', result.error || '更新狀態時發生錯誤，請稍後再試')
        }

        return // 提前返回，不執行後續的本地狀態更新
      }

      // 更新本地狀態
      setInquiries(
        inquiries.map(inquiry =>
          inquiry.id === inquiryId
            ? { ...inquiry, status: newStatus, updated_at: new Date().toISOString() }
            : inquiry
        )
      )

      // 如果有選中的詢問單，也更新它
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry({
          ...selectedInquiry,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
      }

      success('狀態更新成功', `詢問單狀態已更新為「${INQUIRY_STATUS_LABELS[newStatus]}」`)
    } catch (err) {
      logger.error(
        'Error updating status:',
        err instanceof Error ? err : new Error('Unknown error')
      )

      if (err instanceof Error && err.message.includes('無法從')) {
        // 狀態轉換錯誤，提供更友善的提示
        warning('無法更新狀態', err.message)
      } else {
        showError('更新失敗', err instanceof Error ? err.message : '更新狀態時發生錯誤，請稍後再試')
      }
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // 初始載入
  useEffect(() => {
    if (user) {
      fetchInquiries()
      fetchDetailedStats()
    }
  }, [user, statusFilter, typeFilter])

  if (isLoading) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 pt-36 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">載入詢問單管理...</p>
          </div>
        </div>
      </AdminProtection>
    )
  }

  if (error) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 pt-36">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="text-center">
              <div className="text-6xl mb-8">❌</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">載入失敗</h1>
              <p className="text-gray-600 mb-8">{error}</p>
              <button
                onClick={fetchInquiries}
                className="bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors"
              >
                重新載入
              </button>
            </div>
          </div>
        </div>
      </AdminProtection>
    )
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 pt-36">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">詢問單問答管理</h1>
            <p className="text-gray-600 mt-1">管理所有客戶詢問單問答和回覆狀態</p>
          </div>

          {/* 統計儀表板 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">總詢問單</p>
                  <p className="text-2xl font-bold text-gray-900">{inquiryStats.total}</p>
                  {detailedStats?.summary?.completion_rate && (
                    <p className="text-xs text-gray-500">
                      完成率 {detailedStats.summary.completion_rate}%
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-sm font-medium">👀</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">未讀詢問</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold text-orange-600">{inquiryStats.unread}</p>
                    {inquiryStats.unread > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        需關注
                      </span>
                    )}
                  </div>
                  {detailedStats?.summary?.read_rate && (
                    <p className="text-xs text-gray-500">
                      已讀率 {detailedStats.summary.read_rate}%
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm font-medium">💬</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">未回覆詢問</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold text-red-600">{inquiryStats.unreplied}</p>
                    {inquiryStats.unreplied > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        待處理
                      </span>
                    )}
                  </div>
                  {detailedStats?.summary?.reply_rate && (
                    <p className="text-xs text-gray-500">
                      回覆率 {detailedStats.summary.reply_rate}%
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm font-medium">⚡</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">平均回覆時間</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold text-green-600">
                      {detailedStats?.summary?.avg_response_time_hours
                        ? `${detailedStats.summary.avg_response_time_hours}h`
                        : '--'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">最近 30 天</p>
                </div>
              </div>
            </div>
          </div>

          {/* 每日趨勢圖表 */}
          {detailedStats?.daily_trends && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">最近 7 天趨勢</h3>
              <div className="grid grid-cols-7 gap-2">
                {detailedStats.daily_trends.map(
                  (
                    day: {
                      date: string
                      total_inquiries: number
                      replied_inquiries: number
                    },
                    index: number
                  ) => (
                    <div key={index} className="text-center">
                      <div className="text-xs text-gray-500 mb-2">
                        {new Date(day.date).toLocaleDateString('zh-TW', {
                          month: 'numeric',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="bg-gray-100 rounded p-3">
                        <div className="text-lg font-bold text-gray-900">{day.total_inquiries}</div>
                        <div className="text-xs text-gray-600">新詢問</div>
                        <div className="text-xs text-green-600 mt-1">
                          {day.total_inquiries > 0
                            ? Math.round((day.replied_inquiries / day.total_inquiries) * 100)
                            : 0}
                          % 回覆率
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* 篩選器 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 space-y-4">
            {/* 類型篩選 */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">詢問類型：</span>
              <div className="flex space-x-2">
                {['all', 'product', 'farm_tour'].map(type => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type as InquiryType | 'all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      typeFilter === type
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'all' ? '全部類型' : INQUIRY_TYPE_LABELS[type as InquiryType]}
                  </button>
                ))}
              </div>
            </div>

            {/* 狀態篩選 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 font-medium">處理狀態：</span>
                <div className="flex space-x-2 flex-wrap">
                  {(
                    [
                      'all',
                      'unread',
                      'unreplied',
                      'pending',
                      'quoted',
                      'confirmed',
                      'completed',
                      'cancelled',
                    ] as const
                  ).map(filter => {
                    let displayName = ''
                    let badgeClass = ''

                    if (filter === 'all') {
                      displayName = '全部'
                    } else if (filter === 'unread') {
                      displayName = `未讀 (${inquiryStats.unread})`
                      badgeClass = inquiryStats.unread > 0 ? 'text-orange-600' : ''
                    } else if (filter === 'unreplied') {
                      displayName = `待回覆 (${inquiryStats.unreplied})`
                      badgeClass = inquiryStats.unreplied > 0 ? 'text-red-600' : ''
                    } else {
                      displayName = INQUIRY_STATUS_LABELS[filter as InquiryStatus]
                    }

                    return (
                      <button
                        key={filter}
                        onClick={() => setStatusFilter(filter)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          statusFilter === filter
                            ? 'bg-amber-900 text-white'
                            : `bg-gray-100 hover:bg-gray-200 ${badgeClass || 'text-gray-700'}`
                        }`}
                      >
                        {displayName}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="text-sm text-gray-600">共 {inquiries.length} 筆詢問單</div>
            </div>
          </div>

          {/* 詢問單列表 */}
          {inquiries.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-6xl mb-8">📋</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {statusFilter === 'all' && '還沒有詢問單'}
                {statusFilter === 'unread' && '沒有未讀的詢問單'}
                {statusFilter === 'unreplied' && '沒有待回覆的詢問單'}
                {statusFilter !== 'all' &&
                  statusFilter !== 'unread' &&
                  statusFilter !== 'unreplied' &&
                  `沒有${INQUIRY_STATUS_LABELS[statusFilter as InquiryStatus]}的詢問單`}
              </h2>
              <p className="text-gray-600">當客戶送出詢問時，會顯示在這裡</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        詢問單號
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        客戶
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        類型
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        詢問內容
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        金額
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        狀態
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        建立時間
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inquiries.map(inquiry => (
                      <tr
                        key={inquiry.id}
                        className={`hover:bg-gray-50 ${!inquiry.is_read ? 'bg-orange-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="text-sm font-medium text-gray-900">
                              #{InquiryUtils.formatInquiryNumber(inquiry)}
                            </div>
                            {!inquiry.is_read && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                NEW
                              </span>
                            )}
                            {inquiry.is_read &&
                              !inquiry.is_replied &&
                              inquiry.status !== 'cancelled' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  待回覆
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {inquiry.customer_name}
                            </div>
                            <div className="text-sm text-gray-700">{inquiry.customer_email}</div>
                            {inquiry.customer_phone && (
                              <div className="text-sm text-gray-700">{inquiry.customer_phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${INQUIRY_TYPE_COLORS[inquiry.inquiry_type]}`}
                          >
                            {INQUIRY_TYPE_LABELS[inquiry.inquiry_type]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {inquiry.inquiry_type === 'product' ? (
                            <>
                              <div className="text-sm text-gray-900">
                                {InquiryUtils.calculateTotalQuantity(inquiry)} 件商品
                              </div>
                              <div className="text-sm text-gray-700">
                                {inquiry.inquiry_items
                                  .slice(0, 2)
                                  .map(item => item.product_name)
                                  .join(', ')}
                                {inquiry.inquiry_items.length > 2 && '...'}
                              </div>
                            </>
                          ) : (
                            <div>
                              <div className="text-sm text-gray-900 font-medium">
                                {inquiry.activity_title}
                              </div>
                              <div className="text-sm text-gray-700">
                                {inquiry.visit_date} · {inquiry.visitor_count}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {inquiry.inquiry_type === 'product'
                              ? `NT$ ${InquiryUtils.calculateTotalAmount(inquiry).toLocaleString()}`
                              : '待報價'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={inquiry.status}
                            onChange={e =>
                              updateInquiryStatus(inquiry.id, e.target.value as InquiryStatus)
                            }
                            disabled={isUpdatingStatus}
                            className={`text-sm font-medium rounded px-3 py-1.5 border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                              INQUIRY_STATUS_COLORS[inquiry.status]
                            } ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {(
                              ['pending', 'quoted', 'confirmed', 'completed', 'cancelled'] as const
                            ).map(status => (
                              <option key={status} value={status}>
                                {INQUIRY_STATUS_LABELS[status]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(inquiry.created_at).toLocaleDateString('zh-TW')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => setSelectedInquiry(inquiry)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              查看詳情
                            </button>
                            {!inquiry.is_read && (
                              <button
                                onClick={() => markAsRead(inquiry.id)}
                                className="text-green-600 hover:text-green-800"
                              >
                                標記已讀
                              </button>
                            )}
                            <button
                              onClick={() => deleteInquiry(inquiry.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              刪除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 詢問單詳情 Modal */}
          {selectedInquiry && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                      詢問單詳情 #{InquiryUtils.formatInquiryNumber(selectedInquiry)}
                    </h2>
                    <button
                      onClick={() => setSelectedInquiry(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {/* 狀態流程追蹤 */}
                  <div className="mb-6">
                    <InquiryStatusFlowCompact
                      inquiry={selectedInquiry}
                      className="border border-gray-200"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">客戶資訊</h3>
                      <div className="space-y-2">
                        <p>
                          <span className="text-gray-900">姓名：</span>
                          <span className="text-gray-900">{selectedInquiry.customer_name}</span>
                        </p>
                        <p>
                          <span className="text-gray-900">Email：</span>
                          <span className="text-gray-900">{selectedInquiry.customer_email}</span>
                        </p>
                        {selectedInquiry.customer_phone && (
                          <p>
                            <span className="text-gray-900">電話：</span>
                            <span className="text-gray-900">{selectedInquiry.customer_phone}</span>
                          </p>
                        )}
                        {selectedInquiry.delivery_address && (
                          <p>
                            <span className="text-gray-900">配送地址：</span>
                            <span className="text-gray-900">
                              {selectedInquiry.delivery_address}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">詢問資訊</h3>
                      <div className="space-y-2">
                        <p>
                          <span className="text-gray-900">狀態：</span>
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs ${INQUIRY_STATUS_COLORS[selectedInquiry.status]}`}
                          >
                            {INQUIRY_STATUS_LABELS[selectedInquiry.status]}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-900">建立時間：</span>
                          <span className="text-gray-900">
                            {new Date(selectedInquiry.created_at).toLocaleString('zh-TW')}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-900">更新時間：</span>
                          <span className="text-gray-900">
                            {new Date(selectedInquiry.updated_at).toLocaleString('zh-TW')}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-900">讀取狀態：</span>
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                              selectedInquiry.is_read
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {selectedInquiry.is_read ? '已讀' : '未讀'}
                          </span>
                          {selectedInquiry.read_at && (
                            <span className="text-sm text-gray-500 ml-2">
                              ({new Date(selectedInquiry.read_at).toLocaleString('zh-TW')})
                            </span>
                          )}
                        </p>
                        <p>
                          <span className="text-gray-900">回覆狀態：</span>
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                              selectedInquiry.is_replied
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {selectedInquiry.is_replied ? '已回覆' : '待回覆'}
                          </span>
                          {selectedInquiry.replied_at && (
                            <span className="text-sm text-gray-500 ml-2">
                              ({new Date(selectedInquiry.replied_at).toLocaleString('zh-TW')})
                            </span>
                          )}
                        </p>
                        {selectedInquiry.is_replied &&
                          InquiryUtils.calculateResponseTime(selectedInquiry) && (
                            <p>
                              <span className="text-gray-900">回覆時間：</span>
                              <span className="text-gray-900">
                                {InquiryUtils.formatResponseTime(selectedInquiry)}
                              </span>
                            </p>
                          )}
                      </div>
                    </div>
                  </div>

                  {selectedInquiry.notes && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">客戶備註</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-900">{selectedInquiry.notes}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">詢問商品</h3>
                    <div className="space-y-3">
                      {selectedInquiry.inquiry_items.map(item => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                            {item.product_category && (
                              <p className="text-sm text-gray-900">分類：{item.product_category}</p>
                            )}
                            <p className="text-sm text-gray-900">數量：{item.quantity}</p>
                          </div>
                          <div className="text-right">
                            {item.unit_price && (
                              <p className="text-sm text-gray-700">
                                單價：NT$ {item.unit_price.toLocaleString()}
                              </p>
                            )}
                            <p className="font-medium text-gray-900">
                              小計：NT${' '}
                              {(
                                item.total_price || (item.unit_price || 0) * item.quantity
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">總計：</span>
                        <span className="text-xl font-bold text-amber-900">
                          NT$ {InquiryUtils.calculateTotalAmount(selectedInquiry).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminProtection>
  )
}

export default function AdminInquiriesPageWithErrorBoundary() {
  return (
    <ComponentErrorBoundary>
      <AdminInquiriesPage />
    </ComponentErrorBoundary>
  )
}
