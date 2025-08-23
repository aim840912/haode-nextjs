/**
 * 庫存查詢/預訂系統類型定義
 * 定義庫存查詢單和查詢項目的資料結構
 */

export type InquiryStatus = 'pending' | 'quoted' | 'confirmed' | 'completed' | 'cancelled';

export interface Inquiry {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  status: InquiryStatus;
  notes?: string;
  total_estimated_amount?: number;
  delivery_address?: string;
  preferred_delivery_date?: string;
  created_at: string;
  updated_at: string;
}

export interface InquiryItem {
  id: string;
  inquiry_id: string;
  product_id: string;
  product_name: string;
  product_category?: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  notes?: string;
  created_at: string;
}

// 完整的詢價單資料（包含項目列表）
export interface InquiryWithItems extends Inquiry {
  inquiry_items: InquiryItem[];
}

// 建立詢價單的請求資料
export interface CreateInquiryRequest {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  notes?: string;
  delivery_address?: string;
  preferred_delivery_date?: string;
  items: CreateInquiryItemRequest[];
}

// 建立詢價項目的請求資料
export interface CreateInquiryItemRequest {
  product_id: string;
  product_name: string;
  product_category?: string;
  quantity: number;
  unit_price?: number;
  notes?: string;
}

// 更新詢價單的請求資料
export interface UpdateInquiryRequest {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  status?: InquiryStatus;
  notes?: string;
  total_estimated_amount?: number;
  delivery_address?: string;
  preferred_delivery_date?: string;
}

// 詢價單統計資料
export interface InquiryStats {
  status: InquiryStatus;
  count: number;
  total_amount: number;
  average_amount: number;
}

// 詢價單查詢參數
export interface InquiryQueryParams {
  status?: InquiryStatus;
  customer_email?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'updated_at' | 'total_estimated_amount';
  sort_order?: 'asc' | 'desc';
}

// 庫存查詢單狀態顯示文字
export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  pending: '待確認',
  quoted: '有庫存',
  confirmed: '已預訂',
  completed: '已完成',
  cancelled: '已取消'
};

// 庫存查詢單狀態顏色
export const INQUIRY_STATUS_COLORS: Record<InquiryStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  quoted: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

// 詢價服務介面
export interface InquiryService {
  // 使用者端方法
  createInquiry(userId: string, data: CreateInquiryRequest): Promise<InquiryWithItems>;
  getUserInquiries(userId: string, params?: InquiryQueryParams): Promise<InquiryWithItems[]>;
  getInquiryById(userId: string, inquiryId: string): Promise<InquiryWithItems | null>;
  updateInquiry(userId: string, inquiryId: string, data: UpdateInquiryRequest): Promise<InquiryWithItems>;
  
  // 管理員端方法
  getAllInquiries(params?: InquiryQueryParams): Promise<InquiryWithItems[]>;
  updateInquiryStatus(inquiryId: string, status: InquiryStatus): Promise<InquiryWithItems>;
  getInquiryStats(): Promise<InquiryStats[]>;
  deleteInquiry(inquiryId: string): Promise<void>;
}

// Email 通知相關類型
export interface InquiryEmailData {
  inquiry: InquiryWithItems;
  customer_name: string;
  customer_email: string;
  admin_email?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// 詢價工具函數類別
export class InquiryUtils {
  /**
   * 計算詢價單總金額
   */
  static calculateTotalAmount(inquiry: InquiryWithItems): number {
    return inquiry.inquiry_items.reduce((total, item) => {
      return total + (item.total_price || (item.unit_price || 0) * item.quantity);
    }, 0);
  }

  /**
   * 計算詢價單商品總數量
   */
  static calculateTotalQuantity(inquiry: InquiryWithItems): number {
    return inquiry.inquiry_items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * 格式化詢價單編號
   */
  static formatInquiryNumber(inquiry: InquiryWithItems): string {
    const date = new Date(inquiry.created_at);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const shortId = inquiry.id.slice(0, 8).toUpperCase();
    return `INQ${year}${month}${day}-${shortId}`;
  }

  /**
   * 驗證詢價單資料
   */
  static validateInquiryRequest(data: CreateInquiryRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.customer_name || data.customer_name.trim().length === 0) {
      errors.push('客戶姓名不能為空');
    }

    if (!data.customer_email || data.customer_email.trim().length === 0) {
      errors.push('客戶Email不能為空');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customer_email)) {
      errors.push('Email格式不正確');
    }

    if (!data.items || data.items.length === 0) {
      errors.push('詢價項目不能為空');
    } else {
      data.items.forEach((item, index) => {
        if (!item.product_id || item.product_id.trim().length === 0) {
          errors.push(`第 ${index + 1} 項產品ID不能為空`);
        }
        if (!item.product_name || item.product_name.trim().length === 0) {
          errors.push(`第 ${index + 1} 項產品名稱不能為空`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`第 ${index + 1} 項產品數量必須大於0`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 取得狀態可轉換的選項
   */
  static getAvailableStatusTransitions(currentStatus: InquiryStatus): InquiryStatus[] {
    const transitions: Record<InquiryStatus, InquiryStatus[]> = {
      pending: ['quoted', 'cancelled'],
      quoted: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    return transitions[currentStatus] || [];
  }

  /**
   * 檢查狀態轉換是否有效
   */
  static isValidStatusTransition(from: InquiryStatus, to: InquiryStatus): boolean {
    const availableTransitions = this.getAvailableStatusTransitions(from);
    return availableTransitions.includes(to);
  }
}