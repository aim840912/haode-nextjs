/**
 * 詢問單資料轉換工具
 * 負責資料庫記錄與應用程式物件之間的轉換
 */

import { dbLogger } from '@/lib/logger'
import {
  InquiryWithItems,
  CreateInquiryRequest,
  UpdateInquiryRequest,
  InquiryItem,
} from '@/types/inquiry'

/**
 * 資料庫記錄類型
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

export class InquiryDataMapper {
  /**
   * 解析農場參觀資料
   */
  static parseFarmTourData(record: SupabaseInquiryRecord): SupabaseInquiryRecord {
    if (!record.notes || !record.notes.startsWith('FARM_TOUR_DATA:')) {
      return record
    }

    try {
      const jsonData = record.notes.substring('FARM_TOUR_DATA:'.length)
      const farmTourData = JSON.parse(jsonData)

      return {
        ...record,
        inquiry_type: 'farm_tour',
        activity_title: farmTourData.activity_title,
        visit_date: farmTourData.visit_date,
        visitor_count: farmTourData.visitor_count,
        notes: farmTourData.original_notes,
      }
    } catch (error) {
      dbLogger.warn('無法解析農場參觀資料', {
        module: 'InquiryDataMapper',
        action: 'parseFarmTourData',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          notes: record.notes,
        },
      })
      return record
    }
  }

  /**
   * 轉換資料庫記錄為實體
   */
  static transformFromDB(record: SupabaseInquiryRecord): InquiryWithItems {
    const parsedRecord = this.parseFarmTourData(record)

    return {
      id: parsedRecord.id,
      user_id: parsedRecord.user_id || '',
      customer_name: parsedRecord.customer_name,
      customer_email: parsedRecord.customer_email,
      customer_phone: parsedRecord.customer_phone || undefined,
      status: (parsedRecord.status || 'pending') as any,
      inquiry_type: (parsedRecord.inquiry_type || 'product') as any,
      notes: parsedRecord.notes || undefined,
      total_estimated_amount: parsedRecord.total_estimated_amount || undefined,
      delivery_address: parsedRecord.delivery_address || undefined,
      preferred_delivery_date: parsedRecord.preferred_delivery_date || undefined,
      activity_title: parsedRecord.activity_title || undefined,
      visit_date: parsedRecord.visit_date || undefined,
      visitor_count: parsedRecord.visitor_count || undefined,
      is_read: parsedRecord.is_read,
      read_at: parsedRecord.read_at || undefined,
      is_replied: parsedRecord.is_replied,
      replied_at: parsedRecord.replied_at || undefined,
      replied_by: parsedRecord.replied_by || undefined,
      created_at: parsedRecord.created_at || new Date().toISOString(),
      updated_at: parsedRecord.updated_at || new Date().toISOString(),
      inquiry_items: parsedRecord.inquiry_items || [],
    }
  }

  /**
   * 序列化農場參觀資料到 notes
   */
  static serializeFarmTourData(data: CreateInquiryRequest | UpdateInquiryRequest): string | null {
    if ('inquiry_type' in data && data.inquiry_type === 'farm_tour') {
      const farmTourData = {
        activity_title: data.activity_title,
        visit_date: data.visit_date,
        visitor_count: data.visitor_count,
        original_notes: data.notes || '',
      }
      return `FARM_TOUR_DATA:${JSON.stringify(farmTourData)}`
    }
    return data.notes || null
  }
}
