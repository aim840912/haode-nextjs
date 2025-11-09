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
export { orderService, OrderService } from '../core/order/orderService'

// 詢價單相關服務
export { inquiryTemplateService } from '../core/inquiry/inquiryTemplateService'

// 內容相關服務
export { farmTourService } from '../core/content/farmTourService'
export { scheduleServiceSimple } from '../core/content/scheduleServiceSimple'
export { locationServiceSimple } from '../core/content/locationServiceSimple'
export { siteSettingsService } from '../core/content/siteSettingsService'

// 使用者相關服務
export { userInterestsService } from '../core/user/userInterestsService'

/**
 * 取得產品服務實例
 * @deprecated 直接使用 productService 即可
 */
export async function getProductService() {
  const { productService } = await import('../core/product/productService')
  return productService
}

/**
 * 取得排程服務實例
 * @deprecated 直接使用 scheduleService 即可
 */
export async function getScheduleService() {
  const { scheduleServiceSimple } = await import('../core/content/scheduleServiceSimple')
  return scheduleServiceSimple
}

/**
 * 取得農場導覽服務實例
 * @deprecated 直接使用 farmTourService 即可
 */
export async function getFarmTourService() {
  const { farmTourService } = await import('../core/content/farmTourService')
  return farmTourService
}

/**
 * 取得地點服務實例
 * @deprecated 直接使用 locationService 即可
 */
export async function getLocationService() {
  const { locationServiceSimple } = await import('../core/content/locationServiceSimple')
  return locationServiceSimple
}

/**
 * 取得使用者興趣服務實例
 * @deprecated 直接使用 userInterestsService 即可
 */
export async function getUserInterestsService() {
  const { userInterestsService } = await import('../core/user/userInterestsService')
  return userInterestsService
}
