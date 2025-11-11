/**
 * 快速詢價表單 Hook（簡化版）
 * 專為極簡快速詢價設計，僅 3 個核心欄位
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { inquiryApi } from '@/lib/api-client'
import { logger } from '@/lib/logger'
import { InquirySchemas } from '@/lib/validation'

export interface QuickInquiryFormData {
  product_id: string
  product_name: string
  quantity: number
  contact_method: 'email' | 'phone'
  contact_value: string
  unit_price?: number
}

export interface QuickInquiryFormValidation {
  contact_value?: string
  general?: string
}

export interface QuickInquiryFormState {
  data: QuickInquiryFormData
  validation: QuickInquiryFormValidation
  isSubmitting: boolean
  submitError: string | null
  submitSuccess: boolean
}

export function useQuickInquiryForm(initialData: {
  product_id: string
  product_name: string
  quantity?: number
  unit_price?: number
}) {
  const router = useRouter()

  const [state, setState] = useState<QuickInquiryFormState>({
    data: {
      product_id: initialData.product_id,
      product_name: initialData.product_name,
      quantity: initialData.quantity || 1,
      contact_method: 'email',
      contact_value: '',
      unit_price: initialData.unit_price,
    },
    validation: {},
    isSubmitting: false,
    submitError: null,
    submitSuccess: false,
  })

  /**
   * 更新欄位值
   */
  const updateField = useCallback(
    <K extends keyof QuickInquiryFormData>(field: K, value: QuickInquiryFormData[K]) => {
      setState(prev => ({
        ...prev,
        data: { ...prev.data, [field]: value },
        validation: { ...prev.validation, [field]: undefined }, // 清除該欄位的驗證錯誤
      }))
    },
    []
  )

  /**
   * 切換聯絡方式
   */
  const setContactMethod = useCallback((method: 'email' | 'phone') => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        contact_method: method,
        contact_value: '', // 切換時清空聯絡資訊
      },
      validation: {}, // 清除所有驗證錯誤
    }))
  }, [])

  /**
   * 驗證表單
   */
  const validateForm = useCallback((): boolean => {
    const result = InquirySchemas.quick.safeParse(state.data)

    if (!result.success) {
      const errors: QuickInquiryFormValidation = {}
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof QuickInquiryFormValidation
        errors[field] = issue.message
      })

      setState(prev => ({
        ...prev,
        validation: errors,
        submitError: '請檢查表單欄位',
      }))

      logger.warn('快速詢價表單驗證失敗', {
        metadata: {
          errors: result.error.issues.map(i => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
      })

      return false
    }

    setState(prev => ({ ...prev, validation: {}, submitError: null }))
    return true
  }, [state.data])

  /**
   * 提交表單
   */
  const submitForm = useCallback(async (): Promise<boolean> => {
    // 驗證表單
    if (!validateForm()) {
      return false
    }

    setState(prev => ({ ...prev, isSubmitting: true, submitError: null }))

    try {
      logger.info('提交快速詢價表單', {
        metadata: {
          productId: state.data.product_id,
          productName: state.data.product_name,
          quantity: state.data.quantity,
          contactMethod: state.data.contact_method,
        },
      })

      // 轉換為訪客詢價單格式
      const inquiryData = {
        inquiry_type: 'product' as const,
        customer_name: '快速詢價客戶', // 訪客統一使用此名稱
        customer_email:
          state.data.contact_method === 'email' ? state.data.contact_value : 'phone@guest.inquiry', // 電話聯絡使用佔位 Email
        customer_phone:
          state.data.contact_method === 'phone' ? state.data.contact_value : undefined,
        items: [
          {
            product_id: state.data.product_id,
            product_name: state.data.product_name,
            quantity: state.data.quantity,
            unit_price: state.data.unit_price,
            notes: `快速詢價 - ${state.data.product_name}`,
          },
        ],
        notes: `快速詢價（${state.data.contact_method === 'email' ? 'Email' : '電話'}聯絡）`,
      }

      // 呼叫訪客詢價 API（無需登入）
      const response = await inquiryApi.createGuest(inquiryData)

      if (response.success && response.data) {
        const inquiryId = (response.data as { id: string }).id

        setState(prev => ({
          ...prev,
          isSubmitting: false,
          submitSuccess: true,
        }))

        logger.info('快速詢價提交成功', {
          metadata: {
            inquiryId,
          },
        })

        // 延遲跳轉，讓使用者看到成功訊息
        setTimeout(() => {
          router.push(`/inquiries/${inquiryId}`)
        }, 1500)

        return true
      } else {
        throw new Error(response.message || '提交失敗')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '提交詢價時發生錯誤'

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        submitError: errorMessage,
      }))

      logger.error('快速詢價提交失敗', error as Error, {
        metadata: {
          productId: state.data.product_id,
        },
      })

      return false
    }
  }, [state.data, validateForm, router])

  return {
    // 狀態
    data: state.data,
    validation: state.validation,
    isSubmitting: state.isSubmitting,
    submitError: state.submitError,
    submitSuccess: state.submitSuccess,

    // 方法
    updateField,
    setContactMethod,
    submitForm,
  }
}
