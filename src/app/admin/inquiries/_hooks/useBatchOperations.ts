import { useState, useCallback } from 'react'
import { InquiryStatus, InquiryWithItems, INQUIRY_STATUS_LABELS } from '@/types/inquiry'

interface UseBatchOperationsProps {
  inquiries: InquiryWithItems[]
  onSuccess?: (message: string, description: string) => void
  onError?: (message: string, description: string) => void
  markAsRead: (inquiryId: string) => Promise<void>
  deleteInquiry: (inquiryId: string) => Promise<void>
  updateInquiryStatus: (inquiryId: string, newStatus: InquiryStatus) => Promise<void>
  refreshInquiries: () => Promise<void>
}

export function useBatchOperations({
  inquiries,
  onSuccess,
  onError,
  markAsRead,
  deleteInquiry,
  updateInquiryStatus,
  refreshInquiries,
}: UseBatchOperationsProps) {
  const [selectedInquiries, setSelectedInquiries] = useState<Set<string>>(new Set())
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [showBatchActions, setShowBatchActions] = useState(false)

  // 切換單個詢問單的選擇
  const toggleInquirySelection = useCallback((inquiryId: string) => {
    setSelectedInquiries(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(inquiryId)) {
        newSelected.delete(inquiryId)
      } else {
        newSelected.add(inquiryId)
      }
      setShowBatchActions(newSelected.size > 0)
      return newSelected
    })
  }, [])

  // 全選/全不選
  const selectAllInquiries = useCallback(() => {
    if (selectedInquiries.size === inquiries.length) {
      setSelectedInquiries(new Set())
      setShowBatchActions(false)
    } else {
      setSelectedInquiries(new Set(inquiries.map(i => i.id)))
      setShowBatchActions(true)
    }
  }, [inquiries, selectedInquiries.size])

  // 清除選擇
  const clearSelection = useCallback(() => {
    setSelectedInquiries(new Set())
    setShowBatchActions(false)
  }, [])

  // 批量標記已讀
  const batchMarkAsRead = useCallback(async () => {
    if (selectedInquiries.size === 0) return

    setIsBatchProcessing(true)
    const selectedArray = Array.from(selectedInquiries)
    let successCount = 0
    let failCount = 0

    try {
      const promises = selectedArray.map(async inquiryId => {
        try {
          await markAsRead(inquiryId)
          return { success: true, id: inquiryId }
        } catch (error) {
          return { success: false, id: inquiryId, error }
        }
      })

      const results = await Promise.allSettled(promises)

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++
        } else {
          failCount++
        }
      })

      if (successCount > 0) {
        onSuccess?.(
          '批量操作完成',
          `成功標記 ${successCount} 筆為已讀${failCount > 0 ? `，${failCount} 筆失敗` : ''}`
        )
      }

      if (failCount > 0 && successCount === 0) {
        onError?.('批量操作失敗', `${failCount} 筆操作失敗`)
      }

      clearSelection()
      await refreshInquiries()
    } catch (error) {
      onError?.('批量操作失敗', error instanceof Error ? error.message : '批量標記時發生錯誤')
    } finally {
      setIsBatchProcessing(false)
    }
  }, [selectedInquiries, markAsRead, onSuccess, onError, clearSelection, refreshInquiries])

  // 批量更新狀態
  const batchUpdateStatus = useCallback(
    async (newStatus: InquiryStatus) => {
      if (selectedInquiries.size === 0) return

      if (
        !confirm(
          `確定要將 ${selectedInquiries.size} 筆詢價單狀態更新為「${INQUIRY_STATUS_LABELS[newStatus]}」嗎？`
        )
      ) {
        return
      }

      setIsBatchProcessing(true)
      const selectedArray = Array.from(selectedInquiries)
      let successCount = 0
      let failCount = 0

      try {
        // 並行處理多個請求（限制並發數量）
        const batchSize = 5
        for (let i = 0; i < selectedArray.length; i += batchSize) {
          const batch = selectedArray.slice(i, i + batchSize)
          const promises = batch.map(async inquiryId => {
            try {
              await updateInquiryStatus(inquiryId, newStatus)
              return { success: true, id: inquiryId }
            } catch (error) {
              return { success: false, id: inquiryId, error }
            }
          })

          const results = await Promise.allSettled(promises)

          results.forEach(result => {
            if (result.status === 'fulfilled' && result.value.success) {
              successCount++
            } else {
              failCount++
            }
          })

          // 小延遲避免伺服器過載
          if (i + batchSize < selectedArray.length) {
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        }

        if (successCount > 0) {
          onSuccess?.(
            '批量操作完成',
            `成功更新 ${successCount} 筆狀態${failCount > 0 ? `，${failCount} 筆失敗` : ''}`
          )
        }

        if (failCount > 0 && successCount === 0) {
          onError?.('批量操作失敗', `${failCount} 筆操作失敗`)
        }

        clearSelection()
        await refreshInquiries()
      } catch (error) {
        onError?.('批量操作失敗', error instanceof Error ? error.message : '批量更新時發生錯誤')
      } finally {
        setIsBatchProcessing(false)
      }
    },
    [selectedInquiries, updateInquiryStatus, onSuccess, onError, clearSelection, refreshInquiries]
  )

  // 批量刪除
  const batchDelete = useCallback(async () => {
    if (selectedInquiries.size === 0) return

    if (!confirm(`確定要刪除 ${selectedInquiries.size} 筆詢價單嗎？此操作無法復原。`)) {
      return
    }

    setIsBatchProcessing(true)
    const selectedArray = Array.from(selectedInquiries)
    let successCount = 0
    let failCount = 0

    try {
      // 刪除操作使用較小的批次大小
      const batchSize = 3
      for (let i = 0; i < selectedArray.length; i += batchSize) {
        const batch = selectedArray.slice(i, i + batchSize)
        const promises = batch.map(async inquiryId => {
          try {
            await deleteInquiry(inquiryId)
            return { success: true, id: inquiryId }
          } catch (error) {
            return { success: false, id: inquiryId, error }
          }
        })

        const results = await Promise.allSettled(promises)

        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value.success) {
            successCount++
          } else {
            failCount++
          }
        })

        // 延遲以避免伺服器過載
        if (i + batchSize < selectedArray.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      if (successCount > 0) {
        onSuccess?.(
          '批量刪除完成',
          `成功刪除 ${successCount} 筆詢價單${failCount > 0 ? `，${failCount} 筆失敗` : ''}`
        )
      }

      if (failCount > 0 && successCount === 0) {
        onError?.('批量刪除失敗', `${failCount} 筆操作失敗`)
      }

      clearSelection()
      await refreshInquiries()
    } catch (error) {
      onError?.('批量刪除失敗', error instanceof Error ? error.message : '批量刪除時發生錯誤')
    } finally {
      setIsBatchProcessing(false)
    }
  }, [selectedInquiries, deleteInquiry, onSuccess, onError, clearSelection, refreshInquiries])

  return {
    // 狀態
    selectedInquiries,
    isBatchProcessing,
    showBatchActions,
    // 方法
    toggleInquirySelection,
    selectAllInquiries,
    clearSelection,
    batchMarkAsRead,
    batchUpdateStatus,
    batchDelete,
  }
}
