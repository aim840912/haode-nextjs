/**
 * 庫存查詢 API 路由
 * 處理庫存查詢單的建立和查詢
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase-server';
import { createInquiryService } from '@/services/inquiryService';
import { supabaseServerInquiryService } from '@/services/supabaseInquiryService';
import { AuditLogger } from '@/services/auditLogService';
import { withRateLimit, IdentifierStrategy } from '@/lib/rate-limiter';
import { apiLogger } from '@/lib/logger';
import { 
  CreateInquiryRequest, 
  InquiryQueryParams,
  InquiryUtils
} from '@/types/inquiry';

// 建立庫存查詢服務實例
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

// GET /api/inquiries - 取得庫存查詢單清單
async function handleGET(request: NextRequest) {
  try {
    // 驗證使用者認證
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('未認證或會話已過期', 401);
    }

    // 解析查詢參數
    const { searchParams } = new URL(request.url);
    const queryParams: InquiryQueryParams = {
      status: searchParams.get('status') as any,
      customer_email: searchParams.get('customer_email') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
      sort_by: searchParams.get('sort_by') as any || 'created_at',
      sort_order: searchParams.get('sort_order') as any || 'desc',
      is_read: searchParams.get('is_read') ? searchParams.get('is_read') === 'true' : undefined,
      is_replied: searchParams.get('is_replied') ? searchParams.get('is_replied') === 'true' : undefined,
      unread_only: searchParams.get('unread_only') === 'true',
      unreplied_only: searchParams.get('unreplied_only') === 'true'
    };

    // 檢查是否為管理員
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const adminMode = searchParams.get('admin') === 'true';

    // 取得庫存查詢單清單
    let inquiries;
    if (isAdmin && adminMode) {
      inquiries = await inquiryService.getAllInquiries(queryParams);
    } else {
      inquiries = await inquiryService.getUserInquiries(user.id, queryParams);
    }

    return createSuccessResponse(inquiries, undefined, 200);

  } catch (error) {
    return createErrorResponse(
      '取得庫存查詢單清單失敗', 
      500, 
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// POST /api/inquiries - 建立新庫存查詢單
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
    let requestData: CreateInquiryRequest;
    try {
      requestData = await request.json();
    } catch (parseError) {
      return createErrorResponse('請求資料格式錯誤', 400);
    }

    // 驗證請求資料
    const validation = InquiryUtils.validateInquiryRequest(requestData);
    if (!validation.isValid) {
      return createErrorResponse(
        '資料驗證失敗', 
        400, 
        validation.errors.join(', ')
      );
    }

    // 建立庫存查詢單
    const inquiry = await inquiryService.createInquiry(user.id, requestData);

    // 記錄詢問單建立的審計日誌
    AuditLogger.logInquiryCreate(
      user.id,
      user.email || 'unknown@email.com',
      profile?.name,
      profile?.role,
      inquiry.id,
      {
        customer_name: inquiry.customer_name,
        customer_email: inquiry.customer_email,
        total_estimated_amount: inquiry.total_estimated_amount,
        items_count: inquiry.inquiry_items?.length || 0
      },
      request
    ).catch(error => {
      // 非同步記錄失敗，不影響主要流程
      apiLogger.warn('審計日誌記錄失敗', {
        module: 'AuditLog',
        action: 'logInquiryCreate',
        metadata: { error: (error as Error).message }
      })
    });

    return createSuccessResponse(inquiry, '詢問單建立成功', 201);

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
        return createErrorResponse('詢問單已存在，請勿重複提交', 409, error.message);
      } else if (error.message.includes('foreign key') || error.message.includes('constraint')) {
        return createErrorResponse('資料關聯錯誤，請聯繫系統管理員', 400, error.message);
      }
    }

    return createErrorResponse(
      '建立詢問單失敗', 
      500, 
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// 套用 Rate Limiting 並導出 API 處理器
export const GET = withRateLimit(handleGET, {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 分鐘
  strategy: IdentifierStrategy.USER_ID,
  enableAuditLog: false,
  includeHeaders: true,
  message: '詢問單查詢頻率超出限制，請稍後重試'
});

export const POST = withRateLimit(handlePOST, {
  maxRequests: 3,
  windowMs: 10 * 60 * 1000, // 10 分鐘
  strategy: IdentifierStrategy.COMBINED,
  enableAuditLog: true,
  includeHeaders: true,
  message: '詢問單提交過於頻繁，請等待 10 分鐘後重試'
});

// 處理其他不支援的 HTTP 方法
export async function PUT() {
  return createErrorResponse('不支援的請求方法', 405);
}

export async function DELETE() {
  return createErrorResponse('不支援的請求方法', 405);
}

export async function PATCH() {
  return createErrorResponse('不支援的請求方法', 405);
}