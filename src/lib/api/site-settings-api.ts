/**
 * Site Settings API 客戶端包裝層
 * 提供類型安全的 API 呼叫函數,供客戶端元件使用
 */

import { apiLogger } from '@/lib/logger'
import { apiClient } from '@/lib/api-client'
import { handleApiError } from './common'
import type { SiteSetting, SiteSettingInput, SiteSettingUpdate } from '@/types/siteSettings'

/**
 * 圖片上傳回應
 */
export interface UploadImageResponse {
  url: string
  path: string
  fileName: string
}

/**
 * 取得所有網站設定
 * @returns 所有設定陣列
 */
export async function fetchAllSiteSettings(): Promise<SiteSetting[]> {
  try {
    const result = await apiClient.get<SiteSetting[]>('/api/site-settings')

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得網站設定失敗')
    }

    apiLogger.info('網站設定列表取得成功', {
      metadata: { count: result.data.length },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchAllSiteSettings', 'SiteSettingsAPI')
  }
}

/**
 * 取得單一網站設定（通過 key）
 * @param key - 設定鍵
 * @returns 設定資料
 */
export async function fetchSiteSettingByKey(key: string): Promise<SiteSetting> {
  try {
    const params = new URLSearchParams({ key })
    const result = await apiClient.get<SiteSetting>(`/api/site-settings?${params}`)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得網站設定失敗')
    }

    apiLogger.info('網站設定取得成功', {
      metadata: { key },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchSiteSettingByKey', 'SiteSettingsAPI')
  }
}

/**
 * 批次取得多個網站設定（通過 keys）
 * @param keys - 設定鍵陣列
 * @returns 設定陣列
 */
export async function fetchSiteSettingsByKeys(keys: string[]): Promise<SiteSetting[]> {
  try {
    const params = new URLSearchParams({ keys: keys.join(',') })
    const result = await apiClient.get<SiteSetting[]>(`/api/site-settings?${params}`)

    if (!result.success || !result.data) {
      throw new Error(result.message || '批次取得網站設定失敗')
    }

    apiLogger.info('批次網站設定取得成功', {
      metadata: { keysCount: keys.length },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchSiteSettingsByKeys', 'SiteSettingsAPI')
  }
}

/**
 * 建立新網站設定（管理員）
 * @param data - 設定資料
 * @returns 建立的設定
 */
export async function createSiteSetting(data: SiteSettingInput): Promise<SiteSetting> {
  try {
    const result = await apiClient.post<SiteSetting>(
      '/api/site-settings',
      data as unknown as Record<string, unknown>
    )

    if (!result.success || !result.data) {
      throw new Error(result.message || '建立網站設定失敗')
    }

    apiLogger.info('網站設定建立成功', {
      metadata: { key: data.key },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'createSiteSetting', 'SiteSettingsAPI')
  }
}

/**
 * 更新網站設定（管理員）
 * @param key - 設定鍵
 * @param data - 更新資料
 * @returns 更新後的設定
 */
export async function updateSiteSetting(
  key: string,
  data: SiteSettingUpdate
): Promise<SiteSetting> {
  try {
    const params = new URLSearchParams({ key })
    const result = await apiClient.put<SiteSetting>(
      `/api/site-settings?${params}`,
      data as unknown as Record<string, unknown>
    )

    if (!result.success || !result.data) {
      throw new Error(result.message || '更新網站設定失敗')
    }

    apiLogger.info('網站設定更新成功', {
      metadata: { key },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'updateSiteSetting', 'SiteSettingsAPI')
  }
}

/**
 * Upsert 網站設定（存在則更新，不存在則創建）（管理員）
 * @param key - 設定鍵
 * @param data - 設定資料
 * @returns 設定資料
 */
export async function upsertSiteSetting(
  key: string,
  data: SiteSettingUpdate & { type?: string }
): Promise<SiteSetting> {
  try {
    const params = new URLSearchParams({ key })
    const result = await apiClient.patch<SiteSetting>(
      `/api/site-settings?${params}`,
      data as unknown as Record<string, unknown>
    )

    if (!result.success || !result.data) {
      throw new Error(result.message || '儲存網站設定失敗')
    }

    apiLogger.info('網站設定已儲存', {
      metadata: { key },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'upsertSiteSetting', 'SiteSettingsAPI')
  }
}

/**
 * 刪除網站設定（管理員）
 * @param key - 設定鍵
 * @returns 是否刪除成功
 */
export async function deleteSiteSetting(key: string): Promise<boolean> {
  try {
    const params = new URLSearchParams({ key })
    const result = await apiClient.delete<{ deleted: boolean }>(`/api/site-settings?${params}`)

    if (!result.success) {
      throw new Error(result.message || '刪除網站設定失敗')
    }

    apiLogger.info('網站設定刪除成功', {
      metadata: { key },
    })

    return true
  } catch (error) {
    handleApiError(error, 'deleteSiteSetting', 'SiteSettingsAPI')
  }
}

/**
 * 上傳網站設定圖片（管理員）
 * @param file - 圖片檔案
 * @returns 上傳結果（包含圖片 URL）
 */
export async function uploadSiteSettingImage(file: File): Promise<UploadImageResponse> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    // 使用原生 fetch，因為 FormData 需要特殊處理
    const response = await fetch('/api/site-settings/upload-image', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '圖片上傳失敗')
    }

    const result = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.message || '圖片上傳失敗')
    }

    apiLogger.info('網站設定圖片上傳成功', {
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        url: result.data.url,
      },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'uploadSiteSettingImage', 'SiteSettingsAPI')
  }
}
