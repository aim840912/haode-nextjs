import {
  AuditLog,
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_COLORS,
  RESOURCE_TYPE_LABELS,
  USER_ROLE_LABELS,
  UserRole,
} from '@/types/audit'

interface AuditLogDetailModalProps {
  log: AuditLog | null
  onClose: () => void
}

/**
 * 審計日誌詳情彈窗元件
 * 負責顯示單一日誌的完整資訊
 */
export function AuditLogDetailModal({ log, onClose }: AuditLogDetailModalProps) {
  if (!log) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">審計日誌詳情</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
                    <span className="font-medium text-gray-700">ID:</span> {log.id}
                  </p>
                  <p className="text-gray-900">
                    <span className="font-medium text-gray-700">時間:</span>{' '}
                    {new Date(log.created_at).toLocaleString('zh-TW')}
                  </p>
                  <p className="text-gray-900">
                    <span className="font-medium text-gray-700">動作:</span>
                    <span
                      className={`ml-2 px-2 py-1 text-xs rounded-full ${AUDIT_ACTION_COLORS[log.action]}`}
                    >
                      {AUDIT_ACTION_LABELS[log.action]}
                    </span>
                  </p>
                  <p className="text-gray-900">
                    <span className="font-medium text-gray-700">資源:</span>{' '}
                    {RESOURCE_TYPE_LABELS[log.resource_type]} ({log.resource_id})
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">使用者資訊</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-900">
                    <span className="font-medium text-gray-700">姓名:</span>{' '}
                    {log.user_name || '未知'}
                  </p>
                  <p className="text-gray-900">
                    <span className="font-medium text-gray-700">Email:</span> {log.user_email}
                  </p>
                  <p className="text-gray-900">
                    <span className="font-medium text-gray-700">角色:</span>{' '}
                    {log.user_role ? USER_ROLE_LABELS[log.user_role as UserRole] : '未知'}
                  </p>
                  <p className="text-gray-900">
                    <span className="font-medium text-gray-700">IP 地址:</span>{' '}
                    {log.ip_address || '未知'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {log.resource_details && Object.keys(log.resource_details).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">資源詳情</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                      {JSON.stringify(log.resource_details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {log.previous_data && Object.keys(log.previous_data).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">變更前資料</h3>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <pre className="text-sm text-red-900 whitespace-pre-wrap">
                      {JSON.stringify(log.previous_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {log.new_data && Object.keys(log.new_data).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">變更後資料</h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <pre className="text-sm text-green-900 whitespace-pre-wrap">
                      {JSON.stringify(log.new_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">額外資訊</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <pre className="text-sm text-blue-900 whitespace-pre-wrap">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {log.user_agent && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">瀏覽器資訊</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-900 break-all">{log.user_agent}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
