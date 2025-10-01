import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { getSupabaseClient } from '@/lib/database/supabase-auth'
import type { FarmTourActivity } from '@/types/farmTour'

export interface UseFarmTourActivitiesReturn {
  seasonalActivities: FarmTourActivity[]
  loading: boolean
  error: string | null
  fetchActivities: () => Promise<void>
}

/**
 * 農場導覽活動數據管理 Hook
 * 負責從 Supabase 載入季節性活動資料
 */
export function useFarmTourActivities(): UseFarmTourActivitiesReturn {
  const [seasonalActivities, setSeasonalActivities] = useState<FarmTourActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      logger.info('開始載入農場導覽活動', {
        module: 'FarmTourPage',
        action: 'fetchActivities',
      })

      const supabase = getSupabaseClient()
      const { data, error: fetchError } = await supabase
        .from('farm_tour_activities')
        .select('*')
        .eq('is_active', true)
        .order('start_month', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      setSeasonalActivities(data || [])

      logger.info('農場導覽活動載入完成', {
        module: 'FarmTourPage',
        action: 'fetchActivities',
        metadata: { count: data?.length || 0 },
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入活動失敗'
      setError(errorMessage)

      logger.error('載入農場導覽活動失敗', err as Error, {
        module: 'FarmTourPage',
        action: 'fetchActivities',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  return {
    seasonalActivities,
    loading,
    error,
    fetchActivities,
  }
}
