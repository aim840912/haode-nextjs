import {
  AuditLogQueryParams,
  AuditAction,
  ResourceType,
  UserRole,
  AUDIT_ACTION_LABELS,
  RESOURCE_TYPE_LABELS,
  USER_ROLE_LABELS,
} from '@/types/audit'

interface AuditLogFiltersProps {
  filters: AuditLogQueryParams
  updateFilter: (
    key: keyof AuditLogQueryParams,
    value: string | number | AuditAction | ResourceType | UserRole
  ) => void
  clearFilters: () => void
  selectedLogsCount: number
  totalLogsCount: number
  onDeleteSelected: () => void
  isDeleting: boolean
}

/**
 * 審計日誌篩選元件
 * 負責顯示所有篩選條件和操作按鈕
 */
export function AuditLogFilters({
  filters,
  updateFilter,
  clearFilters,
  selectedLogsCount,
  totalLogsCount,
  onDeleteSelected,
  isDeleting,
}: AuditLogFiltersProps) {
  return (
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
          <div className="text-sm text-gray-700">共 {totalLogsCount} 筆記錄</div>
          {selectedLogsCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-600">已選取 {selectedLogsCount} 筆</span>
              <button
                onClick={onDeleteSelected}
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
  )
}
