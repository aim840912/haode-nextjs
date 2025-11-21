'use client'

/**
 * 付款表單元件
 *
 * 選擇付款方式並提交到藍新金流
 */

import { useState, useRef, useEffect } from 'react'
import { CreditCard, Building2, Store, Monitor } from 'lucide-react'
import type { PaymentMethod } from '@/types/order'
import { getCSRFTokenFromCookie } from '@/lib/api/core/api-headers'

// 綠界付款表單資料
interface ECPayFormData {
  paymentUrl: string
  formData: Record<string, string | number>
}

interface PaymentFormProps {
  orderId: string
  amount: number
  email?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

const PAYMENT_METHODS: {
  value: PaymentMethod
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    value: 'CREDIT',
    label: '信用卡',
    description: '支援 VISA、MasterCard、JCB',
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    value: 'VACC',
    label: 'ATM 轉帳',
    description: '取得虛擬帳號後 7 天內完成轉帳',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    value: 'CVS',
    label: '超商代碼',
    description: '7-11、全家、萊爾富、OK（限 $30-$20,000）',
    icon: <Store className="h-5 w-5" />,
  },
  {
    value: 'WEBATM',
    label: '網路 ATM',
    description: '需安裝讀卡機',
    icon: <Monitor className="h-5 w-5" />,
  },
]

export function PaymentForm({ orderId, amount, email, onSuccess, onError }: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CREDIT')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ECPayFormData | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // 當表單資料準備好時自動提交
  useEffect(() => {
    if (formData && formRef.current) {
      formRef.current.submit()
    }
  }, [formData])

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      // 取得 CSRF token 並加入 header
      const csrfToken = getCSRFTokenFromCookie()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
      }

      // 使用綠界 ECPay API
      const response = await fetch('/api/payments/ecpay/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId,
          paymentMethod: selectedMethod,
          email,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || '建立付款失敗')
      }

      // 設定表單資料，觸發自動提交
      setFormData(result.data)
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : '付款處理失敗'
      onError?.(message)
      setIsLoading(false)
    }
  }

  // 檢查金額是否符合超商限制
  const isCvsDisabled = amount < 30 || amount > 20000

  return (
    <div className="space-y-6">
      {/* 付款方式選擇 */}
      <div>
        <h3 className="text-sm font-medium text-gray-900">選擇付款方式</h3>
        <div className="mt-3 space-y-3">
          {PAYMENT_METHODS.map(method => {
            const isDisabled = method.value === 'CVS' && isCvsDisabled

            return (
              <label
                key={method.value}
                className={`relative flex cursor-pointer rounded-lg border p-4 ${
                  selectedMethod === method.value
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white'
                } ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:border-green-300'}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={selectedMethod === method.value}
                  onChange={e => setSelectedMethod(e.target.value as PaymentMethod)}
                  disabled={isDisabled}
                  className="sr-only"
                />
                <div className="flex w-full items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      selectedMethod === method.value
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {method.icon}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="text-sm font-medium text-gray-900">{method.label}</div>
                    <div className="text-xs text-gray-500">{method.description}</div>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border-2 ${
                      selectedMethod === method.value
                        ? 'border-green-600 bg-green-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedMethod === method.value && (
                      <svg
                        className="h-full w-full text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* 付款金額 */}
      <div className="rounded-lg bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">應付金額</span>
          <span className="text-xl font-bold text-gray-900">NT$ {amount.toLocaleString()}</span>
        </div>
      </div>

      {/* 提交按鈕 */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full rounded-md bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? '處理中...' : '前往付款'}
      </button>

      {/* 隱藏的表單，用於提交到綠界 */}
      {formData && (
        <form ref={formRef} method="POST" action={formData.paymentUrl} className="hidden">
          {Object.entries(formData.formData).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={String(value)} />
          ))}
        </form>
      )}
    </div>
  )
}
