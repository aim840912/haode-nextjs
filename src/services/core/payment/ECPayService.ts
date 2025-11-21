/**
 * 綠界 ECPay 付款服務
 *
 * 提供綠界金流相關的付款建立、通知處理、狀態查詢等功能
 */

import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import {
  getECPayConfig,
  createPaymentFormData,
  generateTradeNo,
  formatTradeDate,
  mapPaymentMethod,
  verifyCheckMacValue,
  isPaymentSuccess,
  type ECPayConfig,
  type ECPayTradeData,
} from '@/lib/payment/ecpay-config'
import type { PaymentMethod } from '@/types/order'

// ==========================================
// 類型定義
// ==========================================

export interface ECPayCreatePaymentRequest {
  orderId: string
  paymentMethod: PaymentMethod
  email?: string
  orderComment?: string
}

export interface ECPayFormData {
  paymentUrl: string
  formData: Record<string, string | number>
}

export interface ECPayNotifyResult {
  success: boolean
  orderId?: string
  tradeNo?: string
  paymentType?: string
  amount?: number
  message?: string
}

// ==========================================
// ECPayService 類別
// ==========================================

export class ECPayService {
  private supabase
  private config: ECPayConfig

  constructor() {
    // 使用 service role key 以繞過 RLS
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    this.config = getECPayConfig()
  }

  // ==========================================
  // 命令方法
  // ==========================================

  /**
   * 建立付款表單資料
   *
   * 生成提交到綠界金流的表單資料
   */
  async createPayment(request: ECPayCreatePaymentRequest): Promise<ECPayFormData> {
    const { orderId, paymentMethod } = request

    // 取得訂單資訊
    const { data: order, error } = await this.supabase
      .from('orders')
      .select('id, order_number, total_amount, user_id')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      logger.error('找不到訂單', error, {
        module: 'ECPayService',
        action: 'createPayment',
        metadata: { orderId },
      })
      throw new Error('找不到訂單')
    }

    // 檢查訂單是否已付款
    const { data: statusCheck } = await this.supabase
      .from('orders')
      .select('payment_status')
      .eq('id', orderId)
      .single()

    if (statusCheck?.payment_status === 'paid') {
      throw new Error('訂單已付款')
    }

    // 建立交易編號（綠界最多 20 字元）
    const merchantTradeNo = generateTradeNo(orderId)

    // 建立交易資訊
    const tradeData: ECPayTradeData = {
      MerchantID: this.config.merchantId,
      MerchantTradeNo: merchantTradeNo,
      MerchantTradeDate: formatTradeDate(),
      PaymentType: 'aio',
      TotalAmount: Math.round(order.total_amount),
      TradeDesc: encodeURIComponent(`田蜜莊訂單`),
      ItemName: `訂單 ${order.order_number}`,
      ReturnURL: this.config.returnUrl,
      ChoosePayment: mapPaymentMethod(paymentMethod),
      EncryptType: 1,
      NeedExtraPaidInfo: 'Y',
    }

    // 設定回調 URL
    if (this.config.clientBackUrl) {
      tradeData.ClientBackURL = this.config.clientBackUrl
    }
    if (this.config.orderResultUrl) {
      tradeData.OrderResultURL = this.config.orderResultUrl
    }

    // ATM 設定到期天數
    if (paymentMethod === 'VACC') {
      tradeData.ExpireDate = 7
    }

    // CVS 設定到期分鐘
    if (paymentMethod === 'CVS') {
      tradeData.StoreExpireDate = 10080 // 7 天
    }

    // 生成完整表單資料（含 CheckMacValue）
    const formData = createPaymentFormData(tradeData, this.config)

    // 更新訂單付款方式和交易編號
    await this.supabase
      .from('orders')
      .update({
        payment_method: paymentMethod,
        payment_status: 'pending',
        payment_trade_no: merchantTradeNo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    logger.info('建立綠界付款表單', {
      module: 'ECPayService',
      action: 'createPayment',
      metadata: {
        orderId,
        merchantTradeNo,
        paymentMethod,
        amount: order.total_amount,
      },
    })

    return {
      paymentUrl: this.config.apiUrl,
      formData,
    }
  }

  /**
   * 處理綠界付款通知
   *
   * 驗證並處理來自綠界的付款結果通知
   */
  async processNotify(
    params: Record<string, string | number>,
    ipAddress?: string
  ): Promise<ECPayNotifyResult> {
    // 驗證 CheckMacValue
    if (!verifyCheckMacValue(params, this.config.hashKey, this.config.hashIv)) {
      logger.warn('CheckMacValue 驗證失敗', {
        module: 'ECPayService',
        action: 'processNotify',
        metadata: { ipAddress },
      })
      return { success: false, message: 'CheckMacValue 驗證失敗' }
    }

    const {
      RtnCode,
      RtnMsg,
      TradeNo,
      MerchantTradeNo,
      TradeAmt,
      PaymentType,
      PaymentDate,
      TradeDate,
    } = params as {
      RtnCode: string
      RtnMsg: string
      TradeNo: string
      MerchantTradeNo: string
      TradeAmt: number
      PaymentType: string
      PaymentDate: string
      TradeDate: string
    }

    // 檢查是否已處理過
    const { data: existing } = await this.supabase
      .from('payment_logs')
      .select('id')
      .eq('trade_no', TradeNo)
      .single()

    if (existing) {
      logger.info('重複的付款通知', {
        module: 'ECPayService',
        action: 'processNotify',
        metadata: { tradeNo: TradeNo },
      })
      return {
        success: true,
        tradeNo: TradeNo,
        message: '已處理過',
      }
    }

    // 根據交易編號查詢訂單
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .select('id, total_amount')
      .eq('payment_trade_no', MerchantTradeNo)
      .single()

    if (orderError || !order) {
      logger.error('找不到對應訂單', orderError, {
        module: 'ECPayService',
        action: 'processNotify',
        metadata: { merchantTradeNo: MerchantTradeNo },
      })
      return { success: false, message: '找不到對應訂單' }
    }

    // 驗證金額
    if (Math.round(order.total_amount) !== Number(TradeAmt)) {
      logger.error('金額不符', new Error('Amount mismatch'), {
        module: 'ECPayService',
        action: 'processNotify',
        metadata: {
          expected: order.total_amount,
          received: TradeAmt,
          orderId: order.id,
        },
      })
      return { success: false, message: '金額不符' }
    }

    // 記錄付款日誌
    await this.supabase.from('payment_logs').insert({
      order_id: order.id,
      trade_no: TradeNo,
      merchant_order_no: MerchantTradeNo,
      status: RtnCode,
      message: RtnMsg,
      amount: Number(TradeAmt),
      payment_type: PaymentType,
      raw_data: params,
      ip_address: ipAddress,
    })

    // 更新訂單付款狀態
    const isSuccess = isPaymentSuccess(RtnCode)
    const paymentStatus = isSuccess ? 'paid' : 'failed'

    await this.supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        payment_time: PaymentDate ? new Date(PaymentDate).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    logger.info(`付款通知處理完成: ${paymentStatus}`, {
      module: 'ECPayService',
      action: 'processNotify',
      metadata: {
        orderId: order.id,
        tradeNo: TradeNo,
        rtnCode: RtnCode,
        paymentType: PaymentType,
      },
    })

    return {
      success: isSuccess,
      orderId: order.id,
      tradeNo: TradeNo,
      paymentType: PaymentType,
      amount: Number(TradeAmt),
      message: RtnMsg,
    }
  }
}

// 匯出單例
export const ecpayService = new ECPayService()
