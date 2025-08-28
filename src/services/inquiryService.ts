/**
 * 庫存查詢服務 - 抽象層
 * 提供統一的庫存查詢服務介面，可切換不同的實作（如 Supabase、本地儲存等）
 */

import { 
  InquiryService,
  InquiryWithItems,
  CreateInquiryRequest,
  UpdateInquiryRequest,
  InquiryQueryParams,
  InquiryStats,
  InquiryStatus,
  InquiryUtils
} from '@/types/inquiry';

class InquiryServiceImpl implements InquiryService {
  private implementation: InquiryService;

  constructor(implementation: InquiryService) {
    this.implementation = implementation;
  }

  // 使用者端方法
  async createInquiry(userId: string, data: CreateInquiryRequest): Promise<InquiryWithItems> {
    try {
      const inquiry = await this.implementation.createInquiry(userId, data);
      console.log('Inquiry created successfully:', inquiry.id);
      return inquiry;
    } catch (error) {
      console.error('Error creating inquiry:', error);
      throw new Error('無法建立庫存查詢單，請稍後再試');
    }
  }

  async getUserInquiries(userId: string, params?: InquiryQueryParams): Promise<InquiryWithItems[]> {
    try {
      return await this.implementation.getUserInquiries(userId, params);
    } catch (error) {
      console.error('Error fetching user inquiries:', error);
      throw new Error('無法取得庫存查詢單清單，請稍後再試');
    }
  }

  async getInquiryById(userId: string, inquiryId: string): Promise<InquiryWithItems | null> {
    try {
      return await this.implementation.getInquiryById(userId, inquiryId);
    } catch (error) {
      console.error('Error fetching inquiry by ID:', error);
      throw new Error('無法取得庫存查詢單詳情，請稍後再試');
    }
  }

  async updateInquiry(userId: string, inquiryId: string, data: UpdateInquiryRequest): Promise<InquiryWithItems> {
    try {
      const inquiry = await this.implementation.updateInquiry(userId, inquiryId, data);
      console.log('Inquiry updated successfully:', inquiry.id);
      return inquiry;
    } catch (error) {
      console.error('Error updating inquiry:', error);
      throw new Error('無法更新庫存查詢單，請稍後再試');
    }
  }

  // 管理員端方法
  async getAllInquiries(params?: InquiryQueryParams): Promise<InquiryWithItems[]> {
    try {
      return await this.implementation.getAllInquiries(params);
    } catch (error) {
      console.error('Error fetching all inquiries:', error);
      throw new Error('無法取得庫存查詢單清單，請稍後再試');
    }
  }

  async updateInquiryStatus(inquiryId: string, status: InquiryStatus): Promise<InquiryWithItems> {
    try {
      const inquiry = await this.implementation.updateInquiryStatus(inquiryId, status);
      console.log('Inquiry status updated successfully:', inquiry.id, 'to', status);
      return inquiry;
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      throw new Error('無法更新庫存查詢單狀態，請稍後再試');
    }
  }

  async getInquiryStats(): Promise<InquiryStats[]> {
    try {
      return await this.implementation.getInquiryStats();
    } catch (error) {
      console.error('Error fetching inquiry stats:', error);
      throw new Error('無法取得庫存查詢統計，請稍後再試');
    }
  }

  async deleteInquiry(inquiryId: string): Promise<void> {
    try {
      await this.implementation.deleteInquiry(inquiryId);
      console.log('Inquiry deleted successfully:', inquiryId);
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      throw new Error('無法刪除庫存查詢單，請稍後再試');
    }
  }
}

// 工廠函數建立庫存查詢服務實例
export function createInquiryService(implementation: InquiryService): InquiryService {
  return new InquiryServiceImpl(implementation);
}


// 預設匯出
export default InquiryServiceImpl;