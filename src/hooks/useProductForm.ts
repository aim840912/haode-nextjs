'use client'

import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'

export interface ProductFormData {
  name: string
  description: string
  category: string
  price: number
  priceUnit: string
  unitQuantity: number
  salePrice: number
  isOnSale: boolean
  saleEndDate: string
  inventory: number
  images: string[]
  isActive: boolean
  sku: string
}

export interface ProductFormErrors {
  name: string
  description: string
  category: string
  price: string
  inventory: string
  images: string
  sku: string
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  category: '',
  price: 0,
  priceUnit: '斤',
  unitQuantity: 1,
  salePrice: 0,
  isOnSale: false,
  saleEndDate: '',
  inventory: 0,
  images: [''],
  isActive: true,
  sku: '',
}

const initialErrors: ProductFormErrors = {
  name: '',
  description: '',
  category: '',
  price: '',
  inventory: '',
  images: '',
  sku: '',
}

export function useProductForm() {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [fieldErrors, setFieldErrors] = useState<ProductFormErrors>(initialErrors)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 表單欄位更新
  const updateField = useCallback(
    (field: keyof ProductFormData, value: any) => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }))

      // 清除相關錯誤
      if (fieldErrors[field as keyof ProductFormErrors]) {
        setFieldErrors(prev => ({
          ...prev,
          [field]: '',
        }))
      }
    },
    [fieldErrors]
  )

  // 批量更新欄位
  const updateFields = useCallback((updates: Partial<ProductFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
    }))
  }, [])

  // 表單驗證
  const validateForm = useCallback(() => {
    const errors: ProductFormErrors = {
      name: '',
      description: '',
      category: '',
      price: '',
      inventory: '',
      images: '',
      sku: '',
    }

    let hasErrors = false

    // 產品名稱驗證
    if (!formData.name.trim()) {
      errors.name = '產品名稱為必填項目'
      hasErrors = true
    } else if (formData.name.length > 100) {
      errors.name = '產品名稱不能超過 100 個字元'
      hasErrors = true
    }

    // 產品描述驗證
    if (!formData.description.trim()) {
      errors.description = '產品描述為必填項目'
      hasErrors = true
    } else if (formData.description.length > 1000) {
      errors.description = '產品描述不能超過 1000 個字元'
      hasErrors = true
    }

    // 分類驗證
    if (!formData.category) {
      errors.category = '請選擇產品分類'
      hasErrors = true
    }

    // 價格驗證
    if (formData.price <= 0) {
      errors.price = '價格必須大於 0'
      hasErrors = true
    } else if (formData.price > 999999) {
      errors.price = '價格不能超過 999,999'
      hasErrors = true
    }

    // 特價驗證
    if (formData.isOnSale) {
      if (formData.salePrice <= 0) {
        errors.price = '特價必須大於 0'
        hasErrors = true
      } else if (formData.salePrice >= formData.price) {
        errors.price = '特價必須低於原價'
        hasErrors = true
      }
    }

    // 庫存驗證
    if (formData.inventory < 0) {
      errors.inventory = '庫存不能為負數'
      hasErrors = true
    } else if (formData.inventory > 9999) {
      errors.inventory = '庫存不能超過 9999'
      hasErrors = true
    }

    // SKU 驗證 (如果有提供)
    if (formData.sku && (formData.sku.length < 3 || formData.sku.length > 20)) {
      errors.sku = 'SKU 長度必須在 3-20 個字元之間'
      hasErrors = true
    }

    // 圖片驗證
    const validImages = formData.images.filter(img => img && img.trim())
    if (validImages.length === 0) {
      errors.images = '至少需要上傳一張產品圖片'
      hasErrors = true
    }

    setFieldErrors(errors)
    return !hasErrors
  }, [formData])

  // 重置表單
  const resetForm = useCallback(() => {
    setFormData(initialFormData)
    setFieldErrors(initialErrors)
    setIsSubmitting(false)
  }, [])

  // 設定提交狀態
  const setSubmitting = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting)
  }, [])

  // 計算表單完整度
  const getFormCompleteness = useCallback(() => {
    const requiredFields = ['name', 'description', 'category', 'price']
    const completedFields = requiredFields.filter(field => {
      const value = formData[field as keyof ProductFormData]
      return value !== null && value !== undefined && String(value).trim() !== ''
    })

    const validImages = formData.images.filter(img => img && img.trim())
    if (validImages.length > 0) {
      completedFields.push('images')
    }

    return Math.round((completedFields.length / (requiredFields.length + 1)) * 100)
  }, [formData])

  return {
    formData,
    fieldErrors,
    isSubmitting,
    updateField,
    updateFields,
    validateForm,
    resetForm,
    setSubmitting,
    getFormCompleteness,
    // 便利方法
    isValid: Object.values(fieldErrors).every(error => !error),
    completeness: getFormCompleteness(),
  }
}
