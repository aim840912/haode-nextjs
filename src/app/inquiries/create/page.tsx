'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEnhancedInquiryForm } from '@/hooks/useEnhancedInquiryForm'
import { useInquiryTemplates } from '@/hooks/useInquiryTemplates'
import { TemplateSelector } from '@/components/inquiry/TemplateSelector'
import { logger } from '@/lib/logger'
import { CreateInquiryItemRequest } from '@/types/inquiry'
import { InquiryFormDataFromTemplate } from '@/types/inquiry-template'

// 內部組件使用 useSearchParams
function InquiryFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  // URL 參數
  const productName = searchParams.get('product') || ''
  const quantity = parseInt(searchParams.get('quantity') || '1')
  const productId = searchParams.get('productId') || ''
  const productPrice = parseFloat(searchParams.get('price') || '0')
  const templateId = searchParams.get('template') || '' // 範本 ID

  // 使用增強的詢價表單 Hook（支援智慧預填）
  const inquiryForm = useEnhancedInquiryForm(
    undefined, // initialData
    user // 傳入 user 進行智慧預填
  )

  // 使用範本 Hook
  const { useTemplate } = useInquiryTemplates()

  // 處理範本選擇
  const handleTemplateSelected = (formData: InquiryFormDataFromTemplate) => {
    // 填入範本資料到表單
    inquiryForm.updateField('customer_name', formData.customer_name)
    inquiryForm.updateField('customer_email', formData.customer_email)
    inquiryForm.updateField('customer_phone', formData.customer_phone)
    inquiryForm.updateField('notes', formData.notes)
    inquiryForm.updateField('delivery_address', formData.delivery_address)
    inquiryForm.updateField('preferred_delivery_date', formData.preferred_delivery_date)

    // 如果範本有項目，替換現有項目
    if (formData.items && formData.items.length > 0) {
      // 清除現有項目
      while (inquiryForm.data.items.length > 0) {
        inquiryForm.removeItem(0)
      }
      // 加入範本項目
      formData.items.forEach(item => {
        inquiryForm.addItem(item as CreateInquiryItemRequest)
      })
    }

    logger.info('已套用範本到表單', {
      metadata: { itemsCount: formData.items?.length || 0 },
    })
  }

  // 從 URL 載入範本
  useEffect(() => {
    if (templateId && user) {
      useTemplate(templateId).then(formData => {
        if (formData) {
          handleTemplateSelected(formData)
        }
      })
    }
  }, [templateId, user]) // eslint-disable-line react-hooks/exhaustive-deps

  // 自動保存恢復提示狀態
  const [showAutoSaveNotice, setShowAutoSaveNotice] = useState(false)

  // 檢測是否有自動保存的資料被恢復
  useEffect(() => {
    if (
      inquiryForm.isDirty &&
      (inquiryForm.data.customer_name ||
        inquiryForm.data.notes ||
        inquiryForm.data.delivery_address)
    ) {
      setShowAutoSaveNotice(true)
      // 3秒後自動隱藏提示
      const timer = setTimeout(() => setShowAutoSaveNotice(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [
    inquiryForm.isDirty,
    inquiryForm.data.customer_name,
    inquiryForm.data.notes,
    inquiryForm.data.delivery_address,
  ])

  // 產品數量狀態
  const [productQuantity, setProductQuantity] = useState(quantity)

  // 如果沒有必要的產品資訊，重定向到產品頁面
  useEffect(() => {
    if (!productName || !productId) {
      router.replace('/products')
      return
    }

    // 自動添加產品到詢價項目中（如果還沒有）
    if (inquiryForm.data.items.length === 0) {
      const inquiryItem: CreateInquiryItemRequest = {
        product_id: productId,
        product_name: productName,
        quantity: productQuantity,
        unit_price: productPrice > 0 ? productPrice : undefined,
        notes: `產品詢價 - ${productName}`,
      }

      inquiryForm.addItem(inquiryItem)

      logger.info('自動添加產品到詢價表單', {
        metadata: {
          productId,
          productName,
          quantity: productQuantity,
          unitPrice: productPrice > 0 ? productPrice : undefined,
        },
      })
    }
  }, [productName, productId, productQuantity, productPrice, inquiryForm, router])

  const handleQuantityChange = (newQuantity: number) => {
    const validQuantity = Math.max(1, newQuantity)
    setProductQuantity(validQuantity)

    // 更新詢價項目中的數量
    if (inquiryForm.data.items.length > 0) {
      inquiryForm.updateItem(0, { quantity: validQuantity })
    }
  }

  const handleSubmitInquiry = async () => {
    if (!user) {
      // 設定用戶錯誤到表單狀態中
      inquiryForm.updateField('customer_email', '') // 觸發驗證
      return
    }

    // 使用 Hook 的提交方法
    const success = await inquiryForm.submitForm()

    if (success) {
      logger.info('詢價表單提交成功')
    }
  }

  if (!productName || !productId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold text-amber-900 mb-4">載入中...</h1>
          <p className="text-gray-600">正在重定向到產品頁面...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-20">
        <div className="max-w-2xl mx-auto">
          {/* 頁面標題 */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-2">產品詢價</h1>
            <p className="text-gray-600 text-sm sm:text-base px-4 sm:px-0">
              填寫以下資訊，我們將儘快為您報價
            </p>

            {/* 自動保存恢復提示 */}
            {showAutoSaveNotice && (
              <div className="mt-2 flex items-center justify-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg py-2 px-4">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                已恢復之前自動保存的表單內容
              </div>
            )}

            {/* 自動儲存指示器 */}
            {inquiryForm.isAutoSaving && (
              <div className="mt-2 flex items-center justify-center text-sm text-blue-600">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                正在自動儲存...
              </div>
            )}
            {inquiryForm.isDirty && !inquiryForm.isAutoSaving && !showAutoSaveNotice && (
              <div className="mt-2 text-sm text-green-600 flex items-center justify-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                表單已自動儲存
              </div>
            )}
          </div>

          {/* 產品資訊卡片 */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
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
                    className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 active:bg-amber-300 flex items-center justify-center text-lg sm:text-base font-semibold transition-colors touch-manipulation"
                    type="button"
                    disabled={productQuantity <= 1}
                  >
                    -
                  </button>
                  <span className="font-medium min-w-[4ch] text-center text-lg sm:text-base">
                    {productQuantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(productQuantity + 1)}
                    className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 active:bg-amber-300 flex items-center justify-center text-lg sm:text-base font-semibold transition-colors touch-manipulation"
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 範本選擇器 */}
          {user && (
            <div className="mb-6">
              <TemplateSelector
                inquiryType="product"
                onTemplateSelected={handleTemplateSelected}
                className="w-full"
              />
            </div>
          )}

          {/* 詢價表單 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6">
            {!user && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">
                      訪客也可以提交詢價！
                    </p>
                    <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">
                      已登入會員可享有更快速的回覆和訂單追蹤。
                      <a href="/login" className="underline ml-1 font-medium">
                        點此登入
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 智慧預填提示（僅已登入時顯示） */}
            {user && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-green-800 dark:text-green-300 text-sm font-medium">
                      已自動填入您的個人資料
                    </p>
                    <p className="text-green-700 dark:text-green-400 text-xs mt-1">
                      姓名、Email、電話和地址已從您的帳戶資訊自動填入，您可以隨時修改。
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* 客戶資訊 */}
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  聯絡資訊
                  <span className="text-red-500 ml-1">*</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                    必填欄位
                  </span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-200 mb-1 font-medium">
                      姓名 *
                    </label>
                    <input
                      type="text"
                      value={inquiryForm.data.customer_name}
                      onChange={e => inquiryForm.updateField('customer_name', e.target.value)}
                      onBlur={() => inquiryForm.validateOnBlur('customer_name')}
                      className={`w-full border rounded-lg px-4 py-3 sm:px-3 sm:py-2 text-gray-900 dark:text-gray-100 dark:bg-slate-700 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
                        inquiryForm.validation.customer_name
                          ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      placeholder="請輸入您的姓名"
                      autoComplete="name"
                      inputMode="text"
                      required
                    />
                    {inquiryForm.validation.customer_name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {inquiryForm.validation.customer_name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-gray-200 mb-1 font-medium">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={inquiryForm.data.customer_email}
                      onChange={e => inquiryForm.updateField('customer_email', e.target.value)}
                      onBlur={() => inquiryForm.validateOnBlur('customer_email')}
                      className={`w-full border rounded-lg px-4 py-3 sm:px-3 sm:py-2 text-gray-900 dark:text-gray-100 dark:bg-slate-700 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
                        inquiryForm.validation.customer_email
                          ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      placeholder="請輸入您的 Email"
                      autoComplete="email"
                      inputMode="email"
                      required
                    />
                    {inquiryForm.validation.customer_email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {inquiryForm.validation.customer_email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-gray-700 dark:text-gray-200 mb-1 font-medium">
                    聯絡電話
                    <span className="text-gray-400 dark:text-gray-500 text-xs ml-2">選填</span>
                  </label>
                  <input
                    type="tel"
                    value={inquiryForm.data.customer_phone}
                    onChange={e => inquiryForm.updateField('customer_phone', e.target.value)}
                    onBlur={() => inquiryForm.validateOnBlur('customer_phone')}
                    className={`w-full border rounded-lg px-4 py-3 sm:px-3 sm:py-2 text-gray-900 dark:text-gray-100 dark:bg-slate-700 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
                      inquiryForm.validation.customer_phone
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="請輸入您的聯絡電話"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                  {inquiryForm.validation.customer_phone && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {inquiryForm.validation.customer_phone}
                    </p>
                  )}
                </div>
              </div>

              {/* 配送資訊 */}
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  配送資訊
                  <span className="text-gray-400 dark:text-gray-500 text-xs font-normal ml-2">
                    選填欄位
                  </span>
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-200 mb-1 font-medium">
                      配送地址
                    </label>
                    <input
                      type="text"
                      value={inquiryForm.data.delivery_address}
                      onChange={e => inquiryForm.updateField('delivery_address', e.target.value)}
                      className={`w-full border rounded-lg px-4 py-3 sm:px-3 sm:py-2 text-gray-900 dark:text-gray-100 dark:bg-slate-700 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
                        inquiryForm.validation.delivery_address
                          ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      placeholder="請輸入配送地址（可選）"
                      autoComplete="street-address"
                      inputMode="text"
                    />
                    {inquiryForm.validation.delivery_address && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {inquiryForm.validation.delivery_address}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-gray-200 mb-1 font-medium">
                      希望配送日期
                    </label>
                    <input
                      type="date"
                      value={inquiryForm.data.preferred_delivery_date}
                      onChange={e =>
                        inquiryForm.updateField('preferred_delivery_date', e.target.value)
                      }
                      onBlur={() => inquiryForm.validateOnBlur('preferred_delivery_date')}
                      className={`w-full border rounded-lg px-4 py-3 sm:px-3 sm:py-2 text-gray-900 dark:text-gray-100 dark:bg-slate-700 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
                        inquiryForm.validation.preferred_delivery_date
                          ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {inquiryForm.validation.preferred_delivery_date && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {inquiryForm.validation.preferred_delivery_date}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 備註 */}
              <div>
                <label className="block text-gray-700 dark:text-gray-200 mb-1 font-medium">
                  特殊需求或備註
                  <span className="text-gray-400 dark:text-gray-500 text-xs font-normal ml-2">
                    選填
                  </span>
                </label>
                <textarea
                  value={inquiryForm.data.notes}
                  onChange={e => inquiryForm.updateField('notes', e.target.value)}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 sm:px-3 sm:py-2 h-28 sm:h-24 text-gray-900 dark:text-gray-100 dark:bg-slate-700 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors resize-none"
                  placeholder="如有特殊需求或其他說明，請在此註明"
                  inputMode="text"
                />
              </div>

              {/* 錯誤訊息 */}
              {(inquiryForm.submitError || inquiryForm.validation.general) && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-red-400 dark:text-red-500 mt-0.5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                        {inquiryForm.submitError || inquiryForm.validation.general}
                      </p>
                      {Object.keys(inquiryForm.validation).length > 0 && (
                        <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                          請檢查並修正上述標記的欄位錯誤
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 成功訊息 */}
              {inquiryForm.submitSuccess && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-400 dark:text-green-500 mr-2"
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
                      詢價單已成功提交！正在跳轉到詢價單詳情頁...
                    </p>
                  </div>
                </div>
              )}

              {/* 提交按鈕 */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => router.back()}
                  className="w-full sm:flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 py-4 sm:py-3 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 active:bg-gray-300 dark:active:bg-slate-500 transition-colors touch-manipulation"
                  disabled={inquiryForm.isSubmitting}
                >
                  返回
                </button>
                <button
                  onClick={handleSubmitInquiry}
                  disabled={inquiryForm.isSubmitting || !user || inquiryForm.submitSuccess}
                  className="w-full sm:flex-1 bg-amber-900 dark:bg-amber-700 text-white py-4 sm:py-3 rounded-lg font-semibold hover:bg-amber-800 dark:hover:bg-amber-600 active:bg-amber-900 dark:active:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative touch-manipulation"
                >
                  {inquiryForm.isSubmitting && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  <span className={inquiryForm.isSubmitting ? 'ml-6' : ''}>
                    {inquiryForm.submitSuccess
                      ? '提交成功'
                      : inquiryForm.isSubmitting
                        ? '提交中...'
                        : '提交詢價'}
                  </span>
                </button>
              </div>

              {/* 清理自動儲存按鈕 */}
              {inquiryForm.isDirty && !inquiryForm.submitSuccess && (
                <div className="text-center pt-4 border-t border-gray-200 dark:border-slate-700">
                  <button
                    onClick={inquiryForm.clearAutoSave}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
                  >
                    清除自動儲存的資料
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 主要導出組件，用 Suspense 包裝
export default function CreateInquiryPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen flex items-center justify-center">載入中...</div>}
    >
      <InquiryFormContent />
    </Suspense>
  )
}
