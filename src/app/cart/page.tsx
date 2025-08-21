'use client';

import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingSpinner, { LoadingButton } from '@/components/LoadingSpinner';
import OptimizedImage from '@/components/OptimizedImage';
import { ComponentErrorBoundary } from '@/components/ErrorBoundary';
import { useState } from 'react';
import { CreateInquiryRequest, InquiryUtils } from '@/types/inquiry';

function CartPage() {
  const { cart, updateItemQuantity, removeItem, clearCart, totalItems, totalPrice } = useCart();
  const { user, isLoading } = useAuth();
  const { success, error } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    deliveryAddress: '',
    notes: ''
  });

  const handleInquirySubmit = async () => {
    if (!user) {
      error('請先登入', '您需要登入才能送出詢價');
      return;
    }
    
    if (totalItems === 0) {
      error('購物車空空的', '請先加入商品再送出詢價');
      return;
    }

    // 準備詢價資料
    const inquiryData: CreateInquiryRequest = {
      customer_name: customerInfo.name || user.name,
      customer_email: customerInfo.email || user.email,
      customer_phone: customerInfo.phone,
      delivery_address: customerInfo.deliveryAddress,
      notes: customerInfo.notes,
      items: cart.items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_category: item.product.category,
        quantity: item.quantity,
        unit_price: item.price
      }))
    };

    // 驗證資料
    const validation = InquiryUtils.validateInquiryRequest(inquiryData);
    if (!validation.isValid) {
      error('資料不完整', validation.errors.join(', '));
      return;
    }

    setIsProcessing(true);
    try {
      // 取得認證 token
      const { data: { session } } = await import('@/lib/supabase-auth').then(m => m.supabase.auth.getSession());
      if (!session?.access_token) {
        error('認證失敗', '請重新登入');
        return;
      }

      // 呼叫詢價 API
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(inquiryData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '送出詢價失敗');
      }

      // 成功後清空購物車並導向詢價列表
      clearCart();
      success('詢價單已送出', '我們會在24小時內回覆您詳細的報價和配送資訊');
      router.push('/inquiries');

    } catch (err) {
      console.error('Inquiry submission error:', err);
      error('送出詢價失敗', err instanceof Error ? err.message : '系統暫時無法處理，請稍後再試');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShowInquiryForm = () => {
    if (!user) {
      error('請先登入', '您需要登入才能送出詢價');
      return;
    }
    
    if (totalItems === 0) {
      error('購物車空空的', '請先加入商品再送出詢價');
      return;
    }

    // 預填使用者資訊
    setCustomerInfo({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      deliveryAddress: '',
      notes: ''
    });
    
    setShowInquiryForm(true);
  };

  const handleClearCart = async () => {
    if (!confirm('確定要清空購物車嗎？')) return;
    
    try {
      await clearCart();
      success('購物車已清空', '所有商品已移除');
    } catch (err) {
      error('清空失敗', '系統暫時無法處理，請稍後再試');
    }
  };

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-36 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">載入購物車...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">需要登入才能使用購物車</h1>
            <p className="text-gray-600 mb-8">請先登入您的帳戶，即可開始選購我們的優質農產品！</p>
            <div className="space-x-4">
              <Link 
                href="/login"
                className="inline-block bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors"
              >
                立即登入
              </Link>
              <Link 
                href="/register"
                className="inline-block border border-amber-900 text-amber-900 px-8 py-3 rounded-lg hover:bg-amber-50 transition-colors"
              >
                註冊帳戶
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-36">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="text-6xl mb-8">🛒</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">購物車是空的</h1>
            <p className="text-gray-600 mb-8">還沒有選購任何商品，快去看看我們的優質農產品吧！</p>
            <Link 
              href="/products"
              className="inline-block bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors"
            >
              前往購物
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-36">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {showInquiryForm ? '送出詢價' : '購物車'}
            </h1>
            <p className="text-gray-600 mt-1">
              {showInquiryForm ? '填寫聯絡資訊後送出詢價' : `${totalItems} 件商品`}
            </p>
          </div>
          {!showInquiryForm && (
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 underline"
            >
              清空購物車
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 購物車商品列表 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">選購商品</h2>
              </div>
              {cart.items.map((item, index) => (
                <div key={item.id} className={`p-6 ${index !== cart.items.length - 1 ? 'border-b border-gray-200' : ''}`}>
                  <div className="flex items-start space-x-4">
                    {/* 商品圖片 */}
                    <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                      <OptimizedImage
                        src={item.product.images?.[0] || '/api/placeholder/80/80'}
                        alt={item.product.name}
                        width={80}
                        height={80}
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    {/* 商品資訊 */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {item.product.category}
                      </p>
                      <p className="text-amber-900 font-bold text-lg">
                        NT$ {item.price.toLocaleString()}
                      </p>
                    </div>

                    {/* 數量控制 */}
                    {!showInquiryForm && (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          <span className="text-lg text-gray-700">-</span>
                        </button>
                        <span className="w-8 text-center font-medium text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center hover:bg-gray-100"
                        >
                          <span className="text-lg text-gray-700">+</span>
                        </button>
                      </div>
                    )}

                    {/* 數量顯示 (詢價模式) */}
                    {showInquiryForm && (
                      <div className="text-center">
                        <span className="text-sm text-gray-600">數量</span>
                        <div className="font-medium text-gray-900">{item.quantity}</div>
                      </div>
                    )}

                    {/* 小計 */}
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">
                        NT$ {(item.price * item.quantity).toLocaleString()}
                      </p>
                      {!showInquiryForm && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 text-sm mt-1"
                        >
                          移除
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 詢價表單 */}
            {showInquiryForm && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">聯絡資訊</h2>
                  <p className="text-gray-600 text-sm mt-1">請填寫您的聯絡資訊，我們會盡快回覆您的詢價</p>
                </div>
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        姓名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="請輸入您的姓名"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="請輸入您的Email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      電話 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="請輸入您的電話"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      配送地址
                    </label>
                    <textarea
                      placeholder="請輸入配送地址"
                      value={customerInfo.deliveryAddress}
                      onChange={(e) => setCustomerInfo({...customerInfo, deliveryAddress: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      備註或特殊需求
                    </label>
                    <textarea
                      placeholder="請輸入任何特殊需求或備註"
                      value={customerInfo.notes}
                      onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowInquiryForm(false)}
                      className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      返回購物車
                    </button>
                    <LoadingButton
                      loading={isProcessing}
                      onClick={handleInquirySubmit}
                      disabled={!customerInfo.name || !customerInfo.email || !customerInfo.phone}
                      className="flex-1 bg-amber-900 text-white py-3 px-6 rounded-lg hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      送出詢價
                    </LoadingButton>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 詢價摘要 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-36">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {showInquiryForm ? '詢價摘要' : '詢價預估'}
              </h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">商品小計 ({totalItems} 件)</span>
                  <span className="font-semibold text-gray-900">NT$ {totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">運費</span>
                  <span className="text-blue-600">依距離計算</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 font-semibold">預估總計</span>
                  <span className="text-amber-900">NT$ {totalPrice.toLocaleString()}+</span>
                </div>
                <p className="text-xs text-gray-500">
                  * 實際價格以詢價回覆為準
                </p>
              </div>

              {!showInquiryForm && (
                <>
                  <LoadingButton
                    loading={isProcessing}
                    onClick={handleShowInquiryForm}
                    className="w-full bg-amber-900 text-white py-3 rounded-lg font-semibold hover:bg-amber-800 transition-colors mb-4"
                  >
                    送出詢價
                  </LoadingButton>

                  <Link 
                    href="/products"
                    className="block w-full text-center py-2 text-amber-900 border border-amber-900 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    繼續購物
                  </Link>
                </>
              )}

              {showInquiryForm && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <div className="text-blue-500 mr-3 mt-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 mb-1">詢價說明</p>
                      <p className="text-blue-800">
                        我們會在收到您的詢價後24小時內回覆詳細報價，包含運費計算和配送資訊。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 詢價說明 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">詢價說明</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    24小時內回覆報價
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    免費詢價服務
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    可客製化需求
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    專人聯繫說明
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPageWithErrorBoundary() {
  return (
    <ComponentErrorBoundary>
      <CartPage />
    </ComponentErrorBoundary>
  );
}