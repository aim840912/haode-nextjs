'use client';

import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import LoadingSpinner, { LoadingButton } from '@/components/LoadingSpinner';
import OptimizedImage from '@/components/OptimizedImage';
import { useState } from 'react';

export default function CartPage() {
  const { cart, updateItemQuantity, removeItem, clearCart, totalItems, totalPrice } = useCart();
  const { user, isLoading } = useAuth();
  const { success, error } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      error('請先登入', '您需要登入才能進行結帳');
      return;
    }
    
    if (totalItems === 0) {
      error('購物車空空的', '請先加入商品再結帳');
      return;
    }

    setIsProcessing(true);
    try {
      // TODO: 實際結帳邏輯
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬 API 呼叫
      success('準備結帳', '結帐功能即將推出，敬請期待！');
    } catch (err) {
      error('結帳失敗', '系統暫時無法處理，請稍後再試');
    } finally {
      setIsProcessing(false);
    }
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
            <h1 className="text-3xl font-bold text-gray-900">購物車</h1>
            <p className="text-gray-600 mt-1">{totalItems} 件商品</p>
          </div>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 underline"
          >
            清空購物車
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 購物車商品列表 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
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

                    {/* 小計 */}
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">
                        NT$ {(item.price * item.quantity).toLocaleString()}
                      </p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 text-sm mt-1"
                      >
                        移除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 訂單摘要 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-36">
              <h2 className="text-xl font-bold text-gray-900 mb-4">訂單摘要</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">商品小計 ({totalItems} 件)</span>
                  <span className="font-semibold text-gray-900">NT$ {totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">運費</span>
                  <span className="text-green-600">免運費</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 font-semibold">總計</span>
                  <span className="text-amber-900">NT$ {totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <LoadingButton
                loading={isProcessing}
                onClick={handleCheckout}
                className="w-full bg-amber-900 text-white py-3 rounded-lg font-semibold hover:bg-amber-800 transition-colors mb-4"
              >
                前往結帳
              </LoadingButton>

              <Link 
                href="/products"
                className="block w-full text-center py-2 text-amber-900 border border-amber-900 rounded-lg hover:bg-amber-50 transition-colors"
              >
                繼續購物
              </Link>

              {/* 購物車詳情 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">購物說明</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    全站免運費
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    新鮮直送保證
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    不滿意可退換
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    冷鏈配送保鮮
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