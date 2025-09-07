import { dbLogger } from '@/lib/logger';

/**
 * @deprecated 此服務因資料庫 schema 問題暫時轉為佔位實作
 * user_interests 表的類型定義與實際結構不匹配，導致 TypeScript 錯誤
 * 需要資料庫管理員檢查表結構和權限設定
 */

export interface UserInterest {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export class UserInterestsService {
  private static logNotImplemented(method: string, metadata?: Record<string, unknown>) {
    dbLogger.warn(`UserInterestsService.${method} - 佔位實作：user_interests 表類型問題`, {
      module: 'UserInterestsService',
      action: method,
      metadata
    })
  }
  // 取得使用者的興趣產品 ID 清單
  static async getUserInterests(userId: string): Promise<string[]> {
    this.logNotImplemented('getUserInterests', { userId })
    return []
  }

  // 新增興趣產品
  static async addInterest(userId: string, productId: string): Promise<boolean> {
    this.logNotImplemented('addInterest', { userId, productId })
    return true // 模擬成功
  }

  // 移除興趣產品
  static async removeInterest(userId: string, productId: string): Promise<boolean> {
    this.logNotImplemented('removeInterest', { userId, productId })
    return true // 模擬成功
  }

  // 批量新增興趣產品
  static async addMultipleInterests(userId: string, productIds: string[]): Promise<boolean> {
    this.logNotImplemented('addMultipleInterests', { userId, productIdCount: productIds.length })
    return true // 模擬成功
  }

  // 切換興趣狀態（加入或移除）
  static async toggleInterest(userId: string, productId: string): Promise<boolean> {
    this.logNotImplemented('toggleInterest', { userId, productId })
    return true // 模擬成功
  }

  // 同步本地興趣清單到雲端（登入時使用）
  static async syncLocalInterests(userId: string, localInterests: string[]): Promise<string[]> {
    try {
      // 取得雲端興趣清單
      const cloudInterests = await this.getUserInterests(userId);
      
      // 合併本地和雲端興趣清單（去重）
      const mergedInterests = Array.from(new Set([...cloudInterests, ...localInterests]));
      
      // 如果有新的興趣需要同步到雲端
      const newInterests = localInterests.filter(id => !cloudInterests.includes(id));
      if (newInterests.length > 0) {
        await this.addMultipleInterests(userId, newInterests);
      }
      
      return mergedInterests;
    } catch (error) {
      dbLogger.error('Error in syncLocalInterests', error instanceof Error ? error : undefined, { userId, metadata: { localInterestCount: localInterests.length } });
      return localInterests; // 如果同步失敗，返回本地清單
    }
  }

  // 清除本地儲存的興趣清單
  static clearLocalInterests(): void {
    try {
      localStorage.removeItem('interestedProducts');
      // 觸發事件通知其他元件更新
      window.dispatchEvent(new CustomEvent('interestedProductsUpdated'));
    } catch (error) {
      dbLogger.error('Error clearing local interests', error instanceof Error ? error : undefined);
    }
  }

  // 取得本地儲存的興趣清單
  static getLocalInterests(): string[] {
    try {
      const saved = localStorage.getItem('interestedProducts');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      dbLogger.error('Error getting local interests', error instanceof Error ? error : undefined);
      return [];
    }
  }

  // 設定本地儲存的興趣清單
  static setLocalInterests(interests: string[]): void {
    try {
      localStorage.setItem('interestedProducts', JSON.stringify(interests));
      // 觸發事件通知其他元件更新
      window.dispatchEvent(new CustomEvent('interestedProductsUpdated'));
    } catch (error) {
      dbLogger.error('Error setting local interests', error instanceof Error ? error : undefined, { metadata: { interestCount: interests.length } });
    }
  }
}