/**
 * 單一詢價 API 路由
 * 處理特定詢價單的查詢、更新和刪除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase-server';
import { createInquiryService } from '@/services/inquiryService';
import { supabaseServerInquiryService } from '@/services/supabaseInquiryService';
import { AuditLogger } from '@/services/auditLogService';
import { 
  UpdateInquiryRequest,
  InquiryStatus,
  InquiryUtils
} from '@/types/inquiry';

// 建立詢價服務實例
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

// GET /api/inquiries/[id] - 取得特定詢價單
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inquiryId } = await params;

    // 驗證使用者認證
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('未認證或會話已過期', 401);
    }

    // 檢查是否為管理員
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const { searchParams } = new URL(request.url);
    const adminMode = searchParams.get('admin') === 'true';

    // 取得詢價單
    let inquiry;
    if (isAdmin && adminMode) {
      // 管理員可以查看任何詢價單
      inquiry = await supabaseServerInquiryService.getInquiryByIdForAdmin(inquiryId);
    } else {
      // 一般使用者只能查看自己的詢價單
      inquiry = await inquiryService.getInquiryById(user.id, inquiryId);
    }

    if (!inquiry) {
      return createErrorResponse('找不到詢價單', 404);
    }

    // 記錄詢價單查看的審計日誌
    AuditLogger.logInquiryView(
      user.id,
      user.email || 'unknown@email.com',
      profile?.name,
      profile?.role,
      inquiryId,
      {
        customer_name: inquiry.customer_name,
        customer_email: inquiry.customer_email,
        status: inquiry.status,
        admin_mode: isAdmin && adminMode
      },
      request
    ).catch(console.error); // 非同步記錄，不影響主要流程

    return createSuccessResponse(inquiry);

  } catch (error) {
    return createErrorResponse(
      '取得詢價單失敗',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// PUT /api/inquiries/[id] - 更新詢價單
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inquiryId } = await params;

    // 驗證使用者認證
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('未認證或會話已過期', 401);
    }

    // 解析請求資料
    const updateData: UpdateInquiryRequest = await request.json();

    // 檢查是否為管理員
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    // 如果是狀態更新，檢查管理員權限
    if (updateData.status && !isAdmin) {
      return createErrorResponse('只有管理員可以更新詢價單狀態', 403);
    }

    // 如果有狀態更新，驗證狀態轉換
    if (updateData.status && isAdmin) {
      // 先取得當前詢價單
      const currentInquiry = await supabaseServerInquiryService.getInquiryByIdForAdmin(inquiryId);
      if (!currentInquiry) {
        return createErrorResponse('找不到詢價單', 404);
      }

      // 驗證狀態轉換
      if (!InquiryUtils.isValidStatusTransition(currentInquiry.status, updateData.status)) {
        return NextResponse.json(
          { 
            error: `無法從 ${currentInquiry.status} 轉換到 ${updateData.status}`,
            availableTransitions: InquiryUtils.getAvailableStatusTransitions(currentInquiry.status),
            success: false
          },
          { status: 400 }
        );
      }

      // 管理員更新狀態
      const updatedInquiry = await inquiryService.updateInquiryStatus(inquiryId, updateData.status);
      
      // 記錄詢價單狀態變更的審計日誌
      AuditLogger.logInquiryStatusChange(
        user.id,
        user.email || 'unknown@email.com',
        profile?.name,
        profile?.role,
        inquiryId,
        currentInquiry.status,
        updateData.status,
        {
          customer_name: currentInquiry.customer_name,
          customer_email: currentInquiry.customer_email
        },
        request
      ).catch(console.error); // 非同步記錄，不影響主要流程
      
      return createSuccessResponse(updatedInquiry, '詢價單狀態更新成功');
    }

    // 取得更新前的詢價單資料（用於審計日誌）
    const previousInquiry = await inquiryService.getInquiryById(user.id, inquiryId);
    if (!previousInquiry) {
      return createErrorResponse('找不到詢價單', 404);
    }

    // 一般使用者更新詢價單
    const updatedInquiry = await inquiryService.updateInquiry(user.id, inquiryId, updateData);

    // 記錄詢價單更新的審計日誌
    AuditLogger.logInquiryUpdate(
      user.id,
      user.email || 'unknown@email.com',
      profile?.name,
      profile?.role,
      inquiryId,
      {
        customer_name: previousInquiry.customer_name,
        customer_email: previousInquiry.customer_email,
        notes: previousInquiry.notes,
        delivery_address: previousInquiry.delivery_address
      },
      {
        customer_name: updatedInquiry.customer_name,
        customer_email: updatedInquiry.customer_email,
        notes: updatedInquiry.notes,
        delivery_address: updatedInquiry.delivery_address
      },
      request
    ).catch(console.error); // 非同步記錄，不影響主要流程

    return createSuccessResponse(updatedInquiry, '詢價單更新成功');

  } catch (error) {
    return createErrorResponse(
      '更新詢價單失敗',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// DELETE /api/inquiries/[id] - 刪除詢價單（僅管理員）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inquiryId } = await params;

    // 驗證使用者認證
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('未認證或會話已過期', 401);
    }

    // 檢查是否為管理員
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return createErrorResponse('只有管理員可以刪除詢價單', 403);
    }

    // 先取得詢價單資料（用於審計日誌）
    const inquiryToDelete = await supabaseServerInquiryService.getInquiryByIdForAdmin(inquiryId);
    if (!inquiryToDelete) {
      return createErrorResponse('找不到詢價單', 404);
    }

    // 刪除詢價單
    await inquiryService.deleteInquiry(inquiryId);

    // 記錄詢價單刪除的審計日誌
    AuditLogger.logInquiryDelete(
      user.id,
      user.email || 'unknown@email.com',
      profile?.name,
      profile?.role,
      inquiryId,
      {
        customer_name: inquiryToDelete.customer_name,
        customer_email: inquiryToDelete.customer_email,
        status: inquiryToDelete.status,
        total_estimated_amount: inquiryToDelete.total_estimated_amount,
        items_count: inquiryToDelete.inquiry_items?.length || 0
      },
      request
    ).catch(console.error); // 非同步記錄，不影響主要流程

    return createSuccessResponse(null, '詢價單刪除成功');

  } catch (error) {
    return createErrorResponse(
      '刪除詢價單失敗',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// PATCH /api/inquiries/[id]/status - 快速更新詢價單狀態（僅管理員）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inquiryId } = await params;

    // 驗證使用者認證
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('未認證或會話已過期', 401);
    }

    // 檢查是否為管理員
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return createErrorResponse('只有管理員可以更新詢價單狀態', 403);
    }

    // 解析請求資料
    const { status } = await request.json();

    if (!status) {
      return createErrorResponse('請提供要更新的狀態', 400);
    }

    // 驗證狀態值
    const validStatuses: InquiryStatus[] = ['pending', 'quoted', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return createErrorResponse('無效的狀態值', 400);
    }

    // 更新狀態
    const updatedInquiry = await inquiryService.updateInquiryStatus(inquiryId, status);

    return createSuccessResponse(updatedInquiry, '詢價單狀態更新成功');

  } catch (error) {
    return createErrorResponse(
      '更新詢價單狀態失敗',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}