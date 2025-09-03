/**
 * 使用者興趣服務適配器
 * 
 * 目的：
 * - 提供向後相容的靜態方法介面
 * - 將舊的 UserInterestsService 調用轉換為新的 v2 架構
 * - 零中斷升級，不需修改現有 API 路由
 * 
 * 使用方式：
 * - 將現有的 UserInterestsService 匯入替換為此適配器
 * - 所有原有的靜態方法調用保持不變
 */

import { userInterestsServiceV2Simple } from './v2/userInterestsServiceSimple'
import type { UserInterest } from './userInterestsService'

/**
 * 使用者興趣服務適配器類別
 * 維持與原始 UserInterestsService 相同的靜態方法介面
 */
export class UserInterestsServiceAdapter {
  // 取得使用者的興趣產品 ID 清單
  static async getUserInterests(userId: string): Promise<string[]> {
    return userInterestsServiceV2Simple.getUserInterests(userId)
  }

  // 新增興趣產品
  static async addInterest(userId: string, productId: string): Promise<boolean> {
    return userInterestsServiceV2Simple.addInterest(userId, productId)
  }

  // 移除興趣產品
  static async removeInterest(userId: string, productId: string): Promise<boolean> {
    return userInterestsServiceV2Simple.removeInterest(userId, productId)
  }

  // 批量新增興趣產品
  static async addMultipleInterests(userId: string, productIds: string[]): Promise<boolean> {
    return userInterestsServiceV2Simple.addMultipleInterests(userId, productIds)
  }

  // 切換興趣狀態（加入或移除）
  static async toggleInterest(userId: string, productId: string): Promise<boolean> {
    return userInterestsServiceV2Simple.toggleInterest(userId, productId)
  }

  // 同步本地興趣清單到雲端（登入時使用）
  static async syncLocalInterests(userId: string, localInterests: string[]): Promise<string[]> {
    return userInterestsServiceV2Simple.syncLocalInterests(userId, localInterests)
  }

  // 清除本地儲存的興趣清單
  static clearLocalInterests(): void {
    return userInterestsServiceV2Simple.clearLocalInterests()
  }

  // 取得本地儲存的興趣清單
  static getLocalInterests(): string[] {
    return userInterestsServiceV2Simple.getLocalInterests()
  }

  // 設定本地儲存的興趣清單
  static setLocalInterests(interests: string[]): void {
    return userInterestsServiceV2Simple.setLocalInterests(interests)
  }

  // === 額外的 v2 功能（可選） ===

  /**
   * 取得服務健康狀態
   * 這是新的 v2 功能，不影響現有程式碼的相容性
   */
  static async getHealthStatus() {
    return userInterestsServiceV2Simple.getHealthStatus()
  }

  /**
   * 取得 v2 服務實例
   * 如果需要直接使用 v2 功能，可以透過此方法取得
   */
  static getV2Instance() {
    return userInterestsServiceV2Simple
  }
}

// 匯出適配器作為預設的服務介面
export { UserInterestsServiceAdapter as UserInterestsService }

// 同時匯出原始介面類型以保持相容性
export type { UserInterest }