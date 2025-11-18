import type { BreadcrumbItem } from './types'

/**
 * 根據路徑自動生成麵包屑項目
 *
 * @param pathname 當前路徑
 * @param customNames 自定義路徑名稱對映
 *
 * @example
 * ```ts
 * const items = generateBreadcrumbs('/products/123', {
 *   products: '所有產品'
 * })
 * // [{ name: '所有產品', href: '/products' }]
 * ```
 */
export const generateBreadcrumbs = (
  pathname: string,
  customNames: Record<string, string> = {}
): BreadcrumbItem[] => {
  if (pathname === '/') return []

  const pathSegments = pathname.split('/').filter(segment => segment !== '')
  const items: BreadcrumbItem[] = []

  // 預設路徑名稱對映
  const defaultNames: Record<string, string> = {
    products: '產品',
    moments: '精彩時刻',
    locations: '產地介紹',
    'farm-tour': '農場導覽',
    schedule: '活動行程',
    admin: '管理後台',
    login: '登入',
    register: '註冊',
    profile: '個人資料',
    inquiries: '詢問單',
    about: '關於我們',
    contact: '聯絡我們',
    ...customNames,
  }

  let currentPath = ''

  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // 跳過動態路由參數（純數字或 UUID 格式）
    if (/^\d+$/.test(segment) || /^[0-9a-f-]{36}$/i.test(segment)) {
      return
    }

    const name =
      defaultNames[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

    items.push({
      name,
      href: currentPath,
      current: index === pathSegments.length - 1,
    })
  })

  return items
}
