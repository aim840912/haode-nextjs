import { useState, useEffect, useCallback } from 'react'
import { fetchLocations as fetchLocationsAPI } from '@/lib/api/locations-api'
import { logger } from '@/lib/logger'
import type { Location } from '@/types/location'

export interface UseLocationsReturn {
  locations: Location[]
  selectedLocation: Location | null
  loading: boolean
  error: string | null
  setSelectedLocation: (location: Location) => void
  refetch: () => Promise<void>
}

/**
 * Locations 數據管理 Hook
 * 負責從 API 載入門市據點列表，並管理選中的門市
 */
export function useLocations(): UseLocationsReturn {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLocations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      logger.info('開始載入門市據點列表', {
        module: 'useLocations',
        action: 'fetchLocations',
      })

      // ✅ 使用 API Client Layer
      const data = await fetchLocationsAPI()

      setLocations(data)

      // 自動選擇第一個門市
      if (data.length > 0 && !selectedLocation) {
        setSelectedLocation(data[0])
      }

      logger.info('門市據點列表載入完成', {
        module: 'useLocations',
        action: 'fetchLocations',
        metadata: { count: data.length },
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入門市據點失敗'
      setError(errorMessage)

      logger.error('載入門市據點列表失敗', err as Error, {
        module: 'useLocations',
        action: 'fetchLocations',
      })
    } finally {
      setLoading(false)
    }
  }, [selectedLocation])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  return {
    locations,
    selectedLocation,
    loading,
    error,
    setSelectedLocation,
    refetch: fetchLocations,
  }
}
