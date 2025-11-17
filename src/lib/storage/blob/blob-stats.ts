/**
 * Blob URL 統計管理
 *
 * 負責統計資訊的收集和計算:
 * - getStats: 完整統計資訊
 * - getTotalMemoryUsage: 總記憶體使用量
 */

import type { BlobURLInfo, BlobURLStats } from '../BlobURLManager'

/**
 * 取得統計資訊
 */
export function getStats(urlMap: Map<string, BlobURLInfo>): BlobURLStats {
  const stats: BlobURLStats = {
    totalUrls: urlMap.size,
    totalMemoryUsage: 0,
    groupStats: {},
    oldestUrl: null,
    largestBlob: null,
  }

  const now = Date.now()
  let oldestAge = 0
  let largestSize = 0

  // 計算統計資料
  for (const [url, info] of urlMap) {
    const size = info.metadata?.fileSize || 0
    const age = now - info.createdAt

    stats.totalMemoryUsage += size

    // 群組統計
    const group = info.group || 'ungrouped'
    if (!stats.groupStats[group]) {
      stats.groupStats[group] = {
        count: 0,
        memoryUsage: 0,
        avgAge: 0,
      }
    }

    stats.groupStats[group].count++
    stats.groupStats[group].memoryUsage += size
    stats.groupStats[group].avgAge += age

    // 最舊 URL
    if (age > oldestAge) {
      oldestAge = age
      stats.oldestUrl = { url: url.substring(0, 50) + '...', age }
    }

    // 最大 Blob
    if (size > largestSize) {
      largestSize = size
      stats.largestBlob = { url: url.substring(0, 50) + '...', size }
    }
  }

  // 計算平均年齡
  for (const group of Object.keys(stats.groupStats)) {
    const groupStat = stats.groupStats[group]
    if (groupStat.count > 0) {
      groupStat.avgAge = Math.floor(groupStat.avgAge / groupStat.count)
    }
  }

  return stats
}

/**
 * 取得總記憶體使用量
 */
export function getTotalMemoryUsage(urlMap: Map<string, BlobURLInfo>): number {
  let total = 0
  for (const info of urlMap.values()) {
    total += info.metadata?.fileSize || 0
  }
  return total
}
