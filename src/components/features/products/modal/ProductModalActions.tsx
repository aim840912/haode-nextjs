import React, { useState } from 'react'
import { Share2, ShoppingCart } from 'lucide-react'
import { TailwindGreenButton } from '@/components/ui/buttons/TailwindGreenButton'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'
import { InterestButton } from '../InterestButton'
import { ExtendedProduct } from './types'

interface ProductModalActionsProps {
  /** 產品資訊 */
  product: ExtendedProduct
  /** 選擇的數量 */
  quantity: number
  /** 是否為感興趣的產品 */
  isInterested: boolean
  /** 興趣切換回調 */
  onToggleInterest: (productId: string, productName: string) => void
  /** 詢問報價回調 */
  onRequestQuote: (product: ExtendedProduct) => Promise<void> | void
}

/**
 * 產品 Modal 操作按鈕群組元件
 *
 * 包含：
 * - 興趣按鈕
 * - 分享按鈕
 * - 詢問報價按鈕
 */
export const ProductModalActions = React.memo<ProductModalActionsProps>(
  ({ product, quantity, isInterested, onToggleInterest, onRequestQuote }) => {
    const [isRequestingQuote, setIsRequestingQuote] = useState(false)
    const { user } = useAuth()

    const handleRequestQuote = async () => {
      setIsRequestingQuote(true)
      try {
        await onRequestQuote(product)
      } finally {
        setIsRequestingQuote(false)
      }
    }

    const handleShare = async () => {
      // 取得當前產品的分享 URL
      const shareUrl = `${window.location.origin}/products?id=${product.id}`
      const shareData = {
        title: product.name,
        text: `查看這個產品：${product.name}`,
        url: shareUrl,
      }

      try {
        // 優先使用 Web Share API（行動裝置支援）
        if (navigator.share) {
          await navigator.share(shareData)
        } else {
          // 備援方案：複製連結到剪貼簿
          await navigator.clipboard.writeText(shareUrl)
          alert('✓ 連結已複製到剪貼簿！')
        }
      } catch (error) {
        // AbortError 是使用者取消分享，不需要顯示錯誤
        if ((error as Error).name !== 'AbortError') {
          logger.error('產品詳情分享失敗', error as Error, {
            module: 'ProductModalActions',
            action: 'handleShare',
            metadata: { productId: product.id, productName: product.name },
          })
          // 最終備援：顯示連結讓使用者手動複製
          alert(`請複製此連結分享：\n${shareUrl}`)
        }
      }
    }

    return (
      <>
        {/* 次要操作按鈕 */}
        <div
          className="space-y-3 mb-6 animate-fade-in opacity-0"
          style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
        >
          <div className="flex gap-3 relative z-10">
            <InterestButton
              productId={product.id}
              productName={product.name}
              isInterested={isInterested}
              onToggle={onToggleInterest}
              variant="button"
              size="md"
              className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 relative z-20"
            />
            <button
              className={cn(
                'px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg',
                'text-gray-700 hover:text-blue-600 transition-all duration-200',
                'shadow-md hover:shadow-lg flex items-center gap-2'
              )}
              onClick={e => {
                e.stopPropagation()
                handleShare()
              }}
              aria-label="分享產品"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">分享</span>
            </button>
          </div>
        </div>

        {/* 主要操作按鈕 - 綠色 Tailwind 設計 */}
        <div
          className="animate-fade-in opacity-0"
          style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
        >
          <TailwindGreenButton
            onClick={handleRequestQuote}
            disabled={(product.availableStock ?? product.inventory) <= 0 || isRequestingQuote}
            aria-label={isRequestingQuote ? '處理中...' : '立即詢問報價'}
            className="py-4 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {(product.availableStock ?? product.inventory) <= 0 ? (
              <span className="font-bold text-base md:text-lg">
                {product.inventory > 0 ? '庫存已保留' : '暫時缺貨'}
              </span>
            ) : isRequestingQuote ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span className="font-bold text-base md:text-lg">處理中...</span>
              </div>
            ) : !user ? (
              <span className="font-bold text-base md:text-lg">請先登入</span>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <ShoppingCart className="w-5 h-5" />
                <div className="flex flex-col items-center">
                  <span className="font-bold text-base md:text-lg">立即詢問報價</span>
                  <span className="text-xs opacity-90">
                    總計 NT$ {(product.price * quantity).toLocaleString()}
                    {product.priceUnit && ` (${quantity} ${product.priceUnit})`}
                  </span>
                </div>
              </div>
            )}
          </TailwindGreenButton>
        </div>
      </>
    )
  }
)

ProductModalActions.displayName = 'ProductModalActions'
