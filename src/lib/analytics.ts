// Google Analytics 4 整合工具函數
// 為豪德農場量身定制的分析追蹤功能

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
  }
}

// 檢查 GA4 是否已載入
function isGALoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

// 獲取 GA 測量 ID
function getGAId(): string | null {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null
}

// 安全的 gtag 呼叫
function safeGtag(...args: unknown[]): void {
  if (isGALoaded()) {
    try {
      window.gtag(...args)
    } catch (error) {
      console.warn('GA tracking error:', error)
    }
  }
}

// 基礎事件追蹤
export function trackEvent(eventName: string, parameters: Record<string, unknown> = {}): void {
  const gaId = getGAId()
  if (!gaId || gaId === 'G-PLACEHOLDER') return

  safeGtag('event', eventName, {
    ...parameters,
    // 自動加入時間戳和頁面資訊
    timestamp: new Date().getTime(),
    page_location: window.location.href,
    page_title: document.title,
  })

  // 同時也記錄到我們的 JSON 系統（作為備份）
  console.log(`📊 GA4 Event: ${eventName}`, parameters)
}

// 頁面瀏覽追蹤（通常由 GoogleAnalytics 組件自動處理）
export function trackPageView(path: string, title?: string): void {
  const gaId = getGAId()
  if (!gaId || gaId === 'G-PLACEHOLDER') return

  safeGtag('config', gaId, {
    page_title: title || document.title,
    page_location: window.location.href,
  })

  console.log(`📄 GA4 Page View: ${path}`, { title })
}

// 產品相關事件追蹤
export const productEvents = {
  // 瀏覽產品
  viewProduct: (product: {
    product_id: string
    product_name: string
    category: string
    price: number
    currency?: string
  }) => {
    trackEvent('view_item', {
      currency: product.currency || 'TWD',
      value: product.price,
      items: [{
        item_id: product.product_id,
        item_name: product.product_name,
        category: product.category,
        price: product.price,
        quantity: 1,
      }]
    })
  },

  // 加入購物車
  addToCart: (product: {
    product_id: string
    product_name: string
    category: string
    price: number
    quantity: number
    currency?: string
  }) => {
    trackEvent('add_to_cart', {
      currency: product.currency || 'TWD',
      value: product.price * product.quantity,
      items: [{
        item_id: product.product_id,
        item_name: product.product_name,
        category: product.category,
        price: product.price,
        quantity: product.quantity,
      }]
    })
  },

  // 購買完成
  purchase: (order: {
    transaction_id: string
    value: number
    items: Array<{
      item_id: string
      item_name: string
      category: string
      price: number
      quantity: number
    }>
    currency?: string
  }) => {
    trackEvent('purchase', {
      transaction_id: order.transaction_id,
      currency: order.currency || 'TWD',
      value: order.value,
      items: order.items
    })
  }
}

// 用戶互動事件追蹤
export const interactionEvents = {
  // 聯繫我們
  contactUs: (method: 'phone' | 'email' | 'form', details?: string) => {
    trackEvent('contact', {
      method,
      contact_details: details,
      category: 'engagement'
    })
  },

  // 下載檔案
  downloadFile: (fileName: string, fileType: string) => {
    trackEvent('file_download', {
      file_name: fileName,
      file_extension: fileType,
      category: 'engagement'
    })
  },

  // 搜尋功能
  search: (searchTerm: string, resultsCount?: number) => {
    trackEvent('search', {
      search_term: searchTerm,
      search_results_count: resultsCount,
      category: 'site_search'
    })
  },

  // 影片播放
  videoPlay: (videoTitle: string, videoDuration?: number) => {
    trackEvent('video_play', {
      video_title: videoTitle,
      video_duration: videoDuration,
      category: 'media'
    })
  },

  // 農場導覽預約
  bookTour: (tourType: string, tourDate: string) => {
    trackEvent('book_tour', {
      tour_type: tourType,
      tour_date: tourDate,
      category: 'conversion'
    })
  }
}

// 錯誤追蹤
export function trackError(error: Error, context?: string): void {
  trackEvent('exception', {
    description: error.message,
    fatal: false,
    context: context,
    stack: error.stack?.substring(0, 500), // 限制堆疊長度
    category: 'error'
  })
}

// 效能追蹤
export const performanceEvents = {
  // 頁面載入時間
  pageLoadTime: (loadTime: number, pagePath: string) => {
    trackEvent('timing_complete', {
      name: 'page_load',
      value: Math.round(loadTime),
      event_category: 'Performance',
      event_label: pagePath
    })
  },

  // 首次內容繪製時間
  firstContentfulPaint: (fcp: number) => {
    trackEvent('timing_complete', {
      name: 'first_contentful_paint',
      value: Math.round(fcp),
      event_category: 'Performance'
    })
  }
}

// 自定義轉換事件
export const conversionEvents = {
  // 註冊用戶
  signUp: (method: 'email' | 'phone', userId?: string) => {
    trackEvent('sign_up', {
      method,
      user_id: userId,
      category: 'conversion'
    })
  },

  // 訂閱電子報
  subscribe: (email: string) => {
    trackEvent('newsletter_subscribe', {
      email_domain: email.split('@')[1],
      category: 'conversion'
    })
  },

  // 分享內容
  share: (method: 'facebook' | 'line' | 'email' | 'copy_link', contentType: string, contentId?: string) => {
    trackEvent('share', {
      method,
      content_type: contentType,
      content_id: contentId,
      category: 'engagement'
    })
  }
}

// GA4 初始化狀態檢查
export function checkGAStatus(): {
  isLoaded: boolean
  hasValidId: boolean
  measurementId: string | null
} {
  const measurementId = getGAId()
  return {
    isLoaded: isGALoaded(),
    hasValidId: measurementId !== null && measurementId !== 'G-PLACEHOLDER',
    measurementId
  }
}

// 開發環境的追蹤狀態顯示
export function logGAStatus(): void {
  if (process.env.NODE_ENV === 'development') {
    const status = checkGAStatus()
    console.log('🔍 GA4 Status:', status)
    
    if (!status.hasValidId) {
      console.warn('⚠️ GA4: 請在 .env.local 中設定有效的 NEXT_PUBLIC_GA_MEASUREMENT_ID')
    } else if (!status.isLoaded) {
      console.warn('⚠️ GA4: Google Analytics 腳本尚未載入')
    } else {
      console.log('✅ GA4: Google Analytics 已準備就緒')
    }
  }
}