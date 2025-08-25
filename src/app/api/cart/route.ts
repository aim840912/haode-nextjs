import { NextRequest, NextResponse } from 'next/server'
import { AddToCartRequest } from '@/types/cart'
import { requireAuth } from '@/lib/auth-middleware'
import { withRateLimit, IdentifierStrategy } from '@/lib/rate-limiter'
import { ApiResponseBuilder, handleApiError } from '@/lib/api-response'

// 獲取購物車
const handleGET = requireAuth(async (request) => {
  try {
    const userId = request.user!.id;
    
    // TODO: 從資料庫查詢用戶購物車
    const mockCart = {
      id: `cart-${userId}`,
      userId,
      items: [],
      totalItems: 0,
      totalPrice: 0,
      updatedAt: new Date().toISOString()
    }
    
    return ApiResponseBuilder.success(mockCart, '購物車載入成功');
    
  } catch (error) {
    return handleApiError(error);
  }
});

// 添加商品到購物車
const handlePOST = requireAuth(async (request) => {
  try {
    const userId = request.user!.id;
    let body: AddToCartRequest;
    
    try {
      body = await request.json();
    } catch {
      return ApiResponseBuilder.badRequest('請求格式錯誤');
    }
    
    const { productId, quantity = 1 } = body;
    
    if (!productId) {
      return ApiResponseBuilder.badRequest('缺少商品ID');
    }
    
    if (quantity < 1 || quantity > 99) {
      return ApiResponseBuilder.badRequest('商品數量必須在 1-99 之間');
    }
    
    // TODO: 實際的購物車邏輯
    // - 檢查商品是否存在並有庫存
    // - 檢查用戶購物車是否已有此商品
    // - 更新或新增購物車項目
    
    const cartItem = {
      id: `item-${Date.now()}`,
      cartId: `cart-${userId}`,
      productId,
      quantity,
      addedAt: new Date().toISOString()
    };
    
    return ApiResponseBuilder.created(cartItem, '商品已加入購物車');
    
  } catch (error) {
    return handleApiError(error);
  }
});

// 清空購物車
const handleDELETE = requireAuth(async (request) => {
  try {
    const userId = request.user!.id;
    
    // TODO: 清空用戶的購物車
    
    return ApiResponseBuilder.success({ cleared: true }, '購物車已清空');
    
  } catch (error) {
    return handleApiError(error);
  }
});

// 套用 Rate Limiting 並導出 API 處理器
export const GET = withRateLimit(handleGET, {
  maxRequests: 200,
  windowMs: 60 * 1000, // 1 分鐘
  strategy: IdentifierStrategy.USER_ID,
  enableAuditLog: false,
  includeHeaders: true,
  message: '購物車查詢過於頻繁，請稍後重試'
});

export const POST = withRateLimit(handlePOST, {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 分鐘
  strategy: IdentifierStrategy.USER_ID,
  enableAuditLog: false,
  includeHeaders: true,
  message: '加入購物車過於頻繁，請稍後重試'
});

export const DELETE = withRateLimit(handleDELETE, {
  maxRequests: 50,
  windowMs: 60 * 1000, // 1 分鐘
  strategy: IdentifierStrategy.USER_ID,
  enableAuditLog: false,
  includeHeaders: true,
  message: '清空購物車過於頻繁，請稍後重試'
});