/**
 * 網站設定 Hook
 * 用於前台頁面讀取動態設定
 */

import { useState, useEffect } from 'react'
import type { SiteSetting, SettingKey } from '@/types/siteSettings'

export function useSiteSettings(keys: (SettingKey | string)[]) {
  const [settings, setSettings] = useState<Record<string, SiteSetting>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const keysParam = keys.join(',')
        const response = await fetch(`/api/site-settings?keys=${keysParam}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || '載入設定失敗')
        }

        setSettings(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入設定失敗')
      } finally {
        setLoading(false)
      }
    }

    if (keys.length > 0) {
      fetchSettings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join(',')])

  return { settings, loading, error }
}

export function useSiteSetting(key: SettingKey | string) {
  const { settings, loading, error } = useSiteSettings([key])
  return { setting: settings[key] || null, loading, error }
}
