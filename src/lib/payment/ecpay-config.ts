/**
 * 綠界 ECPay 金流配置和加密工具
 *
 * 提供綠界 ECPay 金流整合所需的配置和 CheckMacValue 生成功能
 */

import crypto from 'crypto'
import { logger } from '@/lib/logger'

// ==========================================
// 配置
// ==========================================

export interface ECPayConfig {
  merchantId: string
  hashKey: string
  hashIv: string
  apiUrl: string
  returnUrl: string
  clientBackUrl: string
  orderResultUrl: string
}

/**
 * 取得綠界金流配置
 * @throws 如果必要的環境變數未設定
 */
export function getECPayConfig(): ECPayConfig {
  const config = {
    merchantId: process.env.ECPAY_MERCHANT_ID,
    hashKey: process.env.ECPAY_HASH_KEY,
    hashIv: process.env.ECPAY_HASH_IV,
    apiUrl: process.env.ECPAY_API_URL,
    returnUrl: process.env.ECPAY_RETURN_URL,
    clientBackUrl: process.env.ECPAY_CLIENT_BACK_URL,
    orderResultUrl: process.env.ECPAY_ORDER_RESULT_URL,
  }

  // 驗證必要配置
  const requiredKeys = ['merchantId', 'hashKey', 'hashIv', 'apiUrl']
  const missingKeys = requiredKeys.filter(key => !config[key as keyof typeof config])

  if (missingKeys.length > 0) {
    logger.error('綠界金流配置缺失', new Error('Missing ECPay config'), {
      module: 'ECPayConfig',
      action: 'getECPayConfig',
      metadata: { missingKeys },
    })
    throw new Error(`綠界金流配置缺失: ${missingKeys.join(', ')}`)
  }

  return {
    merchantId: config.merchantId!,
    hashKey: config.hashKey!,
    hashIv: config.hashIv!,
    apiUrl: config.apiUrl!,
    returnUrl: config.returnUrl || '',
    clientBackUrl: config.clientBackUrl || '',
    orderResultUrl: config.orderResultUrl || '',
  }
}

// ==========================================
// CheckMacValue 計算
// ==========================================

/**
 * 綠界 URL 編碼
 *
 * 綠界使用特殊的 URL 編碼規則，需要將某些字元轉換
 */
function ecpayUrlEncode(str: string): string {
  let encoded = encodeURIComponent(str)

  // 綠界特殊編碼規則
  encoded = encoded
    .replace(/%20/g, '+')
    .replace(/%2d/g, '-')
    .replace(/%5f/g, '_')
    .replace(/%2e/g, '.')
    .replace(/%21/g, '!')
    .replace(/%2a/g, '*')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')
    .replace(/%40/g, '@')

  return encoded
}

/**
 * 生成 CheckMacValue
 *
 * 綠界使用 SHA256 計算檢查碼
 * 步驟：
 * 1. 將參數按照 key 字母順序排序
 * 2. 組合成 HashKey=xxx&key1=value1&key2=value2&HashIV=xxx
 * 3. URL 編碼
 * 4. 轉成小寫
 * 5. SHA256 雜湊
 * 6. 轉成大寫
 *
 * @param params - 要計算的參數
 * @param hashKey - HashKey
 * @param hashIv - HashIV
 * @returns SHA256 大寫十六進位字串
 */
export function generateCheckMacValue(
  params: Record<string, string | number>,
  hashKey: string,
  hashIv: string
): string {
  // 1. 按照 key 字母順序排序
  const sortedKeys = Object.keys(params).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  )

  // 2. 組合字串
  const paramString = sortedKeys.map(key => `${key}=${params[key]}`).join('&')

  const rawString = `HashKey=${hashKey}&${paramString}&HashIV=${hashIv}`

  // 3. URL 編碼
  const encodedString = ecpayUrlEncode(rawString)

  // 4. 轉成小寫
  const lowercaseString = encodedString.toLowerCase()

  // 5. SHA256 雜湊
  const hash = crypto.createHash('sha256').update(lowercaseString).digest('hex')

  // 6. 轉成大寫
  return hash.toUpperCase()
}

/**
 * 驗證 CheckMacValue 是否正確
 *
 * @param params - 收到的參數（包含 CheckMacValue）
 * @param hashKey - HashKey
 * @param hashIv - HashIV
 * @returns 是否驗證通過
 */
