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
 * - 開啟 Modal 時更新 URL（用於分享）
 * - 關閉 Modal 時清理 URL
 * - 處理詢問單頁面導向
 */
export function useProductModal(products: Product[]): UseProductModalReturn {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { user } = useAuth()

  // 檢查 URL 參數並自動開啟產品 modal
  useEffect(() => {
    if (typeof window === 'undefined' || products.length === 0) return

    const params = new URLSearchParams(window.location.search)
    const productId = params.get('id') || params.get('productId') // 支援兩種格式

    if (productId) {
      const product = products.find(p => p.id === productId)
      if (product) {
        setSelectedProduct(product)
      }
    }
  }, [products])

  const openModal = useCallback((product: Product) => {
    setSelectedProduct(product)

    // 更新 URL，加入產品 ID（用於分享）
    if (typeof window !== 'undefined') {
      const newUrl = `${window.location.pathname}?id=${product.id}`
      window.history.pushState({}, '', newUrl)
    }
  }, [])

  const closeModal = useCallback(() => {
    setSelectedProduct(null)

    // 清理 URL 參數
    if (typeof window !== 'undefined') {
      const newUrl = window.location.pathname
      window.history.pushState({}, '', newUrl)
    }
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
