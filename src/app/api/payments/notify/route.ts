/**
 * 付款通知 API
 *
 * POST /api/payments/notify
 * 接收藍新金流的付款結果通知（後端對後端）
 *
 * 注意：此 API 不需要認證，由藍新伺服器直接呼叫
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { paymentService } from '@/services/core/payment'

export async function POST(request: NextRequest) {
  try {
    // 取得來源 IP
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'

    // 解析 form data
    const formData = await request.formData()
    const tradeInfo = formData.get('TradeInfo') as string
    const tradeSha = formData.get('TradeSha') as string
    const status = formData.get('Status') as string

    logger.info('收到藍新付款通知', {
      module: 'PaymentNotifyAPI',
      action: 'POST',
      metadata: {
        status,
        ipAddress,
        hasTradeInfo: !!tradeInfo,
        hasTradeSha: !!tradeSha,
      },
    })

    // 驗證必要參數
    if (!tradeInfo || !tradeSha) {
      logger.warn('付款通知缺少必要參數', {
        module: 'PaymentNotifyAPI',
        action: 'POST',
        metadata: { ipAddress },
      })
      return new NextResponse('Missing parameters', { status: 400 })
    }

    // 處理付款通知
    const result = await paymentService.processNotify(tradeInfo, tradeSha, ipAddress)

    if (result.success) {
      logger.info('付款通知處理成功', {
        module: 'PaymentNotifyAPI',
        action: 'POST',
        metadata: {
          orderId: result.orderId,
          tradeNo: result.tradeNo,
          paymentType: result.paymentType,
        },
      })
    } else {
      logger.warn('付款通知處理失敗', {
        module: 'PaymentNotifyAPI',
        action: 'POST',
        metadata: {
          message: result.message,
          ipAddress,
        },
      })
    }

    // 藍新要求回傳純文字 "OK"
    return new NextResponse('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (error) {
    logger.error('付款通知處理異常', error as Error, {
      module: 'PaymentNotifyAPI',
      action: 'POST',
    })

    // 即使發生錯誤也回傳 OK，避免藍新重複發送
    return new NextResponse('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}
