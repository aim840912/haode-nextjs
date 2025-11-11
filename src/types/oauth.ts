/**
 * OAuth Provider 類型
 * 支援的社交登入平台
 */
export type OAuthProvider = 'google' | 'facebook' | 'line'

/**
 * OAuth 登入選項
 */
export interface OAuthSignInOptions {
  /** 登入成功後的導向 URL */
  redirectTo?: string
  /** 額外的 OAuth 參數 */
  scopes?: string
}

/**
 * OAuth Profile 資訊
 * 從 user.user_metadata 提取的使用者資訊
 */
export interface OAuthProfile {
  provider: OAuthProvider
  email: string
  name?: string
  avatar_url?: string
  provider_id: string
}

/**
 * 社交登入提供者資訊
 */
export interface SocialProvider {
  id: OAuthProvider
  name: string
  enabled: boolean
}

/**
 * OAuth 錯誤類型
 */
export type OAuthError = 'oauth_failed' | 'oauth_cancelled' | 'oauth_timeout' | 'provider_disabled'

/**
 * OAuth 登入結果
 */
export interface OAuthSignInResult {
  error: Error | null
  provider?: OAuthProvider
}
