/**
 * 藍新金流配置和加密工具
 *
 * 提供藍新 NewebPay 金流整合所需的配置和加密/解密功能
 */

import crypto from 'crypto'
import { logger } from '@/lib/logger'

// ==========================================
// 配置
// ==========================================

export interface NewebPayConfig {
  merchantId: string
  hashKey: string
  hashIv: string
  apiUrl: string
  queryUrl: string
  returnUrl: string
  notifyUrl: string
  version: string
}

/**
 * 取得藍新金流配置
 * @throws 如果必要的環境變數未設定
 */
export function getNewebPayConfig(): NewebPayConfig {
  const config = {
    merchantId: process.env.NEWEBPAY_MERCHANT_ID,
    hashKey: process.env.NEWEBPAY_HASH_KEY,
    hashIv: process.env.NEWEBPAY_HASH_IV,
    apiUrl: process.env.NEWEBPAY_API_URL,
    queryUrl: process.env.NEWEBPAY_QUERY_URL,
    returnUrl: process.env.NEWEBPAY_RETURN_URL,
    notifyUrl: process.env.NEWEBPAY_NOTIFY_URL,
  }

  // 驗證必要配置
  const missingKeys = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missingKeys.length > 0) {
    logger.error('藍新金流配置缺失', new Error('Missing NewebPay config'), {
      module: 'NewebPayConfig',
      action: 'getNewebPayConfig',
      metadata: { missingKeys },
    })
    throw new Error(`藍新金流配置缺失: ${missingKeys.join(', ')}`)
  }

  return {
    merchantId: config.merchantId!,
    hashKey: config.hashKey!,
    hashIv: config.hashIv!,
    apiUrl: config.apiUrl!,
    queryUrl: config.queryUrl!,
    returnUrl: config.returnUrl!,
    notifyUrl: config.notifyUrl!,
    version: '2.0', // MPG 版本
  }
}

// ==========================================
// 加密工具
// ==========================================

/**
 * AES-256-CBC 加密
 *
 * 藍新金流使用 AES-256-CBC 加密交易資訊
 * @param data - 要加密的資料（物件會自動轉為 JSON）
 * @param key - HashKey
 * @param iv - HashIV
 * @returns 加密後的十六進位字串
 */
export function aesEncrypt(data: string | object, key: string, iv: string): string {
  const dataString = typeof data === 'object' ? JSON.stringify(data) : data

  // 將 key 和 iv 轉換為正確長度的 Buffer
  const keyBuffer = Buffer.from(key, 'utf8')
  const ivBuffer = Buffer.from(iv, 'utf8')

  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, ivBuffer)
  let encrypted = cipher.update(dataString, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return encrypted
}

/**
 * AES-256-CBC 解密
 *
 * @param encryptedData - 加密後的十六進位字串
 * @param key - HashKey
 * @param iv - HashIV
 * @returns 解密後的字串
 */
export function aesDecrypt(encryptedData: string, key: string, iv: string): string {
  const keyBuffer = Buffer.from(key, 'utf8')
  const ivBuffer = Buffer.from(iv, 'utf8')

  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer)
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * 生成 SHA256 檢查碼
 *
 * 藍新金流使用 SHA256 驗證交易資訊完整性
 * 格式：HashKey=xxx&TradeInfo&HashIV=xxx
 *
 * @param tradeInfo - 加密後的交易資訊
 * @param key - HashKey
 * @param iv - HashIV
 * @returns SHA256 大寫十六進位字串
 */
export function generateTradeSha(tradeInfo: string, key: string, iv: string): string {
  const data = `HashKey=${key}&${tradeInfo}&HashIV=${iv}`
  return crypto.createHash('sha256').update(data).digest('hex').toUpperCase()
}

/**
 * 驗證 TradeSha 是否正確
 *
 * @param tradeInfo - 加密後的交易資訊
 * @param tradeSha - 要驗證的 SHA256 檢查碼
 * @param key - HashKey
 * @param iv - HashIV
 * @returns 是否驗證通過
 */
