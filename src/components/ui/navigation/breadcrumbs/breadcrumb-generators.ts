import type { BreadcrumbItem } from './types'

/**
 * Breadcrumb Generators - 針對特定頁面類型建立麵包屑
 *
 * 提供便利函數，快速建立常見頁面的麵包屑導航。
 */

/**
 * 產品頁面麵包屑
 *
 * @example
 * ```ts
 * const items = createProductBreadcrumbs('有機蘋果')
 * // [{ name: '產品', href: '/products' }, { name: '有機蘋果' }]
 * ```
 */
export const createProductBreadcrumbs = (productName?: string): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [{ name: '產品', href: '/products' }]

  if (productName) {
    items.push({ name: productName })
  }

  return items
}

/**
 * 精彩時刻頁面麵包屑
 */
export const createMomentsBreadcrumbs = (momentTitle?: string): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [{ name: '精彩時刻', href: '/moments' }]

  if (momentTitle) {
    items.push({ name: momentTitle })
  }

  return items
}

/**
 * 門市據點頁面麵包屑
 */
export const createLocationsBreadcrumbs = (locationName?: string): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [{ name: '門市據點', href: '/locations' }]

  if (locationName) {
    items.push({ name: locationName })
  }

  return items
}

/**
 * 管理後台頁面麵包屑
 *
 * @example
 * ```ts
 * const items = createAdminBreadcrumbs('products', 'edit')
 * // [
 * //   { name: '管理後台', href: '/admin' },
 * //   { name: '產品管理', href: '/admin/products' },
 * //   { name: '編輯' }
 * // ]
 * ```
 */
export const createAdminBreadcrumbs = (...segments: string[]): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [{ name: '管理後台', href: '/admin' }]

  const nameMap: Record<string, string> = {
    products: '產品管理',
    users: '用戶管理',
    orders: '訂單管理',
    inquiries: '詢問單管理',
    settings: '系統設定',
    logs: '系統日誌',
    add: '新增',
    edit: '編輯',
    view: '查看',
  }

  let currentPath = '/admin'
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    items.push({
      name: nameMap[segment] || segment,
      href: index === segments.length - 1 ? undefined : currentPath,
    })
  })

  return items
}

/**
 * 擺攤行程頁面麵包屑
 */
export const createScheduleBreadcrumbs = (scheduleTitle?: string): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [{ name: '擺攤行程', href: '/schedule' }]

  if (scheduleTitle) {
    items.push({ name: scheduleTitle })
  }

  return items
}

/**
 * 觀光果園頁面麵包屑
 */
export const createFarmTourBreadcrumbs = (tourTitle?: string): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [{ name: '觀光果園', href: '/farm-tour' }]

  if (tourTitle) {
    items.push({ name: tourTitle })
  }

  return items
}
