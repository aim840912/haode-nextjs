import { useState, useCallback, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/database/supabase-auth'
import { AuditLog, AuditLogQueryParams } from '@/types/audit'

export interface UseAuditLogsDataReturn {
  auditLogs: AuditLog[]
  isLoading: boolean
  error: string | null
  fetchAuditLogs: () => Promise<void>
  refetch: () => Promise<void>
}

/**
 * 審計日誌資料獲取 Hook
 * 負責管理審計日誌的資料狀態和 API 呼叫
 */
export function useAuditLogsData(
  userId: string | undefined,
  filters: AuditLogQueryParams
): UseAuditLogsDataReturn {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 取得審計日誌
  const fetchAuditLogs = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      // 取得認證 token
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('認證失敗')
      }

      // 建立查詢參數
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      // 呼叫 API
      const response = await fetch(`/api/audit-logs?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '取得審計日誌失敗')
      }

      setAuditLogs(result.data || [])
    } catch (err) {
      logger.error('載入審計日誌失敗', err instanceof Error ? err : new Error('Unknown error'), {
        module: 'useAuditLogsData',
      })
      setError(err instanceof Error ? err.message : '載入審計日誌時發生錯誤')
    } finally {
      setIsLoading(false)
    }
  }, [userId, filters])

  // 初始載入
  useEffect(() => {
    if (userId) {
      fetchAuditLogs()
    }
  }, [userId, fetchAuditLogs])

  return {
    auditLogs,
    isLoading,
    error,
    fetchAuditLogs,
    refetch: fetchAuditLogs,
  }
}
