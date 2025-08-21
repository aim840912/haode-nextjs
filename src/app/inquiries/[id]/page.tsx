'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ComponentErrorBoundary } from '@/components/ErrorBoundary';
import { 
  InquiryWithItems, 
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUS_COLORS,
  InquiryUtils
} from '@/types/inquiry';

interface InquiryDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function InquiryDetailPage({ params }: InquiryDetailPageProps) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [inquiry, setInquiry] = useState<InquiryWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inquiryId, setInquiryId] = useState<string>('');

  // 取得參數
  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setInquiryId(id);
    };
    getParams();
  }, [params]);

  // 取得詢價單詳情
  const fetchInquiry = async () => {
    if (!user || !inquiryId) return;

    setIsLoading(true);
    setError(null);

    try {
      // 取得認證 token
      const { data: { session } } = await import('@/lib/supabase-auth').then(m => m.supabase.auth.getSession());
      if (!session?.access_token) {
        throw new Error('認證失敗');
      }

      // 呼叫 API
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('找不到詢價單');
        }
        throw new Error(result.error || '取得詢價單詳情失敗');
      }

      setInquiry(result.data);

    } catch (err) {
      console.error('Error fetching inquiry:', err);
      setError(err instanceof Error ? err.message : '載入詢價單時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    if (user && inquiryId) {
      fetchInquiry();
    } else if (!authLoading && !inquiryId) {
      setIsLoading(false);
    }
  }, [user, authLoading, inquiryId]);

  // 載入中狀態
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-36 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">載入詢價單詳情...</p>
        </div>
      </div>
    );
  }

  // 未登入檢查
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-36">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="text-6xl mb-8">🔒</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">需要登入才能查看詢價單</h1>
            <p className="text-gray-600 mb-8">請先登入您的帳戶！</p>
            <Link 
              href="/login"
              className="bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors"
            >
              立即登入
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-36">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="text-6xl mb-8">❌</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">載入失敗</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <div className="space-x-4">
              <button
                onClick={fetchInquiry}
                className="bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors"
              >
                重新載入
              </button>
              <Link
                href="/inquiries"
                className="border border-amber-900 text-amber-900 px-8 py-3 rounded-lg hover:bg-amber-50 transition-colors"
              >
                返回列表
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="min-h-screen bg-gray-50 pt-36">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="text-6xl mb-8">📋</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">找不到詢價單</h1>
            <p className="text-gray-600 mb-8">這個詢價單可能已被刪除或您沒有權限查看</p>
            <Link
              href="/inquiries"
              className="bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors"
            >
              返回詢價列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 主要內容
  return (
    <div className="min-h-screen bg-gray-50 pt-36">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-4">
              <Link
                href="/inquiries"
                className="text-gray-600 hover:text-gray-800"
              >
                ← 返回列表
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              詢價單 #{InquiryUtils.formatInquiryNumber(inquiry)}
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${INQUIRY_STATUS_COLORS[inquiry.status]}`}>
                {INQUIRY_STATUS_LABELS[inquiry.status]}
              </span>
              <span className="text-gray-600">
                {new Date(inquiry.created_at).toLocaleDateString('zh-TW', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 詢價單詳情 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 商品清單 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">詢價商品</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {inquiry.inquiry_items.map((item, index) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <span className="text-gray-500 text-xs">圖片</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.product_name}
                        </h3>
                        {item.product_category && (
                          <p className="text-gray-600 text-sm mb-2">
                            分類：{item.product_category}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>數量：{item.quantity}</span>
                          {item.unit_price && (
                            <span>單價：NT$ {item.unit_price.toLocaleString()}</span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                            備註：{item.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          NT$ {(item.total_price || (item.unit_price || 0) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 聯絡資訊 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">聯絡資訊</h2>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">姓名</h3>
                    <p className="text-gray-900">{inquiry.customer_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Email</h3>
                    <p className="text-gray-900">{inquiry.customer_email}</p>
                  </div>
                  {inquiry.customer_phone && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">電話</h3>
                      <p className="text-gray-900">{inquiry.customer_phone}</p>
                    </div>
                  )}
                  {inquiry.delivery_address && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">配送地址</h3>
                      <p className="text-gray-900">{inquiry.delivery_address}</p>
                    </div>
                  )}
                </div>
                {inquiry.notes && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">備註</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-900">{inquiry.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 詢價摘要 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-36">
              <h2 className="text-xl font-bold text-gray-900 mb-4">詢價摘要</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-700">商品總數</span>
                  <span className="font-semibold">{InquiryUtils.calculateTotalQuantity(inquiry)} 件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">商品小計</span>
                  <span className="font-semibold">NT$ {InquiryUtils.calculateTotalAmount(inquiry).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">運費</span>
                  <span className="text-blue-600">待報價</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>預估總計</span>
                  <span className="text-amber-900">NT$ {InquiryUtils.calculateTotalAmount(inquiry).toLocaleString()}+</span>
                </div>
                <p className="text-xs text-gray-500">
                  * 實際價格以回覆為準
                </p>
              </div>

              {/* 狀態說明 */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-blue-900 mb-2">
                  目前狀態：{INQUIRY_STATUS_LABELS[inquiry.status]}
                </h3>
                {inquiry.status === 'pending' && (
                  <p className="text-sm text-blue-800">
                    我們已收到您的詢價，會在24小時內回覆詳細報價。
                  </p>
                )}
                {inquiry.status === 'quoted' && (
                  <p className="text-sm text-blue-800">
                    我們已回覆報價，請確認後聯絡我們。
                  </p>
                )}
                {inquiry.status === 'confirmed' && (
                  <p className="text-sm text-blue-800">
                    訂單已確認，我們正在準備您的商品。
                  </p>
                )}
                {inquiry.status === 'completed' && (
                  <p className="text-sm text-green-800">
                    訂單已完成，感謝您的購買！
                  </p>
                )}
                {inquiry.status === 'cancelled' && (
                  <p className="text-sm text-red-800">
                    此詢價單已取消。
                  </p>
                )}
              </div>

              {/* 操作按鈕 */}
              <div className="space-y-3">
                <Link
                  href="/inquiries"
                  className="block w-full text-center py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  返回詢價列表
                </Link>
                <Link
                  href="/cart"
                  className="block w-full text-center py-3 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors"
                >
                  新增詢價
                </Link>
              </div>

              {/* 聯絡資訊 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">需要協助？</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>📞 客服電話：0800-123-456</p>
                  <p>📧 客服信箱：service@example.com</p>
                  <p>🕐 服務時間：週一至週五 9:00-18:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InquiryDetailPageWithErrorBoundary({ params }: InquiryDetailPageProps) {
  return (
    <ComponentErrorBoundary>
      <InquiryDetailPage params={params} />
    </ComponentErrorBoundary>
  );
}