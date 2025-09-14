import { logger } from '@/lib/logger'

const SEARCH_HISTORY_KEY = 'admin_product_search_history'
const MAX_SEARCH_HISTORY = 5

/**
 * 搜尋歷史記錄管理工具類
 * 負責本地儲存的搜尋歷史記錄管理
 */
export class SearchHistoryManager {
  /**
   * 獲取搜尋歷史記錄
   */
  static getHistory(): string[] {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]')
    } catch (error) {
      logger.warn('Failed to read search history', {
        module: 'SearchHistoryManager',
        action: 'getHistory',
        metadata: { error },
      })
      return []
    }
  }

  /**
   * 新增搜尋記錄到歷史
   */
  static addToHistory(searchTerm: string): void {
    if (typeof window === 'undefined' || !searchTerm.trim()) return

    const history = this.getHistory()
    const filtered = history.filter(term => term !== searchTerm)
    const newHistory = [searchTerm, ...filtered].slice(0, MAX_SEARCH_HISTORY)

    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
    } catch (error) {
      logger.warn('Failed to save search history', {
        module: 'SearchHistoryManager',
        action: 'addToHistory',
        metadata: { error, searchTerm },
      })
    }
  }

  /**
   * 清除搜尋歷史記錄
   */
  static clearHistory(): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY)
    } catch (error) {
      logger.warn('Failed to clear search history', {
        module: 'SearchHistoryManager',
        action: 'clearHistory',
        metadata: { error },
      })
    }
  }

  /**
   * 移除特定的搜尋記錄
   */
  static removeFromHistory(searchTerm: string): void {
    if (typeof window === 'undefined') return

    const history = this.getHistory()
    const filtered = history.filter(term => term !== searchTerm)

    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered))
    } catch (error) {
      logger.warn('Failed to remove search history item', {
        module: 'SearchHistoryManager',
        action: 'removeFromHistory',
        metadata: { error, searchTerm },
      })
    }
  }

  /**
   * 獲取最大歷史記錄數量
   */
  static getMaxHistorySize(): number {
    return MAX_SEARCH_HISTORY
  }
}
