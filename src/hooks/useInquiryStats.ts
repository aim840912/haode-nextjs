/**
 * 詢價統計資料 Hook - 智能切換版本
 * 根據 feature flag 在 V1 和 V2 版本之間切換
 *
 * V1: 原始版本（單體 hook）
 * V2: 重構版本（模組化 hooks 組合）
 */

'use client'

import { isFeatureEnabled } from '@/lib/feature-flags'
import { logger } from '@/lib/logger'

// 導入兩個版本
import { useInquiryStats as useInquiryStatsV1, UseInquiryStatsReturn } from './useInquiryStatsV1'
import { useInquiryStats as useInquiryStatsV2 } from './useInquiryStatsV2'

/**
 * 主要的詢價統計 Hook
 * 自動根據 feature flag 選擇版本
 */
export function useInquiryStats(
  baseRefreshInterval = process.env.NODE_ENV === 'production' ? 120000 : 300000
): UseInquiryStatsReturn {
  const useV2 = isFeatureEnabled('USE_INQUIRY_STATS_V2')

  // 總是調用兩個 hooks，但只使用其中一個的結果
  // 這遵循了 React Hooks 規則：始終以相同順序調用相同數量的 hooks
  const resultV1 = useInquiryStatsV1(baseRefreshInterval)
  const resultV2 = useInquiryStatsV2(baseRefreshInterval)

  // 開發環境記錄使用的版本
  if (process.env.NODE_ENV === 'development') {
    logger.debug(
      `[useInquiryStats] Using version: ${useV2 ? 'V2 (refactored)' : 'V1 (original)'}`,
      {
        module: 'useInquiryStats',
        metadata: {
          version: useV2 ? 'V2' : 'V1',
          baseRefreshInterval,
          featureFlag: useV2,
        },
      }
    )
  }

  // 根據 feature flag 返回對應版本的結果
  return useV2 ? resultV2 : resultV1
}

// 重新導出類型以保持向後相容
export type { UseInquiryStatsReturn } from './useInquiryStatsV1'
