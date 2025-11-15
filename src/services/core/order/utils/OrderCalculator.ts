/**
 * 訂單計算工具
 * 負責運費、稅金等計算邏輯
 */

import type { OrderItem, ShippingAddress } from '@/types/order'

export class OrderCalculator {
  // 商業規則配置
  private static readonly BASE_SHIPPING_FEE = 60 // 基本運費 60 元
  private static readonly FREE_SHIPPING_THRESHOLD = 1000 // 滿 1000 元免運費
  private static readonly REMOTE_AREA_SURCHARGE = 40 // 偏遠地區加收 40 元
  private static readonly REMOTE_AREAS = ['離島', '山區']

  /**
   * 計算運費
   */
  static calculateShippingFee(items: OrderItem[], address: ShippingAddress): number {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)

    // 滿額免運
    if (subtotal >= this.FREE_SHIPPING_THRESHOLD) {
      return 0
    }

    // 偏遠地區加收運費
    const isRemoteArea = this.REMOTE_AREAS.some(area => address.city.includes(area))

    return isRemoteArea
      ? this.BASE_SHIPPING_FEE + this.REMOTE_AREA_SURCHARGE
      : this.BASE_SHIPPING_FEE
  }

  /**
   * 計算稅費
   * 台灣目前食品類商品免營業稅，這裡預留稅費計算邏輯
   */
  static calculateTax(_subtotal: number): number {
    return 0
  }

  /**
   * 計算訂單總金額
   */
  static calculateTotal(subtotal: number, shippingFee: number, tax: number): number {
    return subtotal + shippingFee + tax
  }

  /**
   * 檢查是否符合免運條件
   */
  static isFreeShipping(subtotal: number): boolean {
    return subtotal >= this.FREE_SHIPPING_THRESHOLD
  }
}
