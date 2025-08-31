/**
 * 詢問系統類型定義
 * 定義詢問單和查詢項目的資料結構，支援產品詢價和農場參觀預約
 */

export type InquiryStatus = 'pending' | 'quoted' | 'confirmed' | 'completed' | 'cancelled';

// 詢問類型
export type InquiryType = 'product' | 'farm_tour';

// 庫存查詢單讀取狀態類型
export type InquiryReadStatus = 'unread' | 'read' | 'replied';

// 每日庫存查詢統計介面
export interface DailyInquiryStats {
  inquiry_date: string;
  total_inquiries: number;
  read_inquiries: number;
  replied_inquiries: number;
  read_rate_percent: number;
  reply_rate_percent: number;
  avg_response_time_hours: number | null;
}

export interface Inquiry {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  status: InquiryStatus;
  inquiry_type: InquiryType;
  notes?: string;
  total_estimated_amount?: number;
  delivery_address?: string;
  preferred_delivery_date?: string;
  // 農場參觀相關欄位
  activity_title?: string;
  visit_date?: string;
  visitor_count?: string;
  is_read: boolean;
  read_at?: string;
  is_replied: boolean;
  replied_at?: string;
  replied_by?: string;
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

// 完整的詢問單資料（包含項目列表）
export interface InquiryWithItems extends Inquiry {
  inquiry_items: InquiryItem[];
}

// 建立詢問單的請求資料
export interface CreateInquiryRequest {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  inquiry_type: InquiryType;
  notes?: string;
  delivery_address?: string;
  preferred_delivery_date?: string;
  // 產品詢價相關
  items?: CreateInquiryItemRequest[];
  // 農場參觀相關
  activity_title?: string;
  visit_date?: string;
  visitor_count?: string;
}

// 建立庫存查詢項目的請求資料
export interface CreateInquiryItemRequest {
  product_id: string;
  product_name: string;
  product_category?: string;
  quantity: number;
  unit_price?: number;
  notes?: string;
}

// 更新庫存查詢單的請求資料
export interface UpdateInquiryRequest {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  status?: InquiryStatus;
  notes?: string;
  total_estimated_amount?: number;
  delivery_address?: string;
  preferred_delivery_date?: string;
  is_read?: boolean;
  is_replied?: boolean;
}

// 庫存查詢單統計資料
export interface InquiryStats {
  status: InquiryStatus;
  count: number;
  total_amount: number;
  average_amount: number;
  unread_count: number;
  unreplied_count: number;
  avg_response_time_hours: number | null;
}

// 詢問單查詢參數
export interface InquiryQueryParams {
  status?: InquiryStatus;
  inquiry_type?: InquiryType;
  customer_email?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'updated_at' | 'total_estimated_amount';
  sort_order?: 'asc' | 'desc';
  is_read?: boolean;
  is_replied?: boolean;
  unread_only?: boolean;
  unreplied_only?: boolean;
}

// 詢問單狀態顯示文字
export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  pending: '待回覆',
  quoted: '已回覆',
  confirmed: '已確認',
  completed: '已完成',
  cancelled: '已取消'
};

// 詢問類型顯示文字
export const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  product: '產品詢問',
  farm_tour: '農場參觀'
};

// 詢問單狀態顏色
export const INQUIRY_STATUS_COLORS: Record<InquiryStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  quoted: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

// 詢問類型顏色
export const INQUIRY_TYPE_COLORS: Record<InquiryType, string> = {
  product: 'bg-blue-100 text-blue-800',
  farm_tour: 'bg-green-100 text-green-800'
};

// 庫存查詢服務介面
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

// 庫存查詢工具函數類別
export class InquiryUtils {
  /**
   * 計算庫存查詢單總金額
   */
  static calculateTotalAmount(inquiry: InquiryWithItems): number {
    return inquiry.inquiry_items.reduce((total, item) => {
      return total + (item.total_price || (item.unit_price || 0) * item.quantity);
    }, 0);
  }

  /**
   * 計算庫存查詢單商品總數量
   */
  static calculateTotalQuantity(inquiry: InquiryWithItems): number {
    return inquiry.inquiry_items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * 格式化庫存查詢單編號
   */
  static formatInquiryNumber(inquiry: InquiryWithItems): string {
    const date = new Date(inquiry.created_at);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const shortId = inquiry.id.slice(0, 8).toUpperCase();
    return `STK${year}${month}${day}-${shortId}`;
  }

  /**
   * 驗證詢問單資料
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

    if (!data.inquiry_type) {
      errors.push('詢問類型不能為空');
    }

    // 根據詢問類型驗證不同欄位
    if (data.inquiry_type === 'product') {
      if (!data.items || data.items.length === 0) {
        errors.push('產品查詢項目不能為空');
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
    } else if (data.inquiry_type === 'farm_tour') {
      if (!data.activity_title || data.activity_title.trim().length === 0) {
        errors.push('活動標題不能為空');
      }
      if (!data.visit_date || data.visit_date.trim().length === 0) {
        errors.push('參觀日期不能為空');
      }
      if (!data.visitor_count || data.visitor_count.trim().length === 0) {
        errors.push('參觀人數不能為空');
      }
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

  /**
   * 取得庫存查詢單讀取狀態
   */
  static getReadStatus(inquiry: InquiryWithItems): InquiryReadStatus {
    if (inquiry.is_replied) return 'replied';
    if (inquiry.is_read) return 'read';
    return 'unread';
  }

  /**
   * 檢查庫存查詢單是否需要關注（未讀或未回覆）
   */
  static needsAttention(inquiry: InquiryWithItems): boolean {
    // 已取消的庫存查詢單不需要關注
    if (inquiry.status === 'cancelled') return false;
    
    // 未讀或未回覆的庫存查詢單需要關注
    return !inquiry.is_read || !inquiry.is_replied;
  }

  /**
   * 計算回覆時間（小時）
   */
  static calculateResponseTime(inquiry: InquiryWithItems): number | null {
    if (!inquiry.replied_at) return null;
    
    const createdTime = new Date(inquiry.created_at).getTime();
    const repliedTime = new Date(inquiry.replied_at).getTime();
    
    return Math.round((repliedTime - createdTime) / (1000 * 60 * 60) * 10) / 10; // 保留一位小數
  }

  /**
   * 格式化回覆時間顯示
   */
  static formatResponseTime(inquiry: InquiryWithItems): string {
    const hours = this.calculateResponseTime(inquiry);
    if (hours === null) return '未回覆';
    
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} 分鐘`;
    } else if (hours < 24) {
      return `${hours} 小時`;
    } else {
      const days = Math.round(hours / 24 * 10) / 10;
      return `${days} 天`;
    }
  }

  /**
   * 取得庫存查詢單優先級（未讀 > 未回覆 > 已完成）
   */
  static getPriority(inquiry: InquiryWithItems): number {
    if (inquiry.status === 'cancelled') return 0;
    if (!inquiry.is_read) return 10; // 最高優先級
    if (!inquiry.is_replied) return 5; // 中等優先級
    return 1; // 低優先級
  }
}