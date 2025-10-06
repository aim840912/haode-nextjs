import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Product } from '@/types/product'
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

export function useProductData(params: Promise<{ id: string }>) {
  const router = useRouter()

  const [initialLoading, setInitialLoading] = useState(true)
  const [productId, setProductId] = useState<string>('')
  const [categories, setCategories] = useState<string[]>([])

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

  /**
   * 從 API 獲取產品分類列表
   */
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/products/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch {
      // 忽略分類載入錯誤，不影響表單功能
    }
  }, [])

  /**
   * 從 API 獲取產品資料
   */
  const fetchProduct = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/products/${id}`)
        if (response.ok) {
          const responseData = await response.json()

          // 檢查回應格式是否正確
          if (!responseData.success || !responseData.data) {
            logger.error('產品資料格式錯誤', undefined, { metadata: { responseData } })
            alert('產品資料格式錯誤')
            router.push('/admin/products')
            return
          }

          const product: Product = responseData.data

          // 根據是否為特價商品來設定正確的價格顯示
          const isOnSale = product.isOnSale || false
          const displayPrice = isOnSale ? product.originalPrice || product.price : product.price
          const displaySalePrice = isOnSale ? product.price : 0

          setFormData({
            name: product.name,
            description: product.description,
            category: product.category,
            price: displayPrice, // 顯示原價
            priceUnit: product.priceUnit || '斤', // 價格單位，預設為斤
            unitQuantity: product.unitQuantity || 1, // 單位數量，預設為1
            salePrice: displaySalePrice, // 顯示特價
            isOnSale: isOnSale,
            saleEndDate: product.saleEndDate || '',
            inventory: product.inventory,
            isActive: product.isActive,
          })

          logger.info('產品資料載入成功', {
            metadata: { productId: id, productName: product.name },
          })
        } else {
          const errorText = await response.text().catch(() => 'Unknown error')
          logger.error('產品載入失敗', undefined, {
            metadata: { productId: id, status: response.status, error: errorText },
          })
          alert(`產品不存在 (${response.status})`)
          router.push('/admin/products')
        }
      } catch (error) {
        logger.error(
          '產品載入發生錯誤',
          error instanceof Error ? error : new Error(String(error)),
          { metadata: { productId: id } }
        )
        alert(`載入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
      } finally {
        setInitialLoading(false)
      }
    },
    [router]
  )

  /**
   * 處理 params Promise 並獲取資料
   */
  useEffect(() => {
    fetchCategories()
    params.then(({ id }) => {
      setProductId(id)
      fetchProduct(id)
    })
  }, [params, fetchProduct, fetchCategories])

  return {
    initialLoading,
    productId,
    categories,
    formData,
    setFormData,
    fetchProduct,
  }
}
