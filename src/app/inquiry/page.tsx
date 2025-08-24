'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ComponentErrorBoundary } from '@/components/ErrorBoundary';
import { supabase } from '@/lib/supabase-auth';
import { 
  InquiryWithItems, 
  InquiryStatus,
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUS_COLORS,
  InquiryUtils,
  InquiryQueryParams
} from '@/types/inquiry';

function InquiryListPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: showError, warning } = useToast();
  
  // 狀態管理
  const [inquiries, setInquiries] = useState<InquiryWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const isInitialized = useRef(false);

  // 取得使用者詢價單
  const fetchUserInquiries = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // 取得認證 token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('請重新登入');
      }

      // 建立查詢參數
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      params.append('sort_by', 'created_at');
      params.append('sort_order', 'desc');
      params.append('limit', '100'); // 先載入較多資料，前端進行分頁

      // 呼叫 API（使用者模式，不是管理員模式）
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
      setError(err instanceof Error ? err.message : '載入詢價單時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  // 清理本地快取功能
  const clearLocalCache = () => {
    if (!confirm('確定要清除所有本地快取嗎？這將清除購物車和暫存的詢價資料。')) {
      return;
    }

    try {
      // 清理購物車資料
      localStorage.removeItem('cart');
      // 清理複製詢價資料
      localStorage.removeItem('duplicate_inquiry_data');
      // 清理其他可能的詢價相關資料
      const inquiryKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('inquiry') || key.includes('cart') || key.includes('order'))) {
          inquiryKeys.push(key);
        }
      }
      inquiryKeys.forEach(key => localStorage.removeItem(key));
      
      success('清理完成', '所有本地快取資料已清除，頁面將重新載入');
      
      // 重新載入頁面以更新狀態
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (err) {
      showError('清理失敗', '清除本地快取時發生錯誤');
    }
  };

  // 重新詢價功能（複製現有詢價單）
  const duplicateInquiry = async (inquiry: InquiryWithItems) => {
    try {
      // 跳轉到購物車頁面，並帶上詢價資料
      const inquiryData = {
        items: inquiry.inquiry_items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.unit_price || 0
        })),
        customer_info: {
          name: inquiry.customer_name,
          email: inquiry.customer_email,
          phone: inquiry.customer_phone,
          address: inquiry.delivery_address,
          notes: inquiry.notes
        }
      };

      // 將資料存到 localStorage 供購物車頁面使用
      localStorage.setItem('duplicate_inquiry_data', JSON.stringify(inquiryData));
      
      // 導航到購物車頁面
      window.location.href = '/cart?from=duplicate_inquiry';
      
      success('成功複製查詢單', '已將商品加入購物車，您可以修改後重新查詢庫存');
      
    } catch (err) {
      showError('複製失敗', '複製查詢單時發生錯誤');
    }
  };

  // 篩選和搜尋功能
  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = !searchTerm || 
      inquiry.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      InquiryUtils.formatInquiryNumber(inquiry).toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.inquiry_items.some(item => item.product_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // 分頁計算
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInquiries = filteredInquiries.slice(startIndex, startIndex + itemsPerPage);

  // 初始載入（只在使用者認證完成時載入一次）
  useEffect(() => {
    if (user && !isInitialized.current) {
      isInitialized.current = true;
      fetchUserInquiries();
    }
  }, [user]);

  // 當狀態篩選條件改變時重新載入（跳過初始值）
  useEffect(() => {
    if (user && isInitialized.current) {
      fetchUserInquiries();
    }
  }, [statusFilter]);

  // 重置分頁當篩選條件改變
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  // 認證載入中
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-36 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // 未登入
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-36">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="text-6xl mb-8">🔒</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">需要登入</h1>
            <p className="text-gray-600 mb-8">請先登入以查看您的詢價單</p>
            <div className="space-x-4">
              <Link
                href="/login"
                className="bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors"
              >
                登入
              </Link>
              <Link
                href="/register"
                className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                註冊
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 載入中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-36 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">載入詢價單...</p>
        </div>
      </div>
    );
  }

  // 載入錯誤
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-36">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="text-6xl mb-8">❌</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">載入失敗</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={fetchUserInquiries}
              className="bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-36">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">我的庫存查詢記錄</h1>
              <p className="text-gray-600 mt-1">查看和管理您的庫存查詢與預訂記錄</p>
            </div>
            {filteredInquiries.length === 0 && inquiries.length === 0 && (
              <button
                onClick={clearLocalCache}
                className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm border border-red-300"
                title="清除本地快取資料"
              >
                🗑️ 清理快取
              </button>
            )}
          </div>
        </div>

        {/* 篩選和搜尋 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* 狀態篩選 */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">篩選狀態：</span>
              <div className="flex flex-wrap gap-2">
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

            {/* 搜尋欄 */}
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="搜尋查詢單號、商品名稱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 min-w-[300px] text-gray-900 placeholder-gray-500"
              />
              <div className="text-sm text-gray-600">
                共 {filteredInquiries.length} 筆查詢記錄
              </div>
            </div>
          </div>
        </div>

        {/* 詢價單列表 */}
        {filteredInquiries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-8">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {statusFilter === 'all' ? '還沒有查詢記錄' : `沒有${INQUIRY_STATUS_LABELS[statusFilter as InquiryStatus]}的查詢記錄`}
            </h2>
            <p className="text-gray-600 mb-8">
              {searchTerm ? '請嘗試不同的搜尋條件' : '開始購物並查詢庫存吧！'}
            </p>
            <Link
              href="/products"
              className="bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors inline-block"
            >
              瀏覽商品
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedInquiries.map((inquiry) => (
              <div key={inquiry.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  {/* 左側：詢價單資訊 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          查詢單 #{InquiryUtils.formatInquiryNumber(inquiry)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(inquiry.created_at).toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${INQUIRY_STATUS_COLORS[inquiry.status]}`}>
                        {INQUIRY_STATUS_LABELS[inquiry.status]}
                      </span>
                    </div>

                    {/* 商品摘要 */}
                    <div className="mb-4">
                      <p className="text-gray-900 font-medium">
                        共 {InquiryUtils.calculateTotalQuantity(inquiry)} 件商品
                      </p>
                      <p className="text-sm text-gray-600">
                        {inquiry.inquiry_items.slice(0, 3).map(item => 
                          `${item.product_name} x${item.quantity}`
                        ).join('、')}
                        {inquiry.inquiry_items.length > 3 && '...'}
                      </p>
                      <p className="text-lg font-semibold text-amber-900 mt-2">
                        總金額：NT$ {InquiryUtils.calculateTotalAmount(inquiry).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* 右側：操作按鈕 */}
                  <div className="flex flex-col sm:flex-row gap-3 lg:ml-6">
                    <Link
                      href={`/inquiry/${inquiry.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm"
                    >
                      查看詳情
                    </Link>
                    
                    {inquiry.status === 'quoted' && (
                      <Link
                        href={`/inquiry/${inquiry.id}?action=accept`}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center text-sm"
                      >
                        確認預訂
                      </Link>
                    )}
                    
                    <button
                      onClick={() => duplicateInquiry(inquiry)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      重新查詢
                    </button>
                  </div>
                </div>

                {/* 客戶備註 */}
                {inquiry.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">備註：</span>{inquiry.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* 分頁 */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    上一頁
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          currentPage === page
                            ? 'bg-amber-900 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InquiryListPageWithErrorBoundary() {
  return (
    <ComponentErrorBoundary>
      <InquiryListPage />
    </ComponentErrorBoundary>
  );
}