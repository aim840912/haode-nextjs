/**
 * Supabase 詢價服務實作
 * 實作詢價服務介面，使用 Supabase 作為資料儲存後端
 */

import { createServiceSupabaseClient } from '@/lib/supabase-server';
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
  
  // 輔助函數：從 notes 解析農場參觀資料
  private parseFarmTourDataFromNotes(inquiry: any): any {
    if (!inquiry.notes || !inquiry.notes.startsWith('FARM_TOUR_DATA:')) {
      return inquiry;
    }
    
    try {
      const jsonData = inquiry.notes.substring('FARM_TOUR_DATA:'.length);
      const farmTourData = JSON.parse(jsonData);
      
      return {
        ...inquiry,
        inquiry_type: 'farm_tour',
        activity_title: farmTourData.activity_title,
        visit_date: farmTourData.visit_date,
        visitor_count: farmTourData.visitor_count,
        notes: farmTourData.original_notes
      };
    } catch (error) {
      console.warn('Failed to parse farm tour data from notes:', error);
      return inquiry;
    }
  }
  
  // 使用者端方法
  async createInquiry(userId: string, data: CreateInquiryRequest): Promise<InquiryWithItems> {
    try {
      console.log('🔍 SupabaseInquiryService.createInquiry 開始執行:', {
        userId,
        customerName: data.customer_name,
        itemsCount: data.items?.length || 0
      });

      // 計算預估總金額（只有產品詢價才計算）
      const totalEstimatedAmount = data.inquiry_type === 'product' && data.items 
        ? data.items.reduce((total, item) => {
            return total + (item.unit_price || 0) * item.quantity;
          }, 0)
        : null;

      console.log('💰 計算的總金額:', totalEstimatedAmount);

      // 建立詢問單主記錄 - 暫時將農場參觀資料存在 notes 中
      let notesWithFarmTourData = data.notes || '';
      
      // 如果是農場參觀詢問，將相關資料序列化到 notes
      if (data.inquiry_type === 'farm_tour') {
        const farmTourData = {
          activity_title: data.activity_title,
          visit_date: data.visit_date,
          visitor_count: data.visitor_count,
          original_notes: data.notes || ''
        };
        notesWithFarmTourData = `FARM_TOUR_DATA:${JSON.stringify(farmTourData)}`;
      }
      const inquiryData = {
        user_id: userId,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        notes: notesWithFarmTourData,
        delivery_address: data.delivery_address,
        preferred_delivery_date: data.preferred_delivery_date,
        total_estimated_amount: totalEstimatedAmount && totalEstimatedAmount > 0 ? totalEstimatedAmount : null,
        status: 'pending' as InquiryStatus
      };

      const { data: inquiry, error: inquiryError } = await createServiceSupabaseClient()
        .from('inquiries')
        .insert(inquiryData)
        .select()
        .single();

      if (inquiryError) {
        console.error('❌ Supabase 詢價單插入失敗:', {
          message: inquiryError.message,
          code: inquiryError.code,
          details: inquiryError.details,
          hint: inquiryError.hint,
          data: inquiryData
        });
        throw new Error(`建立詢價單失敗: ${inquiryError.message} (code: ${inquiryError.code})`);
      }

      // 建立庫存查詢項目記錄（只有產品詢價才需要）
      let inquiryItems: any[] = [];
      
      if (data.inquiry_type === 'product' && data.items && data.items.length > 0) {
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

        const { data: items, error: itemsError } = await createServiceSupabaseClient()
          .from('inquiry_items')
          .insert(itemsData)
          .select();

        if (itemsError) {
          console.error('❌ Supabase 庫存查詢項目插入失敗:', {
            message: itemsError.message,
            code: itemsError.code,
            details: itemsError.details,
            hint: itemsError.hint,
            data: itemsData
          });
          // 如果項目建立失敗，清除已建立的庫存查詢單
          await createServiceSupabaseClient().from('inquiries').delete().eq('id', inquiry.id);
          throw new Error(`建立庫存查詢項目失敗: ${itemsError.message} (code: ${itemsError.code})`);
        }

        inquiryItems = items || [];
      }

      // 解析農場參觀資料並返回
      const parsedInquiry = this.parseFarmTourDataFromNotes(inquiry);
      
      return {
        ...parsedInquiry,
        inquiry_items: inquiryItems
      } as InquiryWithItems;

    } catch (error) {
      console.error('Error creating inquiry:', error);
      throw error instanceof Error ? error : new Error('建立詢價單時發生未知錯誤');
    }
  }

  async getUserInquiries(userId: string, params?: InquiryQueryParams): Promise<InquiryWithItems[]> {
    try {
      let query = createServiceSupabaseClient()
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

      // 讀取/回覆狀態篩選
      if (params?.is_read !== undefined) {
        query = query.eq('is_read', params.is_read);
      }

      if (params?.is_replied !== undefined) {
        query = query.eq('is_replied', params.is_replied);
      }

      if (params?.unread_only) {
        query = query.eq('is_read', false);
      }

      if (params?.unreplied_only) {
        query = query.eq('is_replied', false);
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

      // 解析所有詢問單的農場參觀資料
      const parsedData = (data || []).map((inquiry: any) => this.parseFarmTourDataFromNotes(inquiry));
      
      return parsedData as InquiryWithItems[];

    } catch (error) {
      console.error('Error fetching user inquiries:', error);
      throw error instanceof Error ? error : new Error('取得詢價單清單時發生未知錯誤');
    }
  }

  async getInquiryById(userId: string, inquiryId: string): Promise<InquiryWithItems | null> {
    try {
      const { data, error } = await createServiceSupabaseClient()
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

      // 解析農場參觀資料
      const parsedData = this.parseFarmTourDataFromNotes(data);
      
      return parsedData as InquiryWithItems;

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
      const { data: updatedInquiry, error } = await createServiceSupabaseClient()
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
      let query = createServiceSupabaseClient()
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

      // 讀取/回覆狀態篩選
      if (params?.is_read !== undefined) {
        query = query.eq('is_read', params.is_read);
      }

      if (params?.is_replied !== undefined) {
        query = query.eq('is_replied', params.is_replied);
      }

      if (params?.unread_only) {
        query = query.eq('is_read', false);
      }

      if (params?.unreplied_only) {
        query = query.eq('is_replied', false);
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

      // 解析所有詢問單的農場參觀資料
      const parsedData = (data || []).map((inquiry: any) => this.parseFarmTourDataFromNotes(inquiry));
      
      return parsedData as InquiryWithItems[];

    } catch (error) {
      console.error('Error fetching all inquiries:', error);
      throw error instanceof Error ? error : new Error('取得所有詢價單時發生未知錯誤');
    }
  }

  async updateInquiryStatus(inquiryId: string, status: InquiryStatus): Promise<InquiryWithItems> {
    try {
      const { data, error } = await createServiceSupabaseClient()
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
      const { data, error } = await createServiceSupabaseClient()
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
      const { error } = await createServiceSupabaseClient()
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
      const { data, error } = await createServiceSupabaseClient()
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

      // 解析農場參觀資料
      const parsedData = this.parseFarmTourDataFromNotes(data);
      
      return parsedData as InquiryWithItems;

    } catch (error) {
      console.error('Error fetching inquiry by ID for admin:', error);
      throw error instanceof Error ? error : new Error('取得詢價單詳情時發生未知錯誤');
    }
  }

  async updateInquiryItems(inquiryId: string, items: InquiryItem[]): Promise<void> {
    try {
      // 先刪除舊的項目
      await createServiceSupabaseClient()
        .from('inquiry_items')
        .delete()
        .eq('inquiry_id', inquiryId);

      // 新增新的項目
      if (items.length > 0) {
        const { error } = await createServiceSupabaseClient()
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
export const supabaseServerInquiryService = new SupabaseInquiryService();