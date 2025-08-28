/**
 * 農場參觀預約詢問 API 路由
 * 處理農場參觀預約詢問的建立
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase-server';
import { createInquiryService } from '@/services/inquiryService';
import { supabaseServerInquiryService } from '@/services/supabaseInquiryService';
import { AuditLogger } from '@/services/auditLogService';
import { withRateLimit, IdentifierStrategy } from '@/lib/rate-limiter';
import { 
  CreateInquiryRequest, 
  InquiryUtils
} from '@/types/inquiry';

// 農場參觀預約詢問的資料介面
interface FarmTourInquiryRequest {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  activity_title: string;
  visit_date: string;
  visitor_count: string;
  notes?: string;
}

// 建立詢問服務實例
const inquiryService = createInquiryService(supabaseServerInquiryService);

// 統一的錯誤回應函數
function createErrorResponse(message: string, status: number, details?: string) {
  return NextResponse.json(
    { 
      error: message,
      success: false,
      details: process.env.NODE_ENV === 'development' ? details : undefined
    },
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// 統一的成功回應函數
function createSuccessResponse(data: any, message?: string, status: number = 200) {
  return NextResponse.json(
    { 
      success: true,
      data,
      message
    },
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// POST /api/farm-tour/inquiry - 建立農場參觀預約詢問
async function handlePOST(request: NextRequest) {
  try {
    // 驗證使用者認證
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('未認證或會話已過期', 401);
    }

    // 取得使用者資訊
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();

    // 解析請求資料
    let farmTourData: FarmTourInquiryRequest;
    try {
      farmTourData = await request.json();
    } catch (parseError) {
      return createErrorResponse('請求資料格式錯誤', 400);
    }

    // 轉換為詢問單格式
    const inquiryData: CreateInquiryRequest = {
      customer_name: farmTourData.customer_name,
      customer_email: farmTourData.customer_email,
      customer_phone: farmTourData.customer_phone,
      inquiry_type: 'farm_tour',
      activity_title: farmTourData.activity_title,
      visit_date: farmTourData.visit_date,
      visitor_count: farmTourData.visitor_count,
      notes: farmTourData.notes,
      // 農場參觀詢問不需要商品項目
      items: []
    };

    // 驗證請求資料
    const validation = InquiryUtils.validateInquiryRequest(inquiryData);
    if (!validation.isValid) {
      return createErrorResponse(
        '資料驗證失敗', 
        400, 
        validation.errors.join(', ')
      );
    }

    // 建立詢問單
    const inquiry = await inquiryService.createInquiry(user.id, inquiryData);

    // 記錄農場參觀預約詢問建立的審計日誌
    AuditLogger.logInquiryCreate(
      user.id,
      user.email || 'unknown@email.com',
      profile?.name,
      profile?.role,
      inquiry.id,
      {
        customer_name: inquiry.customer_name,
        customer_email: inquiry.customer_email,
        inquiry_type: 'farm_tour',
        activity_title: inquiry.activity_title,
        visit_date: inquiry.visit_date,
        visitor_count: inquiry.visitor_count
      },
      request
    ).catch(console.error);

    return createSuccessResponse(
      inquiry, 
      '農場參觀預約詢問已成功提交，我們將盡快與您聯繫', 
      201
    );

  } catch (error) {
    // 根據錯誤類型提供適當的回應
    if (error instanceof Error) {
      if (error.message.includes('row-level security policy') || error.message.includes('policy')) {
        return createErrorResponse(
          '資料庫權限設定問題', 
          403, 
          '請執行 docs/development/fix-rls-inquiry-policy.sql 修復 RLS 政策'
        );
      } else if (error.message.includes('permission') || error.message.includes('violates')) {
        return createErrorResponse('權限不足，請確認您已正確登入', 403, error.message);
      } else if (error.message.includes('connection') || error.message.includes('timeout')) {
        return createErrorResponse('資料庫連線問題，請稍後再試', 503, error.message);
      } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return createErrorResponse('預約詢問已存在，請勿重複提交', 409, error.message);
      } else if (error.message.includes('foreign key') || error.message.includes('constraint')) {
        return createErrorResponse('資料關聯錯誤，請聯繫系統管理員', 400, error.message);
      }
    }

    return createErrorResponse(
      '建立農場參觀預約詢問失敗', 
      500, 
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// 套用 Rate Limiting 並導出 API 處理器
export const POST = withRateLimit(handlePOST, {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 分鐘
  strategy: IdentifierStrategy.COMBINED,
  enableAuditLog: true,
  includeHeaders: true,
  message: '農場參觀預約提交過於頻繁，請等待 15 分鐘後重試'
});

// 處理其他不支援的 HTTP 方法
export async function GET() {
  return createErrorResponse('不支援的請求方法', 405);
}

export async function PUT() {
  return createErrorResponse('不支援的請求方法', 405);
}

export async function DELETE() {
  return createErrorResponse('不支援的請求方法', 405);
}

export async function PATCH() {
  return createErrorResponse('不支援的請求方法', 405);
}