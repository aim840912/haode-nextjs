'use client'

import { useState, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'
import { AdminProtection } from '@/components/features/admin/AdminProtection'
import { ComponentErrorBoundary } from '@/components/ui/error/ErrorBoundary'
import { useToast } from '@/components/ui/feedback/Toast'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { useCSRFToken } from '@/hooks/useCSRFToken'
import { useInquiryWorkflow } from '@/hooks/useInquiryWorkflow'
import { useQuickReplyTemplates } from '@/hooks/useQuickReplyTemplates'
import { InquiryWithItems, InquiryStatus, InquiryType } from '@/types/inquiry'

// 新的 hooks 和元件
import { AssignmentPanel } from './components/AssignmentPanel'
import { BulkActions } from './components/BulkActions'
import { InquiryDetailPanel } from './components/InquiryDetailPanel'
import { InquiryFilters } from './components/InquiryFilters'
import { InquiryList } from './components/InquiryList'
import { InquiryStats } from './components/InquiryStats'
import { QuickReplySection } from './components/QuickReplySection'
import { useBatchOperations } from './hooks/useBatchOperations'
import { useInquiriesData } from './hooks/useInquiriesData'

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

  // 快速回覆模板
  const { templates, isLoading: isLoadingTemplates, fillTemplate } = useQuickReplyTemplates()

  // 工作流程管理
  const {
    availableAssignees,
    assignInquiry,
    getInquiryAssignment,
    updateAssignmentStatus,
    processInquiryWorkflow,
    getAssigneeWorkload,
  } = useInquiryWorkflow()

  // Loading 和 Error 狀態
  if (isLoading) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-24 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">載入詢問單管理...</p>
          </div>
        </div>
      </AdminProtection>
    )
  }

  if (error) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-24">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 mb-8 text-red-500 dark:text-red-400">
                <AlertTriangle className="w-full h-full" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">載入失敗</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8">{error}</p>
              <button
                onClick={fetchInquiries}
                className="bg-amber-900 dark:bg-amber-800 text-white px-8 py-3 rounded-lg hover:bg-amber-800 dark:hover:bg-amber-700 transition-colors"
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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                詢問單問答管理
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                管理所有客戶詢問單問答和回覆狀態
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* 使用新的統計元件 */}
          <InquiryStats stats={inquiryStats} detailedStats={detailedStats} />

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
            <InquiryDetailPanel
              inquiry={selectedInquiry}
              isUpdatingStatus={isUpdatingStatus}
              onClose={() => setSelectedInquiry(null)}
              onStatusChange={updateInquiryStatus}
            >
              {/* 快速回覆模板區域 */}
              <QuickReplySection
                inquiry={selectedInquiry}
                templates={templates}
                isLoadingTemplates={isLoadingTemplates}
                fillTemplate={fillTemplate}
                onSuccess={(message: string) => success('成功', message)}
                onError={(message: string) => showError('錯誤', message)}
                onWarning={(message: string) => warning('提示', message)}
              />

              {/* 分配管理面板 */}
              <AssignmentPanel
                inquiry={selectedInquiry}
                availableAssignees={availableAssignees}
                currentAssignment={getInquiryAssignment(selectedInquiry.id)}
                userEmail={user?.email}
                onAssign={assignInquiry}
                onUpdateAssignmentStatus={updateAssignmentStatus}
                onProcessWorkflow={processInquiryWorkflow}
                onGetAssigneeWorkload={getAssigneeWorkload}
                onSuccess={(message: string) => success('成功', message)}
                onError={(message: string) => showError('錯誤', message)}
                onWarning={(message: string) => warning('提示', message)}
              />
            </InquiryDetailPanel>
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
