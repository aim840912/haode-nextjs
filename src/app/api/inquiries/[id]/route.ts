/**
 * 單一庫存查詢 API 路由
 * 處理特定庫存查詢單的查詢、更新和刪除
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

// GET /api/inquiries/[id] - 取得特定庫存查詢單
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

    // 取得庫存查詢單
    let inquiry;
    if (isAdmin && adminMode) {
      // 管理員可以查看任何庫存查詢單
      inquiry = await supabaseServerInquiryService.getInquiryByIdForAdmin(inquiryId);
    } else {
      // 一般使用者只能查看自己的庫存查詢單
      inquiry = await inquiryService.getInquiryById(user.id, inquiryId);
    }

    if (!inquiry) {
      return createErrorResponse('找不到庫存查詢單', 404);
    }

    // 管理員查看庫存查詢單時自動標記為已讀
    if (isAdmin && adminMode && !inquiry.is_read) {
      try {
        await supabase
          .from('inquiries')
          .update({ 
            is_read: true, 
            read_at: new Date().toISOString() 
          })
          .eq('id', inquiryId);
        
        // 更新本地資料物件
        inquiry.is_read = true;
        inquiry.read_at = new Date().toISOString();
      } catch (error) {
        console.error('Failed to mark inquiry as read:', error);
      }
    }

    // 記錄庫存查詢單查看的審計日誌
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
        admin_mode: isAdmin && adminMode,
        marked_as_read: isAdmin && adminMode && !inquiry.is_read
      },
      request
    ).catch(console.error); // 非同步記錄，不影響主要流程

    return createSuccessResponse(inquiry);

  } catch (error) {
    return createErrorResponse(
      '取得庫存查詢單失敗',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// PUT /api/inquiries/[id] - 更新庫存查詢單
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
      return createErrorResponse('只有管理員可以更新庫存查詢單狀態', 403);
    }

    // 如果是讀取/回覆狀態更新，檢查管理員權限
    if ((updateData.is_read !== undefined || updateData.is_replied !== undefined) && !isAdmin) {
      return createErrorResponse('只有管理員可以更新庫存查詢單讀取/回覆狀態', 403);
    }

    // 如果有狀態更新，驗證狀態轉換
    if (updateData.status && isAdmin) {
      // 先取得當前庫存查詢單
      const currentInquiry = await supabaseServerInquiryService.getInquiryByIdForAdmin(inquiryId);
      if (!currentInquiry) {
        return createErrorResponse('找不到庫存查詢單', 404);
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
      
      // 記錄詢問單狀態變更的審計日誌
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
      
      return createSuccessResponse(updatedInquiry, '詢問單狀態更新成功');
    }

    // 取得更新前的詢問單資料（用於審計日誌）
    const previousInquiry = await inquiryService.getInquiryById(user.id, inquiryId);
    if (!previousInquiry) {
      return createErrorResponse('找不到庫存查詢單', 404);
    }

    // 一般使用者更新詢問單
    const updatedInquiry = await inquiryService.updateInquiry(user.id, inquiryId, updateData);

    // 記錄詢問單更新的審計日誌
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

    return createSuccessResponse(updatedInquiry, '詢問單更新成功');

  } catch (error) {
    return createErrorResponse(
      '更新詢問單失敗',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// DELETE /api/inquiries/[id] - 刪除詢問單（僅管理員）
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
      return createErrorResponse('只有管理員可以刪除詢問單', 403);
    }

    // 先取得詢問單資料（用於審計日誌）
    const inquiryToDelete = await supabaseServerInquiryService.getInquiryByIdForAdmin(inquiryId);
    if (!inquiryToDelete) {
      return createErrorResponse('找不到庫存查詢單', 404);
    }

    // 刪除詢問單
    await inquiryService.deleteInquiry(inquiryId);

    // 記錄詢問單刪除的審計日誌
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

    return createSuccessResponse(null, '詢問單刪除成功');

  } catch (error) {
    return createErrorResponse(
      '刪除詢問單失敗',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// PATCH /api/inquiries/[id] - 快速更新詢問單讀取/回覆狀態（僅管理員）
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
      .select('role, name')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return createErrorResponse('只有管理員可以更新庫存查詢單狀態', 403);
    }

    // 解析請求資料
    const requestData = await request.json();
    const { is_read, is_replied, status } = requestData;

    // 準備更新資料
    const updateData: any = {};
    
    if (is_read !== undefined) {
      updateData.is_read = is_read;
      if (is_read && !updateData.read_at) {
        updateData.read_at = new Date().toISOString();
      }
    }

    if (is_replied !== undefined) {
      updateData.is_replied = is_replied;
      if (is_replied && !updateData.replied_at) {
        updateData.replied_at = new Date().toISOString();
        updateData.replied_by = user.id;
      }
    }

    if (status !== undefined) {
      // 驗證狀態值
      const validStatuses: InquiryStatus[] = ['pending', 'quoted', 'confirmed', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return createErrorResponse('無效的狀態值', 400);
      }
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return createErrorResponse('請提供要更新的欄位', 400);
    }

    // 先取得當前詢問單資料
    const currentInquiry = await supabaseServerInquiryService.getInquiryByIdForAdmin(inquiryId);
    if (!currentInquiry) {
      return createErrorResponse('找不到庫存查詢單', 404);
    }

    // 執行更新
    const { data: updatedInquiry, error } = await supabase
      .from('inquiries')
      .update(updateData)
      .eq('id', inquiryId)
      .select(`
        *, 
        inquiry_items (
          id,
          product_id,
          product_name,
          product_category,
          quantity,
          unit_price,
          total_price,
          notes,
          created_at
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    // 記錄審計日誌
    if (is_read !== undefined || is_replied !== undefined) {
      const previousStatus = `read:${currentInquiry.is_read},replied:${currentInquiry.is_replied}`;
      const newStatus = `read:${updateData.is_read ?? currentInquiry.is_read},replied:${updateData.is_replied ?? currentInquiry.is_replied}`;
      
      AuditLogger.logInquiryStatusChange(
        user.id,
        user.email || 'unknown@email.com',
        profile?.name,
        profile?.role,
        inquiryId,
        previousStatus,
        newStatus,
        {
          customer_name: currentInquiry.customer_name,
          customer_email: currentInquiry.customer_email,
          is_read_changed: is_read !== undefined,
          is_replied_changed: is_replied !== undefined
        },
        request
      ).catch(console.error);
    }

    return createSuccessResponse(updatedInquiry, '詢問單更新成功');

  } catch (error) {
    return createErrorResponse(
      '更新詢問單失敗',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}