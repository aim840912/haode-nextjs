'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/feedback/Toast'
import { useCSRFToken } from '@/hooks/useCSRFToken'
import { useQuickReplyTemplates, QuickReplyTemplate } from '@/hooks/useQuickReplyTemplates'
import {
  useInquiryWorkflow,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  InquiryPriority,
} from '@/hooks/useInquiryWorkflow'
import AdminProtection from '@/components/features/admin/AdminProtection'
import LoadingSpinner from '@/components/ui/loading/LoadingSpinner'
import { ComponentErrorBoundary } from '@/components/ui/error/ErrorBoundary'
import {
  InquiryWithItems,
  InquiryStatus,
  InquiryType,
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUS_COLORS,
  InquiryUtils,
} from '@/types/inquiry'
import { InquiryStatusFlowCompact } from '@/components/features/inquiry/InquiryStatusFlow'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { logger } from '@/lib/logger'

// 新的 hooks 和元件
import { useInquiriesData } from './_hooks/useInquiriesData'
import { useBatchOperations } from './_hooks/useBatchOperations'
import InquiryStatsComponent from './_components/InquiryStats'
import InquiryFilters from './_components/InquiryFilters'
import BulkActions from './_components/BulkActions'
import InquiryList from './_components/InquiryList'

function AdminInquiriesPage() {
  const { user } = useAuth()
  const { success, error: showError, warning } = useToast()
  const { token: csrfToken } = useCSRFToken()

  // 篩選狀態
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all' | 'unread' | 'unreplied'>(
    'all'
  )
  const [typeFilter, setTypeFilter] = useState<InquiryType | 'all'>('all')
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryWithItems | null>(null)

  // 使用 useInquiriesData hook
  const {
    inquiries,
    isLoading,
    error,
    inquiryStats,
    detailedStats,
    isUpdatingStatus,
    fetchInquiries,
    markAsRead,
    deleteInquiry,
    updateInquiryStatus: updateInquiryStatusBase,
    setInquiries,
  } = useInquiriesData({
    userId: user?.id || null,
    statusFilter,
    typeFilter,
    csrfToken,
    onSuccess: success,
    onError: showError,
    onWarning: warning,
  })

  // 包裝 updateInquiryStatus 以同步更新 selectedInquiry
  const updateInquiryStatus = useCallback(
    async (inquiryId: string, newStatus: InquiryStatus) => {
      await updateInquiryStatusBase(inquiryId, newStatus)
      // 如果有選中的詢問單，也更新它
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry({
          ...selectedInquiry,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
      }
    },
    [updateInquiryStatusBase, selectedInquiry]
  )

  // 使用 useBatchOperations hook
  const {
    selectedInquiries,
    isBatchProcessing,
    showBatchActions,
    toggleInquirySelection,
    selectAllInquiries,
    clearSelection,
    batchMarkAsRead,
    batchUpdateStatus,
    batchDelete,
  } = useBatchOperations({
    inquiries,
    onSuccess: success,
    onError: showError,
    markAsRead,
    deleteInquiry,
    updateInquiryStatus,
    refreshInquiries: fetchInquiries,
  })

  // 快速回覆模板狀態
  const { templates, isLoading: isLoadingTemplates, fillTemplate } = useQuickReplyTemplates()
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<QuickReplyTemplate | null>(null)
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
  const [generatedReply, setGeneratedReply] = useState<string>('')

  // 工作流程管理狀態
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

  // 處理模板使用
  const handleTemplateUse = useCallback(
    (templateId: string) => {
      const template = templates.find(t => t.id === templateId)
      if (template) {
        logger.info('使用快速回覆模板', {
          module: 'InquiryAdmin',
          action: 'useTemplate',
          metadata: { templateId, templateTitle: template.title },
        })

        setSelectedTemplate(template)
        setShowTemplateSelector(true)

        if (selectedInquiry) {
          const defaultVariables: Record<string, string> = {
            customerName: selectedInquiry.customer_name || '客戶',
            inquiryId: selectedInquiry.id || '',
            productName: selectedInquiry.inquiry_items?.[0]?.product_name || '產品',
            currentDate: new Date().toLocaleDateString('zh-TW'),
          }
          setTemplateVariables(defaultVariables)

          const filledContent = fillTemplate(template, defaultVariables)
          setGeneratedReply(filledContent)
        } else {
          setTemplateVariables({})
          setGeneratedReply(template.content)
        }
      }
    },
    [templates, selectedInquiry, fillTemplate]
  )

  // Loading 和 Error 狀態
  if (isLoading) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
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
        <div className="min-h-screen bg-gray-50 pt-24">
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">詢問單問答管理</h1>
              <p className="text-gray-600 mt-2">管理所有客戶詢問單問答和回覆狀態</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* 使用新的統計元件 */}
          <InquiryStatsComponent stats={inquiryStats} detailedStats={detailedStats} />

          {/* 使用新的批量操作元件 */}
          <BulkActions
            selectedCount={selectedInquiries.size}
            isBatchProcessing={isBatchProcessing}
            onClearSelection={clearSelection}
            onBatchMarkAsRead={batchMarkAsRead}
            onBatchUpdateStatus={batchUpdateStatus}
            onBatchDelete={batchDelete}
          />

          {/* 使用新的篩選器元件 */}
          <InquiryFilters
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            inquiryStats={inquiryStats}
            inquiriesCount={inquiries.length}
            onStatusFilterChange={setStatusFilter}
            onTypeFilterChange={setTypeFilter}
          />

          {/* 使用新的列表元件 */}
          <InquiryList
            inquiries={inquiries}
            selectedInquiries={selectedInquiries}
            isUpdatingStatus={isUpdatingStatus}
            statusFilter={statusFilter}
            onSelectInquiry={setSelectedInquiry}
            onToggleSelection={toggleInquirySelection}
            onSelectAll={selectAllInquiries}
            onMarkAsRead={markAsRead}
            onDeleteInquiry={deleteInquiry}
            onUpdateStatus={updateInquiryStatus}
          />

          {/* 詢問單詳情 Modal */}
          {selectedInquiry && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-0 sm:p-4 z-50">
              <div className="bg-white sm:rounded-lg shadow-xl w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[90vh] overflow-auto">
                <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-gray-200 z-10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                      詢問單詳情 #{InquiryUtils.formatInquiryNumber(selectedInquiry)}
                    </h2>
                    <button
                      onClick={() => setSelectedInquiry(null)}
                      className="text-gray-400 hover:text-gray-600 p-1 ml-2 shrink-0"
                    >
                      <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  {/* 狀態流程追蹤 */}
                  <div className="mb-6">
                    <InquiryStatusFlowCompact
                      inquiry={selectedInquiry}
                      className="border border-gray-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
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
                        <div className="flex items-center">
                          <span className="text-gray-900 mr-3">狀態：</span>
                          <select
                            value={selectedInquiry.status}
                            onChange={e =>
                              updateInquiryStatus(
                                selectedInquiry.id,
                                e.target.value as InquiryStatus
                              )
                            }
                            disabled={isUpdatingStatus}
                            className={`text-sm font-medium rounded px-3 py-1.5 border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                              INQUIRY_STATUS_COLORS[selectedInquiry.status]
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
                        </div>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
