'use client';

import { useCart } from '@/lib/cart-context';
import Link from 'next/link';

interface CartSummaryProps {
  showCheckoutButton?: boolean;
  className?: string;
}

export default function CartSummary({ showCheckoutButton = true, className = '' }: CartSummaryProps) {
  const { cart, totalItems, totalPrice } = useCart();

  if (cart.items.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-4xl mb-4">🛒</div>
        <p className="text-gray-600 mb-4">購物車是空的</p>
        <Link 
          href="/products"
          className="inline-block bg-amber-900 text-white px-6 py-2 rounded-lg hover:bg-amber-800 transition-colors"
        >
          前往購物
        </Link>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-bold text-gray-900 mb-4">購物車摘要</h3>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">商品數量</span>
          <span className="font-semibold text-gray-900">{totalItems} 件</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">商品小計</span>
          <span className="font-semibold text-gray-900">NT$ {totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">運費</span>
          <span className="text-green-600 font-medium">免運費</span>
        </div>
        <hr />
        <div className="flex justify-between text-lg font-bold">
          <span className="text-gray-900 font-semibold">總計</span>
          <span className="text-amber-900">NT$ {totalPrice.toLocaleString()}</span>
        </div>
      </div>

      {showCheckoutButton && (
        <div className="space-y-3">
          <button className="w-full bg-amber-900 text-white py-3 rounded-lg font-semibold hover:bg-amber-800 transition-colors">
            前往結帳
          </button>
          <Link 
            href="/cart"
            className="block w-full text-center py-2 text-amber-900 border border-amber-900 rounded-lg hover:bg-amber-50 transition-colors"
          >
            查看購物車
          </Link>
        </div>
      )}

      {/* 最近添加的商品 */}
      {cart.items.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">購物車商品</h4>
          <div className="space-y-2">
            {cart.items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate flex-1 mr-2">
                  {item.product.name} x {item.quantity}
                </span>
                <span className="font-semibold text-gray-900">
                  NT$ {(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
            {cart.items.length > 3 && (
              <p className="text-xs text-gray-500 text-center pt-2">
                還有 {cart.items.length - 3} 件商品...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}