'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { logger } from '@/lib/logger'

export type VersionType = 'v1' | 'v2'

export interface VersionConfig {
  defaultVersion: VersionType
  enableABTesting: boolean
  testingRatio: number // 0.0 - 1.0, V2 版本的使用者比例
  forceVersion?: VersionType
}

export interface VersionSwitchResult {
  currentVersion: VersionType
  isV2Enabled: boolean
  switchToV1: () => void
  switchToV2: () => void
  toggleVersion: () => void
  getVersionStats: () => VersionStats
  resetPreference: () => void
}

export interface VersionStats {
  totalSessions: number
  v1Sessions: number
  v2Sessions: number
  userPreference: VersionType | null
  abTestGroup: string | null
  firstVisit: boolean
}

const STORAGE_KEYS = {
  VERSION_PREFERENCE: 'product-page-version-preference',
  VERSION_STATS: 'product-page-version-stats',
  AB_TEST_GROUP: 'product-page-ab-test-group',
  FIRST_VISIT: 'product-page-first-visit',
}

const DEFAULT_CONFIG: VersionConfig = {
  defaultVersion: 'v1',
  enableABTesting: true,
  testingRatio: 0.3, // 30% 使用者使用 V2
}

/**
 * 版本切換 Hook
 *
 * 功能特色：
 * - A/B 測試支援
 * - 使用者偏好記憶
 * - URL 參數控制
 * - 統計資料收集
 * - 強制版本控制
 */
