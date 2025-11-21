/**
 * 付款服務
 *
 * 提供藍新金流相關的付款建立、通知處理、狀態查詢等功能
 */

import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import {
  getNewebPayConfig,
  createEncryptedTradeInfo,
  decryptTradeInfo,
  verifyTradeSha,
  type TradeInfoData,
  type NewebPayConfig,
} from '@/lib/payment'
import type { PaymentMethod, PaymentFormData, PaymentLog } from '@/types/order'

// ==========================================
// 類型定義
// ==========================================

export interface CreatePaymentRequest {
  orderId: string
  paymentMethod: PaymentMethod
  email?: string
  orderComment?: string
}

export interface PaymentNotifyResult {
  success: boolean
  orderId?: string
  tradeNo?: string
  paymentType?: string
  amount?: number
  message?: string
}

export interface PaymentStatus {
  orderId: string
  status: string
  paymentMethod?: string
  tradeNo?: string
  paymentTime?: string
  amount: number
}

// ==========================================
// PaymentService 類別
// ==========================================

export class PaymentService {
  private supabase
  private config: NewebPayConfig

  constructor() {
    // 使用 service role key 以繞過 RLS
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    this.config = getNewebPayConfig()
  }

  // ==========================================
  // 查詢方法
  // ==========================================

  /**
   * 取得訂單付款狀態
   */
  async getPaymentStatus(orderId: string): Promise<PaymentStatus | null> {
    const { data: order, error } = await this.supabase
      .from('orders')
      .select('id, payment_status, payment_method, payment_trade_no, payment_time, total_amount')
      .eq('id', orderId)
      .single()

    if (error) {
      logger.error('查詢付款狀態失敗', error, {
        module: 'PaymentService',
        action: 'getPaymentStatus',
        metadata: { orderId },
      })
      return null
    }

    return {
      orderId: order.id,
      status: order.payment_status || 'pending',
      paymentMethod: order.payment_method,
      tradeNo: order.payment_trade_no,
      paymentTime: order.payment_time,
      amount: order.total_amount,
    }
  }

  /**
   * 根據藍新交易編號查詢付款記錄
   */
  async getPaymentByTradeNo(tradeNo: string): Promise<PaymentLog | null> {
    const { data, error } = await this.supabase
      .from('payment_logs')
      .select('*')
      .eq('trade_no', tradeNo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // 找不到記錄
      }
      logger.error('查詢付款記錄失敗', error, {
        module: 'PaymentService',
        action: 'getPaymentByTradeNo',
        metadata: { tradeNo },
      })
      return null
    }

