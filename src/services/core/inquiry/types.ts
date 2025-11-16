/**
 * 詢問單服務內部型別定義
 */

import { InquiryItem } from '@/types/inquiry'

/**
 * 資料庫記錄類型
 * 對應 Supabase inquiries 表結構
 */
export interface SupabaseInquiryRecord {
  id: string
  user_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string | null
  status: string | null
  inquiry_type: string | null
  notes: string | null
  total_estimated_amount: number | null
  delivery_address: string | null
  preferred_delivery_date: string | null
  activity_title: string | null
  visit_date: string | null
  visitor_count: string | null
  is_read: boolean
  read_at: string | null
  is_replied: boolean
  replied_at: string | null
  replied_by: string | null
  created_at: string | null
  updated_at: string | null
  inquiry_items?: InquiryItem[]
}
