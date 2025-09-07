import { supabase } from '@/lib/supabase-auth';
import { dbLogger } from '@/lib/logger';

export interface UserInterest {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export class UserInterestsService {
  // 取得使用者的興趣產品 ID 清單
  static async getUserInterests(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_interests')
        .select('product_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        dbLogger.error('Error fetching user interests', undefined, { userId, metadata: { error: (error as Error).message || error } });
        return [];
      }

      return data?.map((item: { product_id: string }) => item.product_id) || [];
    } catch (error) {
      dbLogger.error('Error in getUserInterests', error instanceof Error ? error : undefined, { userId });
      return [];
    }
  }

  // 新增興趣產品
  static async addInterest(userId: string, productId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_interests')
        .insert({
          user_id: userId,
          product_id: productId
        });

      if (error) {
        // 如果是重複插入錯誤，視為成功
        if (error.code === '23505') {
          return true;
        }
        dbLogger.error('Error adding interest', undefined, { userId, metadata: { error: (error as Error).message || error, productId } });
        return false;
      }

      return true;
    } catch (error) {
      dbLogger.error('Error in addInterest', error instanceof Error ? error : undefined, { userId, metadata: { productId } });
      return false;
    }
  }

  // 移除興趣產品
  static async removeInterest(userId: string, productId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) {
        dbLogger.error('Error removing interest', undefined, { userId, metadata: { error: (error as Error).message || error, productId } });
        return false;
      }

      return true;
    } catch (error) {
      dbLogger.error('Error in removeInterest', error instanceof Error ? error : undefined, { userId, metadata: { productId } });
      return false;
    }
  }

  // 批量新增興趣產品
  static async addMultipleInterests(userId: string, productIds: string[]): Promise<boolean> {
    try {
      if (productIds.length === 0) return true;

      const interests = productIds.map(productId => ({
        user_id: userId,
        product_id: productId
      }));

      const { error } = await supabase
        .from('user_interests')
        .upsert(interests, { onConflict: 'user_id,product_id' });

      if (error) {
        dbLogger.error('Error adding multiple interests', undefined, { userId, metadata: { error: (error as Error).message || error, productIdCount: productIds.length } });
        return false;
      }

      return true;
    } catch (error) {
      dbLogger.error('Error in addMultipleInterests', error instanceof Error ? error : undefined, { userId, metadata: { productIdCount: productIds.length } });
      return false;
    }
  }

  // 切換興趣狀態（加入或移除）
  static async toggleInterest(userId: string, productId: string): Promise<boolean> {
    try {
      // 先檢查是否已存在
      const { data: existing } = await supabase
        .from('user_interests')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

      if (existing) {
        // 已存在，移除它
        return await this.removeInterest(userId, productId);
      } else {
        // 不存在，新增它
        return await this.addInterest(userId, productId);
      }
    } catch (error) {
      dbLogger.error('Error in toggleInterest', error instanceof Error ? error : undefined, { userId, metadata: { productId } });
      return false;
    }
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