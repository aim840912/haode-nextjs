/**
 * 快速回覆模板 Hook
 * 提供預設的回覆模板和管理功能
 */

import { useState, useCallback, useEffect } from 'react'
import { logger } from '@/lib/logger'

export interface QuickReplyTemplate {
  id: string
  title: string
  content: string
  category: 'product' | 'farm_tour' | 'general' | 'pricing'
  variables: string[] // 模板中的變數，如 {customer_name}, {product_name} 等
  usage_count: number
  created_at: string
  updated_at: string
}

// 預設快速回覆模板
const DEFAULT_TEMPLATES: QuickReplyTemplate[] = [
  {
    id: 'product-quote-basic',
    title: '產品詢價 - 基本回覆',
    content: `親愛的 {customer_name} 您好：

感謝您對我們 {product_name} 的詢問！

根據您的需求，我們為您提供以下報價：
• 產品：{product_name}
• 數量：{quantity}
• 單價：NT$ {unit_price}
• 總價：NT$ {total_price}

此報價有效期為 7 天，包含：
✓ 產品品質保證
✓ 專業包裝配送
✓ 完善售後服務

如有任何問題，歡迎隨時聯繫我們！

豪德茶業 敬上`,
    category: 'product',
    variables: ['customer_name', 'product_name', 'quantity', 'unit_price', 'total_price'],
    usage_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'farm-tour-confirmation',
    title: '農場導覽 - 確認預約',
    content: `親愛的 {customer_name} 您好：

感謝您預約我們的農場導覽活動！

預約詳情確認：
• 活動名稱：{activity_title}
• 參訪日期：{visit_date}
• 參訪人數：{visitor_count} 位
• 集合時間：當日上午 09:00
• 集合地點：豪德茶業農場入口

注意事項：
• 請穿著舒適的運動鞋
• 建議攜帶防曬用品
• 如遇天候不佳將另行通知改期

期待您的到來！

豪德茶業 敬上`,
    category: 'farm_tour',
    variables: ['customer_name', 'activity_title', 'visit_date', 'visitor_count'],
    usage_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'general-inquiry-received',
    title: '一般詢問 - 收到確認',
    content: `親愛的 {customer_name} 您好：

感謝您的詢問，我們已收到您的訊息！

我們的專業團隊正在處理您的需求，預計將於 24 小時內回覆詳細資訊。

如有緊急需求，歡迎直接撥打客服電話與我們聯繫。

豪德茶業 敬上`,
    category: 'general',
    variables: ['customer_name'],
    usage_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pricing-custom-quote',
    title: '客製化報價回覆',
    content: `親愛的 {customer_name} 您好：

根據您的特殊需求，我們為您準備了客製化報價。

由於您的需求較為特殊，我們需要更詳細的討論來為您提供最適合的方案。

建議安排時間進行電話或視訊會議，詳談合作細節：
• 平日 09:00-18:00
• 假日 10:00-17:00

請告知您方便的時間，我們將立即安排！

豪德茶業 敬上`,
    category: 'pricing',
    variables: ['customer_name'],
    usage_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'product-out-of-stock',
    title: '產品缺貨通知',
    content: `親愛的 {customer_name} 您好：

很抱歉，您詢問的 {product_name} 目前暫時缺貨。

預計補貨時間：{restock_date}

我們可以為您：
1. 預約下一批到貨優先供應
2. 推薦其他類似的優質產品
3. 提供到貨通知服務

請告知您的選擇，我們將立即為您安排！

豪德茶業 敬上`,
    category: 'product',
    variables: ['customer_name', 'product_name', 'restock_date'],
    usage_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export function useQuickReplyTemplates() {
  const [templates, setTemplates] = useState<QuickReplyTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<QuickReplyTemplate | null>(null)

  // 從 localStorage 載入模板
  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem('quick_reply_templates')
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates))
      } else {
        // 第一次使用，使用預設模板
        setTemplates(DEFAULT_TEMPLATES)
        localStorage.setItem('quick_reply_templates', JSON.stringify(DEFAULT_TEMPLATES))
      }
    } catch (error) {
      logger.error('Failed to load quick reply templates', error as Error)
      setTemplates(DEFAULT_TEMPLATES)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 保存模板到 localStorage
  const saveTemplates = useCallback((newTemplates: QuickReplyTemplate[]) => {
    try {
      localStorage.setItem('quick_reply_templates', JSON.stringify(newTemplates))
      setTemplates(newTemplates)
    } catch (error) {
      logger.error('Failed to save quick reply templates', error as Error)
    }
  }, [])

  // 根據分類篩選模板
  const getTemplatesByCategory = useCallback(
    (category?: string) => {
      if (!category) return templates
      return templates.filter(template => template.category === category)
    },
    [templates]
  )

  // 使用模板並增加使用計數
  const useTemplate = useCallback(
    (templateId: string) => {
      const template = templates.find(t => t.id === templateId)
      if (!template) return null

      // 增加使用計數
      const updatedTemplates = templates.map(t =>
        t.id === templateId
          ? { ...t, usage_count: t.usage_count + 1, updated_at: new Date().toISOString() }
          : t
      )
      saveTemplates(updatedTemplates)

      return template
    },
    [templates, saveTemplates]
  )

  // 填充模板變數
  const fillTemplate = useCallback(
    (template: QuickReplyTemplate, variables: Record<string, string>): string => {
      try {
        let content = template.content

        // 替換所有變數
        template.variables.forEach(variable => {
          const value = variables[variable] || `{${variable}}`
          // 使用更安全的正則表達式替換
          const regex = new RegExp(`\\{${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'g')
          content = content.replace(regex, value)
        })

        return content
      } catch (error) {
        logger.error('Failed to fill template', error as Error, {
          module: 'QuickReplyTemplates',
          action: 'fillTemplate',
          metadata: { templateId: template.id, variables },
        })
        return template.content
      }
    },
    []
  )

  // 創建新模板
  const createTemplate = useCallback(
    (
      templateData: Omit<QuickReplyTemplate, 'id' | 'usage_count' | 'created_at' | 'updated_at'>
    ) => {
      const newTemplate: QuickReplyTemplate = {
        ...templateData,
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const updatedTemplates = [...templates, newTemplate]
      saveTemplates(updatedTemplates)
      return newTemplate
    },
    [templates, saveTemplates]
  )

  // 更新模板
  const updateTemplate = useCallback(
    (templateId: string, updates: Partial<QuickReplyTemplate>) => {
      const updatedTemplates = templates.map(template =>
        template.id === templateId
          ? { ...template, ...updates, updated_at: new Date().toISOString() }
          : template
      )
      saveTemplates(updatedTemplates)
    },
    [templates, saveTemplates]
  )

  // 刪除模板
  const deleteTemplate = useCallback(
    (templateId: string) => {
      const updatedTemplates = templates.filter(template => template.id !== templateId)
      saveTemplates(updatedTemplates)
    },
    [templates, saveTemplates]
  )

  // 重置為預設模板
  const resetToDefaults = useCallback(() => {
    saveTemplates(DEFAULT_TEMPLATES)
  }, [saveTemplates])

  // 取得熱門模板（按使用次數排序）
  const getPopularTemplates = useCallback(
    (limit = 5) => {
      return [...templates].sort((a, b) => b.usage_count - a.usage_count).slice(0, limit)
    },
    [templates]
  )

  return {
    templates,
    isLoading,
    selectedTemplate,
    setSelectedTemplate,
    getTemplatesByCategory,
    useTemplate,
    fillTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    resetToDefaults,
    getPopularTemplates,
  }
}
