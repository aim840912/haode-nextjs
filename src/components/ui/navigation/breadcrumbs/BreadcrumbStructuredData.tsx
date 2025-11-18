'use client'

import { useMemo } from 'react'
import { logger } from '@/lib/logger'
import {
  sanitizeStructuredData,
  validateStructuredData,
} from '@/lib/utils/structured-data-sanitizer'
import type { BreadcrumbItem } from './types'

/**
 * BreadcrumbStructuredData - JSON-LD 結構化資料元件
 *
 * 產生符合 Schema.org 規範的麵包屑結構化資料，有助於 SEO。
 *
 * **安全性說明**：
 * - 使用 dangerouslySetInnerHTML 來嵌入 JSON-LD 結構化資料
 * - 透過 sanitizeStructuredData 清理資料，防止 XSS 攻擊
 * - JSON-LD 資料放在 <script type="application/ld+json"> 中，不會被執行為 JavaScript
 * - 這是 Google、Schema.org 推薦的 SEO 標準做法
 *
 * @example
 * ```tsx
 * <BreadcrumbStructuredData
 *   items={breadcrumbItems}
 *   baseUrl="https://example.com"
 * />
 * ```
 */

interface BreadcrumbStructuredDataProps {
  items: BreadcrumbItem[]
  baseUrl: string
}

export function BreadcrumbStructuredData({ items, baseUrl }: BreadcrumbStructuredDataProps) {
  const structuredData = useMemo(() => {
    const itemListElement = items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.href && {
        item: {
          '@type': 'WebPage',
          '@id': item.href.startsWith('http') ? item.href : `${baseUrl}${item.href}`,
        },
      }),
    }))

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement,
    }
  }, [items, baseUrl])

  // 驗證結構化資料格式
  const validation = validateStructuredData(structuredData)
  if (!validation.isValid) {
    logger.warn('麵包屑結構化資料格式不符合 Schema.org 規範', {
      module: 'BreadcrumbStructuredData',
      action: 'validate',
      metadata: { errors: validation.errors },
    })
  }

  // 清理並序列化資料
  const sanitizedJson = sanitizeStructuredData(structuredData, {
    enableLogging: true,
    moduleName: 'BreadcrumbStructuredData',
  })

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: sanitizedJson }} />
}
