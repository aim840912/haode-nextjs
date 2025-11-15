import { useState, useCallback, useEffect } from 'react'
import { fetchAuditLogs as fetchAuditLogsAPI } from '@/lib/api/audit-logs-api'
import { logger } from '@/lib/logger'
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
      const data = await fetchAuditLogsAPI(filters)
      setAuditLogs(data)
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
