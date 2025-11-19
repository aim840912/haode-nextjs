/**
 * Identifier Extraction Utilities
 *
 * 從請求中提取用於 Rate Limiting 的識別符
 */

import { NextRequest } from 'next/server'
import { IdentifierStrategy } from '../types'

/**
 * 獲取客戶端 IP
 *
 * 支援多種 Header 格式 (Vercel / Cloudflare / Nginx)
 */
export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

/**
 * 從請求中提取識別符
 *
 * @param request - Next.js 請求物件
 * @param strategy - 識別策略
 * @returns 識別符字串
 */
export function extractIdentifier(request: NextRequest, strategy: IdentifierStrategy): string {
  switch (strategy) {
    case IdentifierStrategy.IP:
      return getClientIP(request)

    case IdentifierStrategy.USER_ID:
      // 從 JWT token 或 session 中提取用戶 ID
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        try {
          // 這裡簡化處理,實際應該解碼 JWT
          return `user:${authHeader.split(' ')[1]?.substring(0, 10)}`
        } catch {
          return getClientIP(request)
        }
      }
      return getClientIP(request)

    case IdentifierStrategy.API_KEY:
      const apiKey = request.headers.get('x-admin-key') || request.headers.get('x-api-key')
      return apiKey ? `api:${apiKey.substring(0, 8)}` : getClientIP(request)

    case IdentifierStrategy.COMBINED:
      const ip = getClientIP(request)
      const userAgent = request.headers.get('user-agent')?.substring(0, 20) || ''
      return `combined:${ip}:${Buffer.from(userAgent).toString('base64').substring(0, 8)}`

    default:
      return getClientIP(request)
  }
}
