'use client'

import { useState, useCallback, useEffect } from 'react'
import { logger } from '@/lib/logger'

export interface SkuValidationState {
  isChecking: boolean
  isValid: boolean | null
  message: string
}

export function useSkuValidation() {
  const [validationState, setValidationState] = useState<SkuValidationState>({
    isChecking: false,
    isValid: null,
    message: '',
  })

  // 防抖計時器
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // 驗證 SKU 格式
  const validateSkuFormat = useCallback((sku: string): { isValid: boolean; message: string } => {
    if (!sku) {
      return { isValid: true, message: '' } // SKU 是可選的
    }

    if (sku.length < 3) {
      return { isValid: false, message: 'SKU 至少需要 3 個字元' }
    }

    if (sku.length > 20) {
      return { isValid: false, message: 'SKU 不能超過 20 個字元' }
    }

    // 檢查是否只包含字母、數字、連字符和底線
    const skuPattern = /^[a-zA-Z0-9_-]+$/
    if (!skuPattern.test(sku)) {
      return { isValid: false, message: 'SKU 只能包含字母、數字、連字符和底線' }
    }

    return { isValid: true, message: '' }
  }, [])

  // 檢查 SKU 是否已存在
  const checkSkuExists = useCallback(async (sku: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/products/check-sku?sku=${encodeURIComponent(sku)}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.exists === true
    } catch (error) {
      logger.warn('SKU 檢查失敗', {
        module: 'useSkuValidation',
        metadata: { sku, error: String(error) },
      })
      // 檢查失敗時假設不存在，避免阻擋用戶
      return false
    }
  }, [])

  // 完整的 SKU 驗證（格式 + 重複性）
  const validateSku = useCallback(
    async (sku: string) => {
      // 清除之前的計時器
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      // 如果 SKU 為空，清除驗證狀態
      if (!sku.trim()) {
        setValidationState({
          isChecking: false,
          isValid: null,
          message: '',
        })
        return
      }

      // 先檢查格式
      const formatValidation = validateSkuFormat(sku)
      if (!formatValidation.isValid) {
        setValidationState({
          isChecking: false,
          isValid: false,
          message: formatValidation.message,
        })
        return
      }

      // 設定新的防抖計時器
      const newTimer = setTimeout(async () => {
        setValidationState(prev => ({
          ...prev,
          isChecking: true,
        }))

        try {
          const exists = await checkSkuExists(sku)

          setValidationState({
            isChecking: false,
            isValid: !exists,
            message: exists ? 'SKU 已存在，請使用其他 SKU' : 'SKU 可以使用',
          })
        } catch (error) {
          setValidationState({
            isChecking: false,
            isValid: null,
            message: '無法驗證 SKU，請稍後再試',
          })
        }
      }, 500) // 500ms 防抖

      setDebounceTimer(newTimer)
    },
    [debounceTimer, validateSkuFormat, checkSkuExists]
  )

  // 清理計時器
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  // 重置驗證狀態
  const resetValidation = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      setDebounceTimer(null)
    }

    setValidationState({
      isChecking: false,
      isValid: null,
      message: '',
    })
  }, [debounceTimer])

  return {
    validationState,
    validateSku,
    resetValidation,
    // 便利方法
    isChecking: validationState.isChecking,
    isValid: validationState.isValid,
    message: validationState.message,
  }
}
