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
import { withErrorHandler } from '@/lib/error-handler';
import { withValidation, withQueryValidation, withBodyValidation } from '@/lib/validation-middleware';
import { InquirySchemas, CommonValidations } from '@/lib/validation-schemas';
import { z } from 'zod';
import { success, created } from '@/lib/api-response';
import { NotFoundError, AuthorizationError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';

// 建立庫存查詢服務實例
const inquiryService = createInquiryService(supabaseServerInquiryService);

// GET /api/inquiries - 取得庫存查詢單清單
async function handleGET(request: NextRequest, { validated }: { validated: any }) {
  // 驗證使用者認證
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorizationError('未認證或會話已過期');
  }

  // 使用驗證過的查詢參數
  const queryParams = validated.query;

  // 檢查是否為管理員
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';
  const adminMode = queryParams.admin === true;

  // 取得庫存查詢單清單
  let inquiries;
  if (isAdmin && adminMode) {
    inquiries = await inquiryService.getAllInquiries(queryParams);
  } else {
    inquiries = await inquiryService.getUserInquiries(user.id, queryParams);
  }

  return success(inquiries, '庫存查詢單清單取得成功');
}

// POST /api/inquiries - 建立新庫存查詢單
async function handlePOST(request: NextRequest, { validated }: { validated: any }) {
  // 驗證使用者認證
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorizationError('未認證或會話已過期');
  }

  // 取得使用者資訊
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single();

  // 使用驗證過的請求資料
  const requestData = validated.body;

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

  return created(inquiry, '詢問單建立成功');
}

// 導出 API 處理器 - 套用驗證和錯誤處理中間件
export const GET = withErrorHandler(
  withQueryValidation(handleGET, InquirySchemas.query.merge(z.object({
    admin: z.coerce.boolean().optional()
  }))),
  {
    module: 'InquiriesAPI',
    action: 'getInquiries',
    enableAuditLog: true
  }
);

export const POST = withErrorHandler(
  withBodyValidation(handlePOST, InquirySchemas.create),
  {
    module: 'InquiriesAPI', 
    action: 'createInquiry',
    enableAuditLog: true
  }
);