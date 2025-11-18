'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { BreadcrumbStructuredData } from './BreadcrumbStructuredData'
import type { BreadcrumbsProps, BreadcrumbItem } from './types'

/**
 * Breadcrumbs 導航元件
 *
 * 提供頁面導航路徑顯示，支援 JSON-LD 結構化資料。
 * 有助於 SEO 和使用者導航體驗。
 *
 * @example
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { name: '產品', href: '/products' },
 *     { name: '有機蘋果' }
 *   ]}
 * />
 * ```
 */
export function Breadcrumbs({
  items,
  className = '',
  separator = '/',
  showHome = true,
  enableStructuredData = true,
  baseUrl = 'https://haode-nextjs.vercel.app',
}: BreadcrumbsProps) {
  // 準備最終的麵包屑項目列表
  const finalItems = useMemo(() => {
    const result: BreadcrumbItem[] = []

    // 添加首頁（如果需要且不是第一個項目）
    if (showHome && (items.length === 0 || items[0].href !== '/')) {
      result.push({
        name: '首頁',
        href: '/',
      })
    }

    // 添加提供的項目
    result.push(...items)

    // 標記最後一個項目為當前頁面
    if (result.length > 0) {
      const lastItem = result[result.length - 1]
      lastItem.current = true
      // 當前頁面不需要連結
      delete lastItem.href
    }

    return result
  }, [items, showHome])

  // 如果沒有項目或只有首頁，不顯示麵包屑
  if (finalItems.length <= 1) {
    return null
  }

  return (
    <>
      {/* 結構化資料 */}
      {enableStructuredData && <BreadcrumbStructuredData items={finalItems} baseUrl={baseUrl} />}

      {/* 可見的麵包屑導航 */}
      <nav className={cn('text-sm text-gray-600', className)} aria-label="麵包屑導航">
        <ol className="flex items-center space-x-2">
          {finalItems.map((item, index) => (
            <li key={index} className="flex items-center">
              {/* 分隔符號（除了第一個項目） */}
              {index > 0 && (
                <span className="mx-2 text-gray-400 select-none" aria-hidden="true">
                  {separator}
                </span>
              )}

              {/* 麵包屑項目 */}
              {item.current ? (
                <span className="text-gray-800 dark:text-gray-200 font-medium" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href!}
                  className="text-amber-900 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:underline transition-colors"
                >
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
