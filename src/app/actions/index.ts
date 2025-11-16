/**
 * Server Actions 統一導出
 *
 * 提供所有 Server Actions 的統一入口
 */

// 用戶興趣相關 Actions
export { toggleInterestAction, syncInterestsAction } from './user-interests'

// 詢價單相關 Actions
export {
  createInquiryAction,
  createGuestInquiryAction,
  updateInquiryStatusAction,
  deleteInquiryAction,
} from './inquiries'

// 訂單相關 Actions
export { createOrderAction, cancelOrderAction } from './orders'
