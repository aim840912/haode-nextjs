/**
 * 綠界 ECPay 付款通知 API
 *
 * POST /api/payments/ecpay/notify
 * 接收綠界金流的付款結果通知
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { ecpayService } from '@/services/core/payment'

/**
 * 處理綠界付款通知
 *
 * 綠界會以 POST 方式發送付款結果到此端點
 * 成功時回傳 1|OK，失敗時回傳 0|ErrorMessage
 */
export async function POST(request: NextRequest) {
  try {
    // 解析 form data
    const formData = await request.formData()
    const params: Record<string, string | number> = {}

    formData.forEach((value, key) => {
      // 嘗試轉換為數字
      const numValue = Number(value)
      params[key] = isNaN(numValue) ? String(value) : numValue
    })

    logger.info('收到綠界付款通知', {
      module: 'ECPayNotify',
      action: 'POST',
      metadata: {
        merchantTradeNo: params.MerchantTradeNo,
        tradeNo: params.TradeNo,
        rtnCode: params.RtnCode,
      },
    })

    // 取得客戶端 IP
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'

    // 處理通知
    const result = await ecpayService.processNotify(params, ipAddress)

    if (result.success) {
      // 綠界要求成功時回傳 1|OK
      return new NextResponse('1|OK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    } else {
      logger.warn('付款通知處理失敗', {
        module: 'ECPayNotify',
        action: 'POST',
        metadata: { message: result.message },
      })
      return new NextResponse(`0|${result.message}`, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }
  } catch (error) {
    logger.error('處理綠界通知時發生錯誤', error as Error, {
      module: 'ECPayNotify',
      action: 'POST',
    })
    return new NextResponse('0|Error', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}