export function useVersionSwitch(config: Partial<VersionConfig> = {}): VersionSwitchResult {
  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [currentVersion, setCurrentVersion] = useState<VersionType>(mergedConfig.defaultVersion)
  const [stats, setStats] = useState<VersionStats>({
    totalSessions: 0,
    v1Sessions: 0,
    v2Sessions: 0,
    userPreference: null,
    abTestGroup: null,
    firstVisit: true,
  })

  // 從 localStorage 載入統計資料
  const loadStats = useCallback((): VersionStats => {
    if (typeof window === 'undefined') {
      return stats
    }

    try {
      const savedStats = localStorage.getItem(STORAGE_KEYS.VERSION_STATS)
      return savedStats ? JSON.parse(savedStats) : stats
    } catch (error) {
      logger.warn('載入版本統計失敗', { metadata: { error: String(error) } })
      return stats
    }
  }, [stats])

  // 儲存統計資料
  const saveStats = useCallback((newStats: VersionStats) => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEYS.VERSION_STATS, JSON.stringify(newStats))
      setStats(newStats)
    } catch (error) {
      logger.warn('儲存版本統計失敗', { metadata: { error: String(error) } })
    }
  }, [])

  // 決定使用者的版本
  const determineVersion = useCallback((): VersionType => {
    if (typeof window === 'undefined') {
      return mergedConfig.defaultVersion
    }

    try {
      // 1. 檢查 URL 參數（最高優先級）
      const urlVersion = searchParams?.get('version') as VersionType
      if (urlVersion === 'v1' || urlVersion === 'v2') {
        logger.debug('使用 URL 參數版本', { metadata: { version: urlVersion } })
        return urlVersion
      }

      // 2. 檢查強制版本設定
      if (mergedConfig.forceVersion) {
        logger.debug('使用強制版本', { metadata: { version: mergedConfig.forceVersion } })
        return mergedConfig.forceVersion
      }

      // 3. 檢查使用者偏好
      const userPreference = localStorage.getItem(STORAGE_KEYS.VERSION_PREFERENCE) as VersionType
      if (userPreference === 'v1' || userPreference === 'v2') {
        logger.debug('使用使用者偏好版本', { metadata: { version: userPreference } })
        return userPreference
      }

      // 4. A/B 測試分組
      if (mergedConfig.enableABTesting) {
        let abTestGroup = localStorage.getItem(STORAGE_KEYS.AB_TEST_GROUP)

        if (!abTestGroup) {
          // 首次訪問，分配測試組
          const isFirstVisit = !localStorage.getItem(STORAGE_KEYS.FIRST_VISIT)
          const randomValue = Math.random()

          if (randomValue < mergedConfig.testingRatio) {
            abTestGroup = 'v2'
          } else {
            abTestGroup = 'v1'
          }

          localStorage.setItem(STORAGE_KEYS.AB_TEST_GROUP, abTestGroup)
          localStorage.setItem(STORAGE_KEYS.FIRST_VISIT, 'false')

          logger.info('A/B 測試分組', {
            metadata: {
              abTestGroup,
              randomValue,
              testingRatio: mergedConfig.testingRatio,
              isFirstVisit,
            },
          })
        }

        return abTestGroup as VersionType
      }

      // 5. 預設版本
      return mergedConfig.defaultVersion
    } catch (error) {
      logger.error('版本決策失敗，使用預設版本', error as Error)
      return mergedConfig.defaultVersion
    }
  }, [searchParams, mergedConfig])

  // 切換到指定版本
  const switchToVersion = useCallback(
    (version: VersionType, recordPreference = true) => {
      setCurrentVersion(version)

      if (typeof window === 'undefined') return

      try {
        // 記錄使用者偏好
        if (recordPreference) {
          localStorage.setItem(STORAGE_KEYS.VERSION_PREFERENCE, version)
        }

        // 更新統計
        const currentStats = loadStats()
        const newStats: VersionStats = {
          ...currentStats,
          totalSessions: currentStats.totalSessions + 1,
          v1Sessions: version === 'v1' ? currentStats.v1Sessions + 1 : currentStats.v1Sessions,
          v2Sessions: version === 'v2' ? currentStats.v2Sessions + 1 : currentStats.v2Sessions,
          userPreference: recordPreference ? version : currentStats.userPreference,
          abTestGroup: localStorage.getItem(STORAGE_KEYS.AB_TEST_GROUP),
          firstVisit: false,
        }

        saveStats(newStats)

        // 記錄版本切換事件
        logger.info('版本切換', {
          metadata: {
            previousVersion: currentVersion,
            newVersion: version,
            recordPreference,
            totalSessions: newStats.totalSessions,
            pathname,
          },
        })
      } catch (error) {
        logger.error('版本切換失敗', error as Error)
      }
    },
    [currentVersion, loadStats, saveStats, pathname]
  )

  // 便捷切換方法
  const switchToV1 = useCallback(() => switchToVersion('v1'), [switchToVersion])
  const switchToV2 = useCallback(() => switchToVersion('v2'), [switchToVersion])
  const toggleVersion = useCallback(() => {
    switchToVersion(currentVersion === 'v1' ? 'v2' : 'v1')
  }, [currentVersion, switchToVersion])

  // 重置偏好
  const resetPreference = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(STORAGE_KEYS.VERSION_PREFERENCE)
      localStorage.removeItem(STORAGE_KEYS.AB_TEST_GROUP)

      // 重新決定版本
      const newVersion = determineVersion()
      switchToVersion(newVersion, false)

      logger.info('版本偏好已重置', {
        metadata: {
          newVersion,
          pathname,
        },
      })
    } catch (error) {
      logger.error('重置版本偏好失敗', error as Error)
    }
  }, [determineVersion, switchToVersion, pathname])

  // 取得統計資料
  const getVersionStats = useCallback((): VersionStats => {
    return loadStats()
  }, [loadStats])

  // 更新 URL（不記錄到歷史記錄）
  const updateURL = useCallback((version: VersionType) => {
    if (typeof window === 'undefined') return

    try {
      const url = new URL(window.location.href)
      url.searchParams.set('version', version)

      // 使用 replace 避免影響瀏覽器歷史
      window.history.replaceState({}, '', url.toString())
    } catch (error) {
      logger.warn('更新 URL 失敗', { metadata: { error: String(error) } })
    }
  }, [])

  // 初始化 - 使用 ref 確保只執行一次
  const isInitialized = useRef(false)
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const initialVersion = determineVersion()
    switchToVersion(initialVersion, false)

    // 同步 URL（如果需要）
    if (initialVersion !== searchParams?.get('version')) {
      updateURL(initialVersion)
    }
  }, [determineVersion, switchToVersion, searchParams, updateURL])

  // 監聽 URL 參數變化
  useEffect(() => {
    const urlVersion = searchParams?.get('version') as VersionType
    if (
      urlVersion &&
      (urlVersion === 'v1' || urlVersion === 'v2') &&
      urlVersion !== currentVersion
    ) {
      switchToVersion(urlVersion, false)
    }
  }, [searchParams, currentVersion, switchToVersion])

  return {
    currentVersion,
    isV2Enabled: currentVersion === 'v2',
    switchToV1,
    switchToV2,
    toggleVersion,
    getVersionStats,
    resetPreference,
  }
}

/**
 * 便捷 Hook：只返回當前版本狀態
 */
export function useCurrentVersion(config?: Partial<VersionConfig>): {
  isV2: boolean
  version: VersionType
} {
  const { currentVersion, isV2Enabled } = useVersionSwitch(config)

  return {
    isV2: isV2Enabled,
    version: currentVersion,
  }
}

/**
 * 便捷函數：檢查是否為 V2 版本
 */
export function isV2Version(): boolean {
  if (typeof window === 'undefined') return false

  try {
    // 檢查 URL 參數
    const urlParams = new URLSearchParams(window.location.search)
    const urlVersion = urlParams.get('version')
    if (urlVersion === 'v2') return true
    if (urlVersion === 'v1') return false

    // 檢查 localStorage
    const preference = localStorage.getItem(STORAGE_KEYS.VERSION_PREFERENCE)
    return preference === 'v2'
  } catch {
    return false
  }
}
