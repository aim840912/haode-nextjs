import { useCallback } from 'react'
import { syncLocalInterests as syncInterestsToCloud } from '@/lib/api/user-interests-api'
import { logger } from '@/lib/logger'

// 本地儲存工具函數
const getLocalInterests = (): string[] => {
  try {
    if (typeof localStorage === 'undefined') {
      return []
    }
    const saved = localStorage.getItem('interestedProducts')
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    logger.error('取得本地興趣清單失敗', error as Error, {
      metadata: { action: 'get_local_interests' },
    })
    return []
  }
}

const clearLocalInterests = (): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('interestedProducts')
      // 觸發事件通知其他元件更新
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('interestedProductsUpdated'))
      }
    }
  } catch (error) {
    logger.error('清除本地興趣清單失敗', error as Error, {
      metadata: { action: 'clear_local_interests' },
    })
  }
}

export function useAuthInterests() {
  // 同步使用者興趣清單
  const syncUserInterests = useCallback(async () => {
    try {
      // 取得本地興趣清單
      const localInterests = getLocalInterests()

      // 同步到雲端並取得合併後的清單（使用 API 呼叫）
      const mergedInterests = await syncInterestsToCloud(localInterests)

      // 清除本地儲存，改用雲端資料
      clearLocalInterests()

      logger.debug('User interests synced', {
        metadata: { count: mergedInterests.length, action: 'sync_interests' },
      })
    } catch (error) {
      logger.error('Error syncing user interests', error as Error, {
        metadata: { action: 'sync_interests' },
      })
    }
  }, [])

  return { syncUserInterests }
}
