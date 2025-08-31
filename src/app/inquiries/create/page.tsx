'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCSRFToken } from '@/hooks/useCSRFToken';
import { CreateInquiryRequest, CreateInquiryItemRequest } from '@/types/inquiry';
import { logger } from '@/lib/logger';

interface FormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string;
  delivery_address: string;
  preferred_delivery_date: string;
}

// 內部組件使用 useSearchParams
function InquiryFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { token: csrfToken } = useCSRFToken();

  // URL 參數
  const productName = searchParams.get('product') || '';
  const quantity = parseInt(searchParams.get('quantity') || '1');
  const productId = searchParams.get('productId') || '';

  // 表單狀態
  const [formData, setFormData] = useState<FormData>({
    customer_name: '',
    customer_email: user?.email || '',
    customer_phone: '',
    notes: '',
    delivery_address: '',
    preferred_delivery_date: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [productQuantity, setProductQuantity] = useState(quantity);

  // 當使用者狀態改變時，更新表單中的 email
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, customer_email: user.email }));
    }
  }, [user]);

  // 如果沒有必要的產品資訊，重定向到產品頁面
  useEffect(() => {
    if (!productName || !productId) {
      router.replace('/products');
    }
  }, [productName, productId, router]);

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuantityChange = (newQuantity: number) => {
    setProductQuantity(Math.max(1, newQuantity));
  };

  const handleSubmitInquiry = async () => {
    if (!user) {
      setSubmitError('請先登入以提交詢價');
      return;
    }

    // 基本驗證
    if (!formData.customer_name || !formData.customer_email) {
      setSubmitError('請填寫必要資訊：姓名和 Email');
      return;
    }

    if (!productId || !productName) {
      setSubmitError('產品資訊不完整');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 建立詢價項目
      const inquiryItem: CreateInquiryItemRequest = {
        product_id: productId,
        product_name: productName,
        quantity: productQuantity,
        notes: `產品詢價 - ${productName}`
      };

      // 建立詢價單請求
      const inquiryRequest: CreateInquiryRequest = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone || undefined,
        inquiry_type: 'product',
        notes: formData.notes || undefined,
        delivery_address: formData.delivery_address || undefined,
        preferred_delivery_date: formData.preferred_delivery_date || undefined,
        items: [inquiryItem]
      };

      // 準備請求標頭
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // 添加 CSRF token 到標頭
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
        logger.info('CSRF token being sent', { metadata: { csrfTokenLength: csrfToken.length } });
      } else {
        logger.warn('No CSRF token available for request');
      }

      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers,
        body: JSON.stringify(inquiryRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '提交詢價失敗');
      }

      const result = await response.json();
      logger.info('Inquiry created successfully', { metadata: { inquiryId: result.data.id } });

      // 成功後重定向到詢價單詳情頁面
      router.push(`/inquiries/${result.data.id}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '提交詢價時發生未知錯誤';
      logger.error('Error creating inquiry', undefined, { metadata: { error: errorMessage } });
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!productName || !productId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold text-amber-900 mb-4">載入中...</h1>
          <p className="text-gray-600">正在重定向到產品頁面...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto">
          {/* 頁面標題 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-amber-900 mb-2">產品詢價</h1>
            <p className="text-gray-600">填寫以下資訊，我們將儘快為您報價</p>
          </div>

          {/* 產品資訊卡片 */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-amber-900 mb-4">詢價產品</h3>
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-800">{productName}</h4>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">數量</span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleQuantityChange(productQuantity - 1)}
                    className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 flex items-center justify-center"
                    type="button"
                  >
                    -
                  </button>
                  <span className="font-medium min-w-[3ch] text-center">{productQuantity}</span>
                  <button
                    onClick={() => handleQuantityChange(productQuantity + 1)}
                    className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 flex items-center justify-center"
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 詢價表單 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {!user && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  請先登入以提交詢價。
                  <a href="/login" className="underline ml-1">點此登入</a>
                </p>
              </div>
            )}

            <div className="space-y-6">
              {/* 客戶資訊 */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">聯絡資訊</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">姓名 *</label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => handleFormChange('customer_name', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="請輸入您的姓名"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">Email *</label>
                    <input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => handleFormChange('customer_email', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="請輸入您的 Email"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-gray-700 mb-1 font-medium">聯絡電話</label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => handleFormChange('customer_phone', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="請輸入您的聯絡電話"
                  />
                </div>
              </div>

              {/* 配送資訊 */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">配送資訊</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">配送地址</label>
                    <input
                      type="text"
                      value={formData.delivery_address}
                      onChange={(e) => handleFormChange('delivery_address', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="請輸入配送地址（可選）"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">希望配送日期</label>
                    <input
                      type="date"
                      value={formData.preferred_delivery_date}
                      onChange={(e) => handleFormChange('preferred_delivery_date', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              {/* 備註 */}
              <div>
                <label className="block text-gray-700 mb-1 font-medium">特殊需求或備註</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="如有特殊需求或其他說明，請在此註明"
                />
              </div>

              {/* 錯誤訊息 */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{submitError}</p>
                </div>
              )}

              {/* 提交按鈕 */}
              <div className="flex gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  返回
                </button>
                <button
                  onClick={handleSubmitInquiry}
                  disabled={isSubmitting || !user}
                  className="flex-1 bg-amber-900 text-white py-3 rounded-lg font-semibold hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '提交中...' : '提交詢價'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 主要導出組件，用 Suspense 包裝
export default function CreateInquiryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">載入中...</div>}>
      <InquiryFormContent />
    </Suspense>
  );
}