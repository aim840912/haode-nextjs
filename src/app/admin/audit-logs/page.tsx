'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import AdminProtection from '@/components/AdminProtection';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ComponentErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/components/Toast';
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
  UserRole
} from '@/types/audit';

function AuditLogsPage() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  
  // 狀態管理
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // 篩選狀態
  const [filters, setFilters] = useState<AuditLogQueryParams>({
    limit: 50,
    offset: 0,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // 取得審計日誌
  const fetchAuditLogs = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // 取得認證 token
      const { data: { session } } = await import('@/lib/supabase-auth').then(m => m.supabase.auth.getSession());
      if (!session?.access_token) {
        throw new Error('認證失敗');
      }

      // 建立查詢參數
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      // 呼叫 API
      const response = await fetch(`/api/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '取得審計日誌失敗');
      }

      setAuditLogs(result.data || []);

    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : '載入審計日誌時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  // 更新篩選條件
  const updateFilter = (key: keyof AuditLogQueryParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0 // 重置分頁
    }));
  };

  // 清除篩選條件
  const clearFilters = () => {
    setFilters({
      limit: 50,
      offset: 0,
      sort_by: 'created_at',
      sort_order: 'desc'
    });
  };

  // 載入更多
  const loadMore = () => {
    setFilters(prev => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 50)
    }));
  };

  // 初始載入和篩選條件變更時重新載入
  useEffect(() => {
    if (user) {
      fetchAuditLogs();
    }
  }, [user, filters]);

  if (isLoading && auditLogs.length === 0) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 pt-36 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">載入審計日誌...</p>
          </div>
        </div>
      </AdminProtection>
    );
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
                onClick={fetchAuditLogs}
                className="bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors"
              >
                重新載入
              </button>
            </div>
          </div>
        </div>
      </AdminProtection>
    );
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 pt-36">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">審計日誌</h1>
            <p className="text-gray-600 mt-1">追蹤系統操作和使用者活動</p>
          </div>

          {/* 篩選條件 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* 使用者篩選 */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">使用者 Email</label>
                <input
                  type="email"
                  value={filters.user_email || ''}
                  onChange={(e) => updateFilter('user_email', e.target.value)}
                  placeholder="輸入使用者 Email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-600"
                />
              </div>

              {/* 動作篩選 */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">動作類型</label>
                <select
                  value={filters.action || ''}
                  onChange={(e) => updateFilter('action', e.target.value as AuditAction)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">全部動作</option>
                  {Object.entries(AUDIT_ACTION_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* 資源類型篩選 */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">資源類型</label>
                <select
                  value={filters.resource_type || ''}
                  onChange={(e) => updateFilter('resource_type', e.target.value as ResourceType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">全部類型</option>
                  {Object.entries(RESOURCE_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* 使用者角色篩選 */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">使用者角色</label>
                <select
                  value={filters.user_role || ''}
                  onChange={(e) => updateFilter('user_role', e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">全部角色</option>
                  {Object.entries(USER_ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
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
                  onChange={(e) => updateFilter('start_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* 結束日期 */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">結束日期</label>
                <input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => updateFilter('end_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* IP 地址 */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">IP 地址</label>
                <input
                  type="text"
                  value={filters.ip_address || ''}
                  onChange={(e) => updateFilter('ip_address', e.target.value)}
                  placeholder="輸入 IP 地址"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                共 {auditLogs.length} 筆記錄
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
                    {auditLogs.map((log) => (
                      <tr key={log.id} className={`hover:bg-gray-50 ${
                        AuditLogUtils.isSensitiveAction(log.action) ? 'bg-red-50' : ''
                      }`}>
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
                          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                            AUDIT_ACTION_COLORS[log.action]
                          }`}>
                            {AUDIT_ACTION_LABELS[log.action]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {RESOURCE_TYPE_LABELS[log.resource_type]}
                          </div>
                          <div className="text-sm text-gray-900 font-mono">
                            {log.resource_id}
                          </div>
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
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            查看詳情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 載入更多按鈕 */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    已顯示 {auditLogs.length} 筆記錄
                  </div>
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
                          <p><span className="font-medium">ID:</span> {selectedLog.id}</p>
                          <p><span className="font-medium">時間:</span> {new Date(selectedLog.created_at).toLocaleString('zh-TW')}</p>
                          <p><span className="font-medium">動作:</span> 
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${AUDIT_ACTION_COLORS[selectedLog.action]}`}>
                              {AUDIT_ACTION_LABELS[selectedLog.action]}
                            </span>
                          </p>
                          <p><span className="font-medium">資源:</span> {RESOURCE_TYPE_LABELS[selectedLog.resource_type]} ({selectedLog.resource_id})</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">使用者資訊</h3>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <p><span className="font-medium">姓名:</span> {selectedLog.user_name || '未知'}</p>
                          <p><span className="font-medium">Email:</span> {selectedLog.user_email}</p>
                          <p><span className="font-medium">角色:</span> {selectedLog.user_role ? USER_ROLE_LABELS[selectedLog.user_role as UserRole] : '未知'}</p>
                          <p><span className="font-medium">IP 地址:</span> {selectedLog.ip_address || '未知'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {selectedLog.resource_details && Object.keys(selectedLog.resource_details).length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">資源詳情</h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <pre className="text-sm whitespace-pre-wrap">
                              {JSON.stringify(selectedLog.resource_details, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {(selectedLog.previous_data && Object.keys(selectedLog.previous_data).length > 0) && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">變更前資料</h3>
                          <div className="bg-red-50 p-4 rounded-lg">
                            <pre className="text-sm whitespace-pre-wrap">
                              {JSON.stringify(selectedLog.previous_data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {(selectedLog.new_data && Object.keys(selectedLog.new_data).length > 0) && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">變更後資料</h3>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <pre className="text-sm whitespace-pre-wrap">
                              {JSON.stringify(selectedLog.new_data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">額外資訊</h3>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <pre className="text-sm whitespace-pre-wrap">
                              {JSON.stringify(selectedLog.metadata, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {selectedLog.user_agent && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">瀏覽器資訊</h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm break-all">{selectedLog.user_agent}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminProtection>
  );
}

export default function AuditLogsPageWithErrorBoundary() {
  return (
    <ComponentErrorBoundary>
      <AuditLogsPage />
    </ComponentErrorBoundary>
  );
}