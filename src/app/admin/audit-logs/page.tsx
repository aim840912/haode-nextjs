'use client'

import { useState } from 'react'
import { logger } from '@/lib/logger'
import { useAuth } from '@/contexts/AuthContext'
import AdminProtection from '@/components/features/admin/AdminProtection'
import LoadingSpinner from '@/components/ui/loading/LoadingSpinner'
import { ComponentErrorBoundary } from '@/components/ui/error/ErrorBoundary'
import { useToast } from '@/components/ui/feedback/Toast'
import { supabase } from '@/lib/database/supabase-auth'
import { AuditLog } from '@/types/audit'

// Hooks
import { useAuditLogsData } from './hooks/useAuditLogsData'
import { useAuditLogFilters } from './hooks/useAuditLogFilters'

// Components
import { AuditLogFilters } from './components/AuditLogFilters'
import { AuditLogsTable } from './components/AuditLogsTable'
import { AuditLogDetailModal } from './components/AuditLogDetailModal'
import { DeleteConfirmModal } from './components/DeleteConfirmModal'

function AuditLogsPage() {
  const { user } = useAuth()
  const { success, error: showError } = useToast()

  // 使用自定義 hooks
  const { filters, updateFilter, clearFilters, loadMore } = useAuditLogFilters()
  const { auditLogs, isLoading, error, refetch } = useAuditLogsData(user?.id, filters)

  // UI 狀態管理
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [selectedLogs, setSelectedLogs] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<
    { type: 'single'; data?: AuditLog } | { type: 'batch'; data?: { ids: string[] } }
  >({ type: 'single' })

  // 切換選取日誌
  const toggleSelectLog = (logId: string) => {
    setSelectedLogs(prev =>
      prev.includes(logId) ? prev.filter(id => id !== logId) : [...prev, logId]
    )
  }

  // 全選/取消全選
  const toggleSelectAll = () => {
    setSelectedLogs(prev => (prev.length === auditLogs.length ? [] : auditLogs.map(log => log.id)))
  }

  // 刪除單個日誌
  const handleDeleteSingle = (log: AuditLog) => {
    setDeleteTarget({ type: 'single', data: log })
    setShowDeleteConfirm(true)
  }

  // 批量刪除選中的日誌
  const handleDeleteSelected = () => {
    if (selectedLogs.length === 0) return
    setDeleteTarget({ type: 'batch', data: { ids: selectedLogs } })
    setShowDeleteConfirm(true)
  }

  // 執行刪除操作
  const executeDelete = async () => {
    if (!user || isDeleting) return

    setIsDeleting(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('認證失敗')
      }

      let response

      if (deleteTarget.type === 'single') {
        // 刪除單個日誌
        const logId = deleteTarget.data?.id
        response = await fetch(`/api/audit-logs/${logId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })
      } else {
        // 批量刪除
        response = await fetch('/api/audit-logs/batch', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'delete_by_ids',
            ids: deleteTarget.data?.ids,
          }),
        })
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '刪除失敗')
      }

      success(result.message || '刪除成功')
      setShowDeleteConfirm(false)
      setSelectedLogs([])
      await refetch() // 重新載入數據
    } catch (err) {
      logger.error('刪除審計日誌失敗', err instanceof Error ? err : new Error('Unknown error'), {
        module: 'AuditLogsPage',
      })
      showError(err instanceof Error ? err.message : '刪除時發生錯誤')
    } finally {
      setIsDeleting(false)
    }
  }

  // 載入狀態
  if (isLoading && auditLogs.length === 0) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AdminProtection>
    )
  }

  // 錯誤狀態
  if (error) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">載入失敗</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </AdminProtection>
    )
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 頁面標題 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">審計日誌</h1>
            <p className="text-gray-600 mt-2">查看和管理系統活動記錄</p>
          </div>

          {/* 篩選條件 */}
          <AuditLogFilters
            filters={filters}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
            selectedLogsCount={selectedLogs.length}
            totalLogsCount={auditLogs.length}
            onDeleteSelected={handleDeleteSelected}
            isDeleting={isDeleting}
          />

          {/* 審計日誌列表 */}
          <AuditLogsTable
            auditLogs={auditLogs}
            selectedLogs={selectedLogs}
            filters={filters}
            isLoading={isLoading}
            onToggleSelectLog={toggleSelectLog}
            onToggleSelectAll={toggleSelectAll}
            onViewDetail={setSelectedLog}
            onDeleteSingle={handleDeleteSingle}
            onLoadMore={loadMore}
            isDeleting={isDeleting}
          />

          {/* 詳情 Modal */}
          <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />

          {/* 刪除確認 Modal */}
          <DeleteConfirmModal
            isOpen={showDeleteConfirm}
            deleteTarget={deleteTarget}
            isDeleting={isDeleting}
            onConfirm={executeDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        </div>
      </div>
    </AdminProtection>
  )
}

export default function AuditLogsPageWithErrorBoundary() {
  return (
    <ComponentErrorBoundary>
      <AuditLogsPage />
    </ComponentErrorBoundary>
  )
}
