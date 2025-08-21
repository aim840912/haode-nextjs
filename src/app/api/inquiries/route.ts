/**
 * 詢價 API 路由
 * 處理詢價單的建立和查詢
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-auth';
import { createInquiryService } from '@/services/inquiryService';
import { supabaseInquiryService } from '@/services/supabaseInquiryService';
import { 
  CreateInquiryRequest, 
  InquiryQueryParams,
  InquiryUtils
} from '@/types/inquiry';

// 建立詢價服務實例
const inquiryService = createInquiryService(supabaseInquiryService);

// GET /api/inquiries - 取得詢價單清單
export async function GET(request: NextRequest) {
  try {
    // 檢查使用者身份
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未提供有效的認證 token' },
        { status: 401 }
      );
    }

    // 取得使用者資訊
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: '認證失敗' },
        { status: 401 }
      );
    }

    // 解析查詢參數
    const queryParams: InquiryQueryParams = {
      status: searchParams.get('status') as any,
      customer_email: searchParams.get('customer_email') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
      sort_by: searchParams.get('sort_by') as any || 'created_at',
      sort_order: searchParams.get('sort_order') as any || 'desc'
    };

    // 檢查是否為管理員
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    // 取得詢價單清單
    let inquiries;
    if (isAdmin && searchParams.get('admin') === 'true') {
      // 管理員查看所有詢價單
      inquiries = await inquiryService.getAllInquiries(queryParams);
    } else {
      // 一般使用者只能查看自己的詢價單
      inquiries = await inquiryService.getUserInquiries(user.id, queryParams);
    }

    return NextResponse.json({
      success: true,
      data: inquiries,
      total: inquiries.length
    });

  } catch (error) {
    console.error('Error in GET /api/inquiries:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '取得詢價單清單失敗',
        success: false 
      },
      { status: 500 }
    );
  }
}

// POST /api/inquiries - 建立新詢價單
export async function POST(request: NextRequest) {
  try {
    // 檢查使用者身份
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未提供有效的認證 token' },
        { status: 401 }
      );
    }

    // 取得使用者資訊
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: '認證失敗' },
        { status: 401 }
      );
    }

    // 解析請求資料
    const requestData: CreateInquiryRequest = await request.json();

    // 驗證請求資料
    const validation = InquiryUtils.validateInquiryRequest(requestData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: '資料驗證失敗',
          details: validation.errors,
          success: false 
        },
        { status: 400 }
      );
    }

    // 建立詢價單
    const inquiry = await inquiryService.createInquiry(user.id, requestData);

    return NextResponse.json({
      success: true,
      data: inquiry,
      message: '詢價單建立成功'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/inquiries:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '建立詢價單失敗',
        success: false 
      },
      { status: 500 }
    );
  }
}

// 處理其他不支援的 HTTP 方法
export async function PUT() {
  return NextResponse.json(
    { error: '不支援的請求方法' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: '不支援的請求方法' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: '不支援的請求方法' },
    { status: 405 }
  );
}