    return this.mapPaymentLog(data)
  }

  // ==========================================
  // 命令方法
  // ==========================================

  /**
   * 建立付款表單資料
   *
   * 生成提交到藍新金流的加密表單資料
   */
  async createPayment(request: CreatePaymentRequest): Promise<PaymentFormData> {
    const { orderId, paymentMethod, email, orderComment } = request

    // 取得訂單資訊
    const { data: order, error } = await this.supabase
      .from('orders')
      .select('id, order_number, total_amount, user_id')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      logger.error('找不到訂單', error, {
        module: 'PaymentService',
        action: 'createPayment',
        metadata: { orderId },
      })
      throw new Error('找不到訂單')
    }

    // 檢查訂單是否已付款
    const status = await this.getPaymentStatus(orderId)
    if (status?.status === 'paid') {
      throw new Error('訂單已付款')
    }

    // 建立商店訂單編號（使用訂單編號）
    const merchantOrderNo = order.order_number

    // 建立交易資訊
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const tradeInfo: TradeInfoData = {
      MerchantID: this.config.merchantId,
      RespondType: 'JSON',
      TimeStamp: timestamp,
      Version: this.config.version,
      MerchantOrderNo: merchantOrderNo,
      Amt: Math.round(order.total_amount),
      ItemDesc: `訂單 ${merchantOrderNo}`,
      Email: email,
      LoginType: 0,
      OrderComment: orderComment,
      // 設定付款方式
      CREDIT: paymentMethod === 'CREDIT' ? 1 : 0,
      VACC: paymentMethod === 'VACC' ? 1 : 0,
      CVS: paymentMethod === 'CVS' ? 1 : 0,
      WEBATM: paymentMethod === 'WEBATM' ? 1 : 0,
      // 回調 URL
      ReturnURL: this.config.returnUrl,
      NotifyURL: this.config.notifyUrl,
    }

    // ATM 和超商設定繳費期限（7 天）
    if (paymentMethod === 'VACC' || paymentMethod === 'CVS') {
      const expireDate = new Date()
      expireDate.setDate(expireDate.getDate() + 7)
      tradeInfo.ExpireDate = expireDate.toISOString().slice(0, 10).replace(/-/g, '')
    }

    // 加密交易資訊
    const { tradeInfo: encryptedInfo, tradeSha } = createEncryptedTradeInfo(tradeInfo, this.config)

    // 更新訂單付款方式
    await this.supabase
      .from('orders')
      .update({
        payment_method: paymentMethod,
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    logger.info('建立付款表單', {
      module: 'PaymentService',
      action: 'createPayment',
      metadata: {
        orderId,
        merchantOrderNo,
        paymentMethod,
        amount: order.total_amount,
      },
    })

    return {
      paymentUrl: this.config.apiUrl,
      merchantId: this.config.merchantId,
      merchantOrderNo,
      tradeInfo: encryptedInfo,
      tradeSha,
      version: this.config.version,
    }
  }

  /**
   * 處理藍新付款通知
   *
   * 驗證並處理來自藍新的付款結果通知
   */
  async processNotify(
    tradeInfo: string,
    tradeSha: string,
    ipAddress?: string
  ): Promise<PaymentNotifyResult> {
    // 驗證 TradeSha
    if (!verifyTradeSha(tradeInfo, tradeSha, this.config.hashKey, this.config.hashIv)) {
      logger.warn('TradeSha 驗證失敗', {
        module: 'PaymentService',
        action: 'processNotify',
        metadata: { ipAddress },
      })
      return { success: false, message: 'TradeSha 驗證失敗' }
    }

    // 解密交易資訊
    const decrypted = decryptTradeInfo(tradeInfo, this.config) as {
      Status: string
      Message: string
      Result: {
        MerchantID: string
        Amt: number
        TradeNo: string
        MerchantOrderNo: string
        PaymentType: string
        PayTime: string
        IP: string
        EscrowBank?: string
        BankCode?: string
        CodeNo?: string
        ExpireDate?: string
      }
    }

    const { Status, Message, Result } = decrypted

    // 檢查是否已處理過
    const existing = await this.getPaymentByTradeNo(Result.TradeNo)
    if (existing) {
      logger.info('重複的付款通知', {
        module: 'PaymentService',
        action: 'processNotify',
        metadata: { tradeNo: Result.TradeNo },
      })
      return {
        success: true,
        tradeNo: Result.TradeNo,
        message: '已處理過',
      }
    }

    // 根據商店訂單編號查詢訂單
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .select('id, total_amount')
      .eq('order_number', Result.MerchantOrderNo)
      .single()

    if (orderError || !order) {
      logger.error('找不到對應訂單', orderError, {
        module: 'PaymentService',
        action: 'processNotify',
        metadata: { merchantOrderNo: Result.MerchantOrderNo },
      })
      return { success: false, message: '找不到對應訂單' }
    }

    // 驗證金額
    if (Math.round(order.total_amount) !== Result.Amt) {
      logger.error('金額不符', new Error('Amount mismatch'), {
        module: 'PaymentService',
        action: 'processNotify',
        metadata: {
          expected: order.total_amount,
          received: Result.Amt,
          orderId: order.id,
        },
      })
      return { success: false, message: '金額不符' }
    }

    // 記錄付款日誌
    await this.supabase.from('payment_logs').insert({
      order_id: order.id,
      trade_no: Result.TradeNo,
      merchant_order_no: Result.MerchantOrderNo,
      status: Status,
      message: Message,
      amount: Result.Amt,
      payment_type: Result.PaymentType,
      bank_code: Result.BankCode,
      raw_data: decrypted,
      ip_address: ipAddress,
    })

    // 更新訂單付款狀態
    const isSuccess = Status === 'SUCCESS'
    const paymentStatus = isSuccess ? 'paid' : 'failed'

    await this.supabase.rpc('update_order_payment_status', {
      p_order_id: order.id,
      p_status: paymentStatus,
      p_trade_no: Result.TradeNo,
      p_payment_time: Result.PayTime ? new Date(Result.PayTime).toISOString() : null,
      p_bank_code: Result.BankCode,
      p_va_account: Result.CodeNo,
      p_expire_date: Result.ExpireDate
        ? new Date(
            `${Result.ExpireDate.slice(0, 4)}-${Result.ExpireDate.slice(4, 6)}-${Result.ExpireDate.slice(6, 8)}`
          ).toISOString()
        : null,
    })

    logger.info(`付款通知處理完成: ${paymentStatus}`, {
      module: 'PaymentService',
      action: 'processNotify',
      metadata: {
        orderId: order.id,
        tradeNo: Result.TradeNo,
        status: Status,
        paymentType: Result.PaymentType,
      },
    })

    return {
      success: isSuccess,
      orderId: order.id,
      tradeNo: Result.TradeNo,
      paymentType: Result.PaymentType,
      amount: Result.Amt,
      message: Message,
    }
  }

  /**
   * 從藍新查詢交易狀態
   *
   * 主動向藍新查詢交易狀態（用於對帳或狀態同步）
   */
  async queryFromNewebPay(merchantOrderNo: string): Promise<Record<string, unknown> | null> {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const checkValue = this.generateQueryCheckValue(merchantOrderNo, timestamp)

    const formData = new URLSearchParams({
      MerchantID: this.config.merchantId,
      Version: '1.3',
      RespondType: 'JSON',
      CheckValue: checkValue,
      TimeStamp: timestamp,
      MerchantOrderNo: merchantOrderNo,
      Amt: '0', // 查詢時金額填 0
    })

    try {
      const response = await fetch(this.config.queryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      const result = await response.json()

      logger.info('查詢藍新交易狀態', {
        module: 'PaymentService',
        action: 'queryFromNewebPay',
        metadata: { merchantOrderNo, status: result.Status },
      })

      return result
    } catch (error) {
      logger.error('查詢藍新交易狀態失敗', error as Error, {
        module: 'PaymentService',
        action: 'queryFromNewebPay',
        metadata: { merchantOrderNo },
      })
      return null
    }
  }

  // ==========================================
  // 私有方法
  // ==========================================

  /**
   * 生成查詢用的 CheckValue
   */
  private generateQueryCheckValue(merchantOrderNo: string, timestamp: string): string {
    const crypto = require('crypto')
    const data = `IV=${this.config.hashIv}&Amt=0&MerchantID=${this.config.merchantId}&MerchantOrderNo=${merchantOrderNo}&Key=${this.config.hashKey}`
    return crypto.createHash('sha256').update(data).digest('hex').toUpperCase()
  }

  /**
   * 映射付款日誌資料
   */
  private mapPaymentLog(data: Record<string, unknown>): PaymentLog {
    return {
      id: data.id as string,
      orderId: data.order_id as string,
      tradeNo: data.trade_no as string,
      merchantOrderNo: data.merchant_order_no as string,
      status: data.status as string,
      message: data.message as string,
      amount: data.amount as number,
      paymentType: data.payment_type as string,
      bankCode: data.bank_code as string,
      rawData: data.raw_data as Record<string, unknown>,
      ipAddress: data.ip_address as string,
      createdAt: data.created_at as string,
    }
  }
}

// 匯出單例
export const paymentService = new PaymentService()
