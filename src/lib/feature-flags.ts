/**
 * Feature Flags 配置
 * 用於控制新功能的啟用/停用
 */

/**
 * Feature flags 配置物件
 */
export const FEATURE_FLAGS = {
  // Hook 架構重構
  USE_INQUIRY_STATS_V2:
    process.env.NEXT_PUBLIC_USE_INQUIRY_STATS_V2 === 'true' ||
    process.env.NODE_ENV === 'development', // 開發環境預設啟用

  // 其他可能的功能開關
  ENABLE_DEBUG_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_PERFORMANCE_MONITORING: true,
} as const

/**
 * 檢查 feature flag 是否啟用
 */
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag]
}

/**
 * Feature flag 資訊（用於調試）
 */
export function getFeatureFlagInfo() {
  return {
    flags: FEATURE_FLAGS,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }
}
