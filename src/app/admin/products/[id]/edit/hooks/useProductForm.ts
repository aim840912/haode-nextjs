import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Product } from '@/types/product'
import { logger } from '@/lib/logger'
import type { PendingImageChanges } from '@/components/features/products/ProductImageManager'

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

export function useProductForm(productId: string) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [hasPendingImageChanges, setHasPendingImageChanges] = useState(false)

  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle'
  )
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const getPendingChangesRef = useRef<() => PendingImageChanges>(() => ({
    deletedIds: [],
    newImages: [],
    reorderedImages: [],
  }))

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: '季節水果',
    price: 0,
    priceUnit: '斤',
    unitQuantity: 1,
    salePrice: 0,
    isOnSale: false,
    saleEndDate: '',
    inventory: 0,
    isActive: true,
  })

  const resetFormState = useCallback(() => {
    setSubmitStatus('idle')
    setLoading(false)
    setSubmitError(null)
    setSubmitSuccess(null)
    setHasSubmitted(false)
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/products/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch {
      // 忽略分類載入錯誤
    }
  }, [])

  const fetchProduct = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/products/${id}`)
        const result = await response.json()

        if (response.ok && result.data) {
          const product: Product = result.data
          setFormData({
            name: product.name || '',
            description: product.description || '',
            category: product.category || '季節水果',
            price: product.price || 0,
            priceUnit: product.priceUnit || '斤',
            unitQuantity: product.unitQuantity || 1,
            salePrice: (product as any).salePrice || 0,
            isOnSale: (product as any).isOnSale || false,
            saleEndDate: (product as any).saleEndDate || '',
            inventory: product.inventory || 0,
            isActive: product.isActive ?? true,
          })
        } else {
          alert(result.error || '產品不存在')
          router.push('/admin/products')
        }
      } catch (error) {
        logger.error(
          'Error fetching product:',
          error instanceof Error ? error : new Error('Unknown error')
        )
        alert('載入失敗')
      } finally {
        setInitialLoading(false)
      }
    },
    [router]
  )

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    let newValue: unknown

    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked
    } else if (type === 'number') {
      newValue = parseFloat(value) || 0
    } else {
      newValue = value
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (hasSubmitted || submitStatus === 'submitting') {
      return
    }

    setHasSubmitted(true)
    setLoading(true)
    setSubmitStatus('submitting')
    setSubmitError(null)

    try {
      // 注意：圖片變更由 ProductImageManager 自動處理

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        setSubmitStatus('success')
        setSubmitSuccess('產品更新成功！')
        setTimeout(() => router.push('/admin/products'), 1500)
      } else {
        setSubmitStatus('error')
        setSubmitError(result.error || '更新失敗')
        setHasSubmitted(false)
      }
    } catch (error) {
      logger.error(
        'Error updating product:',
        error instanceof Error ? error : new Error('Unknown error')
      )
      setSubmitStatus('error')
      setSubmitError('更新失敗')
      setHasSubmitted(false)
    } finally {
      setLoading(false)
    }
  }

  return {
    formData,
    loading,
    initialLoading,
    categories,
    hasPendingImageChanges,
    submitStatus,
    submitError,
    submitSuccess,
    getPendingChangesRef,
    setHasPendingImageChanges,
    fetchCategories,
    fetchProduct,
    handleInputChange,
    handleSubmit,
    resetFormState,
  }
}
