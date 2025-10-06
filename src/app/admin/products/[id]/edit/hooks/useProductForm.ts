import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'

interface FormData {
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
  isActive: boolean
}

interface UseProductFormOptions {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  productId: string
  csrfToken: string | null
  csrfLoading: boolean
  csrfError: string | null
}

export function useProductForm({
  formData,
  setFormData,
  productId,
  csrfToken,
  csrfLoading,
  csrfError,
}: UseProductFormOptions) {
  const router = useRouter()

  // === 統一狀態管理系統 ===
  const [loading, setLoading] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle'
  )
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [shouldCleanup, setShouldCleanup] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)

  /**
   * 處理輸入欄位變更
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target
      setFormData(prev => ({
        ...prev,
        [name]:
          type === 'number'
            ? Number(value)
            : type === 'checkbox'
              ? (e.target as HTMLInputElement).checked
              : value,
      }))

      // 清除錯誤狀態當使用者開始輸入
      if (submitError) {
        setSubmitError(null)
      }
    },
    [setFormData, submitError]
  )

  /**
   * 狀態重置函數
   */
  const resetFormState = useCallback(() => {
    setSubmitStatus('idle')
    setLoading(false)
    setSubmitError(null)
    setSubmitSuccess(null)
    setHasSubmitted(false)
    setShouldCleanup(false)
  }, [])

  /**
   * 處理表單提交
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // 🛡️ 防禦性檢查 - 三重防護機制
      if (loading || submitStatus !== 'idle' || hasSubmitted) {
        logger.warn('阻止重複提交', {
          metadata: {
            loading,
            submitStatus,
            hasSubmitted,
            productId,
            timestamp: new Date().toISOString(),
          },
        })
        return
      }

      // 防止在 CSRF token 未準備好時提交
      if (csrfLoading || !csrfToken) {
        setSubmitError('請稍候，正在初始化安全驗證...')
        return
      }

      if (csrfError) {
        setSubmitError('安全驗證初始化失敗，請重新整理頁面')
        return
      }

      // 🔒 鎖定狀態 - 統一狀態管理
      setSubmitStatus('submitting')
      setLoading(true)
      setHasSubmitted(true)
      setSubmitError(null)
      setSubmitSuccess(null)

      try {
        // 根據是否為特價商品設定正確的價格，但保留 priceUnit 和 unitQuantity
        const { salePrice: _unusedSalePrice, ...restData } = formData
        const productData = {
          ...restData,
          images: [],
          // 如果是特價商品，設定特價為當前售價，原價為 originalPrice
          // 如果不是特價商品，設定原價為當前售價，originalPrice 為 null
          price: formData.isOnSale ? formData.salePrice : formData.price,
          originalPrice: formData.isOnSale ? formData.price : null,
        }

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }

        if (csrfToken) {
          headers['x-csrf-token'] = csrfToken
        }

        logger.info('開始更新產品', {
          metadata: {
            productId,
            productName: formData.name,
            submitStatus,
          },
        })

        const response = await fetch(`/api/admin-proxy/products`, {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify({ id: productId, ...productData }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: '更新失敗' }))
          throw new Error(errorData.error || `更新失敗 (${response.status})`)
        }

        const result = await response.json()

        // ✅ 成功處理 - 設置成功狀態
        setSubmitStatus('success')
        setSubmitSuccess('產品更新成功！即將跳轉...')
        setShouldCleanup(true)

        logger.info('產品更新成功', {
          metadata: {
            productId: productId,
            productName: formData.name,
            submitStatus: 'success',
          },
        })

        // 延遲跳轉，確保狀態穩定
        setTimeout(() => {
          router.push('/admin/products')
        }, 2000)
      } catch (error) {
        // ❌ 錯誤處理 - 允許重試
        setSubmitStatus('error')
        const errorMessage = error instanceof Error ? error.message : '更新失敗，請重試'
        setSubmitError(errorMessage)

        // 重置提交標記，允許重試
        setHasSubmitted(false)

        // 錯誤時立即重置 loading 狀態
        setLoading(false)

        logger.error('產品更新失敗', error as Error, {
          metadata: {
            formData: { name: formData.name, category: formData.category },
            submitStatus: 'error',
          },
        })
      }
      // 🎯 修復競態條件：移除 finally block，成功時保持 loading=true 直到跳轉
    },
    [
      formData,
      productId,
      csrfToken,
      csrfLoading,
      csrfError,
      loading,
      submitStatus,
      hasSubmitted,
      router,
    ]
  )

  /**
   * 資源清理與記憶體管理
   */
  useEffect(() => {
    if (shouldCleanup) {
      logger.info('開始清理資源', {
        metadata: {
          productId,
          submitStatus,
        },
      })

      // 延遲清理，在跳轉前完成
      setTimeout(() => {
        logger.info('編輯頁面資源已清理', { metadata: { productId } })
      }, 1500) // 在 2 秒跳轉前清理
    }
  }, [shouldCleanup, productId, submitStatus])

  /**
   * 頁面離開保護
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 只在有未儲存變更且未成功提交時警告
      if ((formData.name || formData.description) && submitStatus !== 'success') {
        e.preventDefault()
        e.returnValue = '您有未儲存的變更，確定要離開嗎？'
        return '您有未儲存的變更，確定要離開嗎？'
      }
    }

    // 監聽頁面關閉/重新整理
    window.addEventListener('beforeunload', handleBeforeUnload)

    // 清理函數
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [formData, submitStatus])

  return {
    loading,
    submitStatus,
    hasSubmitted,
    submitError,
    submitSuccess,
    showCategorySuggestions,
    setShowCategorySuggestions,
    handleInputChange,
    handleSubmit,
    resetFormState,
  }
}
