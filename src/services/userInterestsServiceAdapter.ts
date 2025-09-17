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

import { UserInterestsApiService } from './userInterestsApiService'
import type { UserInterest } from './userInterestsService'

/**
 * 使用者興趣服務適配器類別
 * 維持與原始 UserInterestsService 相同的靜態方法介面
 */
export class UserInterestsServiceAdapter {
  // 取得使用者的興趣產品 ID 清單
  static async getUserInterests(userId: string): Promise<string[]> {
    return UserInterestsApiService.getUserInterests()
  }

  // 新增興趣產品
  static async addInterest(userId: string, productId: string): Promise<boolean> {
    return UserInterestsApiService.addInterest(productId)
  }

  // 移除興趣產品
  static async removeInterest(userId: string, productId: string): Promise<boolean> {
    return UserInterestsApiService.removeInterest(productId)
  }

  // 批量新增興趣產品
  static async addMultipleInterests(userId: string, productIds: string[]): Promise<boolean> {
    return UserInterestsApiService.addMultipleInterests(productIds)
  }

  // 切換興趣狀態（加入或移除）
  static async toggleInterest(userId: string, productId: string): Promise<boolean> {
    const result = await UserInterestsApiService.toggleInterest(productId)
    return result.success
  }

  // 同步本地興趣清單到雲端（登入時使用）
  static async syncLocalInterests(userId: string, localInterests: string[]): Promise<string[]> {
    return UserInterestsApiService.syncLocalInterests()
  }

  // 清除本地儲存的興趣清單
  static clearLocalInterests(): void {
    return UserInterestsApiService.clearLocalInterests()
  }

  // 取得本地儲存的興趣清單
  static getLocalInterests(): string[] {
    return UserInterestsApiService.getLocalInterests()
  }

  // 設定本地儲存的興趣清單
  static setLocalInterests(interests: string[]): void {
    return UserInterestsApiService.setLocalInterests(interests)
  }

  // === 額外的 v2 功能（可選） ===

  /**
   * 取得服務健康狀態
   * API 服務健康狀態檢查
   */
  static async getHealthStatus() {
    try {
      // 嘗試獲取興趣清單來檢查服務狀態
      await UserInterestsApiService.getUserInterests()
      return {
        status: 'healthy',
        version: 'api-client',
        details: {
          service: 'UserInterestsApiService',
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        version: 'api-client',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      }
    }
  }

  /**
   * 取得 API 服務實例
   * 如果需要直接使用 API 功能，可以透過此方法取得
   */
  static getApiInstance() {
    return UserInterestsApiService
  }
}

// 匯出適配器作為預設的服務介面
export { UserInterestsServiceAdapter as UserInterestsService }

// 同時匯出原始介面類型以保持相容性
export type { UserInterest }
