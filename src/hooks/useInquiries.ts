import { useState, useEffect, useCallback } from 'react'
import { fetchInquiries as fetchInquiriesAPI } from '@/lib/api/inquiries-api'
import { logger } from '@/lib/logger'
import type { InquiryWithItems, InquiryStatus, InquiryType } from '@/types/inquiry'

export interface UseInquiriesOptions {
  statusFilter?: InquiryStatus | 'all'
  typeFilter?: InquiryType | 'all'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface UseInquiriesReturn {
  inquiries: InquiryWithItems[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Inquiries 數據管理 Hook
 * 負責從 API 載入詢問單列表，支援篩選和排序
 */
export function useInquiries(options: UseInquiriesOptions = {}): UseInquiriesReturn {
  const [inquiries, setInquiries] = useState<InquiryWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInquiries = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      logger.info('開始載入詢問單列表', {
        module: 'useInquiries',
        action: 'fetchInquiries',
        metadata: {
          statusFilter: options.statusFilter || 'all',
          typeFilter: options.typeFilter || 'all',
        },
      })

      // ✅ 使用 API Client Layer
      const data = await fetchInquiriesAPI({
        statusFilter: options.statusFilter,
        typeFilter: options.typeFilter,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
      })

      setInquiries(data)

      logger.info('詢問單列表載入完成', {
        module: 'useInquiries',
        action: 'fetchInquiries',
        metadata: { count: data.length },
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入詢問單失敗'
      setError(errorMessage)

      logger.error('載入詢問單列表失敗', err as Error, {
        module: 'useInquiries',
        action: 'fetchInquiries',
      })
    } finally {
      setLoading(false)
    }
  }, [options.statusFilter, options.typeFilter, options.sortBy, options.sortOrder])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  return {
    inquiries,
    loading,
    error,
    refetch: fetchInquiries,
  }
}