export function verifyCheckMacValue(
  params: Record<string, string | number>,
  hashKey: string,
  hashIv: string
): boolean {
  const receivedMac = params.CheckMacValue as string
  if (!receivedMac) return false

  // 移除 CheckMacValue 後重新計算
  const { CheckMacValue, ...paramsWithoutMac } = params
  const expectedMac = generateCheckMacValue(paramsWithoutMac, hashKey, hashIv)

  return expectedMac === receivedMac.toUpperCase()
}

// ==========================================
// 交易資訊處理
// ==========================================

export interface ECPayTradeData {
  MerchantID: string
  MerchantTradeNo: string
  MerchantTradeDate: string
  PaymentType: 'aio'
  TotalAmount: number
  TradeDesc: string
  ItemName: string
  ReturnURL: string
  ChoosePayment: 'Credit' | 'WebATM' | 'ATM' | 'CVS' | 'BARCODE' | 'ALL'
  ClientBackURL?: string
  OrderResultURL?: string
  NeedExtraPaidInfo?: 'Y' | 'N'
  EncryptType: 1
  // 信用卡相關
  CreditInstallment?: string
  InstallmentAmount?: number
  Redeem?: 'Y' | 'N'
  // ATM 相關
  ExpireDate?: number
  // CVS/BARCODE 相關
  StoreExpireDate?: number
}

/**
 * 建立付款表單資料
 *
 * @param data - 交易資訊
 * @param config - 綠界配置
 * @returns 完整的表單資料（包含 CheckMacValue）
 */
export function createPaymentFormData(
  data: ECPayTradeData,
  config: ECPayConfig
): Record<string, string | number> {
  // 轉換為字串物件（用於 CheckMacValue 計算）
  const params: Record<string, string | number> = {}

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = value
    }
  })

  // 生成 CheckMacValue
  const checkMacValue = generateCheckMacValue(params, config.hashKey, config.hashIv)

  logger.debug('建立綠界付款表單', {
    module: 'ECPayCrypto',
    action: 'createPaymentFormData',
    metadata: {
      merchantTradeNo: data.MerchantTradeNo,
      amount: data.TotalAmount,
    },
  })

  return {
    ...params,
    CheckMacValue: checkMacValue,
  }
}

/**
 * 格式化交易時間
 *
 * 綠界要求的格式：yyyy/MM/dd HH:mm:ss
 */
export function formatTradeDate(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 生成交易編號
 *
 * 綠界的 MerchantTradeNo 最多 20 字元
 */
export function generateTradeNo(orderId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const shortId = orderId.replace(/-/g, '').slice(0, 8).toUpperCase()
  return `${shortId}${timestamp}`.slice(0, 20)
}

// ==========================================
// 付款方式對應
// ==========================================

export const ECPAY_PAYMENT_METHODS = {
  CREDIT: 'Credit',
  WEBATM: 'WebATM',
  ATM: 'ATM',
  CVS: 'CVS',
  BARCODE: 'BARCODE',
  ALL: 'ALL',
} as const

export type ECPayPaymentMethod = (typeof ECPAY_PAYMENT_METHODS)[keyof typeof ECPAY_PAYMENT_METHODS]

/**
 * 將通用付款方式轉換為綠界格式
 */
export function mapPaymentMethod(method: string): ECPayPaymentMethod {
  const mapping: Record<string, ECPayPaymentMethod> = {
    CREDIT: 'Credit',
    VACC: 'ATM',
    CVS: 'CVS',
    WEBATM: 'WebATM',
  }
  return mapping[method] || 'Credit'
}

// ==========================================
// 回傳狀態碼
// ==========================================

export const ECPAY_RETURN_CODES = {
  SUCCESS: '1',
  SIMULATED: '2', // 模擬付款成功
} as const

/**
 * 檢查交易是否成功
 */
export function isPaymentSuccess(rtnCode: string | number): boolean {
  const code = String(rtnCode)
  return code === ECPAY_RETURN_CODES.SUCCESS || code === ECPAY_RETURN_CODES.SIMULATED
}

// ==========================================
// 常數
// ==========================================

export const ECPAY_CONSTANTS = {
  // 測試信用卡
  TEST_CARDS: {
    DOMESTIC: ['4311-9511-1111-1111', '4311-9522-2222-2222'],
    INTERNATIONAL: '4000-2011-1111-1111',
    EXPIRY: 'any future date (MM/YYYY)',
    CVV: 'any 3 digits',
    OTP: '1234', // 3D 驗證碼
  } as const,

  // ATM 預設到期天數
  DEFAULT_ATM_EXPIRE_DAYS: 3,

  // CVS 預設到期分鐘
  DEFAULT_CVS_EXPIRE_MINUTES: 10080, // 7 天
} as const
