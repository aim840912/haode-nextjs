/**
 * Supabase 詢價服務實作
 * 實作詢價服務介面，使用 Supabase 作為資料儲存後端
 */

import { supabase } from '@/lib/supabase-auth';
import { 
  InquiryService,
  InquiryWithItems,
  CreateInquiryRequest,
  UpdateInquiryRequest,
  InquiryQueryParams,
  InquiryStats,
  InquiryStatus,
  Inquiry,
  InquiryItem
} from '@/types/inquiry';

export class SupabaseInquiryService implements InquiryService {
  
  // 使用者端方法
  async createInquiry(userId: string, data: CreateInquiryRequest): Promise<InquiryWithItems> {
    try {
      // 計算預估總金額
      const totalEstimatedAmount = data.items.reduce((total, item) => {
        return total + (item.unit_price || 0) * item.quantity;
      }, 0);

      // 建立詢價單主記錄
      const inquiryData = {
        user_id: userId,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        notes: data.notes,
        delivery_address: data.delivery_address,
        preferred_delivery_date: data.preferred_delivery_date,
        total_estimated_amount: totalEstimatedAmount > 0 ? totalEstimatedAmount : null,
        status: 'pending' as InquiryStatus
      };

      const { data: inquiry, error: inquiryError } = await supabase
        .from('inquiries')
        .insert(inquiryData)
        .select()
        .single();

      if (inquiryError) {
        throw new Error(`建立詢價單失敗: ${inquiryError.message}`);
      }

      // 建立詢價項目記錄
      const itemsData = data.items.map(item => ({
        inquiry_id: inquiry.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_category: item.product_category,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price ? item.unit_price * item.quantity : null,
        notes: item.notes
      }));

      const { data: inquiryItems, error: itemsError } = await supabase
        .from('inquiry_items')
        .insert(itemsData)
        .select();

      if (itemsError) {
        // 如果項目建立失敗，清除已建立的詢價單
        await supabase.from('inquiries').delete().eq('id', inquiry.id);
        throw new Error(`建立詢價項目失敗: ${itemsError.message}`);
      }

      return {
        ...inquiry,
        inquiry_items: inquiryItems || []
      } as InquiryWithItems;

    } catch (error) {
      console.error('Error creating inquiry:', error);
      throw error instanceof Error ? error : new Error('建立詢價單時發生未知錯誤');
    }
  }

