'use client'

// GA4 追蹤使用範例
// 這個文件展示如何在不同場景下使用 GA4 追蹤功能

import { useGoogleAnalytics } from '@/components/features/analytics/GoogleAnalyticsProvider'
import { productEvents, interactionEvents, conversionEvents } from '@/lib/analytics'
import { Product } from '@/types/product'

// 類型定義
interface FormData {
  name: string
  email: string
  message: string
  [key: string]: unknown
}

interface OrderItem {
  product_id: string
  product_name: string
  category?: string
  quantity: number
  price: number
}

interface OrderData {
  id: string
  total: number
  currency?: string
  items: OrderItem[]
}

export function ProductPageExample() {
  const { trackEvent } = useGoogleAnalytics()

  const handleViewProduct = (product: Product) => {
    // 追蹤產品瀏覽事件
    productEvents.viewProduct({
      product_id: product.id,
      product_name: product.name,
      category: product.category || '農產品',
      price: product.price,
      currency: 'TWD',
    })
  }

  const handleAddToCart = (product: Product, quantity: number) => {
    // 追蹤加入購物車事件
    productEvents.addToCart({
      product_id: product.id,
      product_name: product.name,
      category: product.category || '農產品',
      price: product.price,
      quantity: quantity,
      currency: 'TWD',
    })
  }

  return (
    <div>
      {/* 產品頁面組件範例 */}
      <p className="text-sm text-gray-600">
        💡 在產品頁面使用：
        <br />• 瀏覽產品時調用 <code>handleViewProduct()</code>
        <br />• 加入購物車時調用 <code>handleAddToCart()</code>
      </p>
    </div>
  )
}

export function ContactFormExample() {
  const { trackEvent } = useGoogleAnalytics()

  const handleFormSubmit = (formData: FormData) => {
    // 追蹤表單提交事件
    interactionEvents.contactUs(
      'form',
      JSON.stringify({
        name: formData.name ? 'provided' : 'not_provided',
        message_length: formData.message?.length || 0,
      })
    )
  }

  const handlePhoneClick = () => {
    // 追蹤電話點擊事件
    interactionEvents.contactUs('phone', '豪德農場電話')
  }

  return (
    <div>
      <p className="text-sm text-gray-600">
        💡 在聯繫頁面使用：
        <br />• 表單提交時調用 <code>handleFormSubmit()</code>
        <br />• 點擊電話時調用 <code>handlePhoneClick()</code>
      </p>
    </div>
  )
}

export function PurchaseExample() {
  const handlePurchaseComplete = (orderData: OrderData) => {
    // 追蹤購買完成事件
    productEvents.purchase({
      transaction_id: orderData.id,
      value: orderData.total,
      items: orderData.items.map((item: OrderItem) => ({
        item_id: item.product_id,
        item_name: item.product_name,
        category: item.category || '農產品',
        price: item.price,
        quantity: item.quantity,
      })),
      currency: 'TWD',
    })
  }

  return (
    <div>
      <p className="text-sm text-gray-600">
        💡 在購買完成頁面使用：
        <br />• 訂單完成時調用 <code>handlePurchaseComplete()</code>
      </p>
    </div>
  )
}

export function NewsletterExample() {
  const handleNewsletterSignup = (email: string) => {
    // 追蹤電子報訂閱事件
    conversionEvents.subscribe(email)
  }

  return (
    <div>
      <p className="text-sm text-gray-600">
        💡 在電子報註冊時使用：
        <br />• 訂閱成功時調用 <code>handleNewsletterSignup()</code>
      </p>
    </div>
  )
}

export function SearchExample() {
  const handleSearch = (searchTerm: string, resultsCount: number) => {
    // 追蹤搜尋事件
    interactionEvents.search(searchTerm, resultsCount)
  }

  return (
    <div>
      <p className="text-sm text-gray-600">
        💡 在搜尋功能中使用：
        <br />• 搜尋提交時調用 <code>handleSearch()</code>
      </p>
    </div>
  )
}

export function SocialShareExample() {
  const handleShare = (
    platform: 'facebook' | 'line' | 'email' | 'copy_link',
    contentType: string,
    contentId?: string
  ) => {
    // 追蹤分享事件
    conversionEvents.share(platform, contentType, contentId)
  }

  return (
    <div>
      <p className="text-sm text-gray-600">
        💡 在社群分享時使用：
        <br />• 分享按鈕點擊時調用 <code>handleShare()</code>
      </p>
    </div>
  )
}

// 整合範例組件
export function GA4TrackingExamples() {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-4">🔧 GA4 追蹤使用範例</h3>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-gray-800 mb-2">產品相關追蹤</h4>
          <ProductPageExample />
        </div>

        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-gray-800 mb-2">聯繫表單追蹤</h4>
          <ContactFormExample />
        </div>

        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-gray-800 mb-2">購買追蹤</h4>
          <PurchaseExample />
        </div>

        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-gray-800 mb-2">電子報追蹤</h4>
          <NewsletterExample />
        </div>

        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-gray-800 mb-2">搜尋追蹤</h4>
          <SearchExample />
        </div>

        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-gray-800 mb-2">社群分享追蹤</h4>
          <SocialShareExample />
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800 text-sm">
          <strong>💡 實作提醒：</strong>
          <br />• 將這些追蹤函數加入到相應的組件中
          <br />• 確保在用戶執行動作時調用對應的追蹤函數
          <br />• 在開發環境中可以在控制台看到追蹤日誌
        </p>
      </div>
    </div>
  )
}
