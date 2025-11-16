/**
 * 詢問單驗證邏輯
 * 提供輸入資料驗證和業務規則檢查
 */

import { ValidationError } from '@/lib/errors'
import { CreateInquiryRequest } from '@/types/inquiry'

/**
 * 驗證建立詢問單請求
 */
export function validateCreateInquiryRequest(data: CreateInquiryRequest): void {
  // 基本欄位驗證
  if (!data.customer_name?.trim()) {
    throw new ValidationError('客戶姓名不能為空')
  }

  if (!data.customer_email?.trim()) {
    throw new ValidationError('客戶Email不能為空')
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customer_email)) {
    throw new ValidationError('Email格式不正確')
  }

  if (!data.inquiry_type) {
    throw new ValidationError('詢問類型不能為空')
  }

  // 驗證產品詢價特定欄位
  if (data.inquiry_type === 'product') {
    validateProductInquiry(data)
  }

  // 驗證農場參觀特定欄位
  if (data.inquiry_type === 'farm_tour') {
    validateFarmTourInquiry(data)
  }
}

/**
 * 驗證產品詢價請求
 */
function validateProductInquiry(data: CreateInquiryRequest): void {
  if (!data.items || data.items.length === 0) {
    throw new ValidationError('產品詢價必須包含至少一個項目')
  }

  data.items.forEach((item, index) => {
    if (!item.product_id?.trim()) {
      throw new ValidationError(`第 ${index + 1} 項產品ID不能為空`)
    }
    if (!item.product_name?.trim()) {
      throw new ValidationError(`第 ${index + 1} 項產品名稱不能為空`)
    }
    if (!item.quantity || item.quantity <= 0) {
      throw new ValidationError(`第 ${index + 1} 項產品數量必須大於0`)
    }
  })
}

/**
 * 驗證農場參觀詢問請求
 */
function validateFarmTourInquiry(data: CreateInquiryRequest): void {
  if (!data.activity_title?.trim()) {
    throw new ValidationError('活動標題不能為空')
  }
  if (!data.visit_date?.trim()) {
    throw new ValidationError('參觀日期不能為空')
  }
  if (!data.visitor_count?.trim()) {
    throw new ValidationError('參觀人數不能為空')
  }
}

/**
 * 計算產品詢價總金額
 */
export function calculateTotalAmount(data: CreateInquiryRequest): number | null {
  if (data.inquiry_type !== 'product' || !data.items) {
    return null
  }

  const total = data.items.reduce((sum, item) => {
    return sum + (item.unit_price || 0) * item.quantity
  }, 0)

  return total > 0 ? total : null
}