export function verifyTradeSha(
  tradeInfo: string,
  tradeSha: string,
  key: string,
  iv: string
): boolean {
  const expectedSha = generateTradeSha(tradeInfo, key, iv)
  return expectedSha === tradeSha.toUpperCase()
}

// ==========================================
// 交易資訊處理
// ==========================================

export interface TradeInfoData {
  MerchantID: string
  RespondType: 'JSON'
  TimeStamp: string
  Version: string
  MerchantOrderNo: string
  Amt: number
  ItemDesc: string
  Email?: string
  LoginType?: 0 | 1
  OrderComment?: string
  // 付款方式開關
  CREDIT?: 0 | 1
  VACC?: 0 | 1
  CVS?: 0 | 1
  WEBATM?: 0 | 1
  // ATM/CVS 相關
  ExpireDate?: string // YYYYMMDD
  // 回調 URL
  ReturnURL?: string
  NotifyURL?: string
  ClientBackURL?: string
}

/**
 * 建立加密的交易資訊
 *
 * @param data - 交易資訊
 * @param config - 藍新配置
 * @returns 加密後的 TradeInfo 和 TradeSha
 */
export function createEncryptedTradeInfo(
  data: TradeInfoData,
  config: NewebPayConfig
): { tradeInfo: string; tradeSha: string } {
  // 轉換為 URL 編碼的查詢字串
  const params = new URLSearchParams()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value))
    }
  })

  const tradeInfoString = params.toString()

  // AES 加密
  const tradeInfo = aesEncrypt(tradeInfoString, config.hashKey, config.hashIv)

  // 生成 SHA256
  const tradeSha = generateTradeSha(tradeInfo, config.hashKey, config.hashIv)

  logger.debug('建立加密交易資訊', {
    module: 'NewebPayCrypto',
    action: 'createEncryptedTradeInfo',
    metadata: {
      merchantOrderNo: data.MerchantOrderNo,
      amount: data.Amt,
    },
  })

  return { tradeInfo, tradeSha }
}

/**
 * 解密並解析交易資訊
 *
 * @param tradeInfo - 加密的交易資訊
 * @param config - 藍新配置
 * @returns 解密後的交易資訊物件
 */
export function decryptTradeInfo(
  tradeInfo: string,
  config: NewebPayConfig
): Record<string, unknown> {
  const decrypted = aesDecrypt(tradeInfo, config.hashKey, config.hashIv)

  // 嘗試解析為 JSON（新版回傳格式）
  try {
    return JSON.parse(decrypted)
  } catch {
    // 如果不是 JSON，嘗試解析為 URL 查詢字串
    const params = new URLSearchParams(decrypted)
    const result: Record<string, string> = {}
    params.forEach((value, key) => {
      result[key] = value
    })
    return result
  }
}

// ==========================================
// 付款狀態碼
// ==========================================

export const PAYMENT_STATUS_CODES: Record<string, string> = {
  SUCCESS: 'SUCCESS',
  // 信用卡相關
  '1': '已授權',
  // ATM 相關
  '0': '未付款',
  '2': '付款完成',
  // 超商代碼相關
  '3': '已取號',
  '4': '已繳費',
}

/**
 * 取得付款狀態描述
 */
export function getPaymentStatusDescription(status: string): string {
  return PAYMENT_STATUS_CODES[status] || `未知狀態 (${status})`
}

// ==========================================
// 常數
// ==========================================

export const NEWEBPAY_CONSTANTS = {
  // 付款方式
  PAYMENT_TYPES: {
    CREDIT: 'CREDIT',
    VACC: 'VACC',
    CVS: 'CVS',
    WEBATM: 'WEBATM',
  } as const,

  // 超商代碼
  CVS_STORES: {
    SEVEN: 'SEVEN',
    FAMILY: 'FAMILY',
    HILIFE: 'HILIFE',
    OK: 'OK',
  } as const,

  // 測試信用卡
  TEST_CARD: {
    NUMBER: '4000-2211-1111-1111',
    EXPIRY: 'any future date',
    CVV: 'any 3 digits',
  } as const,
} as const
