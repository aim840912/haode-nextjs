/**
 * 付款返回 API
 *
 * POST /api/payments/return
 * 使用者完成付款後，藍新將使用者導向此頁面
 *
 * 注意：此 API 不需要認證，由藍新重導使用者至此
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getNewebPayConfig, decryptTradeInfo, verifyTradeSha } from '@/lib/payment'

export async function POST(request: NextRequest) {
  try {
    const config = getNewebPayConfig()

    // 解析 form data
    const formData = await request.formData()
    const tradeInfo = formData.get('TradeInfo') as string
    const tradeSha = formData.get('TradeSha') as string

    // 驗證必要參數
    if (!tradeInfo || !tradeSha) {
      logger.warn('付款返回缺少必要參數', {
        module: 'PaymentReturnAPI',
        action: 'POST',
      })
      return NextResponse.redirect(new URL('/payment/result?error=missing_params', request.url))
    }

    // 驗證 TradeSha
    if (!verifyTradeSha(tradeInfo, tradeSha, config.hashKey, config.hashIv)) {
      logger.warn('付款返回 TradeSha 驗證失敗', {
        module: 'PaymentReturnAPI',
        action: 'POST',
      })
      return NextResponse.redirect(new URL('/payment/result?error=invalid_signature', request.url))
    }

    // 解密交易資訊
    const decrypted = decryptTradeInfo(tradeInfo, config) as {
      Status: string
      Message: string
      Result: {
        MerchantOrderNo: string
        TradeNo: string
        Amt: number
        PaymentType: string
      }
    }

    const { Status, Result } = decrypted
    const isSuccess = Status === 'SUCCESS'

    logger.info('付款返回處理', {
      module: 'PaymentReturnAPI',
      action: 'POST',
      metadata: {
        merchantOrderNo: Result.MerchantOrderNo,
        status: Status,
        paymentType: Result.PaymentType,
      },
    })

    // 重導至付款結果頁面
    const resultUrl = new URL('/payment/result', request.url)
    resultUrl.searchParams.set('orderNo', Result.MerchantOrderNo)
    resultUrl.searchParams.set('status', isSuccess ? 'success' : 'failed')
    if (Result.TradeNo) {
      resultUrl.searchParams.set('tradeNo', Result.TradeNo)
    }

    return NextResponse.redirect(resultUrl)
  } catch (error) {
    logger.error('付款返回處理異常', error as Error, {
      module: 'PaymentReturnAPI',
      action: 'POST',
    })

    return NextResponse.redirect(new URL('/payment/result?error=processing_error', request.url))
  }
}

// 也支援 GET 請求（某些情況下藍新會使用 GET）
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const orderNo = searchParams.get('orderNo')

  if (orderNo) {
    // 如果有訂單編號，重導至結果頁
    return NextResponse.redirect(new URL(`/payment/result?orderNo=${orderNo}`, request.url))
  }

  // 否則重導至首頁
  return NextResponse.redirect(new URL('/', request.url))
}
