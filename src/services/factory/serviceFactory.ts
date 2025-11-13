/**
 * 服務工廠 - 簡化版
 *
 * 統一導出所有核心服務
 * 移除複雜的動態選擇和連線池邏輯，採用靜態導出
 */

// 產品相關服務
export { productService } from '../core/product/productService'
export type { ProductService } from '@/types/product'

// 訂單相關服務
export { orderQueryService } from '../core/order/OrderQueryService'
export { orderCommandService } from '../core/order/OrderCommandService'

// 詢價單相關服務
export { inquiryQueryService } from '../core/inquiry/InquiryQueryService'
export { inquiryCommandService } from '../core/inquiry/InquiryCommandService'
export { inquiryTemplateService } from '../core/inquiry/inquiryTemplateService'

// 內容相關服務
export { farmTourService } from '../core/content/farmTourService'
export { scheduleServiceSimple } from '../core/content/scheduleServiceSimple'
export { locationServiceSimple } from '../core/content/locationServiceSimple'
export { siteSettingsService } from '../core/content/siteSettingsService'

// 使用者相關服務
export { userInterestsService } from '../core/user/userInterestsService'
