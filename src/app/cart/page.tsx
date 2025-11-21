'use client'

/**
 * 購物車頁面
 *
 * 顯示購物車商品列表、數量調整、移除功能
 * 以及金額摘要（小計、運費、總金額）
 */

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

export default function CartPage() {
  const router = useRouter()
  const { items, isLoaded, removeItem, updateQuantity, itemCount, subtotal, shippingFee, total } =
    useCart()

  // 載入中狀態
  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 空購物車狀態
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">購物車是空的</h1>
          <p className="text-gray-600 mb-8">看起來您還沒有將任何商品加入購物車</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            瀏覽商品
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">購物車 ({itemCount} 件商品)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 購物車商品列表 */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start gap-4">
                {/* 商品圖片 */}
                <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* 商品資訊 */}
                <div className="flex-grow min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                  <p className="text-green-600 font-semibold mt-1">
                    NT$ {item.price.toLocaleString()}
                  </p>

                  {/* 數量控制 */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-gray-100 transition-colors rounded-l-lg"
                        aria-label="減少數量"
                      >
                        <Minus className="w-4 h-4 text-gray-600" />
                      </button>
                      <span className="px-4 py-2 text-center min-w-[3rem] font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.maxQuantity}
                        className="p-2 hover:bg-gray-100 transition-colors rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="增加數量"
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    {item.quantity >= item.maxQuantity && (
                      <span className="text-xs text-orange-600">已達庫存上限</span>
                    )}
                  </div>
                </div>

                {/* 小計和刪除 */}
                <div className="flex flex-col items-end gap-2">
                  <p className="font-semibold text-gray-900">
                    NT$ {(item.price * item.quantity).toLocaleString()}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="移除商品"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* 繼續購物連結 */}
          <div className="pt-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              繼續購物
            </Link>
          </div>
        </div>

        {/* 訂單摘要 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">訂單摘要</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>商品小計</span>
                <span>NT$ {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>運費</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-green-600">免運費</span>
                  ) : (
                    `NT$ ${shippingFee.toLocaleString()}`
                  )}
                </span>
              </div>
              {subtotal < 1000 && (
                <p className="text-xs text-gray-500">
                  再購買 NT$ {(1000 - subtotal).toLocaleString()} 即可享免運
                </p>
              )}
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>總金額</span>
                <span>NT$ {total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/checkout')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              前往結帳
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* 付款方式提示 */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">支援信用卡、ATM 轉帳等多種付款方式</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
