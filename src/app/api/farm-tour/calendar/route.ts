'use server';

import { NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/error-handler';
import { success } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { InquiryWithItems, InquiryStatus } from '@/types/inquiry';

// 行事曆事件介面
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    inquiry_id: string;
    activity_title: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    visitor_count: string;
    notes?: string;
    status: InquiryStatus;
    created_at: string;
    updated_at: string;
  };
}

// 行事曆統計介面
export interface CalendarStatistics {
  total: number;
  byStatus: Record<InquiryStatus, number>;
  byDate: Record<string, number>;
}

export interface CalendarResponse {
  events: CalendarEvent[];
  statistics: CalendarStatistics;
}

// 狀態顏色配置
const eventColors = {
  pending: {
    backgroundColor: '#9CA3AF',
    borderColor: '#6B7280',
    textColor: '#FFFFFF'
  },
  quoted: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
    textColor: '#FFFFFF'
  },
  confirmed: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
    textColor: '#FFFFFF'
  },
  completed: {
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
    textColor: '#FFFFFF'
  },
  cancelled: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
    textColor: '#FFFFFF'
  }
} as const;

// 轉換詢問單為行事曆事件
function convertInquiryToEvent(inquiry: InquiryWithItems): CalendarEvent {
  const colors = eventColors[inquiry.status];
  
  return {
    id: inquiry.id,
    title: `${inquiry.visitor_count}人 - ${inquiry.customer_name}`,
    start: inquiry.visit_date || inquiry.created_at,
    backgroundColor: colors.backgroundColor,
    borderColor: colors.borderColor,
    textColor: colors.textColor,
    extendedProps: {
      inquiry_id: inquiry.id,
      activity_title: inquiry.activity_title || '',
      customer_name: inquiry.customer_name,
      customer_email: inquiry.customer_email,
      customer_phone: inquiry.customer_phone,
      visitor_count: inquiry.visitor_count || '1',
      notes: inquiry.notes,
      status: inquiry.status,
      created_at: inquiry.created_at,
      updated_at: inquiry.updated_at
    }
  };
}

// 計算統計資料
function calculateStatistics(inquiries: InquiryWithItems[]): CalendarStatistics {
  const byStatus: Record<InquiryStatus, number> = {
    pending: 0,
    quoted: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  };

  const byDate: Record<string, number> = {};

  inquiries.forEach(inquiry => {
    // 按狀態統計
    byStatus[inquiry.status]++;
    
    // 按日期統計
    const date = inquiry.visit_date ? inquiry.visit_date.split('T')[0] : inquiry.created_at.split('T')[0];
    byDate[date] = (byDate[date] || 0) + 1;
  });

  return {
    total: inquiries.length,
    byStatus,
    byDate
  };
}

async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const statusFilter = searchParams.get('status');

  // 驗證必要參數
  if (!start || !end) {
    throw new ValidationError('缺少必要參數：start 和 end');
  }

  // 驗證日期格式
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new ValidationError('日期格式不正確');
  }

  apiLogger.debug('取得農場導覽行事曆資料');

  const supabase = await createServerSupabaseClient();

  // 建立查詢
  let query = supabase
    .from('inquiries')
    .select(`
      id,
      customer_name,
      customer_email,
      customer_phone,
      status,
      inquiry_type,
      activity_title,
      visit_date,
      visitor_count,
      notes,
      created_at,
      updated_at
    `)
    .eq('inquiry_type', 'farm_tour')
    .gte('visit_date', start)
    .lte('visit_date', end)
    .order('visit_date', { ascending: true });

  // 如果有狀態過濾
  if (statusFilter && statusFilter !== 'all') {
    const statuses = statusFilter.split(',').filter(s => s.length > 0);
    if (statuses.length > 0) {
      query = query.in('status', statuses);
    }
  }

  const { data: inquiries, error } = await query;

  if (error) {
    apiLogger.error('查詢農場導覽預約失敗');
    throw new Error('查詢預約資料失敗');
  }

  if (!inquiries) {
    apiLogger.info('未找到農場導覽預約資料');
    return success<CalendarResponse>({
      events: [],
      statistics: {
        total: 0,
        byStatus: {
          pending: 0,
          quoted: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0
        },
        byDate: {}
      }
    }, '查詢成功');
  }

  // 轉換為行事曆事件
  const events = inquiries.map((inquiry: any) => convertInquiryToEvent(inquiry as InquiryWithItems));
  const statistics = calculateStatistics(inquiries as InquiryWithItems[]);

  apiLogger.info('農場導覽行事曆資料取得成功');

  return success<CalendarResponse>({
    events,
    statistics
  }, '查詢成功');
}

async function handlePUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const inquiryId = searchParams.get('id');

  if (!inquiryId) {
    throw new ValidationError('缺少詢問單 ID');
  }

  const body = await request.json();
  const { visit_date } = body;

  if (!visit_date) {
    throw new ValidationError('缺少參觀日期');
  }

  // 驗證日期格式
  const visitDate = new Date(visit_date);
  if (isNaN(visitDate.getTime())) {
    throw new ValidationError('參觀日期格式不正確');
  }

  apiLogger.debug('更新農場導覽預約時間');

  const supabase = await createServerSupabaseClient();

  // 更新預約時間
  const { error } = await (supabase as any)
    .from('inquiries')
    .update({
      visit_date,
      updated_at: new Date().toISOString()
    })
    .eq('id', inquiryId)
    .eq('inquiry_type', 'farm_tour');

  if (error) {
    apiLogger.error('更新農場導覽預約時間失敗');
    throw new Error('更新預約時間失敗');
  }

  apiLogger.info('農場導覽預約時間更新成功');

  return success({
    id: inquiryId,
    visit_date
  }, '預約時間更新成功');
}

// 導出處理函數
export const GET = withErrorHandler(handleGET, {
  module: 'FarmTourCalendarAPI',
  enableAuditLog: false
});

export const PUT = withErrorHandler(handlePUT, {
  module: 'FarmTourCalendarAPI',
  enableAuditLog: true
});