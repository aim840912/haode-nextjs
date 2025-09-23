'use client'

import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { useAuth } from '@/contexts/AuthContext'
import AdminProtection from '@/components/features/admin/AdminProtection'
import LoadingSpinner from '@/components/ui/loading/LoadingSpinner'
import { ComponentErrorBoundary } from '@/components/ui/error/ErrorBoundary'
import { useToast } from '@/components/ui/feedback/Toast'
import { supabase } from '@/lib/database/supabase-auth'
import {
  AuditLog,
  AuditLogQueryParams,
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_COLORS,
  RESOURCE_TYPE_LABELS,
  USER_ROLE_LABELS,
  AuditLogUtils,
  AuditAction,
  ResourceType,
  UserRole,
} from '@/types/audit'

function AuditLogsPage() {
  const { user } = useAuth()
  const { success, error: showError } = useToast()

  // 狀態管理
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [selectedLogs, setSelectedLogs] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<
    { type: 'single'; data?: AuditLog } | { type: 'batch'; data?: { ids: string[] } }
  >({ type: 'single' })

  // 篩選狀態
  const [filters, setFilters] = useState<AuditLogQueryParams>({
    limit: 50,
    offset: 0,
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  // 取得審計日誌
  const fetchAuditLogs = useCallback(async () => {
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
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      // 呼叫 API
      const response = await fetch(`/api/audit-logs?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '取得審計日誌失敗')
      }

      setAuditLogs(result.data || [])
    } catch (err) {
      logger.error('載入審計日誌失敗', err instanceof Error ? err : new Error('Unknown error'))
      setError(err instanceof Error ? err.message : '載入審計日誌時發生錯誤')
    } finally {
      setIsLoading(false)
    }
  }, [user, filters])

  // 防抖版本的 fetchAuditLogs
  const debouncedFetchAuditLogs = useCallback(() => {
    const debounced = debounce(() => {
      if (user) {
        fetchAuditLogs()
      }
    }, 500)
    return debounced()
  }, [user, fetchAuditLogs])

  // 更新篩選條件
  const updateFilter = (
    key: keyof AuditLogQueryParams,
    value: string | number | AuditAction | ResourceType | UserRole
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0, // 重置分頁
    }))
  }

  // 防抖函數
  function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number) {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  // 清除篩選條件
  const clearFilters = () => {
    setFilters({
      limit: 50,
      offset: 0,
      sort_by: 'created_at',
      sort_order: 'desc',
    })
  }

  // 載入更多
  const loadMore = () => {
    setFilters(prev => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 50),
    }))
  }

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
      await fetchAuditLogs() // 重新載入數據
    } catch (err) {
      logger.error('刪除審計日誌失敗', err instanceof Error ? err : new Error('Unknown error'))
      showError(err instanceof Error ? err.message : '刪除審計日誌時發生錯誤')
    } finally {
      setIsDeleting(false)
    }
  }

  // 初始載入
  useEffect(() => {
    if (user) {
      fetchAuditLogs()
    }
  }, [user, fetchAuditLogs])

  // 篩選條件變更時重新載入（對文字輸入使用防抖）
  useEffect(() => {
    if (user) {
      // 文字輸入類型的篩選使用防抖
      const textFilters = ['user_email', 'ip_address']
      const hasTextFilter = textFilters.some(key => filters[key as keyof typeof filters])

      if (hasTextFilter) {
        debouncedFetchAuditLogs()
      } else {
        // 下拉選單、日期等立即更新
        fetchAuditLogs()
      }
    }
  }, [filters, user, debouncedFetchAuditLogs, fetchAuditLogs])

  if (isLoading && auditLogs.length === 0) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">載入審計日誌...</p>
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
              <div className="text-6xl mb-8">❌</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">載入失敗</h1>
              <p className="text-gray-600 mb-8">{error}</p>
              <button
                onClick={fetchAuditLogs}
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
              <h1 className="text-3xl font-bold text-gray-900">審計日誌</h1>
              <p className="text-gray-600 mt-2">追蹤系統操作和使用者活動</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* 篩選條件 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* 使用者篩選 */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">使用者 Email</label>
                <input
                  type="email"
                  value={filters.user_email || ''}
                  onChange={e => updateFilter('user_email', e.target.value)}
                  placeholder="輸入使用者 Email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 placeholder:text-gray-600"
                />
              </div>

              {/* 動作篩選 */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">動作類型</label>
                <select
                  value={filters.action || ''}
                  onChange={e => updateFilter('action', e.target.value as AuditAction)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                >
                  <option value="">全部動作</option>
                  {Object.entries(AUDIT_ACTION_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 資源類型篩選 */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">資源類型</label>
                <select
                  value={filters.resource_type || ''}
                  onChange={e => updateFilter('resource_type', e.target.value as ResourceType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                >
                  <option value="">全部類型</option>
                  {Object.entries(RESOURCE_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 使用者角色篩選 */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">使用者角色</label>
                <select
                  value={filters.user_role || ''}
                  onChange={e => updateFilter('user_role', e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                >
                  <option value="">全部角色</option>
                  {Object.entries(USER_ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* 開始日期 */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">開始日期</label>
                <input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={e => updateFilter('start_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                />
              </div>

              {/* 結束日期 */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">結束日期</label>
                <input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={e => updateFilter('end_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                />
              </div>

              {/* IP 地址 */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">IP 地址</label>
                <input
                  type="text"
                  value={filters.ip_address || ''}
                  onChange={e => updateFilter('ip_address', e.target.value)}
                  placeholder="輸入 IP 地址"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 placeholder:text-gray-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">共 {auditLogs.length} 筆記錄</div>
                {selectedLogs.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-blue-600">已選取 {selectedLogs.length} 筆</span>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={isDeleting}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {isDeleting ? '刪除中...' : '刪除選取項目'}
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                清除篩選
              </button>
            </div>
          </div>

          {/* 審計日誌列表 */}
          {auditLogs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-6xl mb-8">📋</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">沒有找到審計日誌</h2>
              <p className="text-gray-600">請調整篩選條件或稍後再試</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedLogs.length === auditLogs.length && auditLogs.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-amber-900 focus:ring-amber-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                        時間
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                        使用者
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                        動作
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                        資源
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                        詳情
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                        IP 地址
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.map(log => (
                      <tr
                        key={log.id}
                        className={`hover:bg-gray-50 ${
                          AuditLogUtils.isSensitiveAction(log.action) ? 'bg-red-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedLogs.includes(log.id)}
                            onChange={() => toggleSelectLog(log.id)}
                            className="rounded border-gray-300 text-amber-900 focus:ring-amber-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium">
                            {new Date(log.created_at).toLocaleString('zh-TW')}
                          </div>
                          <div className="text-xs text-gray-600">
                            {AuditLogUtils.formatTimeAgo(log.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.user_name || '未知使用者'}
                            </div>
                            <div className="text-sm text-gray-900">{log.user_email}</div>
                            {log.user_role && (
                              <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-900 mt-1">
                                {USER_ROLE_LABELS[log.user_role as UserRole] || log.user_role}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                              AUDIT_ACTION_COLORS[log.action]
                            }`}
                          >
                            {AUDIT_ACTION_LABELS[log.action]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {RESOURCE_TYPE_LABELS[log.resource_type]}
                          </div>
                          <div className="text-sm text-gray-900 font-mono">{log.resource_id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {AuditLogUtils.createResourceSummary(
                              log.resource_type,
                              log.resource_details
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {log.ip_address || '未知'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              查看詳情
                            </button>
                            <button
                              onClick={() => handleDeleteSingle(log)}
                              disabled={isDeleting}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
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

              {/* 載入更多按鈕 */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700">已顯示 {auditLogs.length} 筆記錄</div>
                  <button
                    onClick={loadMore}
                    disabled={isLoading || auditLogs.length < (filters.limit || 50)}
                    className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '載入中...' : '載入更多'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 詳情 Modal */}
          {selectedLog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">審計日誌詳情</h2>
                    <button
                      onClick={() => setSelectedLog(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">基本資訊</h3>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <p className="text-gray-900">
                            <span className="font-medium text-gray-700">ID:</span> {selectedLog.id}
                          </p>
                          <p className="text-gray-900">
                            <span className="font-medium text-gray-700">時間:</span>{' '}
                            {new Date(selectedLog.created_at).toLocaleString('zh-TW')}
                          </p>
                          <p className="text-gray-900">
                            <span className="font-medium text-gray-700">動作:</span>
                            <span
                              className={`ml-2 px-2 py-1 text-xs rounded-full ${AUDIT_ACTION_COLORS[selectedLog.action]}`}
                            >
                              {AUDIT_ACTION_LABELS[selectedLog.action]}
                            </span>
                          </p>
                          <p className="text-gray-900">
                            <span className="font-medium text-gray-700">資源:</span>{' '}
                            {RESOURCE_TYPE_LABELS[selectedLog.resource_type]} (
                            {selectedLog.resource_id})
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">使用者資訊</h3>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <p className="text-gray-900">
                            <span className="font-medium text-gray-700">姓名:</span>{' '}
                            {selectedLog.user_name || '未知'}
                          </p>
                          <p className="text-gray-900">
                            <span className="font-medium text-gray-700">Email:</span>{' '}
                            {selectedLog.user_email}
                          </p>
                          <p className="text-gray-900">
                            <span className="font-medium text-gray-700">角色:</span>{' '}
                            {selectedLog.user_role
                              ? USER_ROLE_LABELS[selectedLog.user_role as UserRole]
                              : '未知'}
                          </p>
                          <p className="text-gray-900">
                            <span className="font-medium text-gray-700">IP 地址:</span>{' '}
                            {selectedLog.ip_address || '未知'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {selectedLog.resource_details &&
                        Object.keys(selectedLog.resource_details).length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">資源詳情</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                                {JSON.stringify(selectedLog.resource_details, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                      {selectedLog.previous_data &&
                        Object.keys(selectedLog.previous_data).length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">變更前資料</h3>
                            <div className="bg-red-50 p-4 rounded-lg">
                              <pre className="text-sm text-red-900 whitespace-pre-wrap">
                                {JSON.stringify(selectedLog.previous_data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                      {selectedLog.new_data && Object.keys(selectedLog.new_data).length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">變更後資料</h3>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <pre className="text-sm text-green-900 whitespace-pre-wrap">
                              {JSON.stringify(selectedLog.new_data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">額外資訊</h3>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <pre className="text-sm text-blue-900 whitespace-pre-wrap">
                              {JSON.stringify(selectedLog.metadata, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {selectedLog.user_agent && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">瀏覽器資訊</h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-900 break-all">
                              {selectedLog.user_agent}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 刪除確認 Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">確認刪除</h2>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mb-6">
                    {deleteTarget.type === 'single' ? (
                      <div>
                        <p className="text-gray-600 mb-4">確定要刪除這筆審計日誌嗎？</p>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>時間：</strong>
                            {deleteTarget.data?.created_at &&
                              new Date(deleteTarget.data.created_at).toLocaleString('zh-TW')}
                          </p>
                          <p className="text-sm text-gray-700">
                            <strong>動作：</strong>
                            {deleteTarget.data?.action &&
                              AUDIT_ACTION_LABELS[deleteTarget.data.action as AuditAction]}
                          </p>
                          <p className="text-sm text-gray-700">
                            <strong>使用者：</strong>
                            {deleteTarget.data?.user_email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-600 mb-4">
                          確定要刪除選取的 <strong>{deleteTarget.data?.ids?.length}</strong>{' '}
                          筆審計日誌嗎？
                        </p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-700">⚠️ 此操作無法復原，請謹慎確認</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={executeDelete}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {isDeleting ? '刪除中...' : '確認刪除'}
                    </button>
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

export default function AuditLogsPageWithErrorBoundary() {
  return (
    <ComponentErrorBoundary>
      <AuditLogsPage />
    </ComponentErrorBoundary>
  )
}