  async getUserInquiries(userId: string, params?: InquiryQueryParams): Promise<InquiryWithItems[]> {
    try {
      let query = supabase
        .from('inquiries')
        .select(`
          *,
          inquiry_items (*)
        `)
        .eq('user_id', userId);

      // 應用查詢參數
      if (params?.status) {
        query = query.eq('status', params.status);
      }

      if (params?.start_date) {
        query = query.gte('created_at', params.start_date);
      }

      if (params?.end_date) {
        query = query.lte('created_at', params.end_date);
      }

      // 排序
      const sortBy = params?.sort_by || 'created_at';
      const sortOrder = params?.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // 分頁
      if (params?.limit) {
        query = query.limit(params.limit);
      }
      
      if (params?.offset) {
        query = query.range(params.offset, (params.offset + (params.limit || 10)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`取得詢價單清單失敗: ${error.message}`);
      }

      return data as InquiryWithItems[];

    } catch (error) {
      console.error('Error fetching user inquiries:', error);
      throw error instanceof Error ? error : new Error('取得詢價單清單時發生未知錯誤');
    }
  }

  async getInquiryById(userId: string, inquiryId: string): Promise<InquiryWithItems | null> {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          *,
          inquiry_items (*)
        `)
        .eq('id', inquiryId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // 找不到記錄
        }
        throw new Error(`取得詢價單詳情失敗: ${error.message}`);
      }

      return data as InquiryWithItems;

    } catch (error) {
      console.error('Error fetching inquiry by ID:', error);
      throw error instanceof Error ? error : new Error('取得詢價單詳情時發生未知錯誤');
    }
  }

  async updateInquiry(userId: string, inquiryId: string, data: UpdateInquiryRequest): Promise<InquiryWithItems> {
    try {
      // 確認使用者擁有此詢價單
      const existingInquiry = await this.getInquiryById(userId, inquiryId);
      if (!existingInquiry) {
        throw new Error('找不到詢價單或無權限修改');
      }

      // 更新詢價單
      const { data: updatedInquiry, error } = await supabase
        .from('inquiries')
        .update(data)
        .eq('id', inquiryId)
        .eq('user_id', userId)
        .select(`
          *,
          inquiry_items (*)
        `)
        .single();

      if (error) {
        throw new Error(`更新詢價單失敗: ${error.message}`);
      }

      return updatedInquiry as InquiryWithItems;

    } catch (error) {
      console.error('Error updating inquiry:', error);
      throw error instanceof Error ? error : new Error('更新詢價單時發生未知錯誤');
    }
  }

  // 管理員端方法
  async getAllInquiries(params?: InquiryQueryParams): Promise<InquiryWithItems[]> {
    try {
      let query = supabase
        .from('inquiries')
        .select(`
          *,
          inquiry_items (*)
        `);

      // 應用查詢參數
      if (params?.status) {
        query = query.eq('status', params.status);
      }

      if (params?.customer_email) {
        query = query.ilike('customer_email', `%${params.customer_email}%`);
      }

      if (params?.start_date) {
        query = query.gte('created_at', params.start_date);
      }

      if (params?.end_date) {
        query = query.lte('created_at', params.end_date);
      }

      // 排序
      const sortBy = params?.sort_by || 'created_at';
      const sortOrder = params?.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // 分頁
      if (params?.limit) {
        query = query.limit(params.limit);
      }
      
      if (params?.offset) {
        query = query.range(params.offset, (params.offset + (params.limit || 10)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`取得所有詢價單失敗: ${error.message}`);
      }

      return data as InquiryWithItems[];

    } catch (error) {
      console.error('Error fetching all inquiries:', error);
      throw error instanceof Error ? error : new Error('取得所有詢價單時發生未知錯誤');
    }
  }

  async updateInquiryStatus(inquiryId: string, status: InquiryStatus): Promise<InquiryWithItems> {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .update({ status })
        .eq('id', inquiryId)
        .select(`
          *,
          inquiry_items (*)
        `)
        .single();

      if (error) {
        throw new Error(`更新詢價單狀態失敗: ${error.message}`);
      }

      return data as InquiryWithItems;

    } catch (error) {
      console.error('Error updating inquiry status:', error);
      throw error instanceof Error ? error : new Error('更新詢價單狀態時發生未知錯誤');
    }
  }

  async getInquiryStats(): Promise<InquiryStats[]> {
    try {
      const { data, error } = await supabase
        .from('inquiry_stats')
        .select('*');

      if (error) {
        throw new Error(`取得詢價統計失敗: ${error.message}`);
      }

      return data as InquiryStats[];

    } catch (error) {
      console.error('Error fetching inquiry stats:', error);
      throw error instanceof Error ? error : new Error('取得詢價統計時發生未知錯誤');
    }
  }

  async deleteInquiry(inquiryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('inquiries')
        .delete()
        .eq('id', inquiryId);

      if (error) {
        throw new Error(`刪除詢價單失敗: ${error.message}`);
      }

    } catch (error) {
      console.error('Error deleting inquiry:', error);
      throw error instanceof Error ? error : new Error('刪除詢價單時發生未知錯誤');
    }
  }

  // 額外的工具方法
  async getInquiryByIdForAdmin(inquiryId: string): Promise<InquiryWithItems | null> {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          *,
          inquiry_items (*)
        `)
        .eq('id', inquiryId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // 找不到記錄
        }
        throw new Error(`取得詢價單詳情失敗: ${error.message}`);
      }

      return data as InquiryWithItems;

    } catch (error) {
      console.error('Error fetching inquiry by ID for admin:', error);
      throw error instanceof Error ? error : new Error('取得詢價單詳情時發生未知錯誤');
    }
  }

  async updateInquiryItems(inquiryId: string, items: InquiryItem[]): Promise<void> {
    try {
      // 先刪除舊的項目
      await supabase
        .from('inquiry_items')
        .delete()
        .eq('inquiry_id', inquiryId);

      // 新增新的項目
      if (items.length > 0) {
        const { error } = await supabase
          .from('inquiry_items')
          .insert(items.map(item => ({ ...item, inquiry_id: inquiryId })));

        if (error) {
          throw new Error(`更新詢價項目失敗: ${error.message}`);
        }
      }

    } catch (error) {
      console.error('Error updating inquiry items:', error);
      throw error instanceof Error ? error : new Error('更新詢價項目時發生未知錯誤');
    }
  }
}

// 建立並匯出單例實例
export const supabaseInquiryService = new SupabaseInquiryService();