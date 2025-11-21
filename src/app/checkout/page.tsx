'use client'

/**
 * 結帳頁面
 *
 * 收集配送資訊、顯示訂單摘要、建立訂單並跳轉到付款
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, Loader2, AlertCircle } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { PaymentForm } from '@/components/features/payment/PaymentForm'
import { getCSRFTokenFromCookie } from '@/lib/api/core/api-headers'
import type { ShippingAddress } from '@/types/order'

interface FormErrors {
  name?: string
  phone?: string
  street?: string
  city?: string
  postalCode?: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, isLoaded, subtotal, shippingFee, total, clearCart } = useCart()
  const { user, isLoading: authLoading } = useAuth()

  // 表單狀態
  const [formData, setFormData] = useState<ShippingAddress>({
    name: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
    country: '台灣',
    notes: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // 訂單建立後的狀態
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderAmount, setOrderAmount] = useState<number>(0)

  // 檢查認證狀態
  useEffect(() => {
    if (!authLoading && !user) {
      // 未登入時導向登入頁面，並記錄返回 URL
      router.push('/login?redirect=/checkout')
    }
  }, [user, authLoading, router])

  // 檢查購物車是否為空
  useEffect(() => {
    if (isLoaded && items.length === 0 && !orderId) {
      router.push('/cart')
    }
  }, [isLoaded, items.length, orderId, router])

  // 載入中狀態
  if (!isLoaded || authLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-3 text-gray-600">載入中...</span>
        </div>
      </div>
    )
  }

  // 未登入時不顯示內容（等待跳轉）
  if (!user) {
    return null
  }

  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = '請輸入收件人姓名'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '請輸入聯絡電話'
    } else if (!/^0[0-9]{8,9}$/.test(formData.phone.replace(/-/g, ''))) {
      newErrors.phone = '請輸入有效的電話號碼'
    }

    if (!formData.street.trim()) {
      newErrors.street = '請輸入詳細地址'
    }

    if (!formData.city.trim()) {
      newErrors.city = '請輸入縣市區域'
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = '請輸入郵遞區號'
    } else if (!/^[0-9]{3,5}$/.test(formData.postalCode)) {
      newErrors.postalCode = '請輸入有效的郵遞區號'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 處理輸入變更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // 清除該欄位的錯誤
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  // 提交訂單
  const handleSubmitOrder = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // 取得 CSRF token
      const csrfToken = getCSRFTokenFromCookie()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
      }

      // 建立訂單
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          shippingAddress: formData,
          notes: formData.notes,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || result.error || '建立訂單失敗')
      }

      // 訂單建立成功
      setOrderId(result.data.id)
      setOrderAmount(result.data.totalAmount)

      // 清空購物車
      clearCart()
    } catch (error) {
      const message = error instanceof Error ? error.message : '訂單建立失敗，請稍後再試'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 如果訂單已建立，顯示付款表單
  if (orderId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">訂單已建立</h1>
              <p className="text-gray-600 mt-2">請選擇付款方式完成結帳</p>
            </div>

            <PaymentForm
              orderId={orderId}
              amount={orderAmount}
              email={user.email}
              onSuccess={() => {
                // 付款表單已提交到綠界
              }}
              onError={error => {
                setSubmitError(error)
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">結帳</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 配送資訊表單 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">配送資訊</h2>

            <div className="space-y-4">
              {/* 收件人姓名 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  收件人姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="請輸入收件人姓名"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* 聯絡電話 */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  聯絡電話 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="例：0912345678"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
              </div>

              {/* 郵遞區號和縣市 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="postalCode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    郵遞區號 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      errors.postalCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="例：603"
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-sm text-red-500">{errors.postalCode}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    縣市區域 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="例：嘉義縣梅山鄉"
                  />
                  {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
                </div>
              </div>

              {/* 詳細地址 */}
              <div>
                <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                  詳細地址 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.street ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="請輸入詳細地址"
                />
                {errors.street && <p className="mt-1 text-sm text-red-500">{errors.street}</p>}
              </div>

              {/* 備註 */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  配送備註
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="例：請在白天配送、管理員收"
                />
              </div>
            </div>
          </div>

          {/* 返回購物車連結 */}
          <div className="mt-4">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回購物車
            </Link>
          </div>
        </div>

        {/* 訂單摘要 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">訂單摘要</h2>

            {/* 商品列表 */}
            <div className="space-y-3 mb-6">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      NT$ {item.price.toLocaleString()} x {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    NT$ {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <hr className="border-gray-200 mb-4" />

            {/* 金額明細 */}
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
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>總金額</span>
                <span>NT$ {total.toLocaleString()}</span>
              </div>
            </div>

            {/* 錯誤訊息 */}
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}

            {/* 確認訂單按鈕 */}
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  建立訂單中...
                </>
              ) : (
                '確認訂單並付款'
              )}
            </button>

            {/* 安全提示 */}
            <p className="mt-4 text-xs text-gray-500 text-center">
              點擊確認後將建立訂單並跳轉到付款頁面
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
