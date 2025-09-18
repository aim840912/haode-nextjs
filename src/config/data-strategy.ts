/**
 * 混合資料策略配置
 *
 * 根據環境和資料類型決定使用 JSON 檔案還是 Supabase
 * 符合 advice.md 中的三階段漸進式策略
 */

import { logger } from '@/lib/logger'

export type DataSource = 'json' | 'supabase' | 'cache+json' | 'cache+supabase'

export interface DataStrategyConfig {
  // 核心服務
  products: DataSource
  schedule: DataSource
  farmTour: DataSource
  news: DataSource
  moments: DataSource
  locations: DataSource
  reviews: DataSource

  // 動態資料（需要即時性）
  orders: DataSource
  inventory: DataSource
  users: DataSource

  // 系統設定
  useCache: boolean
  fallbackToJson: boolean
}

/**
 * 獲取當前環境的資料策略
 */
export function getDataStrategy(): DataStrategyConfig {
  const useSupabase = process.env.USE_SUPABASE === 'true'
  const nodeEnv = process.env.NODE_ENV
  const hasSupabaseConfig = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // 改善環境變數判斷機制
  // 1. 如果明確設定 USE_SUPABASE=false，則使用 JSON
  // 2. 如果沒有 Supabase 配置，則使用 JSON
  // 3. 如果在生產環境且有 Supabase 配置，預設使用 Supabase
  // 4. 如果明確設定 USE_SUPABASE=true，且有配置，則使用 Supabase

  const shouldUseJson = process.env.USE_SUPABASE === 'false' || !hasSupabaseConfig
  const isProduction = nodeEnv === 'production'
  const explicitlyUseSupabase = useSupabase && hasSupabaseConfig
  const autoUseSupabaseInProduction =
    isProduction && hasSupabaseConfig && process.env.USE_SUPABASE !== 'false'

  if (shouldUseJson) {
    // 明確不使用 Supabase 或無配置時的 fallback
    return {
      products: 'json',
      schedule: 'json',
      farmTour: 'json',
      news: 'json',
      moments: 'json',
      locations: 'json',
      reviews: 'json',
      orders: 'json',
      inventory: 'json',
      users: 'json',
      useCache: false,
      fallbackToJson: true,
    }
  }

  // 有 Supabase 配置時 - 全部使用 Supabase
  return {
    products: 'cache+supabase',
    schedule: 'cache+supabase',
    farmTour: 'cache+supabase',
    news: 'cache+supabase',
    moments: 'cache+supabase',
    locations: 'cache+supabase',
    reviews: 'cache+supabase',
    orders: 'cache+supabase',
    inventory: 'cache+supabase',
    users: 'cache+supabase',
    useCache: true,
    fallbackToJson: true, // 保留 JSON 作為緊急 fallback
  }
}

/**
 * 檢查特定資料類型是否應該使用 Supabase
 */
export function shouldUseSupabase(
  dataType: keyof Omit<DataStrategyConfig, 'useCache' | 'fallbackToJson'>
): boolean {
  const strategy = getDataStrategy()
  const source = strategy[dataType]
  return source.includes('supabase')
}

/**
 * 檢查是否應該使用快取
 */
export function shouldUseCache(
  dataType: keyof Omit<DataStrategyConfig, 'useCache' | 'fallbackToJson'>
): boolean {
  const strategy = getDataStrategy()
  const source = strategy[dataType]
  return strategy.useCache && source.includes('cache')
}

/**
 * 檢查是否有 fallback 機制
 */
export function shouldFallbackToJson(): boolean {
  const strategy = getDataStrategy()
  return strategy.fallbackToJson
}

/**
 * 獲取當前策略的摘要資訊（用於調試）
 */
export function getStrategyInfo() {
  const strategy = getDataStrategy()
  const nodeEnv = process.env.NODE_ENV || 'development'
  const useSupabaseEnv = process.env.USE_SUPABASE
  const hasSupabaseConfig = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  return {
    environment: nodeEnv,
    useSupabaseEnv,
    useSupabase: process.env.USE_SUPABASE === 'true',
    hasSupabaseConfig,
    isProduction: nodeEnv === 'production',
    strategy,
    decisionReason: getDecisionReason(useSupabaseEnv, hasSupabaseConfig, nodeEnv),
    summary: {
      primaryDataSource: strategy.products.includes('supabase') ? 'Supabase' : 'JSON',
      cacheEnabled: strategy.useCache,
      fallbackEnabled: strategy.fallbackToJson,
    },
  }
}

function getDecisionReason(
  useSupabaseEnv: string | undefined,
  hasSupabaseConfig: boolean,
  nodeEnv: string
): string {
  if (useSupabaseEnv === 'false') {
    return 'USE_SUPABASE explicitly set to false'
  }
  if (!hasSupabaseConfig) {
    return 'No Supabase configuration found'
  }
  if (useSupabaseEnv === 'true') {
    return 'USE_SUPABASE explicitly set to true'
  }
  if (nodeEnv === 'production') {
    return 'Production environment with Supabase config available'
  }
  return 'Development environment with Supabase config available'
}

// 輸出策略資訊（僅開發環境）
if (process.env.NODE_ENV === 'development') {
  const info = getStrategyInfo()
  logger.debug('資料策略配置', {
    metadata: {
      environment: info.environment,
      useSupabaseEnv: info.useSupabaseEnv,
      hasSupabaseConfig: info.hasSupabaseConfig,
      decisionReason: info.decisionReason,
      primaryDataSource: info.summary.primaryDataSource,
      cacheEnabled: info.summary.cacheEnabled,
      fallbackEnabled: info.summary.fallbackEnabled,
      action: 'data_strategy_config',
    },
  })
}
