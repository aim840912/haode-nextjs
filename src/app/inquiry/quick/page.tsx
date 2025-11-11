'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuickInquiryForm } from '@/hooks/useQuickInquiryForm'
import { logger } from '@/lib/logger'

/**
 * 極簡快速詢價頁面（內部元件）
 * 僅 3 個核心欄位：產品、數量、聯絡方式
 */
function QuickInquiryFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL 參數
  const productName = searchParams.get('product') || ''
  const productId = searchParams.get('productId') || ''
  const initialQuantity = parseInt(searchParams.get('quantity') || '1')
  const productPrice = parseFloat(searchParams.get('price') || '0')

  // 如果沒有必要的產品資訊，重定向到產品頁面
  useEffect(() => {
    if (!productName || !productId) {
      router.replace('/products')
    }
  }, [productName, productId, router])

  // 使用快速詢價表單 Hook
  const form = useQuickInquiryForm({
    product_id: productId,
    product_name: productName,
    quantity: initialQuantity,
    unit_price: productPrice > 0 ? productPrice : undefined,
  })

  // 本地數量狀態（用於即時更新 UI）
  const [localQuantity, setLocalQuantity] = useState(initialQuantity)

  const handleQuantityChange = (newQuantity: number) => {
    const validQuantity = Math.max(1, newQuantity)
    setLocalQuantity(validQuantity)
    form.updateField('quantity', validQuantity)
  }

  const handleSubmit = async () => {
    await form.submitForm()
  }

  if (!productName || !productId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-4">載入中...</h1>
          <p className="text-gray-600 dark:text-gray-300">正在重定向到產品頁面...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-20">
        <div className="max-w-xl mx-auto">
          {/* 頁面標題 */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2">
              快速詢價
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base px-4 sm:px-0">
              30 秒快速詢價，我們會儘快回覆您
            </p>
          </div>

          {/* 產品資訊卡片 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6">
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-4">
              詢價產品
            </h3>
            <div className="bg-amber-50 dark:bg-slate-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-3">{productName}</h4>

              {/* 數量調整 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">數量</span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleQuantityChange(localQuantity - 1)}
                    className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-800 active:bg-amber-300 dark:active:bg-amber-700 flex items-center justify-center text-lg font-semibold transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                    disabled={localQuantity <= 1}
                  >
                    -
                  </button>
                  <span className="font-medium min-w-[4ch] text-center text-lg text-gray-900 dark:text-gray-100">
                    {localQuantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(localQuantity + 1)}
                    className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-800 active:bg-amber-300 dark:active:bg-amber-700 flex items-center justify-center text-lg font-semibold transition-colors touch-manipulation"
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 快速詢價表單 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6">
            <div className="space-y-6">
              {/* 聯絡方式選擇 */}
              <div>
                <label className="block text-gray-700 dark:text-gray-200 mb-3 font-medium">
                  選擇聯絡方式 *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => form.setContactMethod('email')}
                    className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                      form.data.contact_method === 'email'
                        ? 'bg-amber-900 dark:bg-amber-800 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    <svg
                      className="w-5 h-5 mx-auto mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => form.setContactMethod('phone')}
                    className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                      form.data.contact_method === 'phone'
                        ? 'bg-amber-900 dark:bg-amber-800 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    <svg
                      className="w-5 h-5 mx-auto mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    電話
                  </button>
                </div>
              </div>

              {/* 聯絡資訊輸入 */}
              <div>
                <label className="block text-gray-700 dark:text-gray-200 mb-2 font-medium">
                  {form.data.contact_method === 'email' ? 'Email 信箱' : '聯絡電話'} *
                </label>
                <input
                  type={form.data.contact_method === 'email' ? 'email' : 'tel'}
                  value={form.data.contact_value}
                  onChange={e => form.updateField('contact_value', e.target.value)}
                  className={`w-full border rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 dark:bg-slate-700 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
                    form.validation.contact_value
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-slate-600'
                  }`}
                  placeholder={
                    form.data.contact_method === 'email' ? '請輸入您的 Email' : '請輸入您的聯絡電話'
                  }
                  autoComplete={form.data.contact_method === 'email' ? 'email' : 'tel'}
                  inputMode={form.data.contact_method === 'email' ? 'email' : 'tel'}
                  required
                />
                {form.validation.contact_value && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {form.validation.contact_value}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {form.data.contact_method === 'email'
                    ? '我們會將報價單發送到此信箱'
                    : '我們會透過此號碼與您聯繫'}
                </p>
              </div>

              {/* 錯誤訊息 */}
              {(form.submitError || form.validation.general) && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-red-400 mt-0.5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                      {form.submitError || form.validation.general}
                    </p>
                  </div>
                </div>
              )}

              {/* 成功訊息 */}
              {form.submitSuccess && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-400 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                      詢價已送出！正在跳轉到詢價詳情頁...
                    </p>
                  </div>
                </div>
              )}

              {/* 提交按鈕 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.back()}
                  className="w-full sm:flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 py-4 sm:py-3 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 active:bg-gray-300 dark:active:bg-slate-500 transition-colors touch-manipulation"
                  disabled={form.isSubmitting}
                >
                  返回
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={form.isSubmitting || form.submitSuccess}
                  className="w-full sm:flex-1 bg-amber-900 dark:bg-amber-800 text-white py-4 sm:py-3 rounded-lg font-semibold hover:bg-amber-800 dark:hover:bg-amber-700 active:bg-amber-900 dark:active:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative touch-manipulation"
                >
                  {form.isSubmitting && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  <span className={form.isSubmitting ? 'ml-6' : ''}>
                    {form.submitSuccess ? '提交成功' : form.isSubmitting ? '提交中...' : '提交詢價'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 資訊提示 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              提交後，我們會在 24 小時內回覆您的詢價
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 快速詢價頁面（主導出元件）
 * 使用 Suspense 包裝以支援 useSearchParams
 */
export default function QuickInquiryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-amber-900 dark:border-amber-100 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">載入中...</p>
          </div>
        </div>
      }
    >
      <QuickInquiryFormContent />
    </Suspense>
  )
}
