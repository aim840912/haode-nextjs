'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import AdminProtection from '@/components/AdminProtection';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ComponentErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase-auth';
import { 
  InquiryWithItems, 
  InquiryStatus,
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUS_COLORS,
  InquiryUtils
} from '@/types/inquiry';

function AdminInquiriesPage() {
  const { user } = useAuth();
  const { success, error: showError, warning } = useToast();
  const [inquiries, setInquiries] = useState<InquiryWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryWithItems | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // 刪除詢價單
  const deleteInquiry = async (inquiryId: string) => {
    // 確認對話框
    if (!confirm('確定要刪除這筆詢價單嗎？此操作無法復原。')) {
      return;
    }

    try {
      // 取得認證 token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('認證失敗');
      }

      // 呼叫 DELETE API
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        showError('刪除失敗', result.error || '刪除詢價單時發生錯誤');
        return;
      }

      // 更新本地狀態，移除已刪除的詢價單
      setInquiries(inquiries.filter(inquiry => inquiry.id !== inquiryId));
      
      // 如果刪除的是當前選中的詢價單，清除選中狀態
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry(null);
      }

      success('刪除成功', '詢價單已成功刪除');

    } catch (err) {
      console.error('Error deleting inquiry:', err);
      showError('刪除失敗', err instanceof Error ? err.message : '刪除詢價單時發生錯誤');
    }
  };

  // 取得所有詢價單
  const fetchInquiries = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // 取得認證 token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('認證失敗');
      }

      // 建立查詢參數
      const params = new URLSearchParams();
      params.append('admin', 'true'); // 管理員模式
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      params.append('sort_by', 'created_at');
      params.append('sort_order', 'desc');

      // 呼叫 API
      const response = await fetch(`/api/inquiries?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '取得詢價單列表失敗');
      }

      setInquiries(result.data || []);

    } catch (err) {
      console.error('Error fetching inquiries:', err);
      setError(err instanceof Error ? err.message : '載入詢價單時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  // 更新詢價單狀態
  const updateInquiryStatus = async (inquiryId: string, newStatus: InquiryStatus) => {
    if (!user) return;

    setIsUpdatingStatus(true);

    try {
      // 取得認證 token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('認證失敗');
      }

      // 呼叫 API 更新狀態
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();

      if (!response.ok) {
        // 不要拋出錯誤，直接處理並顯示 Toast 通知
        console.log('狀態更新失敗:', result.error);
        
        // 根據錯誤類型顯示不同的 Toast
        if (result.error && result.error.includes('無法從')) {
          warning('無法更新狀態', result.error);
        } else {
          showError('更新失敗', result.error || '更新狀態時發生錯誤，請稍後再試');
        }
        
        return; // 提前返回，不執行後續的本地狀態更新
      }

      // 更新本地狀態
      setInquiries(inquiries.map(inquiry => 
        inquiry.id === inquiryId 
          ? { ...inquiry, status: newStatus, updated_at: new Date().toISOString() }
          : inquiry
      ));

      // 如果有選中的詢價單，也更新它
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry({ ...selectedInquiry, status: newStatus, updated_at: new Date().toISOString() });
      }

      success('狀態更新成功', `詢價單狀態已更新為「${INQUIRY_STATUS_LABELS[newStatus]}」`);

    } catch (err) {
      console.error('Error updating status:', err);
      
      if (err instanceof Error && err.message.includes('無法從')) {
        // 狀態轉換錯誤，提供更友善的提示
        warning('無法更新狀態', err.message);
      } else {
        showError('更新失敗', err instanceof Error ? err.message : '更新狀態時發生錯誤，請稍後再試');
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 初始載入
  useEffect(() => {
    if (user) {
      fetchInquiries();
    }
  }, [user, statusFilter]);

  if (isLoading) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 pt-36 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">載入詢價單管理...</p>
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
                onClick={fetchInquiries}
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
            <h1 className="text-3xl font-bold text-gray-900">庫存查詢管理</h1>
            <p className="text-gray-600 mt-1">管理所有客戶庫存查詢和回覆狀態</p>
          </div>

          {/* 狀態篩選 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 font-medium">篩選狀態：</span>
                <div className="flex space-x-2">
                  {(['all', 'pending', 'quoted', 'confirmed', 'completed', 'cancelled'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        statusFilter === status
                          ? 'bg-amber-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'all' ? '全部' : INQUIRY_STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                共 {inquiries.length} 筆詢價單
              </div>
            </div>
          </div>

          {/* 詢價單列表 */}
          {inquiries.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-6xl mb-8">📋</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {statusFilter === 'all' ? '還沒有詢價單' : `沒有${INQUIRY_STATUS_LABELS[statusFilter as InquiryStatus]}的詢價單`}
              </h2>
              <p className="text-gray-600">當客戶送出詢價時，會顯示在這裡</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        詢價單號
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        客戶
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        商品摘要
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
                    {inquiries.map((inquiry) => (
                      <tr key={inquiry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            #{InquiryUtils.formatInquiryNumber(inquiry)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {inquiry.customer_name}
                            </div>
                            <div className="text-sm text-gray-700">
                              {inquiry.customer_email}
                            </div>
                            {inquiry.customer_phone && (
                              <div className="text-sm text-gray-700">
                                {inquiry.customer_phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {InquiryUtils.calculateTotalQuantity(inquiry)} 件商品
                          </div>
                          <div className="text-sm text-gray-700">
                            {inquiry.inquiry_items.slice(0, 2).map(item => item.product_name).join(', ')}
                            {inquiry.inquiry_items.length > 2 && '...'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            NT$ {InquiryUtils.calculateTotalAmount(inquiry).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={inquiry.status}
                            onChange={(e) => updateInquiryStatus(inquiry.id, e.target.value as InquiryStatus)}
                            disabled={isUpdatingStatus}
                            className={`text-sm font-medium rounded px-3 py-1.5 border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                              INQUIRY_STATUS_COLORS[inquiry.status]
                            } ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {(['pending', 'quoted', 'confirmed', 'completed', 'cancelled'] as const).map((status) => (
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

          {/* 詢價單詳情 Modal */}
          {selectedInquiry && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                      詢價單詳情 #{InquiryUtils.formatInquiryNumber(selectedInquiry)}
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
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">客戶資訊</h3>
                      <div className="space-y-2">
                        <p><span className="text-gray-900">姓名：</span><span className="text-gray-900">{selectedInquiry.customer_name}</span></p>
                        <p><span className="text-gray-900">Email：</span><span className="text-gray-900">{selectedInquiry.customer_email}</span></p>
                        {selectedInquiry.customer_phone && (
                          <p><span className="text-gray-900">電話：</span><span className="text-gray-900">{selectedInquiry.customer_phone}</span></p>
                        )}
                        {selectedInquiry.delivery_address && (
                          <p><span className="text-gray-900">配送地址：</span><span className="text-gray-900">{selectedInquiry.delivery_address}</span></p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">詢價資訊</h3>
                      <div className="space-y-2">
                        <p><span className="text-gray-900">狀態：</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${INQUIRY_STATUS_COLORS[selectedInquiry.status]}`}>
                            {INQUIRY_STATUS_LABELS[selectedInquiry.status]}
                          </span>
                        </p>
                        <p><span className="text-gray-900">建立時間：</span>
                          <span className="text-gray-900">{new Date(selectedInquiry.created_at).toLocaleString('zh-TW')}</span>
                        </p>
                        <p><span className="text-gray-900">更新時間：</span>
                          <span className="text-gray-900">{new Date(selectedInquiry.updated_at).toLocaleString('zh-TW')}</span>
                        </p>
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
                    <h3 className="font-semibold text-gray-900 mb-3">詢價商品</h3>
                    <div className="space-y-3">
                      {selectedInquiry.inquiry_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                            {item.product_category && (
                              <p className="text-sm text-gray-900">分類：{item.product_category}</p>
                            )}
                            <p className="text-sm text-gray-900">數量：{item.quantity}</p>
                          </div>
                          <div className="text-right">
                            {item.unit_price && (
                              <p className="text-sm text-gray-700">單價：NT$ {item.unit_price.toLocaleString()}</p>
                            )}
                            <p className="font-medium text-gray-900">
                              小計：NT$ {(item.total_price || (item.unit_price || 0) * item.quantity).toLocaleString()}
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
  );
}

export default function AdminInquiriesPageWithErrorBoundary() {
  return (
    <ComponentErrorBoundary>
      <AdminInquiriesPage />
    </ComponentErrorBoundary>
  );
}