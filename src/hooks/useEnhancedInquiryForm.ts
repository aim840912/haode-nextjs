/**
 * 增強的詢價表單 Hook
 * 提供完整的表單狀態管理、驗證、自動儲存和錯誤處理
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { inquiryApi } from '@/lib/api-client'
import { logger } from '@/lib/logger'
import { CreateInquiryRequest, CreateInquiryItemRequest } from '@/types/inquiry'
import { useErrorTracking } from './useErrorTracking'

export interface InquiryFormData {
  customer_name: string
  customer_email: string
  customer_phone: string
  notes: string
  delivery_address: string
  preferred_delivery_date: string
  items: CreateInquiryItemRequest[]
}

export interface InquiryFormValidation {
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  delivery_address?: string
  preferred_delivery_date?: string
  items?: string
  general?: string
}

export interface InquiryFormState {
  data: InquiryFormData
  validation: InquiryFormValidation
  isSubmitting: boolean
  isAutoSaving: boolean
  submitError: string | null
  submitSuccess: boolean
  isDirty: boolean
}

const STORAGE_KEY = 'inquiry_form_autosave'
const AUTOSAVE_DELAY = 2000 // 2秒後自動儲存

export function useEnhancedInquiryForm(initialData?: Partial<InquiryFormData>) {
  const router = useRouter()
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { trackUserAction, trackError, trackFormSubmission } = useErrorTracking()
  
  const [state, setState] = useState<InquiryFormState>({
    data: {
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      notes: '',
      delivery_address: '',
      preferred_delivery_date: '',
      items: [],
      ...initialData,
    },
    validation: {},
    isSubmitting: false,
    isAutoSaving: false,
    submitError: null,
    submitSuccess: false,
    isDirty: false,
  })

  // 載入自動儲存的資料（僅在客戶端）
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const savedData = JSON.parse(saved)
        
        // 檢查資料是否在24小時內
        const now = Date.now()
        const savedTime = savedData.timestamp || 0
        const hoursSinceLastSave = (now - savedTime) / (1000 * 60 * 60)
        
        if (hoursSinceLastSave < 24 && savedData.formData) {
          logger.info('載入自動儲存的表單資料', {
            metadata: { 
              hoursSinceLastSave: Math.round(hoursSinceLastSave * 10) / 10,
              hasItems: savedData.formData.items?.length > 0
            }
          })
          
          setState(prev => ({
            ...prev,
            data: { ...prev.data, ...savedData.formData },
            isDirty: true,
          }))
        } else {
          // 清理過期資料
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (error) {
      logger.warn('載入自動儲存資料失敗', { metadata: { error: String(error) } })
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // 自動儲存
  const autoSave = useCallback(() => {
    if (typeof window === 'undefined') return

    setState(prev => ({ ...prev, isAutoSaving: true }))
    
    try {
      const saveData = {
        formData: state.data,
        timestamp: Date.now(),
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))
      
      logger.debug('表單資料自動儲存', {
        metadata: { 
          hasItems: state.data.items.length > 0,
          customerName: !!state.data.customer_name,
        }
      })
    } catch (error) {
      logger.warn('自動儲存失敗', { metadata: { error: String(error) } })
    } finally {
      // 延遲移除載入狀態以提供視覺回饋
      setTimeout(() => {
        setState(prev => ({ ...prev, isAutoSaving: false }))
      }, 500)
    }
  }, [state.data])

  // 表單驗證
  const validateForm = useCallback((): InquiryFormValidation => {
    const errors: InquiryFormValidation = {}

    // 必填欄位驗證
    if (!state.data.customer_name.trim()) {
      errors.customer_name = '請輸入姓名'
    }

    if (!state.data.customer_email.trim()) {
      errors.customer_email = '請輸入 Email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.data.customer_email)) {
      errors.customer_email = '請輸入有效的 Email 格式'
    }

    // 電話格式驗證（可選）
    if (state.data.customer_phone.trim() && !/^[\d\s\-\+\(\)]+$/.test(state.data.customer_phone)) {
      errors.customer_phone = '請輸入有效的電話號碼'
    }

    // 日期驗證（可選）
    if (state.data.preferred_delivery_date) {
      const selectedDate = new Date(state.data.preferred_delivery_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        errors.preferred_delivery_date = '配送日期不能早於今天'
      }
    }

    // 項目驗證
    if (!state.data.items.length) {
      errors.items = '請至少選擇一個商品'
    } else {
      // 檢查每個項目的數量
      const hasInvalidQuantity = state.data.items.some(item => !item.quantity || item.quantity < 1)
      if (hasInvalidQuantity) {
        errors.items = '商品數量必須大於 0'
      }
    }

    return errors
  }, [state.data])

  // 即時驗證單一欄位
  const validateField = useCallback(<K extends keyof InquiryFormData>(
    field: K,
    value: InquiryFormData[K]
  ): string | undefined => {
    switch (field) {
      case 'customer_name':
        if (typeof value === 'string' && !value.trim()) {
          return '請輸入姓名'
        }
        break
      case 'customer_email':
        if (typeof value === 'string') {
          if (!value.trim()) {
            return '請輸入 Email'
          }
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return '請輸入有效的 Email 格式'
          }
        }
        break
      case 'customer_phone':
        if (typeof value === 'string' && value.trim() && !/^[\d\s\-\+\(\)]+$/.test(value)) {
          return '請輸入有效的電話號碼'
        }
        break
      case 'preferred_delivery_date':
        if (typeof value === 'string' && value) {
          const selectedDate = new Date(value)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (selectedDate < today) {
            return '配送日期不能早於今天'
          }
        }
        break
    }
    return undefined
  }, [])

  // 更新表單欄位（含即時驗證）
  const updateField = useCallback(<K extends keyof InquiryFormData>(
    field: K,
    value: InquiryFormData[K],
    validateNow: boolean = true
  ) => {
    // 即時驗證
    const error = validateNow ? validateField(field, value) : undefined

    setState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      isDirty: true,
      validation: { 
        ...prev.validation, 
        [field]: error // 設定或清除該欄位的錯誤
      },
    }))

    // 設定自動儲存延遲
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }
    
    autosaveTimeoutRef.current = setTimeout(() => {
      autoSave()
    }, AUTOSAVE_DELAY)
  }, [autoSave, validateField])

  // 添加詢價項目
  const addItem = useCallback((item: CreateInquiryItemRequest) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        items: [...prev.data.items, item],
      },
      isDirty: true,
      validation: { ...prev.validation, items: undefined },
    }))
    
    // 觸發自動儲存
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }
    autosaveTimeoutRef.current = setTimeout(autoSave, AUTOSAVE_DELAY)
  }, [autoSave])

  // 移除詢價項目
  const removeItem = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        items: prev.data.items.filter((_, i) => i !== index),
      },
      isDirty: true,
    }))
    
    // 觸發自動儲存
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }
    autosaveTimeoutRef.current = setTimeout(autoSave, AUTOSAVE_DELAY)
  }, [autoSave])

  // 更新詢價項目
  const updateItem = useCallback((index: number, updates: Partial<CreateInquiryItemRequest>) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        items: prev.data.items.map((item, i) => 
          i === index ? { ...item, ...updates } : item
        ),
      },
      isDirty: true,
    }))
    
    // 觸發自動儲存
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }
    autosaveTimeoutRef.current = setTimeout(autoSave, AUTOSAVE_DELAY)
  }, [autoSave])

  // 提交表單
  const submitForm = useCallback(async () => {
    // 驗證表單
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setState(prev => ({
        ...prev,
        validation: validationErrors,
        submitError: '請修正表單錯誤後再試',
      }))
      return false
    }

    setState(prev => ({
      ...prev,
      isSubmitting: true,
      submitError: null,
      validation: {},
    }))

    try {
      // 準備請求資料
      const inquiryRequest: CreateInquiryRequest = {
        customer_name: state.data.customer_name,
        customer_email: state.data.customer_email,
        customer_phone: state.data.customer_phone || undefined,
        inquiry_type: 'product',
        notes: state.data.notes || undefined,
        delivery_address: state.data.delivery_address || undefined,
        preferred_delivery_date: state.data.preferred_delivery_date || undefined,
        items: state.data.items,
      }

      logger.info('提交詢價表單', {
        metadata: {
          itemCount: inquiryRequest.items?.length || 0,
          hasPhone: !!inquiryRequest.customer_phone,
          hasDelivery: !!inquiryRequest.delivery_address,
        }
      })

      // 追蹤表單提交嘗試
      trackUserAction('inquiry_form_submit', {
        itemCount: inquiryRequest.items?.length || 0,
        hasPhone: !!inquiryRequest.customer_phone,
        hasDelivery: !!inquiryRequest.delivery_address,
      })

      // 使用新的 v1 API
      const response = await inquiryApi.create(inquiryRequest)

      if (response.success && response.data) {
        logger.info('詢價單建立成功', {
          metadata: { inquiryId: (response.data as any)?.id }
        })

        // 追蹤成功提交
        trackFormSubmission('inquiry_form', true, undefined, {
          inquiryId: (response.data as { id?: string | number })?.id,
          itemCount: inquiryRequest.items?.length || 0
        })

        setState(prev => ({
          ...prev,
          submitSuccess: true,
          isDirty: false,
        }))

        // 清理自動儲存的資料
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY)
        }

        // 導航到詢價單詳情頁
        router.push(`/inquiries/${(response.data as { id?: string })?.id}`)
        return true
      } else {
        throw new Error(response.message || '提交失敗')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '提交詢價時發生未知錯誤'
      
      logger.error('詢價表單提交失敗', error as Error, {
        metadata: {
          customerEmail: state.data.customer_email,
          itemCount: state.data.items.length,
        }
      })

      // 追蹤失敗提交
      trackFormSubmission('inquiry_form', false, errorMessage, {
        customerEmail: state.data.customer_email,
        itemCount: state.data.items.length
      })

      // 追蹤錯誤
      trackError(error as Error, 'inquiry_form_submission', {
        customerEmail: state.data.customer_email,
        itemCount: state.data.items.length,
      })

      setState(prev => ({
        ...prev,
        submitError: errorMessage,
      }))
      
      return false
    } finally {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
      }))
    }
  }, [state.data, validateForm, router, trackError, trackFormSubmission, trackUserAction])

  // 重置表單
  const resetForm = useCallback(() => {
    setState(prev => ({
      ...prev,
      data: {
        customer_name: '',
        customer_email: initialData?.customer_email || '',
        customer_phone: '',
        notes: '',
        delivery_address: '',
        preferred_delivery_date: '',
        items: [],
      },
      validation: {},
      submitError: null,
      submitSuccess: false,
      isDirty: false,
    }))

    // 清理自動儲存資料
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }

    // 清理自動儲存計時器
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }
  }, [initialData])

  // 清理自動儲存的資料
  const clearAutoSave = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      logger.info('已清理自動儲存的表單資料')
    }
  }, [])

  // 清理計時器
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current)
      }
    }
  }, [])

  // 欄位失焦時的驗證
  const validateOnBlur = useCallback(<K extends keyof InquiryFormData>(field: K) => {
    const value = state.data[field]
    const error = validateField(field, value)
    
    if (error) {
      setState(prev => ({
        ...prev,
        validation: {
          ...prev.validation,
          [field]: error
        }
      }))
    }
  }, [state.data, validateField])

  return {
    // 狀態
    ...state,
    
    // 操作
    updateField,
    addItem,
    removeItem,
    updateItem,
    submitForm,
    resetForm,
    clearAutoSave,
    
    // 驗證函數
    validateForm,
    validateField,
    validateOnBlur,
  }
}