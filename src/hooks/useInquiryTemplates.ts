/**
 * 詢價範本管理 Hook
 * 提供範本的 CRUD 操作和狀態管理
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { inquiryTemplateApi } from '@/lib/api-client'
import { apiLogger } from '@/lib/logger'
import {
  InquiryTemplate,
  CreateInquiryTemplateRequest,
  UpdateInquiryTemplateRequest,
  InquiryTemplateQueryParams,
  InquiryFormDataFromTemplate,
} from '@/types/inquiry-template'

interface UseInquiryTemplatesState {
  templates: InquiryTemplate[]
  loading: boolean
  error: string | null
  total: number
}

interface UseInquiryTemplatesReturn extends UseInquiryTemplatesState {
  // 查詢方法
  fetchTemplates: (params?: InquiryTemplateQueryParams) => Promise<void>
  refreshTemplates: () => Promise<void>

  // CRUD 方法
  createTemplate: (data: CreateInquiryTemplateRequest) => Promise<InquiryTemplate | null>
  updateTemplate: (
    id: string,
    data: UpdateInquiryTemplateRequest
  ) => Promise<InquiryTemplate | null>
  deleteTemplate: (id: string) => Promise<boolean>
  useTemplate: (id: string) => Promise<InquiryFormDataFromTemplate | null>

  // 工具方法
  toggleFavorite: (id: string) => Promise<boolean>
  toggleActive: (id: string) => Promise<boolean>
}

/**
 * 詢價範本管理 Hook
 */
export function useInquiryTemplates(
  initialParams?: InquiryTemplateQueryParams
): UseInquiryTemplatesReturn {
  const [state, setState] = useState<UseInquiryTemplatesState>({
    templates: [],
    loading: false,
    error: null,
    total: 0,
  })

  const [currentParams, setCurrentParams] = useState<InquiryTemplateQueryParams | undefined>(
    initialParams
  )

  /**
   * 取得範本列表
   */
  const fetchTemplates = useCallback(async (params?: InquiryTemplateQueryParams) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      setCurrentParams(params)

      const response = await inquiryTemplateApi.list(params)

      if (response.success && response.data) {
        const data = response.data as {
          templates: InquiryTemplate[]
          pagination: { limit: number; offset: number; total: number }
        }
        setState({
          templates: data.templates || [],
          total: data.pagination?.total || 0,
          loading: false,
          error: null,
        })
      } else {
        throw new Error(response.message || '查詢範本失敗')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '查詢範本失敗'
      apiLogger.error('查詢範本失敗', error as Error, {
        metadata: { params },
      })
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
    }
  }, [])

  /**
   * 重新載入當前查詢
   */
  const refreshTemplates = useCallback(async () => {
    await fetchTemplates(currentParams)
  }, [currentParams, fetchTemplates])

  /**
   * 建立範本
   */
  const createTemplate = useCallback(
    async (data: CreateInquiryTemplateRequest): Promise<InquiryTemplate | null> => {
      try {
        const response = await inquiryTemplateApi.create(data as unknown as Record<string, unknown>)

        if (response.success && response.data) {
          // 重新載入列表
          await refreshTemplates()
          return response.data as InquiryTemplate
        } else {
          throw new Error(response.message || '建立範本失敗')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '建立範本失敗'
        apiLogger.error('建立範本失敗', error as Error, {
          metadata: { data },
        })
        setState(prev => ({ ...prev, error: errorMessage }))
        return null
      }
    },
    [refreshTemplates]
  )

  /**
   * 更新範本
   */
  const updateTemplate = useCallback(
    async (id: string, data: UpdateInquiryTemplateRequest): Promise<InquiryTemplate | null> => {
      try {
        const response = await inquiryTemplateApi.update(
          id,
          data as unknown as Record<string, unknown>
        )

        if (response.success && response.data) {
          // 更新本地狀態
          setState(prev => ({
            ...prev,
            templates: prev.templates.map(t =>
              t.id === id ? (response.data as InquiryTemplate) : t
            ),
          }))
          return response.data as InquiryTemplate
        } else {
          throw new Error(response.message || '更新範本失敗')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '更新範本失敗'
        apiLogger.error('更新範本失敗', error as Error, {
          metadata: { id, data },
        })
        setState(prev => ({ ...prev, error: errorMessage }))
        return null
      }
    },
    []
  )

  /**
   * 刪除範本
   */
  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await inquiryTemplateApi.delete(id)

      if (response.success) {
        // 從本地狀態移除
        setState(prev => ({
          ...prev,
          templates: prev.templates.filter(t => t.id !== id),
          total: prev.total - 1,
        }))
        return true
      } else {
        throw new Error(response.message || '刪除範本失敗')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '刪除範本失敗'
      apiLogger.error('刪除範本失敗', error as Error, {
        metadata: { id },
      })
      setState(prev => ({ ...prev, error: errorMessage }))
      return false
    }
  }, [])

  /**
   * 使用範本
   */
  const useTemplate = useCallback(
    async (id: string): Promise<InquiryFormDataFromTemplate | null> => {
      try {
        const response = await inquiryTemplateApi.use(id)

        if (response.success && response.data) {
          // 更新使用次數（樂觀更新）
          setState(prev => ({
            ...prev,
            templates: prev.templates.map(t =>
              t.id === id
                ? {
                    ...t,
                    usage_count: t.usage_count + 1,
                    last_used_at: new Date().toISOString(),
                  }
                : t
            ),
          }))
          return response.data as InquiryFormDataFromTemplate
        } else {
          throw new Error(response.message || '使用範本失敗')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '使用範本失敗'
        apiLogger.error('使用範本失敗', error as Error, {
          metadata: { id },
        })
        setState(prev => ({ ...prev, error: errorMessage }))
        return null
      }
    },
    []
  )

  /**
   * 切換常用狀態
   */
  const toggleFavorite = useCallback(
    async (id: string): Promise<boolean> => {
      const template = state.templates.find(t => t.id === id)
      if (!template) return false

      return (await updateTemplate(id, { is_favorite: !template.is_favorite })) !== null
    },
    [state.templates, updateTemplate]
  )

  /**
   * 切換啟用狀態
   */
  const toggleActive = useCallback(
    async (id: string): Promise<boolean> => {
      const template = state.templates.find(t => t.id === id)
      if (!template) return false

      return (await updateTemplate(id, { is_active: !template.is_active })) !== null
    },
    [state.templates, updateTemplate]
  )

  // 初始載入
  useEffect(() => {
    if (initialParams) {
      fetchTemplates(initialParams)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    fetchTemplates,
    refreshTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    toggleFavorite,
    toggleActive,
  }
}
