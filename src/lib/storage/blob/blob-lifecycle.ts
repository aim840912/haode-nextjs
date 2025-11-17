/**
 * Blob URL 生命週期管理
 *
 * 負責 Blob URL 的建立、撤銷和引用計數:
 * - createURL: 建立並追蹤 Blob URL
 * - revokeURL: 撤銷單一 URL
 * - addReference/removeReference: 引用計數管理
 * - revokeGroup: 批次撤銷群組
 */

import { logger } from '@/lib/logger'
import type { BlobURLInfo } from '../BlobURLManager'

/**
 * 建立 Blob URL 並自動管理
 */
export function createURL(
  blob: Blob,
  urlMap: Map<string, BlobURLInfo>,
  groupMap: Map<string, Set<string>>,
  options?: {
    group?: string
    metadata?: BlobURLInfo['metadata']
    ttl?: number
  }
): string {
  try {
    const url = URL.createObjectURL(blob)
    const now = Date.now()

    const info: BlobURLInfo = {
      url,
      blob,
      createdAt: now,
      lastAccessedAt: now,
      refCount: 1,
      group: options?.group,
      metadata: {
        fileSize: blob.size,
        mimeType: blob.type,
        ...options?.metadata,
      },
    }

    urlMap.set(url, info)

    // 群組管理
    if (options?.group) {
      if (!groupMap.has(options.group)) {
        groupMap.set(options.group, new Set())
      }
      groupMap.get(options.group)!.add(url)
    }

    // 自動 TTL 清理
    if (options?.ttl) {
      setTimeout(() => {
        revokeURL(url, urlMap, groupMap)
      }, options.ttl)
    }

    logger.info('Blob URL 已建立', {
      metadata: {
        url: url.substring(0, 50) + '...',
        size: blob.size,
        group: options?.group,
        type: blob.type,
      },
    })

    return url
  } catch (error) {
    logger.error('Blob URL 建立失敗', error as Error, {
      metadata: {
        blobSize: blob.size,
        blobType: blob.type,
        group: options?.group,
      },
    })
    throw error
  }
}

/**
 * 增加引用計數
 */
export function addReference(url: string, urlMap: Map<string, BlobURLInfo>): boolean {
  const info = urlMap.get(url)
  if (info) {
    info.refCount++
    info.lastAccessedAt = Date.now()
    return true
  }
  return false
}

/**
 * 減少引用計數
 */
export function removeReference(
  url: string,
  urlMap: Map<string, BlobURLInfo>,
  groupMap: Map<string, Set<string>>
): boolean {
  const info = urlMap.get(url)
  if (info) {
    info.refCount = Math.max(0, info.refCount - 1)
    if (info.refCount === 0) {
      // 延遲清理，給一個緩衝時間
      setTimeout(() => {
        const currentInfo = urlMap.get(url)
        if (currentInfo && currentInfo.refCount === 0) {
          revokeURL(url, urlMap, groupMap)
        }
      }, 1000) // 1秒緩衝
    }
    return true
  }
  return false
}

/**
 * 撤銷特定 URL
 */
export function revokeURL(
  url: string,
  urlMap: Map<string, BlobURLInfo>,
  groupMap: Map<string, Set<string>>
): boolean {
  try {
    const info = urlMap.get(url)
    if (!info) {
      return false
    }

    // 從瀏覽器中撤銷
    URL.revokeObjectURL(url)

    // 從群組中移除
    if (info.group && groupMap.has(info.group)) {
      groupMap.get(info.group)!.delete(url)

      // 清理空群組
      if (groupMap.get(info.group)!.size === 0) {
        groupMap.delete(info.group)
      }
    }

    // 從主映射中移除
    urlMap.delete(url)

    logger.debug('Blob URL 已撤銷', {
      metadata: {
        url: url.substring(0, 50) + '...',
        size: info.metadata?.fileSize || 0,
        group: info.group,
        age: Date.now() - info.createdAt,
      },
    })

    return true
  } catch (error) {
    logger.error('Blob URL 撤銷失敗', error as Error, {
      metadata: { url: url.substring(0, 50) + '...' },
    })
    return false
  }
}

/**
 * 撤銷整個群組的 URL
 */
export function revokeGroup(
  group: string,
  urlMap: Map<string, BlobURLInfo>,
  groupMap: Map<string, Set<string>>
): number {
  const urls = groupMap.get(group)
  if (!urls) {
    return 0
  }

  let revokedCount = 0
  for (const url of Array.from(urls)) {
    if (revokeURL(url, urlMap, groupMap)) {
      revokedCount++
    }
  }

  logger.info('群組 Blob URL 已批次撤銷', {
    metadata: { group, revokedCount },
  })

  return revokedCount
}
