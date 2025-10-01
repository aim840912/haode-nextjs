import {
  AuditLog,
  AuditLogQueryParams,
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_COLORS,
  RESOURCE_TYPE_LABELS,
  USER_ROLE_LABELS,
  AuditLogUtils,
  UserRole,
} from '@/types/audit'

interface AuditLogsTableProps {
  auditLogs: AuditLog[]
  selectedLogs: string[]
  filters: AuditLogQueryParams
  isLoading: boolean
  onToggleSelectLog: (logId: string) => void
  onToggleSelectAll: () => void
  onViewDetail: (log: AuditLog) => void
  onDeleteSingle: (log: AuditLog) => void
  onLoadMore: () => void
  isDeleting: boolean
}

/**
 * 審計日誌表格元件
 * 負責顯示日誌列表和操作按鈕
 */
export function AuditLogsTable({
  auditLogs,
  selectedLogs,
  filters,
  isLoading,
  onToggleSelectLog,
  onToggleSelectAll,
  onViewDetail,
  onDeleteSingle,
  onLoadMore,
  isDeleting,
}: AuditLogsTableProps) {
  // 空狀態
  if (auditLogs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="text-6xl mb-8">📋</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">沒有找到審計日誌</h2>
        <p className="text-gray-600">請調整篩選條件或稍後再試</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedLogs.length === auditLogs.length && auditLogs.length > 0}
                  onChange={onToggleSelectAll}
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
                    onChange={() => onToggleSelectLog(log.id)}
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
                    {AuditLogUtils.createResourceSummary(log.resource_type, log.resource_details)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                  {log.ip_address || '未知'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewDetail(log)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      查看詳情
                    </button>
                    <button
                      onClick={() => onDeleteSingle(log)}
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
            onClick={onLoadMore}
            disabled={isLoading || auditLogs.length < (filters.limit || 50)}
            className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '載入中...' : '載入更多'}
          </button>
        </div>
      </div>
    </div>
  )
}
