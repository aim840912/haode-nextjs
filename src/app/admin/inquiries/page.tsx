'use client'

import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { useAuth } from '@/contexts/AuthContext'
import AdminProtection from '@/components/features/admin/AdminProtection'
import LoadingSpinner from '@/components/ui/loading/LoadingSpinner'
import { ComponentErrorBoundary } from '@/components/ui/error/ErrorBoundary'
import { useToast } from '@/components/ui/feedback/Toast'
import { useCSRFToken } from '@/hooks/useCSRFToken'
import { useQuickReplyTemplates, QuickReplyTemplate } from '@/hooks/useQuickReplyTemplates'
import {
  useInquiryWorkflow,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  InquiryPriority,
} from '@/hooks/useInquiryWorkflow'
import { supabase } from '@/lib/database/supabase-auth'
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
import { InquiryStatusFlowCompact } from '@/components/features/inquiry/InquiryStatusFlow'
import {
  ExclamationTriangleIcon,
  ChartBarIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  BoltIcon,
  ClipboardDocumentListIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

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

  // 快速回覆模板相關狀態
  const { templates, isLoading: isLoadingTemplates, fillTemplate } = useQuickReplyTemplates()
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<QuickReplyTemplate | null>(null)
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
  const [generatedReply, setGeneratedReply] = useState<string>('')

  // 工作流程管理相關狀態
  const {
    availableAssignees,
    assignInquiry,
    getInquiryAssignment,
    updateAssignmentStatus,
    processInquiryWorkflow,
    getAssigneeWorkload,
  } = useInquiryWorkflow()
  const [showAssignmentPanel, setShowAssignmentPanel] = useState(false)
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<InquiryPriority>('normal')
  const [assignmentNotes, setAssignmentNotes] = useState('')

  // 批量操作相關狀態
  const [selectedInquiries, setSelectedInquiries] = useState<Set<string>>(new Set())
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [showBatchActions, setShowBatchActions] = useState(false)
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
  } | null>(null)

  // 取得詳細統計資料
  const fetchDetailedStats = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('認證失敗')
      }

      // 使用統計 API，管理員模式並取得完整詳情
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
        // 轉換新 API 格式為現有格式，同時保留新功能
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
  const fetchInquiries = useCallback(async () => {
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
  }, [user, statusFilter, typeFilter, csrfToken])

  // 批量操作相關函數
  const toggleInquirySelection = (inquiryId: string) => {
    const newSelected = new Set(selectedInquiries)
    if (newSelected.has(inquiryId)) {
      newSelected.delete(inquiryId)
    } else {
      newSelected.add(inquiryId)
    }
    setSelectedInquiries(newSelected)
    setShowBatchActions(newSelected.size > 0)
  }

  const selectAllInquiries = () => {
    if (selectedInquiries.size === inquiries.length) {
      // 全部取消選取
      setSelectedInquiries(new Set())
      setShowBatchActions(false)
    } else {
      // 全部選取
      setSelectedInquiries(new Set(inquiries.map(i => i.id)))
      setShowBatchActions(true)
    }
  }

  const clearSelection = () => {
    setSelectedInquiries(new Set())
    setShowBatchActions(false)
  }

  // 批量標記已讀
  const batchMarkAsRead = async () => {
    if (selectedInquiries.size === 0) return

    setIsBatchProcessing(true)
    const selectedArray = Array.from(selectedInquiries)
    let successCount = 0
    let failCount = 0

    try {
      // 並行處理多個請求
      const promises = selectedArray.map(async inquiryId => {
        try {
          await markAsRead(inquiryId)
          return { success: true, id: inquiryId }
        } catch (error) {
          return { success: false, id: inquiryId, error }
        }
      })

      const results = await Promise.allSettled(promises)

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++
        } else {
          failCount++
        }
      })

      if (successCount > 0) {
        success(
          '批量操作完成',
          `成功標記 ${successCount} 筆為已讀${failCount > 0 ? `，${failCount} 筆失敗` : ''}`
        )
      }

      if (failCount > 0 && successCount === 0) {
        showError('批量操作失敗', `${failCount} 筆操作失敗`)
      }

      clearSelection()
      await fetchInquiries() // 重新載入列表
    } catch (error) {
      showError('批量操作失敗', error instanceof Error ? error.message : '批量標記時發生錯誤')
    } finally {
      setIsBatchProcessing(false)
    }
  }

  // 批量更新狀態
  const batchUpdateStatus = async (newStatus: InquiryStatus) => {
    if (selectedInquiries.size === 0) return

    if (
      !confirm(
        `確定要將 ${selectedInquiries.size} 筆詢價單狀態更新為「${INQUIRY_STATUS_LABELS[newStatus]}」嗎？`
      )
    ) {
      return
    }

    setIsBatchProcessing(true)
    const selectedArray = Array.from(selectedInquiries)
    let successCount = 0
    let failCount = 0

    try {
      // 並行處理多個請求（限制並發數量以避免伺服器過載）
      const batchSize = 5
      for (let i = 0; i < selectedArray.length; i += batchSize) {
        const batch = selectedArray.slice(i, i + batchSize)
        const promises = batch.map(async inquiryId => {
          try {
            await updateInquiryStatus(inquiryId, newStatus)
            return { success: true, id: inquiryId }
          } catch (error) {
            return { success: false, id: inquiryId, error }
          }
        })

        const results = await Promise.allSettled(promises)

        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value.success) {
            successCount++
          } else {
            failCount++
          }
        })

        // 小延遲以避免伺服器過載
        if (i + batchSize < selectedArray.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      if (successCount > 0) {
        success(
          '批量操作完成',
          `成功更新 ${successCount} 筆狀態${failCount > 0 ? `，${failCount} 筆失敗` : ''}`
        )
      }

      if (failCount > 0 && successCount === 0) {
        showError('批量操作失敗', `${failCount} 筆操作失敗`)
      }

      clearSelection()
      await fetchInquiries() // 重新載入列表
    } catch (error) {
      showError('批量操作失敗', error instanceof Error ? error.message : '批量更新時發生錯誤')
    } finally {
      setIsBatchProcessing(false)
    }
  }

  // 批量刪除
  const batchDelete = async () => {
    if (selectedInquiries.size === 0) return

    if (!confirm(`確定要刪除 ${selectedInquiries.size} 筆詢價單嗎？此操作無法復原。`)) {
      return
    }

    setIsBatchProcessing(true)
    const selectedArray = Array.from(selectedInquiries)
    let successCount = 0
    let failCount = 0

    try {
      // 並行處理刪除請求
      const batchSize = 3 // 刪除操作使用較小的批次大小
      for (let i = 0; i < selectedArray.length; i += batchSize) {
        const batch = selectedArray.slice(i, i + batchSize)
        const promises = batch.map(async inquiryId => {
          try {
            await deleteInquiry(inquiryId)
            return { success: true, id: inquiryId }
          } catch (error) {
            return { success: false, id: inquiryId, error }
          }
        })

        const results = await Promise.allSettled(promises)

        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value.success) {
            successCount++
          } else {
            failCount++
          }
        })

        // 延遲以避免伺服器過載
        if (i + batchSize < selectedArray.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      if (successCount > 0) {
        success(
          '批量刪除完成',
          `成功刪除 ${successCount} 筆詢價單${failCount > 0 ? `，${failCount} 筆失敗` : ''}`
        )
      }

      if (failCount > 0 && successCount === 0) {
        showError('批量刪除失敗', `${failCount} 筆操作失敗`)
      }

      clearSelection()
      await fetchInquiries() // 重新載入列表
    } catch (error) {
      showError('批量刪除失敗', error instanceof Error ? error.message : '批量刪除時發生錯誤')
    } finally {
      setIsBatchProcessing(false)
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

  // 處理模板使用
  const handleTemplateUse = useCallback(
    (templateId: string) => {
      // 調用 hook 來記錄使用並取得模板
      const template = templates.find(t => t.id === templateId)
      if (template) {
        // 記錄模板使用
        logger.info('使用快速回覆模板', {
          module: 'InquiryAdmin',
          action: 'useTemplate',
          metadata: { templateId, templateTitle: template.title },
        })

        // 實作模板使用邏輯
        setSelectedTemplate(template)
        setShowTemplateSelector(true)

        // 準備模板變數（根據選中的詢價單填充）
        if (selectedInquiry) {
          const defaultVariables: Record<string, string> = {
            customerName: selectedInquiry.customer_name || '客戶',
            inquiryId: selectedInquiry.id || '',
            productName: selectedInquiry.inquiry_items?.[0]?.product_name || '產品',
            currentDate: new Date().toLocaleDateString('zh-TW'),
          }
          setTemplateVariables(defaultVariables)

          // 使用 fillTemplate 生成初始回覆內容
          const filledContent = fillTemplate(template, defaultVariables)
          setGeneratedReply(filledContent)
        } else {
          // 沒有選中詢價單時，使用空變數
          setTemplateVariables({})
          setGeneratedReply(template.content)
        }
      }
    },
    [templates, selectedInquiry, fillTemplate]
  )

  // 載入詢問單（當用戶、篩選條件改變時）
  useEffect(() => {
    if (user) {
      fetchInquiries()
    }
  }, [user, statusFilter, typeFilter, fetchInquiries])

  // 載入統計資料（僅當用戶改變時）
  useEffect(() => {
    if (user) {
      fetchDetailedStats()
    }
  }, [user, fetchDetailedStats])

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
              <div className="mx-auto w-24 h-24 mb-8 text-red-500">
                <ExclamationTriangleIcon className="w-full h-full" />
              </div>
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
                    <ChartBarIcon className="w-5 h-5 text-blue-600" />
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
                    <EyeIcon className="w-5 h-5 text-orange-600" />
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
                    <ChatBubbleLeftIcon className="w-5 h-5 text-red-600" />
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
                    <BoltIcon className="w-5 h-5 text-green-600" />
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

          {/* 狀態分析和類型分析 */}
          {detailedStats?.status_breakdown && detailedStats?.type_breakdown && (
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* 狀態分組統計 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">狀態分析</h3>
                <div className="space-y-3">
                  {Object.entries(detailedStats.status_breakdown).map(([status, data]) => {
                    const statusData = data as {
                      count: number
                      total_amount: number
                      percentage: number
                    }
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              INQUIRY_STATUS_COLORS[status as InquiryStatus]
                            }`}
                          >
                            {INQUIRY_STATUS_LABELS[status as InquiryStatus]}
                          </span>
                          <span className="text-sm text-gray-600">
                            {statusData.count} 筆 ({statusData.percentage}%)
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          NT$ {statusData.total_amount.toLocaleString()}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 類型分組統計 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">類型分析</h3>
                <div className="space-y-3">
                  {Object.entries(detailedStats.type_breakdown).map(([type, data]) => {
                    const typeData = data as {
                      count: number
                      total_amount: number
                      percentage: number
                    }
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              INQUIRY_TYPE_COLORS[type as InquiryType]
                            }`}
                          >
                            {INQUIRY_TYPE_LABELS[type as InquiryType]}
                          </span>
                          <span className="text-sm text-gray-600">
                            {typeData.count} 筆 ({typeData.percentage}%)
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          NT$ {typeData.total_amount.toLocaleString()}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 每日趨勢圖表 */}
          {detailedStats?.daily_trends && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                詢價趨勢分析 (最近 {detailedStats.timeframe_days} 天)
              </h3>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {detailedStats.daily_trends.slice(-7).map(
                  (
                    day: {
                      date: string
                      total_inquiries: number
                      replied_inquiries: number
                      total_amount?: number
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
                        {day.total_amount && day.total_amount > 0 && (
                          <div className="text-xs text-amber-600 mt-1">
                            NT$ {day.total_amount.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* 趨勢總覽 */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {detailedStats.daily_trends.reduce((sum, day) => sum + day.total_inquiries, 0)}
                  </div>
                  <div className="text-sm text-gray-600">總詢問數</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {detailedStats.daily_trends.reduce(
                      (sum, day) => sum + day.replied_inquiries,
                      0
                    )}
                  </div>
                  <div className="text-sm text-gray-600">已回覆數</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {detailedStats.daily_trends.reduce(
                      (sum, day) => sum + (day.total_amount || 0),
                      0
                    ) > 0
                      ? `NT$ ${detailedStats.daily_trends.reduce((sum, day) => sum + (day.total_amount || 0), 0).toLocaleString()}`
                      : '--'}
                  </div>
                  <div className="text-sm text-gray-600">總金額</div>
                </div>
              </div>
            </div>
          )}

          {/* 批量操作工具列 */}
          {showBatchActions && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm font-medium text-amber-800">
                    已選取 {selectedInquiries.size} 筆詢價單
                  </div>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-amber-600 hover:text-amber-800 underline"
                  >
                    取消選取
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {/* 批量標記已讀 */}
                  <button
                    onClick={batchMarkAsRead}
                    disabled={isBatchProcessing}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBatchProcessing ? '處理中...' : '標記已讀'}
                  </button>

                  {/* 批量狀態更新下拉選單 */}
                  <select
                    onChange={e =>
                      e.target.value && batchUpdateStatus(e.target.value as InquiryStatus)
                    }
                    value=""
                    disabled={isBatchProcessing}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                  >
                    <option value="">更改狀態...</option>
                    {(['pending', 'quoted', 'confirmed', 'completed', 'cancelled'] as const).map(
                      status => (
                        <option key={status} value={status}>
                          更改為 {INQUIRY_STATUS_LABELS[status]}
                        </option>
                      )
                    )}
                  </select>

                  {/* 批量刪除 */}
                  <button
                    onClick={batchDelete}
                    disabled={isBatchProcessing}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBatchProcessing ? '刪除中...' : '批量刪除'}
                  </button>
                </div>
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
              <div className="mx-auto w-24 h-24 mb-8 text-gray-400">
                <ClipboardDocumentListIcon className="w-full h-full" />
              </div>
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
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            inquiries.length > 0 && selectedInquiries.size === inquiries.length
                          }
                          onChange={selectAllInquiries}
                          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                      </th>
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
                        建立時間
                      </th>
                      <th className="sticky right-[180px] z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-l border-gray-200 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]">
                        狀態
                      </th>
                      <th className="sticky right-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-l border-gray-200 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)] min-w-[180px]">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inquiries.map(inquiry => (
                      <tr
                        key={inquiry.id}
                        className={`hover:bg-gray-50 ${!inquiry.is_read ? 'bg-orange-50' : ''} ${selectedInquiries.has(inquiry.id) ? 'bg-amber-50' : ''}`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedInquiries.has(inquiry.id)}
                            onChange={() => toggleInquirySelection(inquiry.id)}
                            className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                          />
                        </td>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(inquiry.created_at).toLocaleDateString('zh-TW')}
                        </td>
                        <td
                          className={`sticky right-[180px] z-10 px-6 py-4 whitespace-nowrap border-l border-gray-200 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)] ${!inquiry.is_read ? 'bg-orange-50' : selectedInquiries.has(inquiry.id) ? 'bg-amber-50' : 'bg-white'}`}
                        >
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
                        <td
                          className={`sticky right-0 z-10 px-6 py-4 whitespace-nowrap text-sm border-l border-gray-200 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)] min-w-[180px] ${!inquiry.is_read ? 'bg-orange-50' : selectedInquiries.has(inquiry.id) ? 'bg-amber-50' : 'bg-white'}`}
                        >
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => setSelectedInquiry(inquiry)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              查看詳情
                            </button>
                            {!inquiry.is_read && (
                              <button
                                onClick={() => markAsRead(inquiry.id)}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                標記已讀
                              </button>
                            )}
                            {(() => {
                              const assignment = getInquiryAssignment(inquiry.id)
                              return assignment ? (
                                <div className="flex items-center space-x-1">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      PRIORITY_COLORS[assignment.priority]
                                    }`}
                                  >
                                    {PRIORITY_LABELS[assignment.priority]}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    → {assignment.assignee_name}
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={e => {
                                    e.stopPropagation()
                                    setSelectedInquiry(inquiry)
                                    setShowAssignmentPanel(true)
                                  }}
                                  className="text-purple-600 hover:text-purple-800 text-sm"
                                >
                                  分配
                                </button>
                              )
                            })()}
                            <button
                              onClick={() => deleteInquiry(inquiry.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
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
                      <XMarkIcon className="w-6 h-6" />
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

                  {/* 快速回覆模板區域 */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">快速回覆模板</h3>
                      <button
                        onClick={() => {
                          setShowTemplateSelector(!showTemplateSelector)
                          if (!showTemplateSelector) {
                            // 重置狀態
                            setSelectedTemplate(null)
                            setTemplateVariables({})
                            setGeneratedReply('')
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          showTemplateSelector
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-amber-900 text-white hover:bg-amber-800'
                        }`}
                      >
                        {showTemplateSelector ? '收起模板' : '使用模板回覆'}
                      </button>
                    </div>

                    {showTemplateSelector && (
                      <div className="space-y-4">
                        {/* 模板選擇器 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            選擇回覆模板
                          </label>
                          {isLoadingTemplates ? (
                            <div className="text-center py-4">
                              <LoadingSpinner size="sm" />
                              <p className="text-sm text-gray-600 mt-2">載入模板中...</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {templates.map(template => {
                                const isRelevant =
                                  (selectedInquiry.inquiry_type === 'product' &&
                                    (template.category === 'product' ||
                                      template.category === 'pricing' ||
                                      template.category === 'general')) ||
                                  (selectedInquiry.inquiry_type === 'farm_tour' &&
                                    (template.category === 'farm_tour' ||
                                      template.category === 'general'))
                                return (
                                  <button
                                    key={template.id}
                                    onClick={() => {
                                      setSelectedTemplate(template)
                                      // 預填變數
                                      const defaultVariables: Record<string, string> = {
                                        customer_name: selectedInquiry.customer_name,
                                        ...(selectedInquiry.inquiry_type === 'product' &&
                                          selectedInquiry.inquiry_items.length > 0 && {
                                            product_name:
                                              selectedInquiry.inquiry_items[0].product_name,
                                            quantity: selectedInquiry.inquiry_items
                                              .reduce((sum, item) => sum + item.quantity, 0)
                                              .toString(),
                                            total_price:
                                              InquiryUtils.calculateTotalAmount(
                                                selectedInquiry
                                              ).toLocaleString(),
                                          }),
                                        ...(selectedInquiry.inquiry_type === 'farm_tour' && {
                                          activity_title:
                                            selectedInquiry.activity_title || '農場導覽',
                                          visit_date: selectedInquiry.visit_date || '',
                                          visitor_count: (
                                            selectedInquiry.visitor_count || 1
                                          ).toString(),
                                        }),
                                      }
                                      setTemplateVariables(defaultVariables)
                                    }}
                                    className={`p-3 text-left rounded-lg border transition-colors ${
                                      selectedTemplate?.id === template.id
                                        ? 'border-amber-500 bg-amber-50'
                                        : isRelevant
                                          ? 'border-green-200 bg-green-50 hover:bg-green-100'
                                          : 'border-gray-200 bg-white hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <h4 className="font-medium text-sm text-gray-900">
                                        {template.title}
                                      </h4>
                                      <div className="flex items-center space-x-2">
                                        {isRelevant && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            推薦
                                          </span>
                                        )}
                                        <span
                                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                            template.category === 'product'
                                              ? 'bg-blue-100 text-blue-800'
                                              : template.category === 'farm_tour'
                                                ? 'bg-purple-100 text-purple-800'
                                                : template.category === 'pricing'
                                                  ? 'bg-amber-100 text-amber-800'
                                                  : 'bg-gray-100 text-gray-800'
                                          }`}
                                        >
                                          {template.category === 'product'
                                            ? '產品'
                                            : template.category === 'farm_tour'
                                              ? '導覽'
                                              : template.category === 'pricing'
                                                ? '報價'
                                                : '一般'}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2">
                                      {template.content.substring(0, 100)}...
                                    </p>
                                    {template.usage_count > 0 && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        使用次數: {template.usage_count}
                                      </p>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* 變數填寫區域 */}
                        {selectedTemplate && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">
                                填寫模板變數 - {selectedTemplate.title}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedTemplate.variables.map(variable => (
                                  <div key={variable}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {variable
                                        .replace(/_/g, ' ')
                                        .replace(/\b\w/g, l => l.toUpperCase())}
                                    </label>
                                    <input
                                      type="text"
                                      value={templateVariables[variable] || ''}
                                      onChange={e =>
                                        setTemplateVariables(prev => ({
                                          ...prev,
                                          [variable]: e.target.value,
                                        }))
                                      }
                                      placeholder={`輸入 ${variable}`}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* 產生預覽 */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">回覆預覽</h4>
                                <button
                                  onClick={() => {
                                    const preview = fillTemplate(
                                      selectedTemplate,
                                      templateVariables
                                    )
                                    setGeneratedReply(preview)
                                    // 記錄使用
                                    handleTemplateUse(selectedTemplate.id)
                                  }}
                                  className="px-3 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition-colors"
                                >
                                  產生預覽
                                </button>
                              </div>
                              <textarea
                                value={generatedReply}
                                onChange={e => setGeneratedReply(e.target.value)}
                                placeholder="點擊「產生預覽」來查看填寫後的模板內容，您可以在此處進一步編輯..."
                                rows={8}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                              />
                            </div>

                            {/* 操作按鈕 */}
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() => {
                                  // 複製到剪貼板
                                  if (generatedReply) {
                                    navigator.clipboard
                                      .writeText(generatedReply)
                                      .then(() => {
                                        success('已複製', '回覆內容已複製到剪貼板')
                                      })
                                      .catch(() => {
                                        showError('複製失敗', '無法複製到剪貼板，請手動複製')
                                      })
                                  }
                                }}
                                disabled={!generatedReply}
                                className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                複製到剪貼板
                              </button>
                              <button
                                onClick={() => {
                                  // 這裡可以實作直接發送 Email 的功能
                                  // 暫時先顯示提示
                                  warning(
                                    '功能提示',
                                    '此功能將在後續版本中實作。請先複製內容到您的 Email 系統中。'
                                  )
                                }}
                                disabled={!generatedReply}
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                發送回覆
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 詢價分配和工作流程面板 */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">分配管理</h3>
                      <button
                        onClick={() => {
                          setShowAssignmentPanel(!showAssignmentPanel)
                          if (!showAssignmentPanel) {
                            // 重設狀態
                            setSelectedAssignee('')
                            setSelectedPriority('normal')
                            setAssignmentNotes('')
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          showAssignmentPanel
                            ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                            : 'bg-purple-900 text-white hover:bg-purple-800'
                        }`}
                      >
                        {showAssignmentPanel ? '收起分配面板' : '管理分配'}
                      </button>
                    </div>

                    {/* 當前分配狀態 */}
                    {(() => {
                      const currentAssignment = getInquiryAssignment(selectedInquiry.id)
                      return currentAssignment ? (
                        <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-purple-900">當前分配</h4>
                              <div className="mt-2 space-y-1">
                                <p className="text-sm text-purple-800">
                                  <span className="font-medium">處理人員：</span>{' '}
                                  {currentAssignment.assignee_name}
                                </p>
                                <p className="text-sm text-purple-800">
                                  <span className="font-medium">優先級：</span>
                                  <span
                                    className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                                      PRIORITY_COLORS[currentAssignment.priority]
                                    }`}
                                  >
                                    {PRIORITY_LABELS[currentAssignment.priority]}
                                  </span>
                                </p>
                                <p className="text-sm text-purple-800">
                                  <span className="font-medium">分配時間：</span>
                                  {new Date(currentAssignment.assigned_at).toLocaleString('zh-TW')}
                                </p>
                                {currentAssignment.due_date && (
                                  <p className="text-sm text-purple-800">
                                    <span className="font-medium">截止時間：</span>
                                    <span
                                      className={`ml-1 ${
                                        new Date(currentAssignment.due_date) < new Date()
                                          ? 'text-red-600 font-medium'
                                          : 'text-purple-800'
                                      }`}
                                    >
                                      {new Date(currentAssignment.due_date).toLocaleString('zh-TW')}
                                    </span>
                                    {new Date(currentAssignment.due_date) < new Date() && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        已逾期
                                      </span>
                                    )}
                                  </p>
                                )}
                                {currentAssignment.notes && (
                                  <p className="text-sm text-purple-800">
                                    <span className="font-medium">備註：</span>{' '}
                                    {currentAssignment.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <select
                                value={currentAssignment.status}
                                onChange={e => {
                                  updateAssignmentStatus(
                                    currentAssignment.id,
                                    e.target.value as 'assigned' | 'in_progress' | 'completed'
                                  )
                                }}
                                className="px-3 py-1 text-sm border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="assigned">已分配</option>
                                <option value="in_progress">處理中</option>
                                <option value="completed">已完成</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-center text-gray-600">
                            <p className="font-medium">尚未分配處理人員</p>
                            <p className="text-sm mt-1">點擊「管理分配」來指派處理人員</p>
                          </div>
                        </div>
                      )
                    })()}

                    {showAssignmentPanel && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* 選擇處理人員 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              指派處理人員
                            </label>
                            <select
                              value={selectedAssignee}
                              onChange={e => setSelectedAssignee(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="">選擇處理人員...</option>
                              {availableAssignees.map(assignee => {
                                const workload = getAssigneeWorkload(assignee.id)
                                return (
                                  <option key={assignee.id} value={assignee.id}>
                                    {assignee.name} ({assignee.role}) - {workload.total} 件處理中
                                  </option>
                                )
                              })}
                            </select>
                          </div>

                          {/* 設定優先級 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              優先級
                            </label>
                            <select
                              value={selectedPriority}
                              onChange={e => setSelectedPriority(e.target.value as InquiryPriority)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* 分配備註 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            分配備註
                          </label>
                          <textarea
                            value={assignmentNotes}
                            onChange={e => setAssignmentNotes(e.target.value)}
                            placeholder="輸入分配相關備註或特殊說明..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                          />
                        </div>

                        {/* 執行分配 */}
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => {
                              // 自動套用工作流程規則
                              const workflowResult = processInquiryWorkflow(selectedInquiry)
                              if (workflowResult.wasAssigned) {
                                success('工作流程處理完成', '已根據規則自動分配處理人員')
                              } else {
                                warning(
                                  '無符合規則',
                                  `已套用 ${workflowResult.processedRules.length} 條規則，但無自動分配設定`
                                )
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            套用工作流程規則
                          </button>

                          <button
                            onClick={() => {
                              if (!selectedAssignee) {
                                showError('請選擇處理人員', '必須選擇一位處理人員才能進行分配')
                                return
                              }

                              const assignee = availableAssignees.find(
                                a => a.id === selectedAssignee
                              )
                              if (!assignee) return

                              try {
                                assignInquiry(
                                  selectedInquiry.id,
                                  assignee.id,
                                  assignee.name,
                                  assignee.role,
                                  user?.email || 'admin',
                                  {
                                    priority: selectedPriority,
                                    notes: assignmentNotes || undefined,
                                    dueHours:
                                      selectedPriority === 'urgent'
                                        ? 1
                                        : selectedPriority === 'high'
                                          ? 4
                                          : selectedPriority === 'normal'
                                            ? 24
                                            : 72,
                                  }
                                )

                                success('分配成功', `詢價單已分配給 ${assignee.name}`)

                                // 重設表單
                                setSelectedAssignee('')
                                setSelectedPriority('normal')
                                setAssignmentNotes('')
                                setShowAssignmentPanel(false)
                              } catch (error) {
                                showError(
                                  '分配失敗',
                                  error instanceof Error ? error.message : '分配時發生錯誤'
                                )
                              }
                            }}
                            disabled={!selectedAssignee}
                            className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            確認分配
                          </button>
                        </div>
                      </div>
                    )}
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
