import { useState, useEffect, useCallback } from 'react'
import { Product } from '@/types/product'
import { useAuth } from '@/contexts/AuthContext'

export interface UseProductModalReturn {
  selectedProduct: Product | null
  openModal: (product: Product) => void
  closeModal: () => void
  requestQuote: (product: Product) => void
}

/**
 * 產品 Modal 管理 Hook
 *
 * 統一管理產品詳情 Modal 的狀態和 URL 參數同步
 * - URL 參數自動開啟對應產品 Modal
 * - 處理詢問單頁面導向
 * - 統一關閉邏輯
 */
export function useProductModal(products: Product[]): UseProductModalReturn {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { user } = useAuth()

  // 檢查 URL 參數並自動開啟產品 modal
  useEffect(() => {
    if (typeof window === 'undefined' || products.length === 0) return

    const params = new URLSearchParams(window.location.search)
    const productId = params.get('productId')

    if (productId) {
      const product = products.find(p => p.id === productId)
      if (product) {
        setSelectedProduct(product)
        // 移除 URL 參數，保持 URL 乾淨
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [products])

  const openModal = useCallback((product: Product) => {
    setSelectedProduct(product)
  }, [])

  const closeModal = useCallback(() => {
    setSelectedProduct(null)
  }, [])

  const requestQuote = useCallback(
    (product: Product) => {
      if (!user) {
        window.location.href = '/login'
        return
      }

      // 導向詢問單頁面，並預填產品資訊（包含價格）
      const inquiryUrl = `/inquiries/create?product=${encodeURIComponent(
        product.name
      )}&productId=${product.id}&price=${product.price}`
      window.location.href = inquiryUrl
    },
    [user]
  )

  return {
    selectedProduct,
    openModal,
    closeModal,
    requestQuote,
  }
}
