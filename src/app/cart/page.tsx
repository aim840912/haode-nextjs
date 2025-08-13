'use client';

import { useCart } from '@/lib/cart-context';
import Link from 'next/link';
import Image from 'next/image';

export default function CartPage() {
  const { cart, updateItemQuantity, removeItem, clearCart, totalItems, totalPrice } = useCart();

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
                      <Image
                        src={item.product.imageUrl || '/api/placeholder/80/80'}
                        alt={item.product.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
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
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        disabled={item.quantity <= 1}
                      >
                        <span className="text-lg">-</span>
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <span className="text-lg">+</span>
                      </button>
                    </div>

                    {/* 小計 */}
                    <div className="text-right">
                      <p className="font-bold text-lg">
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
                  <span>商品小計 ({totalItems} 件)</span>
                  <span>NT$ {totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>運費</span>
                  <span className="text-green-600">免運費</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>總計</span>
                  <span className="text-amber-900">NT$ {totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <button className="w-full bg-amber-900 text-white py-3 rounded-lg font-semibold hover:bg-amber-800 transition-colors mb-4">
                前往結帳
              </button>

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