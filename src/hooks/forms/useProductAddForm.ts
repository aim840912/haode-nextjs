import { useState, useCallback } from 'react'

export interface ProductFormData {
  name: string
  description: string
  category: string
  price: number
  priceUnit: string
  unitQuantity: number
  inventory: number
  isActive: boolean
}

export interface ProductFormErrors {
  name: string
  description: string
  category: string
  price: string
  inventory: string
  images: string
}

export interface UseProductFormReturn {
  formData: ProductFormData
  fieldErrors: ProductFormErrors
  updateField: (field: keyof ProductFormData, value: unknown) => void
  setFieldError: (field: keyof ProductFormErrors, error: string) => void
  validateForm: () => boolean
  resetForm: () => void
}

const INITIAL_FORM_DATA: ProductFormData = {
  name: '',
  description: '',
  category: '',
  price: 0,
  priceUnit: '斤',
  unitQuantity: 1,
  inventory: 0,
  isActive: true,
}

const INITIAL_ERRORS: ProductFormErrors = {
  name: '',
  description: '',
  category: '',
  price: '',
  inventory: '',
  images: '',
}

/**
 * 產品表單狀態管理 Hook
 * 負責管理表單資料、驗證和錯誤狀態
 */
export function useProductForm(): UseProductFormReturn {
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA)
  const [fieldErrors, setFieldErrors] = useState<ProductFormErrors>(INITIAL_ERRORS)

  // 更新單個欄位
  const updateField = useCallback((field: keyof ProductFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))

    // 清除該欄位的錯誤訊息
    setFieldErrors(prev => ({
      ...prev,
      [field]: '',
    }))
  }, [])

  // 設置欄位錯誤
  const setFieldError = useCallback((field: keyof ProductFormErrors, error: string) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: error,
    }))
  }, [])

  // 表單驗證
  const validateForm = useCallback((): boolean => {
    const errors: ProductFormErrors = {
      name: '',
      description: '',
      category: '',
      price: '',
      inventory: '',
      images: '',
    }
    let isValid = true

    // 驗證產品名稱
    if (!formData.name.trim()) {
      errors.name = '產品名稱為必填'
      isValid = false
    } else if (formData.name.length < 2) {
      errors.name = '產品名稱至少需要 2 個字元'
      isValid = false
    } else if (formData.name.length > 100) {
      errors.name = '產品名稱不能超過 100 個字元'
      isValid = false
    }

    // 驗證產品描述
    if (!formData.description.trim()) {
      errors.description = '產品描述為必填'
      isValid = false
    } else if (formData.description.length > 1000) {
      errors.description = '產品描述不能超過 1000 個字元'
      isValid = false
    }

    // 驗證分類
    if (!formData.category.trim()) {
      errors.category = '產品分類為必填'
      isValid = false
    }

    // 驗證價格
    if (formData.price <= 0) {
      errors.price = '價格必須大於 0'
      isValid = false
    } else if (formData.price > 1000000) {
      errors.price = '價格不能超過 1,000,000'
      isValid = false
    }

    // 驗證庫存
    if (formData.inventory < 0) {
      errors.inventory = '庫存不能為負數'
      isValid = false
    }

    setFieldErrors(errors)
    return isValid
  }, [formData])

  // 重置表單
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA)
    setFieldErrors(INITIAL_ERRORS)
  }, [])

  return {
    formData,
    fieldErrors,
    updateField,
    setFieldError,
    validateForm,
    resetForm,
  }
}
