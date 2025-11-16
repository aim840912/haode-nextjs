/**
 * 詢問單輔助函數
 * 提供資料轉換、序列化和查詢構建功能
 */

import { dbLogger } from '@/lib/logger'
import {
  InquiryWithItems,
  CreateInquiryRequest,
  UpdateInquiryRequest,
  InquiryQueryParams,
} from '@/types/inquiry'
import { SupabaseInquiryRecord } from './types'

/**
 * 解析農場參觀資料
 * 從 notes 欄位中提取 FARM_TOUR_DATA 格式的資料
 */
export function parseFarmTourDataFromNotes(record: SupabaseInquiryRecord): SupabaseInquiryRecord {
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
      module: 'InquiryHelpers',
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
export function transformFromDB(record: SupabaseInquiryRecord): InquiryWithItems {
  const parsedRecord = parseFarmTourDataFromNotes(record)

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
export function serializeFarmTourData(
  data: CreateInquiryRequest | UpdateInquiryRequest
): string | null {
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

/**
 * 應用查詢參數到 Supabase 查詢構建器
 */
export function applyQueryParams(query: any, params?: InquiryQueryParams): any {
  if (!params) return query

  // 狀態篩選
  if (params.status) {
    query = query.eq('status', params.status)
  }

  // 類型篩選
  if (params.inquiry_type) {
    query = query.eq('inquiry_type', params.inquiry_type)
  }

  // Email 搜尋
  if (params.customer_email) {
    query = query.ilike('customer_email', `%${params.customer_email}%`)
  }

  // 日期範圍
  if (params.start_date) {
    query = query.gte('created_at', params.start_date)
  }
  if (params.end_date) {
    query = query.lte('created_at', params.end_date)
  }

  // 讀取/回覆狀態
  if (params.is_read !== undefined) {
    query = query.eq('is_read', params.is_read)
  }
  if (params.is_replied !== undefined) {
    query = query.eq('is_replied', params.is_replied)
  }

  // 特殊篩選
  if (params.unread_only) {
    query = query.eq('is_read', false)
  }
  if (params.unreplied_only) {
    query = query.eq('is_replied', false)
  }

  // 排序
  const sortBy = params.sort_by || 'created_at'
  const sortOrder = params.sort_order || 'desc'
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // 分頁
  if (params.limit) {
    query = query.limit(params.limit)
  }
  if (params.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 10) - 1)
  }

  return query
}
